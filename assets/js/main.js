// +++===+++ 2025-08-27 08:50 UTC — Hasan Alizada — Updated for Resume as default section, removed Home

/**
 * Main Application Class - Orchestrates all atomic modules
 */
class App {
    constructor() {
        console.log('+++===+++ App constructor called');
        this.atoms = {};
        this.isInitialized = false;
        this.currentSection = 'resume'; // Changed default from 'home' to 'resume'
    }

    /**
     * Initialize application and all atomic modules
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('+++===+++ Application already initialized, skipping');
            return;
        }

        console.log('+++===+++ Starting application initialization');

        try {
            // Initialize atomic modules
            await this.initializeAtoms();

            // Setup navigation
            this.setupNavigation();

            // Setup event listeners
            this.setupEventListeners();

            // Load initial content
            await this.loadInitialContent();

            // Handle initial URL hash
            this.handleInitialRoute();

            this.isInitialized = true;
            console.log('+++===+++ Application initialization completed successfully');

        } catch (error) {
            console.error('+++===+++ Application initialization failed:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize all atomic modules
     */
    async initializeAtoms() {
        console.log('+++===+++ Initializing atomic modules');

        try {
            // Load resume data loader atom
            if (typeof ResumeDataLoader === 'undefined') {
                console.log('+++===+++ Loading ResumeDataLoader script');
                await this.loadScript('atoms/resume-data-loader/impl.js');
                // Wait for class to be available
                await this.waitForGlobal('ResumeDataLoader');
            }
            if (!this.atoms.resumeDataLoader) {
                this.atoms.resumeDataLoader = new ResumeDataLoader();
                console.log('+++===+++ Resume data loader atom initialized');
            }

            // Load PDF generator atom
            if (typeof PDFGenerator === 'undefined') {
                console.log('+++===+++ Loading PDFGenerator script');
                await this.loadScript('atoms/pdf-generator/impl.js');
                // Wait for class to be available
                await this.waitForGlobal('PDFGenerator');
            }
            if (!this.atoms.pdfGenerator) {
                this.atoms.pdfGenerator = new PDFGenerator();
                console.log('+++===+++ PDF generator atom initialized');
            }

            // Load blog renderer atom
            if (typeof BlogRenderer === 'undefined') {
                console.log('+++===+++ Loading BlogRenderer script');
                await this.loadScript('atoms/blog-renderer/impl.js');
                // Wait for class to be available
                await this.waitForGlobal('BlogRenderer');
            }
            if (!this.atoms.blogRenderer) {
                this.atoms.blogRenderer = new BlogRenderer();
                console.log('+++===+++ Blog renderer atom initialized');
            }

            console.log('+++===+++ All available atoms initialized');

        } catch (error) {
            console.error('+++===+++ Error initializing atoms:', error);
            throw error;
        }
    }

