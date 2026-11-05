// 2025-08-28 — PDFGenerator (text-only, vector PDF via pdfmake) — JSON-first
// SINGLE SOURCE OF TRUTH: reads data only from data/resume.json (no DOM).
// Emits selectable text + live links using pdfmake. No rasterization.

// +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Data now comes via injected ResumeDataLoader (declared dependency); pdfmake vendored locally
// +++===+++ 2026-11-05 Asia/Baku — Hasan Alizada — ATS layout: ONE column, no tables, no columns, no images (logos/icons removed);
// every logical line (contacts, skills group, position + company + location + dates) is ONE text line, so ATS parsers and
// copy-paste read it in order. CV variants: opts.profile = key of cv_profiles in resume.json (applied by ResumeDataLoader).
// No DOM in normalize/build (summary HTML parsed by regex), so the document can be built and tested in Node.

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
     * Public API used by App.generatePDF() and the /cv/<profile>/ pages
     * @param {*} _unused
     * @param {{filename?: string, profile?: string}} opts
     */
    async generateAndDownload(_unused = null, opts = {}) {
        if (this.isGenerating) {
            return {success: false, error: 'A PDF generation is already in progress'};
        }
        this.isGenerating = true;

        try {
            // 1) Load resume.json (renderable data of the requested CV profile)
            const data = await this._loadResumeJson(opts.profile);
            if (!data) throw new Error('resume.json not found or invalid');

            // 2) Ensure pdfmake
            await this._ensurePdfMake();

            // 3) Build doc
            const doc = this.buildDocDefinition(data);

            // 4) Filename: <Name>_Resume.pdf, or <Name>_<Profile_Label>_Resume.pdf for a role variant
            const m = this._normalize(data);
            const filename = (opts.filename && String(opts.filename).trim()) || this._filename(m);
            console.debug('[PDFGenerator] filename =', filename, 'profile =', m.profileId);

            // 5) Download
            window.pdfMake.createPdf(doc).download(filename);
            return {success: true};
        } catch (e) {
            return {success: false, error: String(e && e.message || e)};
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Renderable resume data (output of ResumeDataLoader) → pdfmake document definition
     * @param {object} data
     * @returns {object}
     */
    buildDocDefinition(data) {
        return this._buildDocDefinition(this._normalize(data));
    }

    // ---------- data load ----------
    // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Read via ResumeDataLoader instead of own fetch
    async _loadResumeJson(profile) {
        if (!this.resumeDataLoader) {
            console.error('[PDFGenerator] no ResumeDataLoader injected');
            return null;
        }
        const result = await this.resumeDataLoader.loadResumeData(profile || undefined);
        console.debug('[PDFGenerator] loader result success =', result.success, 'error =', result.error);
        return result.success ? result.data : null;
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

    _filename(m) {
        const safe = (s) => String(s).replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        const name = safe(m.profile.name || 'Resume');
        const variant = m.profileId && m.profileId !== 'default' && m.profileLabel ? `_${safe(m.profileLabel)}` : '';
        return `${name}${variant}_Resume.pdf`;
    }

    _normUrl(u) {
        if (!u) return null;
        if (/^mailto:|^https?:\/\//i.test(u)) return u;
        if (/^tel:/i.test(u)) return u;
        if (/^\+?[0-9][0-9()\-\s]{5,}$/.test(u)) return 'tel:' + u.replace(/[^\d+]/g, '');
        return 'https://' + String(u).replace(/^\/+/, '');
    }

    /**
     * +++===+++ 2026-11-05 Asia/Baku — Hasan Alizada — Minimal HTML → pdfmake spans without DOM (<strong>/<b> bold, <em>/<i> italics,
     * <br> newline; other tags dropped; basic entities decoded)
     */
    _htmlToSpans(html) {
        const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
        const spans = [];
        let bold = 0, italics = 0;
        String(html).split(/(<[^>]+>)/).forEach(part => {
            if (!part) return;
            const tag = part.match(/^<\s*(\/?)\s*([a-z0-9]+)/i);
            if (!tag) {
                spans.push({text: decode(part), bold: bold > 0, italics: italics > 0});
                return;
            }
            const closing = tag[1] === '/', name = tag[2].toLowerCase();
            if (name === 'strong' || name === 'b') bold += closing ? -1 : 1;
            else if (name === 'em' || name === 'i') italics += closing ? -1 : 1;
            else if (name === 'br') spans.push({text: '\n'});
        });
        return spans;
    }

    // ---------- normalization ----------
    /**
     * Renderable resume data → internal model (plain strings; to_render and cv profile already applied by the loader)
     */
    _normalize(raw) {
        const clean = (s) => (s ?? '').toString().trim();
        const arr = (v) => Array.isArray(v) ? v : [];
        const pi = raw.personal_info || {};
        const contact = pi.contact || {};
        const cvProfile = raw.cv_profile || {};

        // contacts: email, professional profiles (PDFGenerator.CV_SOCIALS; e.g. X/Twitter stays on the site only), website — one line
        const contacts = [];
        if (contact.email) contacts.push({text: clean(contact.email), url: 'mailto:' + clean(contact.email)});
        Object.entries(pi.social_links || {}).forEach(([platform, u]) => {
            if (PDFGenerator.CV_SOCIALS.includes(platform) && typeof u === 'string' && u) contacts.push({text: clean(u).replace(/^https?:\/\//, '').replace(/\/+$/, ''), url: this._normUrl(u)});
        });
        if (contact.website) contacts.push({text: clean(contact.website).replace(/^https?:\/\//, ''), url: this._normUrl(contact.website)});
        if (contact.phone) contacts.push({text: clean(contact.phone), url: this._normUrl(contact.phone)});

        // technical skills: object of arrays (or {sub: arrays}) with labels from skills.technical_labels
        const techObj = (raw.skills && raw.skills.technical) || {};
        const techLabels = (raw.skills && raw.skills.technical_labels) || {};
        const technical = [];
        Object.keys(techObj).forEach(key => {
            const val = techObj[key];
            const label = clean(techLabels[key]) || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            let value = '';
            if (Array.isArray(val)) value = val.map(clean).filter(Boolean).join(', ');
            // +++===+++ 2026-11-05 Asia/Baku — Hasan Alizada — object of sub-lists: first sub-list plain, others labelled by key
            // e.g. {primary: [Java, SQL], working_knowledge: [C#, Rust]} → "Java, SQL; working knowledge: C#, Rust"
            else if (val && typeof val === 'object') value = Object.entries(val)
                .map(([sub, list], i) => [sub, arr(list).map(clean).filter(Boolean).join(', '), i])
                .filter(([, list]) => list)
                .map(([sub, list, i]) => i ? `${sub.replace(/_/g, ' ')}: ${list}` : list)
                .join('; ');
            if (value) technical.push({label, value});
        });

        const bullet = (a) => (a && typeof a === 'object')
            ? {text: clean(a.text), links: arr(a.links).filter(l => l && l.text && l.url)}
            : {text: clean(a), links: []};

        return {
            profileId: cvProfile.id || 'default',
            profileLabel: clean(cvProfile.label),
            profile: {
                name: clean(pi.name),
                headline: clean(pi.headline),
                credentials: clean(pi.title),
                positioning: clean(pi.positioning),
            },
            location: [clean(contact.location), clean(contact.availability)].filter(Boolean).join(' · '),
            contacts,
            summary: clean(pi.summary_html || pi.summary),
            competencies: arr(raw.skills && raw.skills.professional).map(clean).filter(Boolean),
            technical,
            experience: arr(raw.work_experience).map(e => ({
                position: clean(e.position),
                company: clean(e.company),
                location: clean(e.location),
                period: clean(e.period),
                description: clean(e.company_description),
                bullets: arr(e.achievements).map(bullet).filter(b => b.text)
            })).filter(j => j.position || j.company),
            projects: arr(raw.projects).map(p => ({
                name: clean(p.name), period: clean(p.period), url: clean(p.url), description: clean(p.description)
            })).filter(p => p.name),
            education: arr(raw.education).map(ed => ({
                school: clean(ed.institution || ed.school), degree: clean(ed.degree), period: clean(ed.period || ed.year)
            })).filter(x => x.school || x.degree),
            certifications: arr(raw.certificates).map(c => ({
                name: clean(c.name), issuer: clean(c.authority), period: clean(c.period), url: clean(c.url)
            })).filter(c => c.name),
            memberships: arr(raw.memberships).map(mb => ({
                name: clean(mb.name), position: clean(mb.position), period: clean(mb.period), url: clean(mb.url)
            })).filter(x => x.name),
            courses: arr(raw.courses).map(c => clean(c.name || c)).filter(Boolean),
            languages: arr(raw.languages).map(l => ({name: clean(l.name || l), level: clean(l.level)})).filter(x => x.name)
        };
    }

    // ---------- doc build ----------
    _buildDocDefinition(m) {
        const ACCENT = '#1F3A5F';
        const GREY = '#4A5563';
        const CONTENT_WIDTH = 595.28 - 40 * 2; // A4 width minus left/right margins

        const styles = {
            name: {fontSize: 20, bold: true, color: ACCENT},
            headline: {fontSize: 12, bold: true, color: '#111111', margin: [0, 2, 0, 0]},
            creds: {fontSize: 9.5, color: GREY, margin: [0, 1, 0, 0]},
            positioning: {fontSize: 10, italics: true, color: '#111111', margin: [0, 4, 0, 0]},
            meta: {fontSize: 9, color: GREY},
            h2: {fontSize: 10.5, bold: true, color: ACCENT, characterSpacing: 0.8, margin: [0, 8, 0, 1]},
            body: {fontSize: 9.5, color: '#111111'},
            jobTitle: {fontSize: 10, bold: true, color: '#111111'},
            jobMeta: {fontSize: 9, color: GREY, margin: [0, 0, 0, 2]},
            bullet: {fontSize: 9.5, color: '#111111', margin: [0, 0.5, 0, 0.5]},
            link: {color: ACCENT}
        };

        const SEP = '  |  ';
        const content = [];
        // standard section headings (ATS); hairline is a vector line, not an image
        const section = (title) => content.push({
            stack: [
                {text: title.toUpperCase(), style: 'h2'},
                {canvas: [{type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 0.6, lineColor: ACCENT}], margin: [0, 0, 0, 4]}
            ],
            unbreakable: true
        });
        const joinSpans = (items, sep) => items.flatMap((it, i) => i ? [{text: sep, color: GREY}, it] : [it]);
        const linkSpan = (text, url) => url ? {text, link: url, style: 'link'} : {text};
        // bullet text with parts listed in b.links turned into hyperlinks
        const bulletSpans = (b) => {
            const spans = [];
            let rest = b.text;
            b.links.forEach(l => {
                const i = rest.indexOf(l.text);
                if (i < 0) return;
                if (i > 0) spans.push({text: rest.slice(0, i)});
                spans.push({text: l.text, link: l.url, style: 'link'});
                rest = rest.slice(i + l.text.length);
            });
            if (rest) spans.push({text: rest});
            return spans;
        };

        // ---------- header (first third of page 1: who, what, how to reach) ----------
        content.push({text: m.profile.name, style: 'name'});
        if (m.profile.headline) content.push({text: m.profile.headline, style: 'headline'});
        if (m.profile.credentials) content.push({text: m.profile.credentials, style: 'creds'});
        if (m.location) content.push({text: m.location, style: 'meta', margin: [0, 4, 0, 0]});
        if (m.contacts.length) {
            content.push({text: joinSpans(m.contacts.map(c => linkSpan(c.text, c.url)), SEP), style: 'meta', margin: [0, 1, 0, 0]});
        }
        if (m.profile.positioning) content.push({text: m.profile.positioning, style: 'positioning'});

        // ---------- summary ----------
        if (m.summary) {
            section('Summary');
            content.push({text: this._htmlToSpans(m.summary), style: 'body'});
        }

        // ---------- skills: "Label: a, b, c" lines ----------
        if (m.competencies.length || m.technical.length) {
            section('Skills');
            const lines = [];
            if (m.competencies.length) lines.push({label: 'Core Competencies', value: m.competencies.join(', ')});
            m.technical.forEach(t => lines.push(t));
            lines.forEach(l => content.push({text: [{text: l.label + ': ', bold: true}, {text: l.value}], style: 'body', margin: [0, 0.5, 0, 0.5]}));
        }

        // ---------- experience: title line, then "Company | Location | Period", then bullets ----------
        if (m.experience.length) {
            section('Experience');
            m.experience.forEach((job, idx) => {
                const head = [
                    {text: job.position, style: 'jobTitle'},
                    {text: [job.company, job.location, job.period].filter(Boolean).join(SEP), style: 'jobMeta'}
                ];
                if (job.description) head.push({text: job.description, style: 'body', italics: true, color: GREY, margin: [0, 0, 0, 2]});
                const ul = (items) => ({ul: items.map(b => ({text: bulletSpans(b), style: 'bullet'})), markerColor: ACCENT});
                // title + company line + first bullet never split (no orphan job header); remaining bullets flow freely
                if (job.bullets.length) head.push(ul(job.bullets.slice(0, 1)));
                content.push({stack: head, unbreakable: true, margin: [0, idx ? 5 : 1, 0, 0]});
                // each further bullet is unbreakable on its own (a bullet never splits across pages)
                job.bullets.slice(1).forEach(b => content.push({stack: [ul([b])], unbreakable: true}));
            });
        }

        // ---------- projects ----------
        if (m.projects.length) {
            section('Projects');
            m.projects.forEach(p => {
                const line = [linkSpan(p.name, p.url)];
                if (p.period) line.push({text: ` (${p.period})`});
                if (p.description) line.push({text: ` — ${p.description}`});
                content.push({text: line, style: 'body', margin: [0, 0.5, 0, 0.5]});
            });
        }

        // ---------- certifications ----------
        if (m.certifications.length) {
            section('Certifications');
            m.certifications.forEach(c => {
                const line = [linkSpan(c.name, c.url)];
                if (c.issuer) line.push({text: ` — ${c.issuer}`});
                if (c.period) line.push({text: ` (${c.period})`, color: GREY});
                content.push({text: line, style: 'body', margin: [0, 0.5, 0, 0.5]});
            });
        }

        // ---------- education ----------
        if (m.education.length) {
            section('Education');
            m.education.forEach(ed => {
                content.push({text: [ed.degree, ed.school, ed.period].filter(Boolean).join(SEP), style: 'body', margin: [0, 0.5, 0, 0.5]});
            });
        }

        // ---------- memberships, courses (only when visible in data) ----------
        if (m.memberships.length) {
            section('Memberships');
            m.memberships.forEach(mb => content.push({
                text: [linkSpan(mb.name, mb.url), {text: [mb.position, mb.period].filter(Boolean).map(s => ` — ${s}`).join('')}],
                style: 'body'
            }));
        }
        if (m.courses.length) {
            section('Courses');
            m.courses.forEach(c => content.push({text: c, style: 'body'}));
        }

        // ---------- languages: one line ----------
        if (m.languages.length) {
            section('Languages');
            content.push({text: m.languages.map(l => l.level ? `${l.name} (${l.level})` : l.name).join(', '), style: 'body'});
        }

        const info = {
            title: `${m.profile.name} — ${m.profile.headline || 'Resume'}`,
            author: m.profile.name,
            subject: m.profile.headline || '',
            keywords: m.technical.map(t => t.value).join(', '),
            creator: m.profile.name
        };
        console.debug('[PDFGenerator] document', {profile: m.profileId, jobs: m.experience.length, skills: m.technical.length});
        return {
            info,
            pageSize: 'A4',
            pageMargins: [40, 32, 40, 36],
            // Ligatures off: "fi"/"ffi" glyphs break text extraction (ATS, copy-paste)
            defaultStyle: {fontSize: 9.5, lineHeight: 1.22, color: '#111111', fontFeatures: {liga: false, clig: false}},
            styles,
            content,
            // footer when the CV has more than one page: name + page number (helps when pages get separated)
            footer: (current, total) => total > 1 ? {
                text: `${m.profile.name} — page ${current} of ${total}`,
                fontSize: 8, color: GREY, alignment: 'right', margin: [40, 12, 40, 0]
            } : null
        };
    }
}

// social_links keys shown in the PDF contact line
PDFGenerator.CV_SOCIALS = ['linkedin', 'github', 'xing'];

// Export: browser global, or module for Node (tests, build tools)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFGenerator;
} else {
    window.PDFGenerator = PDFGenerator;
}
