// 2025-08-28 — PDFGenerator (text-only, vector PDF via pdfmake) — JSON-first
// SINGLE SOURCE OF TRUTH: reads data only from data/resume.json (no DOM).
// Emits selectable text + live links using pdfmake. No rasterization.

class PDFGenerator {
    constructor() {
        this.isGenerating = false;
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
    async _loadResumeJson() {
        try {
            const res = await fetch('data/resume.json', {cache: 'no-store'});
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            return null;
        }
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
        await load('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js');
        await load('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.js');
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
            title: clean(pi.title || ''),                 // e.g., "AWS® SA, TOGAF® 10, PMP® ..."
            credentials: '',                              // keep empty unless you add a dedicated field
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
        Object.keys(techObj).forEach(key => {
            const val = techObj[key];

            // normalize label
            let cleanLabel = this._labelize(key)
                .replace(/&/g, 'and')        // & → and
                .replace(/\//g, ' ')         // / → space
                .replace(/_/g, ' ')          // underscores → space
                .replace(/\s+/g, ' ')        // collapse multiple spaces
                .trim();

            // enforce Title Case
            cleanLabel = cleanLabel.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

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
            description: clean(e.company_description || ''),
            bullets: Array.isArray(e.achievements)
                ? e.achievements.map(clean).filter(Boolean)
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
        })).filter(x => x.name) : [];

        // ---- LANGUAGES (top-level array) ----
        const languages = Array.isArray(g(raw, 'languages')) ? g(raw, 'languages').map(l => ({
            name: clean(l.name || l.language || l),
            level: clean(l.level || '')
        })).filter(x => x.name) : [];

        return {profile, contact, summary, skills, technical, experience, education, certifications, languages};
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

        // ---------- styles (black everywhere except hyperlinks) ----------
        const styles = {
            name: {fontSize: 22, bold: true, lineHeight: 1.05, color: '#000000'},
            title: {fontSize: 12, color: '#000000', margin: [0, 2, 0, 2]},
            creds: {fontSize: 10, color: '#000000', italics: true, margin: [0, 0, 0, 6]},

            h2: {fontSize: 11, bold: true, color: '#000000', margin: [0, compact ? 8 : 12, 0, 6], lineHeight: 1.1},

            meta: {fontSize: 9, color: '#000000'},
            small: {fontSize: compact ? 9 : 10, color: '#000000'},
            bullet: {margin: [0, 1, 0, 1], fontSize: compact ? 9 : 10, color: '#000000'},

            jobHeader: {bold: true, fontSize: 10, margin: [0, 1, 0, 0], color: '#000000'},
            jobSub: {fontSize: 9, color: '#000000', margin: [0, 1, 0, 4]},

            contactLink: {fontSize: 9, color: '#0B57D0'}, // hyperlinks ONLY
            contactText: {fontSize: 9, color: '#000000'},
            sep: {fontSize: 9, color: '#000000'}
        };

        // ---------- helpers ----------
        const fullName = [m.profile.firstName, m.profile.lastName].filter(Boolean).join(' ') || m.profile.name || 'Resume';
        const bulletSep = {text: '  •  ', style: 'sep'};
        const linkItem = (text, url) => url ? {text, link: url, style: 'contactLink'} : {text, style: 'contactText'};

        const makeHr = (margin = [0, 8, 0, 12]) => ({
            canvas: [{type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e8e8e8'}],
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

                const renderCol = (col) => col.map(i => ({
                    columns: [
                        // fixed-width label column (black)
                        {width: 64, text: labelFor(i.url || i.node?.text), style: 'contactText'},
                        // value (blue if link, else black)
                        {width: '*', ...(i.node || {text: ''})}
                    ],
                    columnGap: 8,
                    margin: [0, 1, 0, 1]
                }));

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
            content.push({text: 'Summary', style: 'h2'});
            const spans = /<\s*\/?\s*(strong|b|em|i|br|p)\b/i.test(m.summary)
                ? htmlToSpans(m.summary)
                : [{text: m.summary, style: 'small'}];
            content.push({text: spans});
        }

        /// ---------- skills (3 columns, individual items, no commas) ----------
        if (m.skills && m.skills.length) {
            content.push({text: 'Skills', style: 'h2'});

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
            content.push({text: 'Technical Skills', style: 'h2'});

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
            content.push({text: 'Experience', style: 'h2'});

            m.experience.forEach(job => {
                const headerLine = joinLine(job.company || '', job.position ? '— ' + job.position : '');
                const metaTop = joinLine(job.location || '');
                const metaBelow = joinLine(job.period || '');

                const block = [];
                if (headerLine) block.push({text: headerLine, style: 'jobHeader'});
                if (metaTop) block.push({text: metaTop, style: 'jobSub'});   // location
                if (metaBelow) block.push({text: metaBelow, style: 'jobSub'}); // dates under workplace

                if (job.description) block.push({text: job.description, style: 'small', margin: [0, 2, 0, 2]});
                if (job.bullets && job.bullets.length) {
                    block.push({ul: job.bullets.map(b => ({text: b, style: 'bullet'}))});
                }

                content.push(unbreakableCard(block)); // prevents splitting across pages
            });
        }

        // ---------- education (no stray "—") ----------
        if (m.education && m.education.length) {
            content.push({text: 'Education', style: 'h2'});
            m.education.forEach(ed => {
                const parts = [];
                if (ed.school) parts.push(ed.school);
                if (ed.degree) parts.push('— ' + ed.degree);
                const main = parts.join(' ');
                const line = joinLine(main, ed.year ? `(${ed.year})` : '');
                content.push(unbreakableCard([{text: line, style: 'small'}]));
            });
        }

        // ---------- certifications ----------
        if (m.certifications && m.certifications.length) {
            content.push({text: 'Certifications', style: 'h2'});
            m.certifications.forEach(c => {
                const parts = [];
                if (c.name) parts.push(c.name);
                if (c.issuer) parts.push('— ' + c.issuer);
                const main = parts.join(' ');
                const line = joinLine(main, c.year ? `(${c.year})` : '');
                content.push(unbreakableCard([{text: line, style: 'small'}]));
            });
        }

        // ---------- languages (dotted leaders; two columns if long) ----------
        if (m.languages && m.languages.length) {
            content.push({text: 'Languages', style: 'h2'});
            const labels = m.languages.map(l => ({name: l.name, level: l.level}));
            if (labels.length <= 8) {
                labels.forEach(l => content.push(langRow(l.name, l.level)));
            } else {
                const half = Math.ceil(labels.length / 2);
                const left = labels.slice(0, half).map(l => langRow(l.name, l.level));
                const right = labels.slice(half).map(l => langRow(l.name, l.level));
                content.push({columns: [{width: '*', stack: left}, {width: '*', stack: right}], columnGap: 16});
            }
        }

        // ---------- return ----------
        return {
            pageSize: 'A4',
            pageMargins: compact ? [30, 34, 30, 40] : [36, 44, 36, 48],
            defaultStyle: {fontSize: compact ? 9 : 10, lineHeight: 1.35, color: '#000000'},
            styles,
            content,
            footer: (current, total) => ({
                columns: [{text: '', width: '*'}, {
                    text: `${current} / ${total}`,
                    style: 'meta',
                    alignment: 'right',
                    margin: [0, 0, 12, 0]
                }]
            })
        };
    }


}

window.PDFGenerator = PDFGenerator;
