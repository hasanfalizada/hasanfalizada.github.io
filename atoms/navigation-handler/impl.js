// +++===+++ 2025-11-26 UTC — Hasan Alizada — Refactored to load data from resume.json (single source of truth)

class NavigationHandler {
    constructor() {
        this.currentSection = 'blog'; // Default section
        this.resumeData = null; // Will be initialized with resume data
        this.isInitialized = false;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Initialize with resume data
     * @param {object} resumeData - Data from resume.json
     */
    initialize(resumeData) {
        this.resumeData = resumeData;
        this.isInitialized = true;
        return { success: true };
    }

    /**
     * Navigate to a specific section
     * @param {string} sectionId - Section ID to navigate to
     * @returns {{success: boolean, section: string, error: string|null}}
     */
    navigateToSection(sectionId) {
        try {
            // Validate section exists
            const validSections = ['blog', 'resume'];
            if (!validSections.includes(sectionId)) {
                return {
                    success: false,
                    section: this.currentSection,
                    error: `Invalid section: ${sectionId}`
                };
            }

            // Update current section
            this.currentSection = sectionId;

            // Update URL hash
            this.updateURL(sectionId);

            return {
                success: true,
                section: sectionId,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                section: this.currentSection,
                error: error.message
            };
        }
    }

    /**
     * Update browser URL with new hash
     * @param {string} sectionId - Section ID
     * @returns {{success: boolean, error: string|null}}
     */
    updateURL(sectionId) {
        try {
            // Empty hash for blog (default), otherwise use section ID
            const newHash = sectionId === 'blog' ? '' : sectionId;

            if (window.location.hash.substring(1) !== newHash) {
                window.location.hash = newHash;
            }

            return {
                success: true,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current section from URL hash
     * @returns {{success: boolean, section: string, error: string|null}}
     */
    getCurrentSection() {
        try {
            const hash = window.location.hash.substring(1);
            const section = hash || 'blog'; // Default to blog if no hash

            return {
                success: true,
                section: section,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                section: 'blog',
                error: error.message
            };
        }
    }

    /**
     * Handle browser back/forward navigation
     * @param {function} callback - Callback function to execute on navigation
     * @returns {{success: boolean, error: string|null}}
     */
    handleBrowserNavigation(callback) {
        try {
            window.addEventListener('hashchange', () => {
                const result = this.getCurrentSection();
                if (result.success && callback) {
                    callback(result.section);
                }
            });

            window.addEventListener('popstate', () => {
                const result = this.getCurrentSection();
                if (result.success && callback) {
                    callback(result.section);
                }
            });

            return {
                success: true,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Scroll to a specific section
     * @param {string} sectionId - Section ID or element ID
     * @param {object} options - Scroll options
     * @returns {{success: boolean, error: string|null}}
     */
    scrollToSection(sectionId, options = {}) {
        try {
            const element = document.getElementById(sectionId);

            if (!element) {
                return {
                    success: false,
                    error: `Section not found: ${sectionId}`
                };
            }

            const scrollOptions = {
                behavior: options.smooth !== false ? 'smooth' : 'auto',
                block: options.block || 'start',
                inline: options.inline || 'nearest'
            };

            element.scrollIntoView(scrollOptions);

            return {
                success: true,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Generate page title from resume data
     * @param {string} sectionId - Section ID (blog, resume)
     * @returns {string} - Page title
     */
    generatePageTitle(sectionId) {
        if (!this.resumeData || !this.resumeData.personal_info) {
            return 'Portfolio'; // Fallback
        }

        const pi = this.resumeData.personal_info;
        const name = pi.name || '';
        const title = pi.title || '';

        switch (sectionId) {
            case 'resume':
                return title ? `${name} - ${title}` : name;
            case 'blog':
                return `Blog - ${name}`;
            default:
                return title ? `${name} - ${title}` : name;
        }
    }

    /**
     * Get all available sections
     * @returns {{success: boolean, sections: array, error: string|null}}
     */
    getAvailableSections() {
        try {
            const sections = [
                {
                    id: 'blog',
                    label: 'Blog',
                    path: '#blog',
                    isDefault: true
                },
                {
                    id: 'resume',
                    label: 'Resume',
                    path: '#resume',
                    isDefault: false
                }
            ];

            return {
                success: true,
                sections: sections,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                sections: [],
                error: error.message
            };
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationHandler;
} else {
    window.NavigationHandler = NavigationHandler;
}