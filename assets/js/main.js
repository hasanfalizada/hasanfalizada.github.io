// +++===+++ 2025-11-26 UTC — Hasan Alizada — Fixed syntax errors, integrated all atoms, added dynamic SEO

/**
 * Main Application Class - Orchestrates all atomic modules
 */
class App {
    constructor() {
        this.atoms = {};
        this.isInitialized = false;
        this.currentSection = 'blog'; // Default section
    }

    async renderHeaderSocialLinks() {
        try {
            // Load resume data
            const result = await this.atoms.resumeDataLoader.loadResumeData();
            if (!result.success) {
                return;
            }

            const socialLinks = result.data.personal_info?.social_links || {};

            // Find the header social links container
            const socialLinksContainer = document.querySelector('.nav-center .social-links');
            if (!socialLinksContainer) {
                return;
            }

            // Clear existing hardcoded links
            socialLinksContainer.innerHTML = '';

            // Social platform configuration with SVG icons
            const socialPlatforms = {
                linkedin: {
                    label: 'LinkedIn',
                    color: '#0077b5',
                    hoverColor: '#005885',
                    icon: `<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>`
                },
                twitter: {
                    label: 'Twitter',
                    color: '#1da1f2',
                    hoverColor: '#0d8bd9',
                    icon: `<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>`
                },
                github: {
                    label: 'GitHub',
                    color: '#333',
                    hoverColor: '#000',
                    icon: `<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.374-12-12-12z"/>`
                },
                facebook: {
                    label: 'Facebook',
                    color: '#1877f2',
                    hoverColor: '#166fe5',
                    icon: `<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>`
                },
                youtube: {
                    label: 'YouTube',
                    color: '#ff0000',
                    hoverColor: '#cc0000',
                    icon: `<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>`
                },
                instagram: {
                    label: 'Instagram',
                    color: '#e4405f',
                    hoverColor: '#c13584',
                    icon: `<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>`
                },
                xing: {
                    label: 'XING',
                    color: '#026466',
                    hoverColor: '#014a4c',
                    icon: `<rect width="24" height="24" rx="4" fill="#026466"/><g transform="translate(1,1)"><path fill="white" d="M13.741 0c-.34 0-.609.146-.768.432l-5.447 9.632a.708.708 0 0 0 0 .709l3.441 5.983c.158.286.419.437.754.437h3.264c.278 0 .479-.1.599-.295a.69.69 0 0 0-.018-.726l-3.374-5.861 5.384-9.482c.123-.211.125-.424.012-.62a.717.717 0 0 0-.625-.309H13.74zm-8.68 4.38c-.28 0-.482.101-.61.307a.64.64 0 0 0 .009.617l1.71 2.969-2.663 4.69c-.121.212-.123.426-.007.63.114.204.322.309.604.309h2.684c.337 0 .594-.15.76-.446l2.647-4.685-1.687-2.947c-.164-.287-.42-.444-.74-.444H5.06z"/></g>`
                }
            };

            // Helper function to normalize URLs
            const normalizeUrl = (url, platform) => {
                if (!url) return null;

                const cleanUrl = String(url).trim();

                // If already has protocol, return as is
                if (/^https?:\/\//i.test(cleanUrl)) {
                    return cleanUrl;
                }

                // Add https prefix for social platforms
                return `https://${cleanUrl}`;
            };

            // Generate dynamic social links
            const socialLinksHtml = Object.entries(socialLinks)
                .filter(([platform, url]) => url && url.trim() !== '')
                .map(([platform, url]) => {
                    const config = socialPlatforms[platform];
                    if (!config) {
                        return null;
                    }

                    const normalizedUrl = normalizeUrl(url, platform);
                    if (!normalizedUrl) return null;

                    return `
        <a href="${normalizedUrl}"
           target="_blank"
           rel="noopener noreferrer"
           class="social-link"
           aria-label="${config.label}"
           data-platform="${platform}">
            <svg width="24" height="24" viewBox="0 0 24 24" style="fill: ${config.color};">
                ${config.icon}
            </svg>
        </a>
    `;
                })
                .filter(Boolean)
                .join('');

            // Insert dynamic social links
            socialLinksContainer.innerHTML = socialLinksHtml;

            // Add hover effects via JavaScript since we can't easily inject CSS
            const socialLinkElements = socialLinksContainer.querySelectorAll('.social-link');
            socialLinkElements.forEach(link => {
                const platform = link.getAttribute('data-platform');
                const config = socialPlatforms[platform];
                if (!config) return;

                const svg = link.querySelector('svg');
                const originalColor = config.color;
                const hoverColor = config.hoverColor;

                link.addEventListener('mouseenter', () => {
                    if (platform === 'xing') {
                        // Special handling for XING - change the background rectangle color
                        const rect = svg.querySelector('rect');
                        if (rect) rect.setAttribute('fill', hoverColor);
                    } else {
                        svg.style.fill = hoverColor;
                    }
                    link.style.transform = 'translateY(-2px)';
                    link.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))';
                });

                link.addEventListener('mouseleave', () => {
                    if (platform === 'xing') {
                        // Special handling for XING - restore the background rectangle color
                        const rect = svg.querySelector('rect');
                        if (rect) rect.setAttribute('fill', originalColor);
                    } else {
                        svg.style.fill = originalColor;
                    }
                    link.style.transform = 'translateY(0)';
                    link.style.filter = 'none';
                });
            });

        } catch (error) {
            console.error('Failed to render header social links:', error);
        }
    }

    /**
     * Initialize application and all atomic modules
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize atomic modules
            await this.initializeAtoms();

            // Setup navigation using navigation-handler atom
            this.setupNavigation();

            // Setup event listeners
            this.setupEventListeners();

            // Load initial content
            await this.loadInitialContent();

            // Handle initial route
            this.handleInitialRoute();

            // Render header social links
            await this.renderHeaderSocialLinks();

            this.isInitialized = true;

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Initialize all atomic modules including previously unused atoms
     */
    async initializeAtoms() {
        try {
            // Load resume data loader atom
            if (typeof ResumeDataLoader === 'undefined') {
                await this.loadScript('atoms/resume-data-loader/impl.js');
                await this.waitForGlobal('ResumeDataLoader');
            }
            if (!this.atoms.resumeDataLoader) {
                this.atoms.resumeDataLoader = new ResumeDataLoader();
            }

            // Load PDF generator atom
            if (typeof PDFGenerator === 'undefined') {
                await this.loadScript('atoms/pdf-generator/impl.js');
                await this.waitForGlobal('PDFGenerator');
            }
            if (!this.atoms.pdfGenerator) {
                this.atoms.pdfGenerator = new PDFGenerator();
            }

            // Load blog renderer atom
            if (typeof BlogRenderer === 'undefined') {
                await this.loadScript('atoms/blog-renderer/impl.js');
                await this.waitForGlobal('BlogRenderer');
            }
            if (!this.atoms.blogRenderer) {
                this.atoms.blogRenderer = new BlogRenderer();
            }

            // +++===+++ 2025-11-26 UTC — Hasan Alizada — Load SEO optimizer atom (previously unused)
            if (typeof SEOOptimizer === 'undefined') {
                await this.loadScript('atoms/seo-optimizer/impl.js');
                await this.waitForGlobal('SEOOptimizer');
            }
            if (!this.atoms.seoOptimizer) {
                this.atoms.seoOptimizer = new SEOOptimizer();
            }

            // +++===+++ 2025-11-26 UTC — Hasan Alizada — Load UI components atom (previously unused)
            if (typeof UIComponents === 'undefined') {
                await this.loadScript('atoms/ui-components/impl.js');
                await this.waitForGlobal('UIComponents');
            }
            if (!this.atoms.uiComponents) {
                this.atoms.uiComponents = new UIComponents();
            }

            // +++===+++ 2025-11-26 UTC — Hasan Alizada — Load navigation handler atom (previously unused)
            if (typeof NavigationHandler === 'undefined') {
                await this.loadScript('atoms/navigation-handler/impl.js');
                await this.waitForGlobal('NavigationHandler');
            }
            if (!this.atoms.navigationHandler) {
                this.atoms.navigationHandler = new NavigationHandler();
            }

        } catch (error) {
            console.error('Failed to initialize atoms:', error);
            throw error;
        }
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Setup navigation using navigation-handler atom instead of duplicate code
     */
    setupNavigation() {
        // Use navigation-handler atom for consistent navigation behavior
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

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
        try {
            // Load resume content
            await this.loadResumeContent();

            // Load blog content
            await this.loadBlogContent();

        } catch (error) {
            console.error('Failed to load initial content:', error);
            // Don't throw - app should still work with partial content
        }
    }

    /**
     * Load resume content using resume data loader atom
     */
    async loadResumeContent() {
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

        } catch (error) {
            console.error('Failed to load resume content:', error);
            resumeContentContainer.innerHTML = `
                <div class="error">
                    <p>Failed to load resume content. Please try again later.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * @param {object} ed - one entry from data.education
     * @param {number} idx
     * @returns {string}
     */
    renderEducationItem(ed, idx) {
        const degree = ed?.degree ? String(ed.degree) : '';
        const school = ed?.institution ? String(ed.institution) : '';
        const location = ed?.location ? String(ed.location) : '';
        const period = ed?.period ? String(ed.period) : '';

        return `
    <div class="education-card">
      <div class="education-heading">
        <div class="education-degree">${degree}</div>
        <div class="education-institution">${school}</div>
        <div class="education-meta">
          <span class="education-period">${period}</span>
          <span class="education-location">${location}</span>
        </div>
      </div>
    </div>
  `;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * @param {Array<object>} education
     * @returns {string}
     */
    renderEducationSection(education) {
        const list = Array.isArray(education) ? education : [];
        const items = list.map((ed, i) => this.renderEducationItem(ed, i)).join('');
        return `
    <div class="resume-section">
      <h3 class="resume-section__title">EDUCATION</h3>
      ${items}
    </div>
  `;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * @param {object} lang
     * @param {number} idx
     * @returns {string}
     */
    renderLanguageItem(lang, idx) {
        const name = lang?.name ? String(lang.name) : '';
        const level = lang?.level ? String(lang.level) : '';
        return `
    <li class="language-row">
      <span class="language-name">${name}</span>
      ${level ? `<span class="language-level">(${level})</span>` : ''}
    </li>
  `;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * @param {Array<object>} languages
     * @returns {string}
     */
    renderLanguagesSection(languages) {
        const list = Array.isArray(languages) ? languages : [];
        const items = list.map((l, i) => this.renderLanguageItem(l, i)).join('');
        return `
    <div class="resume-section">
      <h3 class="resume-section__title">LANGUAGES</h3>
      <ul class="language-list">${items}</ul>
    </div>
  `;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * Map a textual level to a 0–5 score.
     */
    languageLevelToScore(lang) {
        const direct = Number(lang?.score ?? lang?.proficiency ?? lang?.levelScore);
        if (!Number.isNaN(direct)) {
            const clamped = Math.max(0, Math.min(5, Math.round(direct)));
            return clamped;
        }

        const s = String(lang?.level || '').toLowerCase().trim();
        let score = 0;

        if (!s) score = 0;
        else if (/(native|bilingual)/.test(s)) score = 5;
        else if (/(fluent|advanced|c1|c2)/.test(s)) score = 4;
        else if (/(upper[- ]?intermediate|intermediate|b2|professional)/.test(s)) score = 3;
        else if (/(elementary|a2|pre[- ]?intermediate)/.test(s)) score = 2;
        else if (/(basic|beginner|a1)/.test(s)) score = 1;
        else score = 0;

        return score;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     */
    renderLanguageRowDots(lang, idx) {
        const name = lang?.name ? String(lang.name) : '';
        const score = this.languageLevelToScore(lang);

        const MAX = 5;
        const dots = Array.from({length: MAX}, (_, i) =>
            `<span class="lang-dot${i < score ? ' is-filled' : ''}" aria-hidden="true"></span>`
        ).join('');

        return `
    <div class="lang-row">
      <div class="lang-name">${name}</div>
      <div class="lang-dots" role="img" aria-label="${name}: ${score}/${MAX}">${dots}</div>
    </div>
  `;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     */
    renderLanguagesSectionDots(languages) {
        const list = Array.isArray(languages) ? languages : [];
        const mid = Math.ceil(list.length / 2);
        const left = list.slice(0, mid);
        const right = list.slice(mid);

        const renderCol = (arr, side) => arr.map((l, i) => this.renderLanguageRowDots(l, i)).join('');

        return `
    <div class="resume-section">
      <h3 class="resume-section__title">LANGUAGES</h3>
      <div class="lang-grid">
        <div class="lang-col">${renderCol(left, 'L')}</div>
        <div class="lang-col">${renderCol(right, 'R')}</div>
      </div>
    </div>
  `;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * @param {object} cert
     * @param {number} idx
     * @returns {string}
     */
    renderCertificateItem(cert, idx) {
        const name = cert?.name ? String(cert.name) : '';
        const period = cert?.period ? String(cert.period) : '';

        return `
    <li class="cert-row">
      <span class="cert-name">${name}</span>
      ${period ? `<span class="cert-period">(${period})</span>` : ''}
    </li>
  `;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * @param {Array<object>} certs
     * @returns {string}
     */
    renderCertificatesSection(certs) {
        const list = Array.isArray(certs) ? certs : [];
        const items = list.map((c, i) => this.renderCertificateItem(c, i)).join('');
        return `
    <div class="resume-section">
      <h3 class="resume-section__title">CERTIFICATES</h3>
      <ul class="cert-list">${items}</ul>
    </div>
  `;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * @param {object} exp
     * @param {number} idx
     * @returns {string}
     */
    renderExperienceItem(exp, idx) {
        const position = (exp && exp.position) ? String(exp.position) : '';
        const company = (exp && exp.company) ? String(exp.company) : '';
        const location = (exp && exp.location) ? String(exp.location) : '';
        const period = (exp && exp.period) ? String(exp.period) : '';
        const companyDesc = (exp && exp.company_description ? String(exp.company_description).trim() : '');
        const logo = (exp && exp.company_logo) ? String(exp.company_logo).trim() : '';

        const achievements = Array.isArray(exp && exp.achievements) ? exp.achievements : [];

        const achievementsHtml = achievements.map((a, i) => {
            const text = (a == null) ? '' : String(a);
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

        return html;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — FIXED: Removed invalid 'function' keyword
     * @param {Array<object>} experiences
     * @returns {string} HTML section
     */
    renderWorkExperienceSection(experiences) {
        const list = Array.isArray(experiences) ? experiences : [];

        const itemsHtml = list.map((exp, idx) => this.renderExperienceItem(exp, idx)).join('');

        const section = `
    <div class="resume-section">
      <h3 class="resume-section__title">WORK EXPERIENCE</h3>
      ${itemsHtml}
    </div>
  `;

        return section;
    }

    /**
     * Generate resume HTML (Hero → Contacts & Socials → SKILLS → TECHNICAL SKILLS 2-col → WORK EXPERIENCE → EDUCATION → CERTIFICATES → LANGUAGES)
     * @param {object} data
     * @returns {string}
     */
    generateResumeHTML(data) {
        let html = '';

        // ===== HERO HEADER =====
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

        // ===== CONTACTS & SOCIALS (before SKILLS) =====
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
        const profSkills = (data.skills?.professional || []).map(s => `<li>${s}</li>`).join('');
        html += `
    <div class="resume-section">
      <h3 class="resume-section__title">SKILLS</h3>
      <ul class="resume-list resume-list--skills">${profSkills}</ul>
    </div>
  `;

        // ===== TECHNICAL SKILLS (2 columns, label: value) =====
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
        const experiences = Array.isArray(data.work_experience) ? data.work_experience : [];
        html += this.renderWorkExperienceSection(experiences);

        // ===== EDUCATION =====
        const education = Array.isArray(data.education) ? data.education : [];
        html += this.renderEducationSection(education);

        // ===== CERTIFICATES =====
        const certs = Array.isArray(data.certificates) ? data.certificates : [];
        html += this.renderCertificatesSection(certs);

        // ===== LANGUAGES =====
        const languages = Array.isArray(data.languages) ? data.languages : [];
        html += this.renderLanguagesSectionDots(languages);

        return html;
    }

    /**
     * Load blog content using blog renderer atom
     */
    async loadBlogContent() {
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

        } catch (error) {
            console.error('Failed to load blog content:', error);
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
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Navigate to section with SEO updates
     */
    navigateToSection(sectionId) {
        // Validate section exists
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) {
            return;
        }

        // Prevent navigation to same section
        if (sectionId === this.currentSection) {
            return;
        }

        // Update URL hash - use empty hash for blog (default)
        const newHash = sectionId === 'blog' ? '' : sectionId;
        if (window.location.hash.substring(1) !== newHash) {
            window.location.hash = newHash;
        }

        // Force immediate UI updates
        this.updateActiveSection(sectionId);
        this.updateActiveNavigation(sectionId);

        // +++===+++ 2025-11-26 UTC — Hasan Alizada — Update SEO dynamically using seo-optimizer atom
        this.updatePageSEO(sectionId);

        // Update current section
        this.currentSection = sectionId;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Update page SEO dynamically
     */
    updatePageSEO(sectionId) {
        if (!this.atoms.seoOptimizer) return;

        // Generate optimized page title
        const titleResult = this.atoms.seoOptimizer.generatePageTitle(sectionId, {}, {
            author: 'Hasan Alizada'
        });
        if (titleResult) {
            document.title = titleResult;
        }

        // Update meta description
        const descResult = this.atoms.seoOptimizer.generatePageDescription(sectionId, {}, {
            author: 'Hasan Alizada',
            siteDescription: 'Technology Principal with extensive experience in scalable and fault-tolerant architectures'
        });
        if (descResult) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', descResult);
            }
        }

        // Update canonical URL
        const canonicalUrl = this.atoms.seoOptimizer.generateCanonicalUrl(sectionId, {}, {
            siteUrl: 'https://hasanfalizada.github.io'
        });
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', canonicalUrl);
    }

    /**
     * Update active section visibility
     */
    updateActiveSection(sectionId) {
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
        const hash = window.location.hash.substring(1);
        const sectionId = hash || 'blog'; // Default to blog

        // Force immediate section updates
        this.updateActiveSection(sectionId);
        this.updateActiveNavigation(sectionId);
        this.updatePageSEO(sectionId);
        this.currentSection = sectionId;
    }

    /**
     * Handle hash change events
     */
    handleHashChange() {
        const hash = window.location.hash.substring(1);
        const sectionId = hash || 'blog'; // Default to blog

        if (sectionId !== this.currentSection) {
            // Force immediate UI updates
            this.updateActiveSection(sectionId);
            this.updateActiveNavigation(sectionId);
            this.updatePageSEO(sectionId);
            this.currentSection = sectionId;
        }
    }

    /**
     * Generate PDF using HTML-to-PDF approach for perfect website parity
     */
    async generatePDF() {
        try {
            // Show loading state on all PDF buttons
            const buttons = document.querySelectorAll('#generate-pdf-btn, #download-pdf-btn, #fab-pdf');
            const originalTexts = Array.from(buttons).map(btn => {
                if (btn.textContent && btn.textContent.trim()) {
                    return btn.textContent;
                } else {
                    return btn.getAttribute('aria-label') || 'Generate PDF';
                }
            });

            buttons.forEach(btn => {
                if (btn.textContent && btn.textContent.trim()) {
                    btn.textContent = 'Generating PDF...';
                } else {
                    btn.setAttribute('aria-label', 'Generating PDF...');
                }
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.6';
            });

            // Use the generateAndDownload method which handles everything
            const result = await this.atoms.pdfGenerator.generateAndDownload(null, {
                filename: 'Hasan_Alizada_Resume.pdf',
                margin: [5, 5, 5, 5],
                image: {type: 'jpeg', quality: 0.95}
            });

            if (!result.success) {
                throw new Error(`Failed to generate PDF: ${result.error}`);
            }

            // Show success message briefly
            buttons.forEach(btn => {
                if (btn.textContent && btn.textContent.trim()) {
                    btn.textContent = 'PDF Downloaded!';
                } else {
                    btn.setAttribute('aria-label', 'PDF Downloaded!');
                }
                btn.style.opacity = '1';
            });

            // Reset button states after delay
            setTimeout(() => {
                buttons.forEach((btn, index) => {
                    const originalText = originalTexts[index];
                    if (btn.textContent && btn.textContent.trim()) {
                        btn.textContent = originalText;
                    } else {
                        btn.setAttribute('aria-label', originalText);
                    }
                    btn.disabled = false;
                    btn.style.pointerEvents = '';
                    btn.style.opacity = '1';
                });
            }, 2000);

        } catch (error) {
            console.error('Failed to generate PDF:', error);
            // Reset button states on error
            const buttons = document.querySelectorAll('#generate-pdf-btn, #download-pdf-btn, #fab-pdf');
            buttons.forEach(btn => {
                if (btn.textContent && btn.textContent.trim()) {
                    btn.textContent = btn.id === 'generate-pdf-btn' ? 'Create Resume PDF' : 'Generate PDF';
                } else {
                    btn.setAttribute('aria-label', 'Generate PDF');
                }
                btn.disabled = false;
                btn.style.pointerEvents = '';
                btn.style.opacity = '1';
            });

            // Show error message
            this.showError(`Failed to generate PDF: ${error.message}`);
        }
    }

    /**
     * Wait for global variable to become available
     * @param {string} globalName - Name of global variable to wait for
     * @param {number} timeout - Timeout in milliseconds (default 5000)
     * @returns {Promise}
     */
    waitForGlobal(globalName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkGlobal = () => {
                if (typeof window[globalName] !== 'undefined') {
                    resolve();
                    return;
                }

                if (Date.now() - startTime > timeout) {
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
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-notification';
        errorContainer.textContent = message;
        errorContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 1rem 1.5rem; border-radius: 4px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
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