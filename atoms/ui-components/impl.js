// +++===+++ 2025-08-26 16:30 UTC — Hasan Alizada — UI Components atom implementation

class UIComponents {
    constructor() {
        this.designSystem = {
            colors: {
                primary: '#000000',
                secondary: '#666666',
                accent: '#333333',
                background: '#ffffff',
                surface: '#fafafa',
                border: '#e0e0e0'
            },
            typography: {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                headingWeight: 600,
                bodyWeight: 400,
                lineHeight: 1.6
            },
            spacing: {
                xs: '0.25rem',
                sm: '0.5rem',
                md: '1rem',
                lg: '1.5rem',
                xl: '2rem',
                xxl: '3rem'
            },
            borderRadius: {
                sm: '0.25rem',
                md: '0.5rem',
                lg: '0.75rem'
            }
        };
        console.log('+++===+++ UIComponents initialized');
    }

    /**
     * Renders main header with personal branding and navigation
     * @param {object} personalInfo - Personal information
     * @param {array} navigationItems - Navigation items
     * @param {object} options - Header options
     * @returns {{success: boolean, htmlContent: string, error: string|null}}
     */
    renderHeader(personalInfo, navigationItems, options = {}) {
        console.log('+++===+++ Rendering header component');

        try {
            const defaultOptions = {
                showNavigation: true,
                stickyHeader: false,
                showProfileImage: false,
                theme: 'light'
            };

            const headerOptions = { ...defaultOptions, ...options };

            const headerClass = `header ${headerOptions.stickyHeader ? 'header--sticky' : ''}`;
            const navItems = navigationItems.map(item =>
                `<a href="${item.href}" class="nav-link ${item.active ? 'active' : ''}" data-section="${item.href.replace('#', '')}">${item.label}</a>`
            ).join('');

            const htmlContent = `
                <header class="${headerClass}">
                    <div class="container">
                        <nav class="navigation">
                            <div class="nav-brand">
                                <h1 class="brand-name">${personalInfo.name}</h1>
                                <p class="brand-title">${personalInfo.title}</p>
                            </div>
                            ${headerOptions.showNavigation ? `
                            <div class="nav-links">
                                ${navItems}
                            </div>
                            ` : ''}
                        </nav>
                    </div>
                </header>
            `.trim();

            console.log('+++===+++ Header rendered successfully');
            return {
                success: true,
                htmlContent: htmlContent,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error rendering header:', error);
            return {
                success: false,
                htmlContent: '',
                error: error.message
            };
        }
    }

    /**
     * Renders footer with social media links and copyright info
     * @param {object} socialLinks - Social media links
     * @param {string} footerText - Footer text
     * @param {object} options - Footer options
     * @returns {{success: boolean, htmlContent: string, error: string|null}}
     */
    renderFooter(socialLinks, footerText = '', options = {}) {
        console.log('+++===+++ Rendering footer component');

        try {
            const defaultOptions = {
                showSocialIcons: true,
                showCopyright: true,
                compactMode: false
            };

            const footerOptions = { ...defaultOptions, ...options };
            const socialLinksHtml = footerOptions.showSocialIcons ?
                this.renderSocialLinks(socialLinks, 'horizontal', false).htmlContent : '';

            const copyrightText = footerText || `© ${new Date().getFullYear()} Hasan Alizada. All rights reserved.`;

            const htmlContent = `
                <footer class="footer">
                    <div class="container">
                        <div class="footer-content ${footerOptions.compactMode ? 'footer-content--compact' : ''}">
                            ${socialLinksHtml}
                            ${footerOptions.showCopyright ? `
                            <div class="footer-text">
                                <p>${copyrightText}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </footer>
            `.trim();

            console.log('+++===+++ Footer rendered successfully');
            return {
                success: true,
                htmlContent: htmlContent,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error rendering footer:', error);
            return {
                success: false,
                htmlContent: '',
                error: error.message
            };
        }
    }

    /**
     * Renders social media links with icons and proper styling
     * @param {object} socialData - Social links data
     * @param {string} style - Layout style (horizontal, vertical, grid)
     * @param {boolean} showLabels - Whether to show labels
     * @returns {{success: boolean, htmlContent: string, error: string|null}}
     */
    renderSocialLinks(socialData, style = 'horizontal', showLabels = false) {
        console.log('+++===+++ Rendering social links component');

        try {
            const socialPlatforms = {
                linkedin: { label: 'LinkedIn', icon: 'in' },
                twitter: { label: 'Twitter', icon: 'tw' },
                github: { label: 'GitHub', icon: 'gh' },
                facebook: { label: 'Facebook', icon: 'fb' },
                youtube: { label: 'YouTube', icon: 'yt' },
                instagram: { label: 'Instagram', icon: 'ig' },
                xing: { label: 'XING', icon: 'xi' }
            };

            const socialLinksArray = Object.entries(socialData)
                .filter(([platform, url]) => url && url.trim() !== '')
                .map(([platform, url]) => {
                    const platformInfo = socialPlatforms[platform];
                    if (!platformInfo) return null;

                    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

                    return `
                        <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="${platformInfo.label}">
                            <span class="social-icon">${platformInfo.icon}</span>
                            ${showLabels ? `<span class="social-label">${platformInfo.label}</span>` : ''}
                        </a>
                    `;
                })
                .filter(link => link !== null);

            const containerClass = `social-links social-links--${style}`;
            const htmlContent = `
                <div class="${containerClass}">
                    ${socialLinksArray.join('')}
                </div>
            `.trim();

            console.log(`+++===+++ Social links rendered successfully (${socialLinksArray.length} links)`);
            return {
                success: true,
                htmlContent: htmlContent,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error rendering social links:', error);
            return {
                success: false,
                htmlContent: '',
                error: error.message
            };
        }
    }

    /**
     * Renders skill tags with minimalistic design and proper spacing
     * @param {array} skills - Array of skill names
     * @param {string} category - Skill category name
     * @param {object} options - Rendering options
     * @returns {{success: boolean, htmlContent: string, error: string|null}}
     */
    renderSkillTags(skills, category, options = {}) {
        console.log(`+++===+++ Rendering skill tags for category: ${category}`);

        try {
            const defaultOptions = {
                style: 'pill',
                size: 'medium',
                colorScheme: 'minimal',
                maxPerRow: null
            };

            const skillOptions = { ...defaultOptions, ...options };

            const skillTags = skills.map(skill =>
                `<span class="skill-tag skill-tag--${skillOptions.style} skill-tag--${skillOptions.size}">${skill}</span>`
            ).join('');

            const containerClass = `skills-list ${skillOptions.maxPerRow ? `skills-list--max-${skillOptions.maxPerRow}` : ''}`;

            const htmlContent = `
                <div class="skills-category">
                    <h4 class="skills-category__title">${category}</h4>
                    <div class="${containerClass}">
                        ${skillTags}
                    </div>
                </div>
            `.trim();

            console.log(`+++===+++ Skill tags rendered successfully (${skills.length} skills)`);
            return {
                success: true,
                htmlContent: htmlContent,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error rendering skill tags:', error);
            return {
                success: false,
                htmlContent: '',
                error: error.message
            };
        }
    }

    /**
     * Renders work experience card with clean typography and layout
     * @param {object} experience - Work experience data
     * @param {object} options - Rendering options
     * @returns {{success: boolean, htmlContent: string, error: string|null}}
     */
    renderExperienceCard(experience, options = {}) {
        console.log(`+++===+++ Rendering experience card for: ${experience.position}`);

        try {
            const defaultOptions = {
                showCompanyDescription: true,
                maxAchievements: null,
                expandable: false,
                highlightKeywords: []
            };

            const cardOptions = { ...defaultOptions, ...options };

            // Limit achievements if specified
            const achievements = cardOptions.maxAchievements ?
                experience.achievements.slice(0, cardOptions.maxAchievements) :
                experience.achievements;

            // Highlight keywords if specified
            const highlightText = (text) => {
                if (!cardOptions.highlightKeywords.length) return text;

                let highlightedText = text;
                cardOptions.highlightKeywords.forEach(keyword => {
                    const regex = new RegExp(`(${keyword})`, 'gi');
                    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
                });
                return highlightedText;
            };

            const achievementsList = achievements.map(achievement =>
                `<li>${highlightText(achievement)}</li>`
            ).join('');

            const htmlContent = `
                <div class="experience-card ${cardOptions.expandable ? 'experience-card--expandable' : ''}">
                    <div class="experience-header">
                        <h4 class="experience-position">${highlightText(experience.position)}</h4>
                        <div class="experience-company">${highlightText(experience.company)} - ${experience.location}</div>
                        <div class="experience-period">${experience.period}</div>
                        ${cardOptions.showCompanyDescription && experience.company_description ?
                    `<p class="experience-description">${highlightText(experience.company_description)}</p>` : ''}
                    </div>
                    <ul class="experience-achievements">
                        ${achievementsList}
                    </ul>
                    ${cardOptions.maxAchievements && experience.achievements.length > cardOptions.maxAchievements ?
                    `<button class="experience-expand-btn">Show ${experience.achievements.length - cardOptions.maxAchievements} more achievements</button>` : ''}
                </div>
            `.trim();

            console.log('+++===+++ Experience card rendered successfully');
            return {
                success: true,
                htmlContent: htmlContent,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error rendering experience card:', error);
            return {
                success: false,
                htmlContent: '',
                error: error.message
            };
        }
    }

    /**
     * Renders complete resume section with proper formatting
     * @param {string} sectionType - Section type (personal, experience, skills, education, certificates, languages)
     * @param {object} sectionData - Section data
     * @param {object} options - Section options
     * @returns {{success: boolean, htmlContent: string, error: string|null}}
     */
    renderResumeSection(sectionType, sectionData, options = {}) {
        console.log(`+++===+++ Rendering resume section: ${sectionType}`);

        try {
            const defaultOptions = {
                showTitle: true,
                collapsible: false,
                animateOnLoad: false,
                customCssClass: ''
            };

            const sectionOptions = { ...defaultOptions, ...options };

            let sectionContent = '';
            let sectionTitle = '';

            switch (sectionType) {
                case 'personal':
                    sectionTitle = 'Personal Information';
                    sectionContent = this.renderPersonalInfoSection(sectionData);
                    break;
                case 'experience':
                    sectionTitle = 'Work Experience';
                    sectionContent = this.renderExperienceSection(sectionData);
                    break;
                case 'skills':
                    sectionTitle = 'Skills';
                    sectionContent = this.renderSkillsSection(sectionData);
                    break;
                case 'education':
                    sectionTitle = 'Education';
                    sectionContent = this.renderEducationSection(sectionData);
                    break;
                case 'certificates':
                    sectionTitle = 'Certifications';
                    sectionContent = this.renderCertificatesSection(sectionData);
                    break;
                case 'languages':
                    sectionTitle = 'Languages';
                    sectionContent = this.renderLanguagesSection(sectionData);
                    break;
                default:
                    throw new Error(`Unknown section type: ${sectionType}`);
            }

            const sectionClass = `resume-section resume-section--${sectionType} ${sectionOptions.customCssClass}`;
            const collapseId = sectionOptions.collapsible ? `collapse-${sectionType}` : '';

            const htmlContent = `
                <div class="${sectionClass}" ${sectionOptions.animateOnLoad ? 'data-animate="fade-in"' : ''}>
                    ${sectionOptions.showTitle ? `
                    <h3 class="resume-section__title ${sectionOptions.collapsible ? 'resume-section__title--collapsible' : ''}" 
                        ${sectionOptions.collapsible ? `data-toggle="collapse" data-target="#${collapseId}"` : ''}>
                        ${sectionTitle}
                        ${sectionOptions.collapsible ? '<span class="collapse-icon">▼</span>' : ''}
                    </h3>
                    ` : ''}
                    <div class="resume-section__content" ${sectionOptions.collapsible ? `id="${collapseId}"` : ''}>
                        ${sectionContent}
                    </div>
                </div>
            `.trim();

            console.log(`+++===+++ Resume section ${sectionType} rendered successfully`);
            return {
                success: true,
                htmlContent: htmlContent,
                error: null
            };

        } catch (error) {
            console.error(`+++===+++ Error rendering resume section ${sectionType}:`, error);
            return {
                success: false,
                htmlContent: '',
                error: error.message
            };
        }
    }

    /**
     * Render personal information section
     * @param {object} personalData - Personal information
     * @returns {string}
     */
    renderPersonalInfoSection(personalData) {
        return `
            <div class="personal-info-grid">
                <div class="info-item">
                    <strong>Name:</strong> ${personalData.name}
                </div>
                <div class="info-item">
                    <strong>Title:</strong> ${personalData.title}
                </div>
                <div class="info-item">
                    <strong>Email:</strong> <a href="mailto:${personalData.contact.email}">${personalData.contact.email}</a>
                </div>
                <div class="info-item">
                    <strong>Phone:</strong> <a href="tel:${personalData.contact.phone}">${personalData.contact.phone}</a>
                </div>
                <div class="info-item">
                    <strong>Location:</strong> ${personalData.contact.location}
                </div>
                <div class="info-item">
                    <strong>Website:</strong> <a href="https://${personalData.contact.website}" target="_blank">${personalData.contact.website}</a>
                </div>
            </div>
            <div class="summary">
                <p>${personalData.summary}</p>
            </div>
        `.trim();
    }

    /**
     * Render experience section
     * @param {array} experienceData - Experience data
     * @returns {string}
     */
    renderExperienceSection(experienceData) {
        return experienceData.map(exp =>
            this.renderExperienceCard(exp).htmlContent
        ).join('');
    }

    /**
     * Render skills section
     * @param {object} skillsData - Skills data
     * @returns {string}
     */
    renderSkillsSection(skillsData) {
        let skillsHtml = '';

        // Professional skills
        if (skillsData.professional && skillsData.professional.length > 0) {
            skillsHtml += this.renderSkillTags(skillsData.professional, 'Professional Skills').htmlContent;
        }

        // Technical skills
        if (skillsData.technical) {
            skillsHtml += '<div class="skills-grid">';
            Object.entries(skillsData.technical).forEach(([category, skills]) => {
                const categoryTitle = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let skillsArray = Array.isArray(skills) ? skills :
                    (skills.primary || []).concat(skills.additional || []);

                skillsHtml += this.renderSkillTags(skillsArray, categoryTitle).htmlContent;
            });
            skillsHtml += '</div>';
        }

        return skillsHtml;
    }

    /**
     * Render education section
     * @param {array} educationData - Education data
     * @returns {string}
     */
    renderEducationSection(educationData) {
        return educationData.map(edu => `
            <div class="education-item">
                <h4 class="education-degree">${edu.degree}</h4>
                <p class="education-institution">${edu.institution} - ${edu.location}</p>
                <p class="education-period">${edu.period}</p>
            </div>
        `).join('');
    }

    /**
     * Render certificates section
     * @param {array} certificatesData - Certificates data
     * @returns {string}
     */
    renderCertificatesSection(certificatesData) {
        const certsList = certificatesData.map(cert =>
            `<li><strong>${cert.name}</strong> <span class="cert-period">(${cert.period})</span></li>`
        ).join('');

        return `<ul class="certificates-list">${certsList}</ul>`;
    }

    /**
     * Render languages section
     * @param {array} languagesData - Languages data
     * @returns {string}
     */
    renderLanguagesSection(languagesData) {
        return `
            <div class="languages-grid">
                ${languagesData.map(lang => `
                    <div class="language-item">
                        <span class="language-name">${lang.name}</span>
                        <span class="language-level">${lang.level}</span>
                    </div>
                `).join('')}
            </div>
        `.trim();
    }

    /**
     * Render button component with various styles
     * @param {string} text - Button text
     * @param {object} options - Button options
     * @returns {{success: boolean, htmlContent: string, error: string|null}}
     */
    renderButton(text, options = {}) {
        try {
            const defaultOptions = {
                type: 'button',
                style: 'primary',
                size: 'medium',
                disabled: false,
                icon: null,
                onClick: null,
                href: null,
                target: null,
                ariaLabel: null,
                customClass: ''
            };

            const btnOptions = { ...defaultOptions, ...options };
            const isLink = btnOptions.href !== null;
            const tag = isLink ? 'a' : 'button';

            const classes = [
                'btn',
                `btn--${btnOptions.style}`,
                `btn--${btnOptions.size}`,
                btnOptions.customClass
            ].filter(cls => cls).join(' ');

            const attributes = [];
            if (!isLink) {
                attributes.push(`type="${btnOptions.type}"`);
                if (btnOptions.disabled) attributes.push('disabled');
                if (btnOptions.onClick) attributes.push(`onclick="${btnOptions.onClick}"`);
            } else {
                attributes.push(`href="${btnOptions.href}"`);
                if (btnOptions.target) attributes.push(`target="${btnOptions.target}"`);
                if (btnOptions.target === '_blank') attributes.push('rel="noopener noreferrer"');
            }

            if (btnOptions.ariaLabel) attributes.push(`aria-label="${btnOptions.ariaLabel}"`);

            const htmlContent = `
                <${tag} class="${classes}" ${attributes.join(' ')}>
                    ${btnOptions.icon ? `<span class="btn__icon">${btnOptions.icon}</span>` : ''}
                    <span class="btn__text">${text}</span>
                </${tag}>
            `.trim();

            return {
                success: true,
                htmlContent: htmlContent,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error rendering button:', error);
            return {
                success: false,
                htmlContent: '',
                error: error.message
            };
        }
    }

    /**
     * Render loading spinner component
     * @param {object} options - Spinner options
     * @returns {{success: boolean, htmlContent: string, error: string|null}}
     */
    renderLoadingSpinner(options = {}) {
        const defaultOptions = {
            size: 'medium',
            text: 'Loading...',
            overlay: false
        };

        const spinnerOptions = { ...defaultOptions, ...options };

        const htmlContent = `
            <div class="loading-spinner ${spinnerOptions.overlay ? 'loading-spinner--overlay' : ''} loading-spinner--${spinnerOptions.size}">
                <div class="spinner"></div>
                ${spinnerOptions.text ? `<p class="loading-text">${spinnerOptions.text}</p>` : ''}
            </div>
        `.trim();

        return {
            success: true,
            htmlContent: htmlContent,
            error: null
        };
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
} else {
    window.UIComponents = UIComponents;
}