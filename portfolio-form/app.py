#!/usr/bin/env python3
"""Contact-form handler for skitoji.cloud portfolio (stdlib only).

Delivers each submission to email (iCloud SMTP) and/or Discord (webhook).
Hardened against spam, header injection, and request floods.
"""
import json
import os
import re
import smtplib
import ssl
import threading
import time
import urllib.request
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# --- Config ---
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.mail.me.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
MAIL_TO = os.environ.get("MAIL_TO", "smonroysalas@skitoji.cloud")
MAIL_FROM = os.environ.get("MAIL_FROM", SMTP_USER or "no-reply@skitoji.cloud")
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
PORT = int(os.environ.get("PORT", "5000"))

# --- Limits ---
MAX_BODY = 32768        # reject request bodies larger than 32 KB
RATE_WINDOW = 300       # seconds
RATE_MAX = 5            # submissions per IP per window
GLOBAL_WINDOW = 300     # seconds
GLOBAL_MAX = 60         # submissions total per window
MIN_INTERVAL = 1.0      # minimum seconds between submissions from same IP
MIN_HUMAN_MS = 2500     # reject submissions filled faster than this

# --- In-memory rate limiting (thread-safe) ---
_lock = threading.Lock()
_requests = {}     # ip -> list of timestamps
_global_ts = []    # all submission timestamps


def _rate_ok(ip: str) -> bool:
    now = time.time()
    with _lock:
        hits = [t for t in _requests.get(ip, []) if now - t < RATE_WINDOW]
        if hits and (now - hits[-1]) < MIN_INTERVAL:
            _requests[ip] = hits
            return False
        if len(hits) >= RATE_MAX:
            _requests[ip] = hits
            return False

        _global_ts[:] = [t for t in _global_ts if now - t < GLOBAL_WINDOW]
        if len(_global_ts) >= GLOBAL_MAX:
            return False

        hits.append(now)
        _requests[ip] = hits
        _global_ts.append(now)
        return True


# --- Sanitization ---
# Single-line fields: strip ALL control chars (incl. CR/LF) -> prevents email header injection.
_SINGLE_RE = re.compile(r"[\x00-\x1f\x7f]+")
# Message: keep \n (\x0a) and \t (\x09), strip the rest.
_MULTI_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]+")
# Invisible / bidi trickery used for spoofing or hidden instructions.
_INVIS_RE = re.compile(r"[\u200b-\u200f\u202a-\u202e\u2060\ufeff]")


def _clean_single(s: str) -> str:
    return _INVIS_RE.sub("", _SINGLE_RE.sub("", s)).strip()


def _clean_multi(s: str) -> str:
    return _INVIS_RE.sub("", _MULTI_RE.sub("", s).replace("\r", "")).strip()


def _client_ip(handler) -> str:
    # Caddy overwrites X-Forwarded-For with the real remote host, so we trust it.
    xff = handler.headers.get("X-Forwarded-For", "")
    if xff:
        return xff.split(",")[0].strip()[:64]
    return handler.client_address[0]


# --- Delivery ---
def send_email(name, email, project_type, message, ip):
    text = (
        "New contact form submission from skitoji.cloud\n"
        "=" * 44 + "\n\n"
        f"Name:         {name}\n"
        f"Email:        {email}\n"
        f"Project type: {project_type or '(not specified)'}\n"
        f"IP:           {ip}\n"
        f"Time (UTC):   {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())}\n\n"
        "Message:\n"
        f"{message}\n"
    )
    msg = MIMEText(text, "plain", "utf-8")
    msg["Subject"] = f"[skitoji.cloud] New message from {name}"
    msg["From"] = formataddr(("SKITOJI Form", MAIL_FROM))
    msg["To"] = MAIL_TO
    msg["Reply-To"] = email
    msg["Date"] = formatdate(localtime=False)
    msg["Message-ID"] = make_msgid(domain="skitoji.cloud")

    ctx = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as s:
        s.starttls(context=ctx)
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(MAIL_FROM, [MAIL_TO], msg.as_string())


