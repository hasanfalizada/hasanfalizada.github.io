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
        const pdfButtons = document.querySelectorAll('#generate-pdf-btn, #download-pdf-btn');
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
     * Generate resume HTML from data
     */
    generateResumeHTML(data) {
        console.log('+++===+++ Generating resume HTML from data');

        let html = '';

        // Personal Information Section
        html += `
            <div class="resume-section">
                <h3 class="resume-section__title">Personal Information</h3>
                <div class="personal-info-grid">
                    <div class="info-item">
                        <strong>Name:</strong> ${data.personal_info.name}
                    </div>
                    <div class="info-item">
                        <strong>Title:</strong> ${data.personal_info.title}
                    </div>
                    <div class="info-item">
                        <strong>Email:</strong> <a href="mailto:${data.personal_info.contact.email}">${data.personal_info.contact.email}</a>
                    </div>
                    <div class="info-item">
                        <strong>Phone:</strong> <a href="tel:${data.personal_info.contact.phone}">${data.personal_info.contact.phone}</a>
                    </div>
                    <div class="info-item">
                        <strong>Location:</strong> ${data.personal_info.contact.location}
                    </div>
                </div>
                <div class="summary">
                    <p>${data.personal_info.summary}</p>
                </div>
            </div>
        `;

        // Professional Skills Section
        html += `
            <div class="resume-section">
                <h3 class="resume-section__title">Professional Skills</h3>
                <div class="skills-list">
                    ${data.skills.professional.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        `;

        // Technical Skills Section
        html += `
            <div class="resume-section">
                <h3 class="resume-section__title">Technical Skills</h3>
                <div class="skills-grid">
        `;

        Object.entries(data.skills.technical).forEach(([category, skills]) => {
            const categoryTitle = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let skillsArray = Array.isArray(skills) ? skills : (skills.primary || []).concat(skills.additional || []);

            html += `
                <div class="skills-category">
                    <h4 class="skills-category__title">${categoryTitle}</h4>
                    <div class="skills-list">
                        ${skillsArray.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            `;
        });

        html += '</div></div>';

        // Work Experience Section
        html += `
            <div class="resume-section">
                <h3 class="resume-section__title">Work Experience</h3>
        `;

        data.work_experience.forEach(exp => {
            html += `
                <div class="experience-card">
                    <div class="experience-header">
                        <h4 class="experience-position">${exp.position}</h4>
                        <div class="experience-company">${exp.company} - ${exp.location}</div>
                        <div class="experience-period">${exp.period}</div>
                        ${exp.company_description ? `<p class="experience-description">${exp.company_description}</p>` : ''}
                    </div>
                    <ul class="experience-achievements">
                        ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
            `;
        });

        html += '</div>';

        // Education Section
        html += `
            <div class="resume-section">
                <h3 class="resume-section__title">Education</h3>
        `;

        data.education.forEach(edu => {
            html += `
                <div class="education-item">
                    <h4>${edu.degree}</h4>
                    <p>${edu.institution} - ${edu.location}</p>
                    <p class="education-period">${edu.period}</p>
                </div>
            `;
        });

        html += '</div>';

        // Certificates Section
        html += `
            <div class="resume-section">
                <h3 class="resume-section__title">Certifications</h3>
                <ul class="certificates-list">
        `;

        data.certificates.forEach(cert => {
            html += `<li><strong>${cert.name}</strong> (${cert.period})</li>`;
        });

        html += '</ul></div>';

        // Languages Section
        html += `
            <div class="resume-section">
                <h3 class="resume-section__title">Languages</h3>
                <div class="languages-grid">
        `;

        data.languages.forEach(lang => {
            html += `
                <div class="language-item">
                    <span class="language-name">${lang.name}</span>
                    <span class="language-level">${lang.level}</span>
                </div>
            `;
        });

        html += '</div></div>';

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
                return `${baseName} | TOGAF®, PMP®, ITIL®, OCP®`;
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