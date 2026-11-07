#!/usr/bin/env python3
"""Sync skitoji's Behance projects -> works.json (served by the portfolio site).

No dependencies (Python stdlib only). Reads the public Behance RSS feed,
which includes title / description / cover / date / link, then applies a
manual category mapping from behance-categories.json (keyed by gallery id).

If the fetch fails, the previous works.json is left untouched.
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

USERNAME = "skitoji"
RSS_URL = f"https://www.behance.net/feeds/user?username={USERNAME}"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CATEGORIES_FILE = os.path.join(BASE_DIR, "behance-categories.json")
OUT = "/home/skitoji/docker/skitoji-landing/works.json"
DEFAULT_CATEGORY = "works.cat.project"


def load_categories():
    try:
        with open(CATEGORIES_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def fetch_rss():
    req = urllib.request.Request(RSS_URL, headers={
        "User-Agent": UA,
        "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def strip_html(s):
    s = re.sub(r"<br\s*/?>", " ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = s.replace("\u00a0", " ")
    return re.sub(r"\s+", " ", s).strip()


def main():
    data = fetch_rss()
    import xml.etree.ElementTree as ET
    root = ET.fromstring(data)
    categories = load_categories()

    projects = []
    for item in root.iter("item"):
        def text(tag):
            el = item.find(tag)
            return (el.text or "").strip() if el is not None else ""

        title = text("title")
        link = text("link")
        guid = text("guid")
        url = link or guid
        desc_raw = text("description")

        cover = ""
        m = re.search(r"src=['\"]([^'\"]+)['\"]", desc_raw)
        if m:
            cover = m.group(1)
        description = strip_html(desc_raw)

        year = ""
        m = re.search(r"(\d{4})", text("pubDate"))
        if m:
            year = m.group(1)

        m = re.search(r"/gallery/(\d+)", url)
        pid = m.group(1) if m else url
        category = categories.get(pid, categories.get(url, DEFAULT_CATEGORY))

        if not title:
            continue

        projects.append({
            "id": pid,
            "title": title,
            "url": url,
            "cover": cover,
            "description": description,
            "year": year,
            "category": category,
        })

    payload = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": RSS_URL,
        "projects": projects,
    }

    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    os.replace(tmp, OUT)
    print(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] "
          f"wrote {len(projects)} projects -> {OUT}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"sync failed: {e}", file=sys.stderr)
        sys.exit(1)
