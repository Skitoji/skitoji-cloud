        // --- Internationalization System ---
        const translations = {
            en: {
                'nav.work': 'WORK',
                'nav.about': 'ABOUT',
                'nav.skills': 'SKILLS',
                'nav.services': 'SERVICES',
                'nav.contact': 'CONTACT',
                'hero.creative': 'CREATIVE',
                'hero.portfolio': 'PORTFOLIO',
                'hero.role': 'HYPERMEDIA DESIGNER & FILMMAKER',
                'hero.tagline': 'I design digital experiences that are <span>bold</span>, <span>immersive</span>, and <span>impossible to ignore</span>.',
                'hud.status': 'STATUS: AVAILABLE',
                'hud.timePrefix': 'LOCAL TIME',
                'marquee': '★ HYPERMEDIA DESIGN ★ FILMMAKING ★ MOTION GRAPHICS ★ BRANDING ★ UI/UX ★ ART DIRECTION ★ CREATIVE STRATEGY',
                'works.title': 'SELECTED WORKS',
                'works.cat.branding': 'BRANDING',
                'works.cat.film': 'FILM',
                'works.cat.uiux': 'UI/UX DESIGN',
                'works.cat.motion': 'MOTION',
                'works.cat.3d': '3D / VFX',
                'works.cat.typography': 'TYPOGRAPHY',
                'works.cat.project': 'PROJECT',
                'case.title': 'CASE STUDY',
                'case.viewProject': 'VIEW PROJECT →',
                'case.challenge': 'THE CHALLENGE',
                'case.challengeDesc': 'Redefining visual identity for a cyberpunk-themed creative festival, ensuring it stands out in a saturated market while remaining scalable across digital and physical mediums.',
                'case.solution': 'THE SOLUTION',
                'case.solutionDesc': 'Implemented a dynamic design system using acid colors, brutalist typography, and generative textures that adapt to user interaction and ambient sound.',
                'case.result': 'THE RESULT',
                'case.resultDesc': 'A unified, striking brand presence that resonated deeply with the target audience.',
                'case.engagement': 'ENGAGEMENT',
                'about.title': 'WHO I AM',
                'about.subtitle': '"NOT A STUDIO — JUST ME"',
                'about.bio': 'Hypermedia Designer with a cinematic vision. I transform ideas into immersive digital experiences that challenge the boundaries between design, cinema, and technology. Every project is a mission, every pixel has purpose.',
                'about.yearsExp': 'Years Exp',
                'about.projects': 'Projects',
                'about.clients': 'Clients',
                'about.location': 'BASED IN CARTAGENA, COL',
                'skills.title': 'SKILLS I USE',
                'skills.coreThreads': '// CORE THREADS OF MY WORK',
                'skills.thread1': 'PERCEPTUAL INTERFACES',
                'skills.thread2': 'IMMERSIVE NARRATIVES',
                'skills.thread3': 'DESIGN SYSTEMS',
                'skills.thread4': 'VISUAL STORYTELLING',
                'services.title': 'WHAT I DO',
                'services.s1.title': 'Hypermedia Design <span>↗</span>',
                'services.s1.desc': 'Creation of interactive digital experiences that combine multiple media into a cohesive narrative.',
                'services.s2.title': 'Audiovisual Production <span>↗</span>',
                'services.s2.desc': 'Direction, filming, and post-production with a professional cinematic approach.',
                'services.s3.title': 'Art Direction <span>↗</span>',
                'services.s3.desc': 'Conceptual and visual aesthetic definition for complex and ambitious projects.',
                'services.s4.title': 'Branding & Identity <span>↗</span>',
                'services.s4.desc': 'Building brands with solid, disruptive, and unforgettable visual narratives.',
                'services.s5.title': 'Motion Graphics <span>↗</span>',
                'services.s5.desc': 'Animation and motion design for interfaces, campaigns, and audiovisual content.',
                'services.s6.title': 'Creative Consulting <span>↗</span>',
                'services.s6.desc': 'Strategic advice to elevate the quality and visual coherence of your project.',
                'contact.title': 'LET\'S BUILD SOMETHING<br><span style="color: var(--accent-primary)">EPIC TOGETHER</span>',
                'contact.name': 'YOUR NAME',
                'contact.email': 'YOUR EMAIL',
                'contact.projectType': 'PROJECT TYPE',
                'contact.opt1': 'WEB DESIGN / HYPERMEDIA',
                'contact.opt2': 'FILM / VIDEO',
                'contact.opt4': 'OTHER',
                'contact.message': 'TELL ME ABOUT YOUR MISSION...',
                'contact.submit': 'INITIATE SEQUENCE',
                'contact.directLine': '// DIRECT LINE',
                'contact.socialLabel': '// SOCIAL NETWORKS',
                'contact.available': 'AVAILABLE FOR FREELANCE',
                'footer.copyright': '© 2026 SKITOJI.CLOUD // ALL RIGHTS RESERVED'
            },
            es: {
                'nav.work': 'TRABAJO',
                'nav.about': 'SOBRE MÍ',
                'nav.skills': 'HABILIDADES',
                'nav.services': 'SERVICIOS',
                'nav.contact': 'CONTACTO',
                'hero.creative': 'PORTAFOLIO',
                'hero.portfolio': 'CREATIVO',
                'hero.role': 'DISEÑADOR HIPERMEDIA & CINEASTA',
                'hero.tagline': 'Diseño experiencias digitales que son <span>audaces</span>, <span>inmersivas</span> e <span>imposibles de ignorar</span>.',
                'hud.status': 'ESTADO: DISPONIBLE',
                'hud.timePrefix': 'HORA LOCAL',
                'marquee': '★ DISEÑO HIPERMEDIA ★ CINE ★ MOTION GRAPHICS ★ BRANDING ★ UI/UX ★ DIRECCIÓN DE ARTE ★ ESTRATEGIA CREATIVA',
                'works.title': 'TRABAJOS SELECTOS',
                'works.cat.branding': 'BRANDING',
                'works.cat.film': 'CINE',
                'works.cat.uiux': 'DISEÑO UI/UX',
                'works.cat.motion': 'MOTION',
                'works.cat.3d': '3D / VFX',
                'works.cat.typography': 'TIPOGRAFÍA',
                'works.cat.project': 'PROYECTO',
                'case.title': 'CASO DE ESTUDIO',
                'case.viewProject': 'VER PROYECTO →',
                'case.challenge': 'EL DESAFÍO',
                'case.challengeDesc': 'Redefinir la identidad visual para un festival creativo cyberpunk, asegurando que destaque en un mercado saturado manteniéndose escalable en medios digitales y físicos.',
                'case.solution': 'LA SOLUCIÓN',
                'case.solutionDesc': 'Implementamos un sistema de diseño dinámico usando colores ácidos, tipografía brutalista y texturas generativas que se adaptan a la interacción del usuario y al sonido ambiental.',
                'case.result': 'EL RESULTADO',
                'case.resultDesc': 'Una presencia de marca unificada e impactante que resonó profundamente con la audiencia objetivo.',
                'case.engagement': 'ENGAGEMENT',
                'about.title': 'QUIÉN SOY',
                'about.subtitle': '"NO ES UN ESTUDIO — SOY SOLO YO"',
                'about.bio': 'Diseñador Hipermedia con visión cinematográfica. Transformo ideas en experiencias digitales inmersivas que desafían los límites entre el diseño, el cine y la tecnología. Cada proyecto es una misión, cada pixel tiene propósito.',
                'about.yearsExp': 'Años Exp',
                'about.projects': 'Proyectos',
                'about.clients': 'Clientes',
                'about.location': 'BASADO EN CARTAGENA, COL',
                'skills.title': 'HERRAMIENTAS QUE USO',
                'skills.coreThreads': '// HILOS CENTRALES DE MI TRABAJO',
                'skills.thread1': 'INTERFACES PERCEPTUALES',
                'skills.thread2': 'NARRATIVAS INMERSIVAS',
                'skills.thread3': 'SISTEMAS DE DISEÑO',
                'skills.thread4': 'NARRATIVA VISUAL',
                'services.title': 'QUÉ HAGO',
                'services.s1.title': 'Diseño Hipermedia <span>↗</span>',
                'services.s1.desc': 'Creación de experiencias digitales interactivas que combinan múltiples medios en una narrativa cohesiva.',
                'services.s2.title': 'Producción Audiovisual <span>↗</span>',
                'services.s2.desc': 'Dirección, filmación y post-producción con enfoque cinematográfico profesional.',
                'services.s3.title': 'Dirección de Arte <span>↗</span>',
                'services.s3.desc': 'Definición conceptual y estética visual para proyectos complejos y ambiciosos.',
                'services.s4.title': 'Branding & Identidad <span>↗</span>',
                'services.s4.desc': 'Construcción de marcas con narrativas visuales sólidas, disruptivas e inolvidables.',
                'services.s5.title': 'Motion Graphics <span>↗</span>',
                'services.s5.desc': 'Animación y diseño en movimiento para interfaces, campañas y contenido audiovisual.',
                'services.s6.title': 'Consultoría Creativa <span>↗</span>',
                'services.s6.desc': 'Asesoramiento estratégico para elevar la calidad y coherencia visual de tu proyecto.',
                'contact.title': 'CONSTRUYAMOS ALGO<br><span style="color: var(--accent-primary)">ÉPICO JUNTOS</span>',
                'contact.name': 'TU NOMBRE',
                'contact.email': 'TU EMAIL',
                'contact.projectType': 'TIPO DE PROYECTO',
                'contact.opt1': 'DISEÑO WEB / HIPERMEDIA',
                'contact.opt2': 'CINE / VIDEO',
                'contact.opt4': 'OTRO',
                'contact.message': 'CUÉNTAME SOBRE TU MISIÓN...',
                'contact.submit': 'INICIAR SECUENCIA',
                'contact.directLine': '// LÍNEA DIRECTA',
                'contact.socialLabel': '// REDES SOCIALES',
                'contact.available': 'DISPONIBLE PARA FREELANCE',
                'footer.copyright': '© 2026 SKITOJI.CLOUD // TODOS LOS DERECHOS RESERVADOS'
            }
        };

        let currentLang = 'en';

        function setLanguage(lang) {
            currentLang = lang;
            document.documentElement.lang = lang;
            
            // Update all data-i18n elements (textContent)
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (translations[lang][key]) {
                    el.textContent = translations[lang][key];
                }
            });
            
            // Update all data-i18n-html elements (innerHTML)
            document.querySelectorAll('[data-i18n-html]').forEach(el => {
                const key = el.getAttribute('data-i18n-html');
                if (translations[lang][key]) {
                    el.innerHTML = translations[lang][key];
                }
            });
            
            // Update all data-i18n-placeholder elements
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (translations[lang][key]) {
                    el.placeholder = translations[lang][key];
                }
            });
            
            // Update active button
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
            });
            
            // Save preference
            localStorage.setItem('skitoji-lang', lang);
        }

        // Language toggle event
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setLanguage(btn.getAttribute('data-lang'));
            });
        });

        // Load saved language preference (validated)
        const allowedLanguages = ['en', 'es'];
        const savedLang = localStorage.getItem('skitoji-lang');
        setLanguage(allowedLanguages.includes(savedLang) ? savedLang : 'en');


        // --- Custom Cursor ---
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorRing = document.querySelector('.cursor-ring');
        
        let mouseX = 0;
        let mouseY = 0;
        let ringX = 0;
        let ringY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        });

        function animateCursor() {
            // Smooth follow for the ring
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            
            cursorRing.style.left = `${ringX}px`;
            cursorRing.style.top = `${ringY}px`;
            
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover effects
        const interactives = document.querySelectorAll('a, button, .interactive');
        interactives.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('hover-active');
            });
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('hover-active');
            });
        });

        // --- Magnetic Elements ---
        const magnetics = document.querySelectorAll('.magnetic');
        magnetics.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const h = rect.width / 2;
                const v = rect.height / 2;
                const x = e.clientX - rect.left - h;
                const y = e.clientY - rect.top - v;
                
                el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = `translate(0px, 0px)`;
            });
        });

        // --- Scroll Reveal & Counter Animation ---
        const revealElements = document.querySelectorAll('.reveal');
        const counters = document.querySelectorAll('.counter');

        const revealCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    
                    // Trigger counters if inside the revealed element
                    const entryCounters = entry.target.querySelectorAll('.counter');
                    [...entryCounters, ...(entry.target.classList.contains('counter') ? [entry.target] : [])].forEach(counter => {
                        if (!counter.classList.contains('counted')) {
                            animateCounter(counter);
                            counter.classList.add('counted');
                        }
                    });
                    
                    // Optional: Unobserve after reveal
                    // observer.unobserve(entry.target); 
                }
            });
        };

        const revealOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };

        const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
        revealElements.forEach(el => revealObserver.observe(el));

        function animateCounter(el) {
            const target = +el.getAttribute('data-target');
            const duration = 2000;
            const start = performance.now();
            
            // Add suffix if exists in original HTML
            const textContent = el.innerText;
            const suffix = textContent.replace(/[0-9]/g, '');

            function update(time) {
                const elapsed = time - start;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (easeOutExpo)
                const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                
                const current = Math.floor(easeProgress * target);
                
                if (el.innerText !== current + suffix) {
                    el.innerText = current + (target > 10 ? '+' : suffix); // Simplified suffix logic
                }
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.innerText = target + (target > 1 ? '+' : '');
                    if (target === 340) el.innerText = '+' + target + '%';
                }
            }
            
            requestAnimationFrame(update);
        }

        // --- HUD Local Time ---
        function updateTime() {
            const timeEl = document.getElementById('localTime');
            if (!timeEl) return;
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour12: false });
            const prefix = translations[currentLang]['hud.timePrefix'] || 'LOCAL TIME';
            timeEl.textContent = `${prefix}: ${timeString}`;
        }
        setInterval(updateTime, 1000);
        updateTime();

        // --- Active Nav Link (path-based) ---
        const navLinks = document.querySelectorAll('.nav-links a');
        const currentPage = document.body.getAttribute('data-page') || 'home';
        navLinks.forEach(link => {
            const page = (link.getAttribute('href') || '').replace(/^\//, '').replace(/\/.*$/, '');
            if (page === currentPage) link.classList.add('active');
        });
        // --- Hamburger Menu ---
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const navLinksContainer = document.querySelector('.nav-links');
        
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navLinksContainer.classList.toggle('open');
        });
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                navLinksContainer.classList.remove('open');
            });
        });

        // --- Form Submission ---
        const _pageLoadTs = Date.now();
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const btn = form.querySelector('.submit-btn');
            const originalText = translations[currentLang]['contact.submit'];
            btn.textContent = currentLang === 'en' ? 'TRANSMITTING...' : 'TRANSMITIENDO...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            const payload = {
                name: form.querySelector('[name="name"]').value,
                email: form.querySelector('[name="email"]').value,
                projectType: form.querySelector('[name="projectType"]').value,
                message: form.querySelector('[name="message"]').value,
                website: (form.querySelector('[name="website"]') || {}).value || '',
                form_time: String(Date.now() - _pageLoadTs)
            };

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json().catch(() => ({}));
                const ok = res.ok && data.ok === true;
                btn.textContent = ok
                    ? (currentLang === 'en' ? 'SEQUENCE INITIATED ✓' : 'SECUENCIA INICIADA ✓')
                    : (currentLang === 'en' ? 'ERROR — TRY AGAIN' : 'ERROR — INTÉNTALO DE NUEVO');
                btn.style.background = 'transparent';
                btn.style.border = ok ? '2px solid var(--accent-primary)' : '2px solid var(--accent-danger)';
                btn.style.color = ok ? 'var(--accent-primary)' : 'var(--accent-danger)';
                if (ok) form.reset();
            } catch (err) {
                btn.textContent = currentLang === 'en' ? 'ERROR — TRY AGAIN' : 'ERROR — INTÉNTALO DE NUEVO';
                btn.style.background = 'transparent';
                btn.style.border = '2px solid var(--accent-danger)';
                btn.style.color = 'var(--accent-danger)';
            }

            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                btn.style.background = 'var(--accent-primary)';
                btn.style.border = 'none';
                btn.style.color = 'var(--bg-primary)';
                btn.style.opacity = '1';
            }, 3500);
        });


        // --- Behance Works (rendered from /works.json via RSS sync) ---
        const worksGrid = document.getElementById('worksGrid');
        if (worksGrid) {
            const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[c]));

            const reinitCardInteractions = () => {
                document.querySelectorAll('#worksGrid .reveal').forEach(el => revealObserver.observe(el));
                document.querySelectorAll('#worksGrid .interactive, #worksGrid a').forEach(el => {
                    el.addEventListener('mouseenter', () => document.body.classList.add('hover-active'));
                    el.addEventListener('mouseleave', () => document.body.classList.remove('hover-active'));
                });
            };

            const renderWorks = (projects) => {
                worksGrid.innerHTML = '';
                if (!projects.length) {
                    worksGrid.innerHTML = '<div class="works-empty">NO PROJECTS YET</div>';
                    return;
                }
                projects.forEach((p, i) => {
                    const card = document.createElement('article');
                    card.className = 'work-card reveal interactive';
                    card.style.transitionDelay = ((i % 3) * 0.1) + 's';

                    const cover = p.cover ? `background-image:url('${String(p.cover).replace(/['"]/g, '')}'); background-size:cover; background-position:center;` : '';
                    const url = p.url || '#';

                    card.innerHTML =
                        `<a class="work-card-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(p.title)}"></a>` +
                        `<div class="work-index">${String(i + 1).padStart(2, '0')}</div>` +
                        `<div class="work-image-container" style="${cover}"></div>` +
                        `<div class="work-info">` +
                            `<div>` +
                                `<h3 class="work-title">${escapeHtml(p.title)}</h3>` +
                                `<span class="work-category" data-i18n="${escapeHtml(p.category)}"></span>` +
                                `<p class="work-desc">${escapeHtml(p.description)}</p>` +
                            `</div>` +
                            `<span class="mono">${escapeHtml(p.year)}</span>` +
                        `</div>`;
                    worksGrid.appendChild(card);
                });
                reinitCardInteractions();
                setLanguage(currentLang);
            };

            fetch('/works.json', { cache: 'no-store' })
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(data => renderWorks(Array.isArray(data.projects) ? data.projects : []))
                .catch(() => {
                    const loading = document.getElementById('worksLoading');
                    if (loading) loading.textContent = 'PROJECTS UNAVAILABLE — CHECK BACK SOON';
                });
        }
