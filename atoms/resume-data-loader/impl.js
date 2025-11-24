// +++===+++ 2025-08-26 16:00 UTC — Hasan Alizada — Resume data loader atom implementation

class ResumeDataLoader {
    constructor() {
        this.dataCache = null;
        this.isLoading = false;
    }

    /**
     * Loads complete resume data from JSON file
     * @returns {Promise<{success: boolean, data: object, error: string|null}>}
     */
    async loadResumeData() {
        if (this.dataCache) {
            return {
                success: true,
                data: this.dataCache,
                error: null
            };
        }

        if (this.isLoading) {
            return new Promise(resolve => {
                const checkLoaded = () => {
                    if (!this.isLoading) {
                        resolve(this.loadResumeData());
                    } else {
                        setTimeout(checkLoaded, 100);
                    }
                };
                checkLoaded();
            });
        }

        this.isLoading = true;

        try {
            const response = await fetch('data/resume.json');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch resume data`);
            }

            const data = await response.json();

            const validation = this.validateResumeStructure(data);
            if (!validation.valid) {
                throw new Error(`Resume data validation failed: ${validation.errors.join(', ')}`);
            }

            this.dataCache = data;
            this.isLoading = false;

            return {
                success: true,
                data: this.dataCache,
                error: null
            };

        } catch (error) {
            this.isLoading = false;

            return {
                success: false,
                data: {},
                error: error.message
            };
        }
    }

    /**
     * Validates resume data structure integrity
     * @param {object} data - Resume data to validate
     * @returns {{valid: boolean, errors: string[]}}
     */
    validateResumeStructure(data) {
        const errors = [];

        // Check required top-level properties
        const requiredProps = ['personal_info', 'skills', 'work_experience', 'education', 'certificates', 'languages'];
        for (const prop of requiredProps) {
            if (!data[prop]) {
                errors.push(`Missing required property: ${prop}`);
            }
        }

        // Validate personal_info structure
        if (data.personal_info) {
            const personalRequiredProps = ['name', 'title', 'summary', 'contact', 'social_links'];
            for (const prop of personalRequiredProps) {
                if (!data.personal_info[prop]) {
                    errors.push(`Missing required personal_info property: ${prop}`);
                }
            }

            // Validate contact info
            if (data.personal_info.contact) {
                const contactRequiredProps = ['email', 'phone', 'location', 'website'];
                for (const prop of contactRequiredProps) {
                    if (!data.personal_info.contact[prop]) {
                        errors.push(`Missing required contact property: ${prop}`);
                    }
                }
            }
        }

        // Validate work_experience array
        if (data.work_experience && Array.isArray(data.work_experience)) {
            data.work_experience.forEach((exp, index) => {
                const expRequiredProps = ['position', 'company', 'location', 'period', 'achievements'];
                for (const prop of expRequiredProps) {
                    if (!exp[prop]) {
                        errors.push(`Missing required work_experience[${index}] property: ${prop}`);
                    }
                }

                if (exp.achievements && !Array.isArray(exp.achievements)) {
                    errors.push(`work_experience[${index}].achievements must be an array`);
                }
            });
        } else if (data.work_experience) {
            errors.push('work_experience must be an array');
        }

        // Validate education array
        if (data.education && Array.isArray(data.education)) {
            data.education.forEach((edu, index) => {
                const eduRequiredProps = ['degree', 'institution', 'location', 'period'];
                for (const prop of eduRequiredProps) {
                    if (!edu[prop]) {
                        errors.push(`Missing required education[${index}] property: ${prop}`);
                    }
                }
            });
        }

        const isValid = errors.length === 0;

        return {
            valid: isValid,
            errors: errors
        };
    }

    /**
     * Returns personal information section
     * @returns {Promise<{success: boolean, data: object, error: string|null}>}
     */
    async getPersonalInfo() {
        const result = await this.loadResumeData();
        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: result.data.personal_info || {},
            error: null
        };
    }

    /**
     * Returns work experience array
     * @returns {Promise<{success: boolean, data: array, error: string|null}>}
     */
    async getExperience() {
        const result = await this.loadResumeData();
        if (!result.success) {
            return {
                success: false,
                data: [],
                error: result.error
            };
        }

        return {
            success: true,
            data: result.data.work_experience || [],
            error: null
        };
    }

    /**
     * Returns skills section
     * @returns {Promise<{success: boolean, data: object, error: string|null}>}
     */
    async getSkills() {
        const result = await this.loadResumeData();
        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: result.data.skills || {},
            error: null
        };
    }

    /**
     * Returns education section
     * @returns {Promise<{success: boolean, data: array, error: string|null}>}
     */
    async getEducation() {
        const result = await this.loadResumeData();
        if (!result.success) {
            return {
                success: false,
                data: [],
                error: result.error
            };
        }

        return {
            success: true,
            data: result.data.education || [],
            error: null
        };
    }

    /**
     * Returns certificates section
     * @returns {Promise<{success: boolean, data: array, error: string|null}>}
     */
    async getCertificates() {
        const result = await this.loadResumeData();
        if (!result.success) {
            return {
                success: false,
                data: [],
                error: result.error
            };
        }

        return {
            success: true,
            data: result.data.certificates || [],
            error: null
        };
    }

    /**
     * Returns languages section
     * @returns {Promise<{success: boolean, data: array, error: string|null}>}
     */
    async getLanguages() {
        const result = await this.loadResumeData();
        if (!result.success) {
            return {
                success: false,
                data: [],
                error: result.error
            };
        }

        return {
            success: true,
            data: result.data.languages || [],
            error: null
        };
    }

    /**
     * Clears cached data (useful for testing or forced refresh)
     */
    clearCache() {
        this.dataCache = null;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeDataLoader;
} else {
    window.ResumeDataLoader = ResumeDataLoader;
}