def send_discord(name, email, project_type, message):
    if not DISCORD_WEBHOOK_URL:
        return False
    project_type = project_type or "(not specified)"
    message_value = message if len(message) <= 1000 else message[:997] + "\u2026"

    payload = {
        # Never let submitted text trigger mentions.
        "allowed_mentions": {"parse": []},
        "embeds": [
            {
                "title": "\U0001F4E8 New message from skitoji.cloud",
                "color": 12582656,  # #BFFF00 (portfolio accent)
                "fields": [
                    {"name": "Name", "value": name, "inline": True},
                    {"name": "Email", "value": email, "inline": True},
                    {"name": "Project type", "value": project_type, "inline": True},
                    {"name": "Message", "value": message_value, "inline": False},
                ],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        DISCORD_WEBHOOK_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "skitoji-portfolio-form/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status in (200, 204)


class Handler(BaseHTTPRequestHandler):
    server_version = "skitoji-form/1.0"

    def _send(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        self._send(405, {"ok": False, "error": "method not allowed"})

    def do_POST(self):
        if self.path.split("?")[0] != "/api/contact":
            self._send(404, {"ok": False, "error": "not found"})
            return

        ip = _client_ip(self)
        if not _rate_ok(ip):
            self._send(429, {"ok": False, "error": "too many requests"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0") or 0)
        except ValueError:
            length = 0
        if length < 0 or length > MAX_BODY:
            self._send(413, {"ok": False, "error": "payload too large"})
            return

        try:
            data = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            data = {}
        if not isinstance(data, dict):
            data = {}

        name = _clean_single(str(data.get("name") or ""))[:200]
        email = _clean_single(str(data.get("email") or ""))[:200]
        project_type = _clean_single(str(data.get("projectType") or ""))[:100]
        message = _clean_multi(str(data.get("message") or ""))[:20000]
        honeypot = _clean_single(str(data.get("website") or ""))
        form_time_raw = str(data.get("form_time") or "").strip()

        # Honeypot field filled => bot. Silently pretend success.
        if honeypot:
            self._send(200, {"ok": True})
            return

        # Time honeypot: humans take > MIN_HUMAN_MS to fill the form.
        try:
            form_time = int(form_time_raw)
        except ValueError:
            form_time = -1
        if form_time < MIN_HUMAN_MS:
            self._send(200, {"ok": True})
            return

        if not name or not email or not message:
            self._send(400, {"ok": False, "error": "name, email and message are required"})
            return
        if "@" not in email or "." not in email or len(email) > 200:
            self._send(400, {"ok": False, "error": "invalid email"})
            return

        configured_email = bool(SMTP_USER and SMTP_PASS)
        configured_discord = bool(DISCORD_WEBHOOK_URL)
        if not configured_email and not configured_discord:
            self._send(500, {"ok": False, "error": "no delivery configured"})
            return

        email_ok = False
        discord_ok = False
        err_email = None
        err_discord = None

        if configured_email:
            try:
                send_email(name, email, project_type, message, ip)
                email_ok = True
            except Exception as exc:
                err_email = exc.__class__.__name__

        if configured_discord:
            try:
                discord_ok = send_discord(name, email, project_type, message)
            except Exception as exc:
                err_discord = exc.__class__.__name__

        if email_ok or discord_ok:
            self._send(200, {"ok": True, "email": email_ok, "discord": discord_ok})
        else:
            self._send(500, {"ok": False, "error": f"delivery failed (email={err_email}, discord={err_discord})"})

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    if not (SMTP_USER and SMTP_PASS) and not DISCORD_WEBHOOK_URL:
        print("WARNING: no delivery channel configured (SMTP and/or Discord webhook).")
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"skitoji-form listening on :{PORT}")
    srv.serve_forever()
