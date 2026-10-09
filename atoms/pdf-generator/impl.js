// 2025-08-28 — PDFGenerator (text-only, vector PDF via pdfmake) — JSON-first
// SINGLE SOURCE OF TRUTH: reads data only from data/resume.json (no DOM).
// Emits selectable text + live links using pdfmake. No rasterization.

// +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Data now comes via injected ResumeDataLoader (declared dependency); pdfmake vendored locally

class PDFGenerator {
    /**
     * @param {ResumeDataLoader} resumeDataLoader - single source of resume data
     */
    constructor(resumeDataLoader) {
        this.resumeDataLoader = resumeDataLoader;
        this.isGenerating = false;
        console.debug('[PDFGenerator] created, loader injected =', !!resumeDataLoader);
    }

    /**
     * Public API used by App.generatePDF()
     * @param {*} _unused
     * @param {{filename?: string, compact?: boolean}} opts
     */
    async generateAndDownload(_unused = null, opts = {}) {
        if (this.isGenerating) {
            return {success: false, error: 'A PDF generation is already in progress'};
        }
        this.isGenerating = true;

        try {
            // 1) Load resume.json
            const data = await this._loadResumeJson();
            if (!data) throw new Error('resume.json not found or invalid');

            // 2) Ensure pdfmake
            await this._ensurePdfMake();

            // 3) Normalize JSON → internal model
            const m = this._normalize(data);

            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — 3b) Company logos → PNG data URLs (opts.logos === false skips)
            if (opts.logos !== false) await this._loadLogos(m);

            // 4) Build doc
            const doc = this._buildDocDefinition(m, opts);

            // 5) Filename
            const safe = this._safeFilename([m.profile.firstName, m.profile.lastName].filter(Boolean).join(' ') || 'Resume');
            const filename = (opts.filename && String(opts.filename).trim()) || `${safe}_Resume.pdf`;

            // 6) Download
            window.pdfMake.createPdf(doc).download(filename);
            return {success: true};
        } catch (e) {
            return {success: false, error: String(e && e.message || e)};
        } finally {
            this.isGenerating = false;
        }
    }

    // ---------- data load ----------
    // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Read via ResumeDataLoader instead of own fetch
    async _loadResumeJson() {
        if (!this.resumeDataLoader) {
            console.error('[PDFGenerator] no ResumeDataLoader injected');
            return null;
        }
        const result = await this.resumeDataLoader.loadResumeData();
        console.debug('[PDFGenerator] loader result success =', result.success, 'error =', result.error);
        return result.success ? result.data : null;
    }

    /**
     * +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Load company logos (job.logo paths from resume data) and convert them
     * to square PNG data URLs via canvas (pdfmake supports only PNG/JPEG; this also covers SVG and WebP).
     * Sets job.logoData; a logo that fails to load is skipped (PDF is still generated).
     * @param {object} m - normalized model (m.experience[].logo)
     */
    async _loadLogos(m) {
        const SIZE = 128; // px, square canvas; logo fitted with preserved aspect ratio
        const cache = {};
        const toPng = (src) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const w = img.naturalWidth || SIZE, h = img.naturalHeight || SIZE;
                    const scale = Math.min(SIZE / w, SIZE / h);
                    const dw = w * scale, dh = h * scale;
                    const canvas = document.createElement('canvas');
                    canvas.width = SIZE;
                    canvas.height = SIZE;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
                    console.debug('[PDFGenerator] logo converted', src, {w, h});
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    console.error('[PDFGenerator] logo conversion failed', src, e && e.message);
                    resolve(null);
                }
            };
            img.onerror = () => {
                console.error('[PDFGenerator] logo load failed', src);
                resolve(null);
            };
            img.src = src;
        });

        for (const job of (m.experience || [])) {
            if (!job.logo) continue;
            if (!(job.logo in cache)) cache[job.logo] = await toPng(job.logo);
            job.logoData = cache[job.logo];
        }
        console.debug('[PDFGenerator] _loadLogos done', (m.experience || []).map(j => ({company: j.company, logo: !!j.logoData})));
    }

    // ---------- utils ----------
    async _ensurePdfMake() {
        if (window.pdfMake && window.pdfMake.createPdf) return;
        const load = (src) => new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = res;
            s.onerror = () => rej(new Error('Failed to load ' + src));
            document.head.appendChild(s);
        });
        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — pdfmake 0.2.10 vendored locally (was CDN)
        console.debug('[PDFGenerator] loading local pdfmake');
        await load('assets/js/pdfmake.min.js');
        await load('assets/js/vfs_fonts.js');
        console.debug('[PDFGenerator] pdfmake loaded =', !!(window.pdfMake && window.pdfMake.createPdf));
        if (!window.pdfMake || !window.pdfMake.createPdf) throw new Error('pdfmake failed to initialize');
    }

    _safeFilename(s) {
        return String(s).replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    }

    _clean(s) {
        return (s ?? '').toString().trim();
    }

    _normUrl(u) {
        if (!u) return null;
        if (/^mailto:|^https?:\/\//i.test(u)) return u;
        if (/^tel:/i.test(u)) return u;
        if (/^\+?[0-9][0-9()\-\s]{5,}$/.test(u)) return 'tel:' + u.replace(/[^\d+]/g, '');
        return 'https://' + String(u).replace(/^\/+/, '');
    }

    _dedupeByText(items) {
        const seen = new Set();
        return items.filter(it => {
            const key = (it.text || '').toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    // ---------- normalization ----------
    /**
     * Accepts flexible resume.json shapes and maps to:
     * {
     *   profile: { firstName, lastName, title, credentials },
     *   contact: { email, phone, location, website, socials: [{label, url, text}] },
     *   summary: "…",
     *   skills: ["…","…"],
     *   technical: [{ label, value }],
     *   experience: [{ company, position, location, period, bullets[], description }],
     *   education: [{ school, degree, year }],
     *   certifications: [{ name, issuer, year }],
     *   languages: [{ name, level }]
     * }
     */
    // REPLACE the entire _normalize(raw) method with this:

    _normalize(raw) {
        const g = (obj, path, dflt = null) => {
            try {
                return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj) ?? dflt;
            } catch {
                return dflt;
            }
        };
        const clean = (s) => (s ?? '').toString().trim();

        // ---- PROFILE (personal_info) ----
        const pi = g(raw, 'personal_info', {}) || {};
        const fullName = clean(pi.name || '');
        const firstName = fullName ? fullName.split(' ')[0] : '';
        const lastName = fullName ? fullName.split(' ').slice(1).join(' ') : '';

        const profile = {
            firstName,
            lastName,
            name: fullName,
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Two lines under the name: headline, then credentials (same as site hero)
            title: clean(pi.headline || ''),
            credentials: clean(pi.title || ''),           // e.g., "AWS® SA, TOGAF® 10, PMP® ..."
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — One-line positioning statement under the headline
            positioning: clean(pi.positioning || ''),
        };

        // ---- CONTACT + SOCIALS ----
        const contactObj = g(pi, 'contact', {}) || {};
        const contact = {
            email: clean(contactObj.email || ''),
            phone: clean(contactObj.phone || ''),
            location: clean(contactObj.location || ''),
            website: clean(contactObj.website || ''),
            socials: []
        };

        // social_links is an OBJECT of platform -> url
        const socialLinks = g(pi, 'social_links', {}) || {};
        Object.entries(socialLinks).forEach(([label, url]) => {
            if (!url) return;
            const norm = this._normUrl(url);
            const txt = (String(url).replace(/^https?:\/\//, '') || label).trim();
            if (norm) contact.socials.push({label, url: norm, text: txt});
        });
        contact.socials = this._dedupeByText(contact.socials);

        // ---- SUMMARY: prefer HTML if present ----
        const summary = clean(pi.summary_html || pi.summary || '');

        // ---- SKILLS (your schema) ----
        // 1) Professional: flat array of strings
        const skillsProfessional = Array.isArray(g(raw, 'skills.professional'))
            ? g(raw, 'skills.professional').map(clean).filter(Boolean)
            : [];

        // 2) (Optional) If you want to keep 'skills' section as a flat list in the PDF:
        //    We'll use only "professional" here, and render "technical" under Technical Skills.
        const skills = skillsProfessional;

        // ---- TECHNICAL (object of arrays) ----
        // Convert each key in skills.technical to {label, value}
        const technical = [];
        const techObj = g(raw, 'skills.technical', {}) || {};
        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Group labels from data (skills.technical_labels); auto-label only as fallback
        const techLabels = g(raw, 'skills.technical_labels', {}) || {};
        Object.keys(techObj).forEach(key => {
            const val = techObj[key];

            let cleanLabel = clean(techLabels[key] || '');
            if (!cleanLabel) {
                // normalize label
                cleanLabel = this._labelize(key)
                    .replace(/&/g, 'and')        // & → and
                    .replace(/\//g, ' ')         // / → space
                    .replace(/_/g, ' ')          // underscores → space
                    .replace(/\s+/g, ' ')        // collapse multiple spaces
                    .trim();

                // enforce Title Case
                cleanLabel = cleanLabel.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
            }
            console.debug('[PDFGenerator] technical group', key, '→', cleanLabel);

            if (val && typeof val === 'object' && !Array.isArray(val)) {
                const parts = [];
                Object.keys(val).forEach(sub => {
                    const arr = Array.isArray(val[sub]) ? val[sub].map(clean).filter(Boolean) : [];
                    if (arr.length) parts.push(`${this._labelize(sub)}: ${arr.join(', ')}`);
                });
                if (parts.length) technical.push({ label: cleanLabel, value: parts.join(' | ') });
            } else {
                const arr = Array.isArray(val) ? val.map(clean).filter(Boolean) : [];
                if (arr.length) technical.push({ label: cleanLabel, value: arr.join(', ') });
            }
        });



        // ---- EXPERIENCE (work_experience) ----
        const experience = Array.isArray(g(raw, 'work_experience')) ? g(raw, 'work_experience').map(e => ({
            company: clean(e.company || ''),
            position: clean(e.position || ''),
            location: clean(e.location || ''),
            period: clean(e.period || ''), // already "MM/YYYY – MM/YYYY" in your data
            logo: clean(e.company_logo || ''), // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — logo path (may be hidden via to_render)
            description: clean(e.company_description || ''),
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Bullet = string or {text, links:[{text, url}]} → normalized {text, links}
            bullets: Array.isArray(e.achievements)
                ? e.achievements
                    .map(a => (a && typeof a === 'object')
                        ? {text: clean(a.text), links: Array.isArray(a.links) ? a.links.filter(l => l && l.text && l.url) : []}
                        : {text: clean(a), links: []})
                    .filter(b => b.text)
                : []
        })).filter(j => j.company || j.position || j.description || (j.bullets && j.bullets.length)) : [];

        // ---- EDUCATION ----
        const education = Array.isArray(g(raw, 'education')) ? g(raw, 'education').map(ed => ({
            school: clean(ed.institution || ed.school || ''),
            degree: clean(ed.degree || ''),
            year: clean(ed.period || ed.year || ''),
        })).filter(x => x.school || x.degree || x.year) : [];

        // ---- CERTIFICATIONS (certificates) ----
        const certifications = Array.isArray(g(raw, 'certificates')) ? g(raw, 'certificates').map(c => ({
            name: clean(c.name || ''),
            issuer: '',                           // issuer not present in your schema
            year: clean(c.period || ''),        // show the period string
            url: clean(c.url || ''),            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — verification link
        })).filter(x => x.name) : [];

        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — PROJECTS, COURSES, MEMBERSHIPS
        const projects = Array.isArray(g(raw, 'projects')) ? g(raw, 'projects').map(pr => ({
            name: clean(pr.name || ''),
            period: clean(pr.period || ''),
            url: clean(pr.url || ''),
            description: clean(pr.description || '')
        })).filter(x => x.name) : [];

        const courses = Array.isArray(g(raw, 'courses')) ? g(raw, 'courses').map(c => ({
            name: clean(c.name || '')
        })).filter(x => x.name) : [];

        const memberships = Array.isArray(g(raw, 'memberships')) ? g(raw, 'memberships').map(mb => ({
            name: clean(mb.name || ''),
            position: clean(mb.position || ''),
            period: clean(mb.period || ''),
            url: clean(mb.url || '')
        })).filter(x => x.name) : [];
        console.debug('[PDFGenerator] _normalize new sections', {projects: projects.length, courses: courses.length, memberships: memberships.length});

        // ---- LANGUAGES (top-level array) ----
        const languages = Array.isArray(g(raw, 'languages')) ? g(raw, 'languages').map(l => ({
            name: clean(l.name || l.language || l),
            level: clean(l.level || '')
        })).filter(x => x.name) : [];

        return {profile, contact, summary, skills, technical, experience, education, certifications, languages, projects, courses, memberships};
    }


    _labelize(key) {
        return String(key || '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, m => m.toUpperCase());
    }

    // ---------- doc build ----------
    _sectionTitle(t) {
        return {text: t, style: 'h2', margin: [0, 10, 0, 4]};
    }

    _buildDocDefinition(m, opts = {}) {
        const compact = !!opts.compact;

        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Design "accent" (default): one navy accent, uppercase section titles
        // with a hairline, position bold + dates right-aligned, company in grey. opts.design = 'classic' restores the previous look.
        // Only presentation changes — text content is identical.
        const ACCENT_DESIGN = opts.design !== 'classic';
        const ACCENT = '#1F3A5F';
        const GREY = '#5F6B7A';
        const LINK = ACCENT_DESIGN ? ACCENT : '#0B57D0';
        const CONTENT_WIDTH = 595.28 - 36 * 2; // A4 width minus left/right margins
        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — company logos (accent design only; at least one logo loaded)
        const LOGO_SIZE = 26;
        const SHOW_LOGOS = ACCENT_DESIGN && opts.logos !== false && (m.experience || []).some(j => j.logoData);
        console.debug('[PDFGenerator] design =', ACCENT_DESIGN ? 'accent' : 'classic', 'logos =', SHOW_LOGOS);

        // ---------- styles (black everywhere except hyperlinks) ----------
        const styles = {
            name: ACCENT_DESIGN
                ? {fontSize: 24, bold: true, lineHeight: 1.05, color: ACCENT}
                : {fontSize: 22, bold: true, lineHeight: 1.05, color: '#000000'},
            title: {fontSize: 12, color: ACCENT_DESIGN ? '#222222' : '#000000', margin: [0, 2, 0, 2]},
            creds: {fontSize: 10, color: '#000000', italics: true, margin: [0, 0, 0, 6]},

            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Section title top margin 12 → 8 (one-page resume)
            h2: ACCENT_DESIGN
                ? {fontSize: 10, bold: true, color: ACCENT, characterSpacing: 1.2, margin: [0, 8, 0, 2], lineHeight: 1.1}
                : {fontSize: 11, bold: true, color: '#000000', margin: [0, 8, 0, 6], lineHeight: 1.1},

            meta: {fontSize: 9, color: '#000000'},
            small: {fontSize: compact ? 9 : 10, color: '#000000'},
            bullet: {margin: [0, 1, 0, 1], fontSize: compact ? 9 : 10, color: '#000000'},

            jobHeader: {bold: true, fontSize: 10, margin: [0, 1, 0, 0], color: '#000000'},
            jobSub: {fontSize: 9, color: ACCENT_DESIGN ? GREY : '#000000', margin: [0, 1, 0, 4]},

            contactLink: {fontSize: 9, color: LINK}, // hyperlinks ONLY
            contactText: {fontSize: 9, color: ACCENT_DESIGN ? GREY : '#000000'},
            sep: {fontSize: 9, color: '#000000'}
        };

        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Section title: accent = UPPERCASE + hairline under it; classic = plain
        const sectionTitle = (t) => ACCENT_DESIGN
            ? {
                stack: [
                    {text: String(t).toUpperCase(), style: 'h2'},
                    {canvas: [{type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 0.6, lineColor: ACCENT}], margin: [0, 0, 0, 5]}
                ]
            }
            : {text: t, style: 'h2'};

        // ---------- helpers ----------
        const fullName = [m.profile.firstName, m.profile.lastName].filter(Boolean).join(' ') || m.profile.name || 'Resume';
        const bulletSep = {text: '  •  ', style: 'sep'};
        const linkItem = (text, url) => url ? {text, link: url, style: 'contactLink'} : {text, style: 'contactText'};

        const makeHr = (margin = [0, 8, 0, 12]) => ({
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — accent design: full content width (aligned with section hairlines)
            canvas: [{type: 'line', x1: 0, y1: 0, x2: ACCENT_DESIGN ? CONTENT_WIDTH : 515, y2: 0, lineWidth: 1, lineColor: '#e8e8e8'}],
            margin
        });

        const chunk = (arr, n) => {
            const out = [];
            for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
            return out;
        };

        // dotted leader: "Label ....... (Level)"
        const langRow = (name, level) => {
            const left = name || '';
            const right = level ? `(${level})` : '';
            const maxDots = 60;
            const dotsCount = Math.max(4, maxDots - (left.length + right.length));
            const dots = ' .'.repeat(Math.floor(dotsCount / 2));
            return {text: `${left} ${dots} ${right}`.trim(), style: 'small'};
        };

        const joinLine = (...parts) => parts.filter(Boolean).join(' ');

        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Split bullet text into plain spans and link spans (by b.links[].text)
        const bulletSpans = (b) => {
            const spans = [];
            let rest = b.text;
            (b.links || []).forEach(l => {
                const i = rest.indexOf(l.text);
                if (i < 0) {
                    console.debug('[PDFGenerator] bullet link text not found:', l.text);
                    return;
                }
                if (i > 0) spans.push({text: rest.slice(0, i)});
                spans.push({text: l.text, link: l.url, color: LINK});
                rest = rest.slice(i + l.text.length);
            });
            if (rest) spans.push({text: rest});
            return spans;
        };

        const unbreakableCard = (stack) => ({
            table: {widths: ['*'], body: [[{stack}]]},
            layout: 'noBorders',
            dontBreakRows: true,
            margin: [0, 2, 0, 6]
        });

        // Map contact item to an appropriate Unicode icon (lightweight; no images)
        const iconFor = (s) => {
            const t = (s || '').toLowerCase();
            if (t.startsWith('mailto:') || t.includes('@')) return '✉';   // email
            if (t.startsWith('tel:') || /^\+/.test(t)) return '☎';   // phone
            if (t.includes('linkedin')) return '🔗';   // linkedin
            if (t.includes('github')) return '🐙';   // github
            if (t.includes('twitter') || t.includes('x.com')) return '🐦';   // twitter / X
            if (t.includes('facebook')) return '📘';   // facebook
            if (t.includes('instagram')) return '📷';   // instagram
            if (t.includes('youtube')) return '▶';    // youtube
            if (t.includes('xing')) return '✦';    // xing
            if (t.includes('http')) return '🌐';   // generic web
            if (t.includes('baku') || t.includes('azerbaijan')) return '📍'; // location guess
            return '•';
        };

        // HTML → pdfmake spans (handles <strong>, <em>, <i>, <br>, <p>)
        const htmlToSpans = (html) => {
            const div = document.createElement('div');
            div.innerHTML = html;
            const spans = [];
            const walk = (node, fmt = {bold: false, italics: false}) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const txt = node.textContent;
                    if (txt) spans.push({text: txt, style: 'small', bold: !!fmt.bold, italics: !!fmt.italics});
                    return;
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tag = node.tagName.toLowerCase();
                    if (tag === 'br') {
                        spans.push({text: '\n', style: 'small'});
                        return;
                    }
                    const next = {...fmt};
                    if (tag === 'strong' || tag === 'b') next.bold = true;
                    if (tag === 'em' || tag === 'i') next.italics = true;
                    if (tag === 'p' && spans.length) spans.push({text: '\n', style: 'small'});
                    node.childNodes.forEach(child => walk(child, next));
                    if (tag === 'p') spans.push({text: '\n', style: 'small'});
                }
            };
            div.childNodes.forEach(n => walk(n));
            return spans;
        };

        // ---------- header ----------
        const content = [{text: fullName, style: 'name'}];
        if (m.profile.title) content.push({text: m.profile.title, style: 'title'});
        if (m.profile.credentials) content.push({text: m.profile.credentials, style: 'creds'});
        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — positioning line (personal_info.positioning)
        if (m.profile.positioning) content.push({text: m.profile.positioning, style: 'small', margin: [0, 0, 0, 6]});
        console.debug('[PDFGenerator] header lines', {title: m.profile.title, credentials: m.profile.credentials, positioning: m.profile.positioning});

        const labelFor = (s) => {
            const t = (s || '').toLowerCase();
            if (t.startsWith('mailto:') && t.includes('@')) return 'Email';
            if (t.startsWith('tel:') || /^\+/.test(t)) return 'Phone';
            if (t.includes('linkedin')) return 'LinkedIn';
            if (t.includes('github.io')) return 'Website';   // personal site, not repo
            if (t.includes('github')) return 'GitHub';    // repos/profiles
            if (t.includes('twitter') || t.includes('x.com')) return 'Twitter';
            if (t.includes('facebook')) return 'Facebook';
            if (t.includes('instagram')) return 'Instagram';
            if (t.includes('youtube')) return 'YouTube';
            if (t.includes('xing')) return 'Xing';
            if (t.includes('maps')) return 'Location';
            if (t.includes('http')) return 'Web';
            return 'Contact';
        };


        if (m.contact) {
            const items = [];

            if (m.contact.email) items.push({
                url: 'mailto:' + m.contact.email,
                node: linkItem(m.contact.email, 'mailto:' + m.contact.email)
            });
            if (m.contact.phone) items.push({
                url: this._normUrl(m.contact.phone),
                node: linkItem(m.contact.phone, this._normUrl(m.contact.phone))
            });
            if (m.contact.website) items.push({
                url: this._normUrl(m.contact.website),
                node: linkItem(String(m.contact.website).replace(/^https?:\/\//, ''), this._normUrl(m.contact.website))
            });

            if (Array.isArray(m.contact.socials)) {
                m.contact.socials.forEach(s => {
                    const url = this._normUrl(s.url);
                    const txt = s.text || s.label || (url || '').replace(/^https?:\/\//, '');
                    items.push({url, node: linkItem(txt, url)});
                });
            }
            if (m.contact.location) {
                const locText = m.contact.location;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locText)}`;
                items.push({
                    url: mapsUrl,
                    node: linkItem(locText, mapsUrl)  // now clickable link (blue)
                });
            }

            if (items.length) {
                const half = Math.ceil(items.length / 2);
                const colA = items.slice(0, half);
                const colB = items.slice(half);

                // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — accent design: small vector icon before each contact label
                // (paths from main.js: Email/Website/Twitter from generateResumeHTML, LinkedIn/GitHub from renderHeaderSocialLinks; 24x24 viewBox, grey fill)
                const ICON_PATHS = {
                    Email: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z',
                    Website: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 17.9A8 8 0 0 1 4.1 13H11v6.9zM4.1 11A8 8 0 0 1 11 4.1V11H4.1zM13 4.1A8 8 0 0 1 19.9 11H13V4.1zM13 13h6.9A8 8 0 0 1 13 19.9V13z',
                    LinkedIn: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
                    Twitter: 'M4 3l7.5 9.4L4.7 21H8l5-6.3L17.8 21H21l-7.4-9.9L20.5 3H17.2l-4.8 6-4.6-6H4z',
                    GitHub: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.374-12-12-12z'
                };
                const iconCell = (label) => {
                    const d = ICON_PATHS[label];
                    if (!d) return {width: 13, text: ''};
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${GREY}" d="${d}"/></svg>`;
                    return {width: 13, stack: [{svg, width: 9, height: 9, margin: [0, 1.5, 0, 0]}]};
                };

                const renderCol = (col) => col.map(i => {
                    const label = labelFor(i.url || i.node?.text);
                    const cols = [
                        // fixed-width label column (black)
                        {width: 64, text: label, style: 'contactText'},
                        // value (blue if link, else black)
                        {width: '*', ...(i.node || {text: ''})}
                    ];
                    if (ACCENT_DESIGN) cols.unshift(iconCell(label));
                    return {columns: cols, columnGap: ACCENT_DESIGN ? 4 : 8, margin: [0, 1, 0, 1]};
                });

                content.push({
                    columns: [
                        {width: '*', stack: renderCol(colA)},
                        {width: '*', stack: renderCol(colB)}
                    ],
                    columnGap: 24,
                    margin: [0, 6, 0, 4]
                });
            }
        }

        content.push(makeHr([0, 6, 0, 10]));

        // ---------- summary (HTML supported) ----------
        if (m.summary) {
            content.push(sectionTitle('Summary'));
            const spans = /<\s*\/?\s*(strong|b|em|i|br|p)\b/i.test(m.summary)
                ? htmlToSpans(m.summary)
                : [{text: m.summary, style: 'small'}];
            content.push({text: spans});
        }

        /// ---------- skills (3 columns, individual items, no commas) ----------
        if (m.skills && m.skills.length) {
            content.push(sectionTitle('Skills'));

            if (typeof m.skills[0] === 'string') {
                // flat list (professional skills)
                const colSize = Math.ceil(m.skills.length / 3);
                const cols = [
                    m.skills.slice(0, colSize).map(s => ({text: s, style: 'small', margin: [0, 1, 0, 1]})),
                    m.skills.slice(colSize, colSize * 2).map(s => ({text: s, style: 'small', margin: [0, 1, 0, 1]})),
                    m.skills.slice(colSize * 2).map(s => ({text: s, style: 'small', margin: [0, 1, 0, 1]}))
                ];

                content.push({
                    columns: [
                        {width: '*', stack: cols[0]},
                        {width: '*', stack: cols[1]},
                        {width: '*', stack: cols[2]}
                    ],
                    columnGap: 16
                });
            } else {
                // categorized list (if present)
                const rows = m.skills.map(cat => ({
                    text: cat.category ? `${cat.category}:` : '',
                    style: 'small',
                    bold: !!cat.category,
                    margin: [0, 2, 0, 2]
                }));

                const colSize = Math.ceil(rows.length / 3);
                const left = rows.slice(0, colSize);
                const middle = rows.slice(colSize, colSize * 2);
                const right = rows.slice(colSize * 2);

                content.push({
                    columns: [
                        {width: '*', stack: left},
                        {width: '*', stack: middle},
                        {width: '*', stack: right}
                    ],
                    columnGap: 16
                });
            }
        }


        // ---------- technical skills (2-column structured layout) ----------
        if (m.technical && m.technical.length) {
            content.push(sectionTitle('Technical Skills'));

            // Turn each entry into a "label: value" row
            const rows = m.technical.map(row => {
                const label = row.label ? row.label + ':' : '';
                const value = row.value || '';
                return {
                    columns: [
                        {width: 120, text: label, style: 'small', bold: true, margin: [0, 1, 0, 1]},
                        {width: '*', text: value, style: 'small', margin: [0, 1, 0, 1]}
                    ],
                    columnGap: 8
                };
            });

            // Split into two halves to mimic "two blocks side by side"
            const half = Math.ceil(rows.length / 2);
            const left = rows.slice(0, half);
            const right = rows.slice(half);

            content.push({
                columns: [
                    {width: '*', stack: left},
                    {width: '*', stack: right}
                ],
                columnGap: 24
            });
        }


        // ---------- experience (dates UNDER workplace; no card split) ----------
        if (m.experience && m.experience.length) {
            content.push(sectionTitle('Experience'));

            m.experience.forEach(job => {
                // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Position first, then company
                const headerLine = joinLine(job.position || '', job.company ? '— ' + job.company : '');
                const metaTop = joinLine(job.location || '');
                const metaBelow = joinLine(job.period || '');

                const block = [];
                if (ACCENT_DESIGN) {
                    // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — accent: position (bold) + dates right on one line; company in grey below
                    block.push({
                        columns: [
                            {width: '*', text: job.position || '', style: 'jobHeader'},
                            {width: 'auto', text: job.period || '', fontSize: 9, color: GREY, margin: [0, 1, 0, 0]}
                        ],
                        columnGap: 12
                    });
                    const companyLine = joinLine(job.company || '', metaTop ? `· ${metaTop}` : '');
                    if (companyLine) block.push({text: companyLine, style: 'jobSub', margin: [0, 0, 0, 2]});
                } else {
                    if (headerLine) block.push({text: headerLine, style: 'jobHeader'});
                    if (metaTop) block.push({text: metaTop, style: 'jobSub'});   // location
                    if (metaBelow) block.push({text: metaBelow, style: 'jobSub'}); // dates under workplace
                }

                if (job.description) block.push({text: job.description, style: 'small', margin: [0, 2, 0, 2]});
                if (job.bullets && job.bullets.length) {
                    // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Parts of a bullet listed in b.links become hyperlinks
                    const ul = {ul: job.bullets.map(b => ({text: bulletSpans(b), style: 'bullet'}))};
                    if (ACCENT_DESIGN) ul.markerColor = ACCENT;
                    block.push(ul);
                }

                // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Logo column on the left (LinkedIn-like). Jobs without a logo
                // get an empty column of the same width so all positions stay aligned. Off: opts.logos === false or classic design.
                if (SHOW_LOGOS) {
                    const logoCell = job.logoData
                        ? {width: LOGO_SIZE, image: job.logoData, fit: [LOGO_SIZE, LOGO_SIZE], margin: [0, 2, 0, 0]}
                        : {width: LOGO_SIZE, text: ''};
                    content.push(unbreakableCard([{columns: [logoCell, {width: '*', stack: block}], columnGap: 10}]));
                } else {
                    content.push(unbreakableCard(block)); // prevents splitting across pages
                }
            });
        }

        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — projects (name links to url)
        if (m.projects && m.projects.length) {
            content.push(sectionTitle('Projects'));
            m.projects.forEach(pr => {
                const line = [pr.url ? linkItem(pr.name, pr.url) : {text: pr.name, style: 'small'}];
                if (pr.period) line.push({text: ` (${pr.period})`, style: 'small'});
                const block = [{text: line, style: 'small'}];
                if (pr.description) block.push({text: pr.description, style: 'small', margin: [0, 1, 0, 2]});
                content.push(unbreakableCard(block));
            });
        }

        // ---------- education (no stray "—") ----------
        if (m.education && m.education.length) {
            content.push(sectionTitle('Education'));
            m.education.forEach(ed => {
                const parts = [];
                if (ed.school) parts.push(ed.school);
                if (ed.degree) parts.push('— ' + ed.degree);
                const main = parts.join(' ');
                const line = joinLine(main, ed.year ? `(${ed.year})` : '');
                // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Plain compact line instead of card (one-line items; fits resume on one page)
                content.push({text: line, style: 'small', margin: [0, 1, 0, 1]});
            });
        }

        // ---------- certifications ----------
        if (m.certifications && m.certifications.length) {
            content.push(sectionTitle('Certifications'));
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — name links to verification url when present
            m.certifications.forEach(c => {
                const parts = [];
                if (c.name) parts.push(c.name);
                if (c.issuer) parts.push('— ' + c.issuer);
                const main = parts.join(' ');
                const line = [c.url ? linkItem(main, c.url) : {text: main, style: 'small'}];
                if (c.year) line.push({text: ` (${c.year})`, style: 'small'});
                // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Plain compact line instead of card (one-line items; fits resume on one page)
                content.push({text: line, style: 'small', margin: [0, 1, 0, 1]});
            });
        }

        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — courses
        if (m.courses && m.courses.length) {
            content.push(sectionTitle('Courses'));
            m.courses.forEach(c => content.push(unbreakableCard([{text: c.name, style: 'small'}])));
        }

        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — memberships
        if (m.memberships && m.memberships.length) {
            content.push(sectionTitle('Memberships'));
            m.memberships.forEach(mb => {
                const line = [mb.url ? linkItem(mb.name, mb.url) : {text: mb.name, style: 'small'}];
                if (mb.position) line.push({text: ` — ${mb.position}`, style: 'small'});
                if (mb.period) line.push({text: ` (${mb.period})`, style: 'small'});
                content.push(unbreakableCard([{text: line, style: 'small'}]));
            });
        }

        // ---------- languages ----------
        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — One line, comma-separated: "Azerbaijani (Native), Russian (Native), ..."
        // (previous dotted-leader layout via langRow is kept in code but no longer used here)
        if (m.languages && m.languages.length) {
            content.push(sectionTitle('Languages'));
            const line = m.languages
                .map(l => l.level ? `${l.name} (${l.level})` : l.name)
                .join(', ');
            console.debug('[PDFGenerator] languages line =', line);
            content.push({text: line, style: 'small'});
        }

        // ---------- return ----------
        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — PDF document properties (Title/Author/Subject) from resume data
        const info = {
            title: `${fullName} — Resume`,
            author: fullName,
            subject: m.profile.title || '',
            creator: fullName
        };
        console.debug('[PDFGenerator] document info', info);
        return {
            info,
            pageSize: 'A4',
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Equal 36pt margins (bottom 48 was reserved for page numbers, now off)
            pageMargins: compact ? [30, 34, 30, 40] : [36, 36, 36, 36],
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Ligatures off: "fi"/"ffi" glyphs broke text extraction (ATS, copy-paste)
            defaultStyle: {fontSize: compact ? 9 : 10, lineHeight: 1.35, color: '#000000', fontFeatures: {liga: false, clig: false}},
            styles,
            content,
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Page numbers off (opts.pageNumbers === true brings them back)
            footer: opts.pageNumbers === true ? (current, total) => ({
                columns: [{text: '', width: '*'}, {
                    text: `${current} / ${total}`,
                    style: 'meta',
                    alignment: 'right',
                    margin: [0, 0, 12, 0]
                }]
            }) : undefined
        };
    }


}

window.PDFGenerator = PDFGenerator;