    /**
     * Setup navigation system
     */
    setupNavigation() {
        console.log('+++===+++ Setting up navigation system');

        // Add event listeners to navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.navigateToSection(sectionId);
            });
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleHashChange();
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('+++===+++ Setting up event listeners');

        // PDF generation buttons
        const pdfButtons = document.querySelectorAll('#generate-pdf-btn, #download-pdf-btn, #fab-pdf');
        pdfButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.generatePDF();
            });
        });

        // Blog article clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.article-card')) {
                const articleCard = e.target.closest('.article-card');
                const articleUrl = articleCard.getAttribute('data-url');
                if (articleUrl) {
                    window.open(articleUrl, '_blank');
                }
            }
        });
    }

    /**
     * Load initial content
     */
    async loadInitialContent() {
        console.log('+++===+++ Loading initial content');

        try {
            // Load resume content
            await this.loadResumeContent();

            // Load blog content
            await this.loadBlogContent();

            console.log('+++===+++ Initial content loaded successfully');

        } catch (error) {
            console.error('+++===+++ Error loading initial content:', error);
            // Don't throw - app should still work with partial content
        }
    }

    /**
     * Load resume content using resume data loader atom
     */
    async loadResumeContent() {
        console.log('+++===+++ Loading resume content');

        const resumeContentContainer = document.getElementById('resume-content');
        if (!resumeContentContainer) return;

        try {
            const result = await this.atoms.resumeDataLoader.loadResumeData();

            if (!result.success) {
                throw new Error(result.error);
            }

            // Generate resume HTML using UI components atom (when available)
            const resumeHtml = this.generateResumeHTML(result.data);
            resumeContentContainer.innerHTML = resumeHtml;

            console.log('+++===+++ Resume content rendered successfully');

        } catch (error) {
            console.error('+++===+++ Error loading resume content:', error);
            resumeContentContainer.innerHTML = `
                <div class="error">
                    <p>Failed to load resume content. Please try again later.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * +++===+++ 2025-08-27 17:10 Asia/Baku — Hasan Alizada — Added optional company logo before company name (PDF-parity)
     * Render a single experience card; shows logo if exp.company_logo is provided.
     * @param {object} exp
     * @param {number} idx
     * @returns {string}
     */
    function

    renderExperienceItem(exp, idx) {
        console.log('+++===+++ [renderExperienceItem] start idx=%d payload=%o', idx, exp);

        const position = (exp && exp.position) ? String(exp.position) : '';
        const company = (exp && exp.company) ? String(exp.company) : '';
        const location = (exp && exp.location) ? String(exp.location) : '';
        const period = (exp && exp.period) ? String(exp.period) : '';
        const companyDesc = (exp && exp.company_description ? String(exp.company_description).trim() : '');
        const logo = (exp && exp.company_logo) ? String(exp.company_logo).trim() : '';

        console.log('+++===+++ [renderExperienceItem] meta position="%s" company="%s" period="%s" location="%s" hasLogo=%s',
            position, company, period, location, Boolean(logo));

        const achievements = Array.isArray(exp && exp.achievements) ? exp.achievements : [];
        console.log('+++===+++ [renderExperienceItem] achievements_count=%d', achievements.length);

        const achievementsHtml = achievements.map((a, i) => {
            const text = (a == null) ? '' : String(a);
            console.log('+++===+++ [renderExperienceItem] bullet idx=%d chars=%d', i, text.length);
            return `<li>${text}</li>`;
        }).join('');

        const html = `
    <div class="experience-card">
      <div class="experience-heading">
        <div class="experience-position">${position}</div>
        <div class="experience-company">
          ${logo ? `<img class="experience-company-logo" src="${logo}" alt="${company} logo" loading="lazy">` : ''}
          <span class="experience-company-name">${company}</span>
        </div>
        <div class="experience-meta">
          <span class="experience-period">${period}</span>
          <span class="experience-location">${location}</span>
        </div>
        ${companyDesc ? `<div class="experience-description">${companyDesc}</div>` : ''}
      </div>
      <ul class="experience-achievements">
        ${achievementsHtml}
      </ul>
    </div>
  `;

        console.log('+++===+++ [renderExperienceItem] done idx=%d', idx);
        return html;
    }


    /**
     * +++===+++ 2025-08-27 15:45 Asia/Baku — Hasan Alizada — Uniform WORK EXPERIENCE section composer (calls renderExperienceItem for each job)
     * @param {Array<object>} experiences
     * @returns {string} HTML section
     */
    function

    renderWorkExperienceSection(experiences) {
        const list = Array.isArray(experiences) ? experiences : [];
        console.log('+++===+++ [renderWorkExperienceSection] items=%d', list.length);

        const itemsHtml = list.map((exp, idx) => this.renderExperienceItem(exp, idx)).join('');

        const section = `
    <div class="resume-section">
      <h3 class="resume-section__title">WORK EXPERIENCE</h3>
      ${itemsHtml}
    </div>
  `;

        console.log('+++===+++ [renderWorkExperienceSection] done');
        return section;
    }


    // +++===+++ 2025-08-27 16:05 Asia/Baku — Hasan Alizada — Full generateResumeHTML: PDF-parity layout with Contacts & Socials and 2-col Technical Skills
    /**
     * Generate resume HTML (Hero → Contacts & Socials → SKILLS → TECHNICAL SKILLS 2-col → WORK EXPERIENCE → EDUCATION → CERTIFICATES → LANGUAGES)
     * @param {object} data
     * @returns {string}
     */
    generateResumeHTML(data) {
        console.log('+++===+++ [generateResumeHTML] Start');

        let html = '';

        // ===== HERO HEADER =====
        console.log('+++===+++ [generateResumeHTML] Hero');
        const p = data.personal_info || {};
        const photoUrl = (p.photo_url || '').trim();
        const summaryHtml = (typeof p.summary_html === 'string' && p.summary_html.trim().length)
            ? p.summary_html
            : (p.summary || '');

        html += `
    <div class="resume-hero">
      ${photoUrl ? `<img class="resume-photo" src="${photoUrl}" alt="${p.name || ''}">` : ''}
      <div class="resume-hero__text">
        <h1 class="resume-header__name">${p.name || ''}</h1>
        <div class="resume-header__title">${p.title || ''}</div>
        <div class="resume-header__summary">${summaryHtml || ''}</div>
      </div>
    </div>
  `;

        // ===== CONTACTS & SOCIALS (NEW, before SKILLS) =====
        console.log('+++===+++ [generateResumeHTML] Contacts & Socials');
        const contact = p.contact || {};
        const socials = p.social_links || {};

        // Normalize URL
        const toUrl = (value, explicitPrefix) => {
            if (!value) return '';
            const v = String(value).trim();
            if (/^(https?:)?\/\//i.test(v) || v.startsWith('mailto:') || v.startsWith('tel:') || v.startsWith('skype:')) return v;
            if (explicitPrefix) return explicitPrefix + v;
            return 'https://' + v;
        };

        // Icons
        const icon = (key) => {
            switch (key) {
                case 'email':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/></svg>';
                case 'phone':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1.1-.24 11.8 11.8 0 0 0 3.7.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 1 11.8 11.8 0 0 0 .6 3.7 1 1 0 0 1-.24 1.1L6.6 10.8z"/></svg>';
                case 'location':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
                case 'website':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 17.9A8 8 0 0 1 4.1 13H11v6.9zM4.1 11A8 8 0 0 1 11 4.1V11H4.1zM13 4.1A8 8 0 0 1 19.9 11H13V4.1zM13 13h6.9A8 8 0 0 1 13 19.9V13z"/></svg>';
                case 'linkedin':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9h3v10H6zM7.5 5.5A1.5 1.5 0 1 1 6 7a1.5 1.5 0 0 1 1.5-1.5zM10 9h3v1.5h.04A3.3 3.3 0 0 1 16 9c3 0 3.6 2 3.6 4.6V19H16v-4c0-1 0-2.3-1.4-2.3S13 14 13 15v4h-3V9z"/></svg>';
                case 'twitter':
                case 'x':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3l7.5 9.4L4.7 21H8l5-6.3L17.8 21H21l-7.4-9.9L20.5 3H17.2l-4.8 6-4.6-6H4z"/></svg>';
                case 'github':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 .1 2.8 1.7 1.2 2 3.3 1.5 4.1 1.1.1-.9.4-1.5.7-1.9-2.6-.3-5.4-1.3-5.4-6A4.7 4.7 0 0 1 7 7.2a4.4 4.4 0 0 1 .1-3.2s1-.3 3.3 1.3a11.2 11.2 0 0 1 6 0C18.8 3.7 19.8 4 19.8 4a4.4 4.4 0 0 1 .1 3.2 4.7 4.7 0 0 1 1.2 3.3c0 4.7-2.8 5.7-5.5 6 .4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/></svg>';
                case 'facebook':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 22V12h3l1-4h-4V6c0-1.1.9-2 2-2h2V0h-3a5 5 0 0 0-5 5v3H6v4h3v10h4z"/></svg>';
                case 'instagram':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7zm6-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>';
                case 'youtube':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.2C19 3.5 12 3.5 12 3.5s-7 0-9.4.5A3 3 0 0 0 .5 6.2 31.9 31.9 0 0 0 0 12a31.9 31.9 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.2C5 20.5 12 20.5 12 20.5s7 0 9.4-.5a3 3 0 0 0 2.1-2.2c.4-1.9.5-3.8.5-5.8s0-3.9-.5-5.8zM9.8 15.5V8.5l6 3.5-6 3.5z"/></svg>';
                case 'telegram':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.9 15.3 9.6 19c.4 0 .6-.2.8-.4l1.9-1.8 4 2.9c.7.4 1.3.2 1.5-.6L21.9 5c.3-1-.3-1.4-1.1-1.1L3.7 11.1c-1 .4-1 1 0 1.2l4.4 1.4 10.2-6.5-8.4 8.1z"/></svg>';
                case 'stackoverflow':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-6h2v9H4v-9h2v6h11zM7 19h9v-2H7v2zm.3-4.5 9.3 1 .2-1.5-9.3-1-.2 1.5zm.8-4 8.6 2.6.4-1.5-8.6-2.6-.4 1.5zM10 6l7.5 4.4.8-1.3L10.8 4.7 10 6z"/></svg>';
                case 'medium':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6l4 6-4 6h3l4-6-4-6H2zm6 0h3v12H8V6zm5 0h3a6 6 0 0 1 0 12h-3V6z"/></svg>';
                case 'devto':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h3.5a1.5 1.5 0 0 1 1.5 1.5V15A1.5 1.5 0 0 1 10.5 16H7V7zm9 0h3v9h-3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM8.5 9.5v5h1V9.5h-1z"/></svg>';
                case 'reddit':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12.5a2.5 2.5 0 0 0-4.2-1.8 9.5 9.5 0 0 0-5.8-2l1-4.2 3 .7a1.8 1.8 0 1 0 .3-1 1.8 1.8 0 0 0-1.6.8l-3.7-.9-1.3 5.1a9.4 9.4 0 0 0-6.2 2.3 4.6 4.6 0 0 0-.8 2.7c0 3.4 4.1 6.2 9.1 6.2s9.1-2.8 9.1-6.2c0-.3 0-.5-.1-.7.2-.3.2-.8.2-1zM7.8 13a1.3 1.3 0 1 1 0 2.7 1.3 1.3 0 0 1 0-2.7zm8.4 0a1.3 1.3 0 1 1 0 2.7 1.3 1.3 0 0 1 0-2.7zM12 20.1c-2 0-3.7-.7-4.8-1.7a.5.5 0 1 1 .7-.7c.9.8 2.4 1.3 4 1.3s3.1-.5 4-.1c.3.2.5.4.5.7 0 .3-.5.5-1 .5-.9 0-2.3-.1-3.4-.1z"/></svg>';
                case 'skype':
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2a3 3 0 0 0-3 3c0 .6.2 1.1.4 1.6A8.7 8.7 0 0 0 2 10a8 8 0 0 0 8 8c.9 0 1.8-.1 2.7-.4.5.2 1 .4 1.6.4a3 3 0 1 0 0-6c-.6 0-1.1.2-1.6.4A8.7 8.7 0 0 0 14 10a8 8 0 0 0-8-8c-.5 0-1 .1-1.5.3A3 3 0 0 0 5 2z"/></svg>';
                default:
                    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>';
            }
        };

        const items = [];
        if (contact.email) items.push({key: 'email', label: contact.email, href: toUrl(`mailto:${contact.email}`)});
        if (contact.phone) items.push({
            key: 'phone',
            label: contact.phone,
            href: toUrl(`tel:${String(contact.phone).replace(/\s+/g, '')}`)
        });
        if (contact.location) items.push({key: 'location', label: contact.location});
        if (contact.website) items.push({key: 'website', label: contact.website, href: toUrl(contact.website)});

        const preferred = ['linkedin', 'twitter', 'x', 'github', 'facebook', 'instagram', 'youtube', 'telegram', 'stackoverflow', 'medium', 'devto', 'reddit', 'skype'];
        const seen = new Set();
        Object.keys(socials || {}).forEach(k => {
            // keep preferred order first
            if (preferred.includes(k)) return;
        });
        preferred.forEach(k => {
            if (socials[k]) {
                const label = String(socials[k]).trim();
                const url = (k === 'skype') ? toUrl(`skype:${label}`) : toUrl(label);
                items.push({key: k, label, href: url});
                seen.add(k);
            }
        });
        // any remaining/unknown socials
        Object.keys(socials || {}).forEach(k => {
            if (!seen.has(k)) {
                const label = String(socials[k]).trim();
                items.push({key: k, label, href: toUrl(label)});
            }
        });

        const mid = Math.ceil(items.length / 2);
        const left = items.slice(0, mid);
        const right = items.slice(mid);

        const renderCol = (arr) => arr.map(it => `
    <div class="contact-row" data-key="${it.key}">
      <span class="contact-icon">${icon(it.key)}</span>
      ${it.href ? `<a href="${it.href}" target="_blank" rel="noopener" class="contact-text">${it.label}</a>`
            : `<span class="contact-text">${it.label}</span>`}
    </div>
  `).join('');

        html += `
    <div class="contacts-card">
      <div class="contacts-grid">
        <div class="contacts-col">${renderCol(left)}</div>
        <div class="contacts-col">${renderCol(right)}</div>
      </div>
    </div>
  `;

        // ===== SKILLS (pills) =====
        console.log('+++===+++ [generateResumeHTML] SKILLS');
        const profSkills = (data.skills?.professional || []).map(s => `<li>${s}</li>`).join('');
        html += `
    <div class="resume-section">
      <h3 class="resume-section__title">SKILLS</h3>
      <ul class="resume-list resume-list--skills">${profSkills}</ul>
    </div>
  `;

        // ===== TECHNICAL SKILLS (2 columns, label: value) =====
        console.log('+++===+++ [generateResumeHTML] TECHNICAL SKILLS (2-col)');
        const t = data.skills?.technical || {};
        const langList = [...(t.languages?.primary || []), ...(t.languages?.additional || [])];

        const leftPairs = [
            {label: 'Languages', items: langList},
            {label: 'Architecture & Design', items: t.architecture_design || []},
            {label: 'Messaging & APIs', items: t.messaging_apis || []},
            {label: 'Cloud & Infrastructure', items: t.cloud_infrastructure || []},
        ];
        const rightPairs = [
            {label: 'Backend & Frameworks', items: t.backend_frameworks || []},
            {label: 'Databases', items: t.databases || []},
            {label: 'DevOps & CI/CD', items: t.devops_cicd || []},
            {label: 'Monitoring & Observability', items: t.monitoring_observability || []},
        ];

        const renderTechRow = (pair, idx, side) => {
            const arr = Array.isArray(pair.items) ? pair.items : [];
            console.log(`+++===+++ [generateResumeHTML] TechRow(${side})[${idx}] ${pair.label} count=${arr.length}`);
            if (!arr.length) return '';
            const value = arr.join(', ');
            return `
      <div class="tech-row">
        <div class="tech-label">${pair.label}</div>
        <div class="tech-value">${value}</div>
      </div>
    `;
        };
        const renderTechSide = (pairs, side) => pairs.map((p, i) => renderTechRow(p, i, side)).join('');

        html += `
    <div class="resume-section">
      <h3 class="resume-section__title">TECHNICAL SKILLS</h3>
      <div class="tech-grid">
        <div class="tech-col">${renderTechSide(leftPairs, 'L')}</div>
        <div class="tech-col">${renderTechSide(rightPairs, 'R')}</div>
      </div>
    </div>
  `;

        // ===== WORK EXPERIENCE =====
        console.log('+++===+++ [generateResumeHTML] WORK EXPERIENCE');
        const experiences = Array.isArray(data.work_experience) ? data.work_experience : [];
        // Uses helper provided earlier; ask if you need this inlined.
        html += this.renderWorkExperienceSection(experiences);

        // ===== EDUCATION =====
        console.log('+++===+++ [generateResumeHTML] EDUCATION');
        const education = Array.isArray(data.education) ? data.education : [];
        const eduHtml = education.map((e, idx) => {
            console.log('+++===+++ [generateResumeHTML] Education[' + idx + ']', e.institution || '');
            return `
      <div class="education-item">
        <div class="education-degree">${e.degree || ''}</div>
        <div class="education-institution">${(e.institution || '')}${e.location ? ` — ${e.location}` : ''}</div>
        <div class="education-period">${e.period || ''}</div>
      </div>
    `;
        }).join('');
        html += `
    <div class="resume-section">
      <h3 class="resume-section__title">EDUCATION</h3>
      ${eduHtml}
    </div>
  `;

        // ===== CERTIFICATES =====
        console.log('+++===+++ [generateResumeHTML] CERTIFICATES');
        const certs = Array.isArray(data.certificates) ? data.certificates : [];
        const certHtml = certs.map((c, idx) => {
            console.log('+++===+++ [generateResumeHTML] Certificate[' + idx + ']', c.name || '');
            return `<li>${c.name || ''}${c.period ? ` (${c.period})` : ''}</li>`;
        }).join('');
        html += `
    <div class="resume-section">
      <h3 class="resume-section__title">CERTIFICATES</h3>
      <ul class="resume-list">${certHtml}</ul>
    </div>
  `;

        // ===== LANGUAGES =====
        console.log('+++===+++ [generateResumeHTML] LANGUAGES');
        const langs = Array.isArray(data.languages) ? data.languages : [];
        const langsHtml = langs.map((l, idx) => {
            console.log('+++===+++ [generateResumeHTML] Language[' + idx + ']', l.name || '');
            return `<li>${l.name || ''}</li>`;
        }).join('');
        html += `
    <div class="resume-section">
      <h3 class="resume-section__title">LANGUAGES</h3>
      <ul class="resume-list">${langsHtml}</ul>
    </div>
  `;

        console.log('+++===+++ [generateResumeHTML] Finished');
        return html;
    }


    /**
     * Load blog content using blog renderer atom
     */
    async loadBlogContent() {
        console.log('+++===+++ Loading blog content');

        const blogContentContainer = document.getElementById('blog-content');
        if (!blogContentContainer) return;

        try {
            const articlesResult = await this.atoms.blogRenderer.loadArticleList();

            if (!articlesResult.success) {
                throw new Error(articlesResult.error);
            }

            // Generate article links HTML
            const linksResult = this.atoms.blogRenderer.generateArticleLinks(articlesResult.articles);

            if (!linksResult.success) {
                throw new Error(linksResult.error);
            }

            blogContentContainer.innerHTML = linksResult.htmlLinks;
            console.log('+++===+++ Blog content rendered successfully');

        } catch (error) {
            console.error('+++===+++ Error loading blog content:', error);

            // Fallback content
            const fallbackHtml = `
                <div class="articles-list">
                    <div class="article-card" data-url="articles/welcome.html">
                        <h3 class="article-title">Welcome to My Technical Blog</h3>
                        <div class="article-meta">
                            <span class="article-date">August 26, 2025</span>
                            <span class="article-reading-time">2 min read</span>
                            <div class="article-tags">
                                <span class="article-tag">welcome</span>
                                <span class="article-tag">introduction</span>
                            </div>
                        </div>
                        <p class="article-description">
                            Welcome to my technical blog where I share insights about enterprise architecture, 
                            system design, and modern development practices.
                        </p>
                    </div>
                    <div class="error-notice">
                        <p>Some articles may not be available. Error: ${error.message}</p>
                    </div>
                </div>
            `;

            blogContentContainer.innerHTML = fallbackHtml;
        }
    }

    /**
     * Navigate to specific section
     */
    navigateToSection(sectionId) {
        console.log(`+++===+++ Navigating to section: ${sectionId}`);

        // Update URL hash - empty hash for resume (default)
        window.location.hash = sectionId === 'resume' ? '' : sectionId;

        // Update active section
        this.updateActiveSection(sectionId);

        // Update navigation
        this.updateActiveNavigation(sectionId);

        this.currentSection = sectionId;
    }

    /**
     * Update active section visibility
     */
    updateActiveSection(sectionId) {
        console.log(`+++===+++ Updating active section to: ${sectionId}`);

        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    /**
     * Update active navigation link
     */
    updateActiveNavigation(sectionId) {
        console.log(`+++===+++ Updating active navigation for: ${sectionId}`);

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Handle initial route based on URL hash
     */
    handleInitialRoute() {
        console.log('+++===+++ Handling initial route');

        const hash = window.location.hash.substring(1);
        const sectionId = hash || 'resume'; // Default to resume if no hash

        this.updateActiveSection(sectionId);
        this.updateActiveNavigation(sectionId);
        this.currentSection = sectionId;
    }

    /**
     * Handle hash changes
     */
    handleHashChange() {
        console.log('+++===+++ Handling hash change');

        const hash = window.location.hash.substring(1);
        const sectionId = hash || 'resume'; // Default to resume if no hash

        if (sectionId !== this.currentSection) {
            this.updateActiveSection(sectionId);
            this.updateActiveNavigation(sectionId);
            this.currentSection = sectionId;
        }
    }

    /**
     * Generate PDF using PDF generator atom
     */
    async generatePDF() {
        console.log('+++===+++ PDF generation requested');

        try {
            // Show loading state
            const buttons = document.querySelectorAll('#generate-pdf-btn, #download-pdf-btn');
            const originalTexts = Array.from(buttons).map(btn => btn.textContent);

            buttons.forEach(btn => {
                btn.textContent = 'Generating PDF...';
                btn.disabled = true;
            });

            // Load resume data
            const resumeResult = await this.atoms.resumeDataLoader.loadResumeData();
            if (!resumeResult.success) {
                throw new Error(`Failed to load resume data: ${resumeResult.error}`);
            }

            // Generate and download PDF
            const pdfResult = await this.atoms.pdfGenerator.generateAndDownload(
                resumeResult.data,
                {
                    filename: 'Hasan_Alizada_Resume.pdf',
                    format: 'a4',
                    orientation: 'portrait'
                }
            );

            if (!pdfResult.success) {
                throw new Error(`Failed to generate PDF: ${pdfResult.error}`);
            }

            console.log('+++===+++ PDF generated and downloaded successfully');

            // Show success message briefly
            buttons.forEach(btn => {
                btn.textContent = 'PDF Downloaded!';
            });

            setTimeout(() => {
                buttons.forEach((btn, index) => {
                    btn.textContent = originalTexts[index];
                    btn.disabled = false;
                });
            }, 2000);

        } catch (error) {
            console.error('+++===+++ PDF generation failed:', error);

            // Reset button states
            const buttons = document.querySelectorAll('#generate-pdf-btn, #download-pdf-btn');
            buttons.forEach(btn => {
                btn.textContent = btn.id === 'generate-pdf-btn' ? 'Create Resume PDF' : 'Generate PDF';
                btn.disabled = false;
            });

            // Show error message
            this.showError(`Failed to generate PDF: ${error.message}`);
        }
    }

    /**
     * Generate page title for section
     * @param {string} sectionId - Section ID
     * @returns {string}
     */
    generatePageTitle(sectionId) {
        const baseName = 'Hasan Alizada - Technology Principal';

        switch (sectionId) {
            case 'resume':
                return `${baseName} | AWS® SA, TOGAF®, PMP®, ITIL®, OCP®`;
            case 'blog':
                return `Technical Blog - ${baseName}`;
            default:
                return baseName;
        }
    }

    /**
     * Wait for global variable to become available
     * @param {string} globalName - Name of global variable to wait for
     * @param {number} timeout - Timeout in milliseconds (default 5000)
     * @returns {Promise}
     */
    waitForGlobal(globalName, timeout = 5000) {
        console.log(`+++===+++ Waiting for global ${globalName} to be available`);
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkGlobal = () => {
                if (typeof window[globalName] !== 'undefined') {
                    console.log(`+++===+++ Global ${globalName} is now available`);
                    resolve();
                    return;
                }

                if (Date.now() - startTime > timeout) {
                    console.error(`+++===+++ Timeout waiting for global ${globalName}`);
                    reject(new Error(`Timeout waiting for ${globalName} to load`));
                    return;
                }

                setTimeout(checkGlobal, 50);
            };

            checkGlobal();
        });
    }

    /**
     * Load external script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve(); // Script already loaded
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Show error message to user
     */
    showError(message) {
        console.error(`+++===+++ Showing error to user: ${message}`);

        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-notification';
        errorContainer.textContent = message;
        document.body.appendChild(errorContainer);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 5000);
    }
}

// Initialize global App instance
window.App = new App();