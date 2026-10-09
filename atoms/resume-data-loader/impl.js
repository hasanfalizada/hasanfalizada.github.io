// +++===+++ 2025-08-26 16:00 UTC — Hasan Alizada — Resume data loader atom implementation

// +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — This atom is the ONLY place that knows where resume data comes from.
// All consumers (page, header, SEO, PDF) must get resume data through it. To switch the source, change only `sourceUrl`.

class ResumeDataLoader {
    /**
     * @param {string} sourceUrl - Location of resume data (single source of truth)
     */
    constructor(sourceUrl = 'data/resume.json') {
        this.sourceUrl = sourceUrl;
        this.dataCache = null;
        this.isLoading = false;
        console.debug('[ResumeDataLoader] created, sourceUrl =', this.sourceUrl);
    }

    /**
     * Loads complete resume data from JSON file
     * @returns {Promise<{success: boolean, data: object, error: string|null}>}
     */
    // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Returns RENDERABLE data (to_render:false items removed); raw stays in dataCache
    async loadResumeData() {
        if (this.dataCache) {
            const renderable = this.filterRenderable(this.dataCache);
            console.debug('[ResumeDataLoader] returning renderable data from cache');
            return {
                success: true,
                data: renderable,
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
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Fetch from configurable sourceUrl, no-store to always get fresh data
            console.debug('[ResumeDataLoader] fetching', this.sourceUrl);
            const response = await fetch(this.sourceUrl, {cache: 'no-store'});
            console.debug('[ResumeDataLoader] response status =', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch resume data`);
            }

            const data = await response.json();
            console.debug('[ResumeDataLoader] parsed top-level keys =', Object.keys(data || {}));

            const validation = this.validateResumeStructure(data);
            console.debug('[ResumeDataLoader] validation =', validation);
            if (!validation.valid) {
                throw new Error(`Resume data validation failed: ${validation.errors.join(', ')}`);
            }

            this.dataCache = data;
            this.isLoading = false;
            console.debug('[ResumeDataLoader] data cached');

            return {
                success: true,
                data: this.filterRenderable(this.dataCache),
                error: null
            };

        } catch (error) {
            this.isLoading = false;
            console.error('[ResumeDataLoader] load failed:', error.message);

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
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — headline is required (used by header, SEO, structured data)
            const personalRequiredProps = ['name', 'title', 'headline', 'summary', 'contact', 'social_links'];
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

        // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — to_render, when present, must be boolean (anywhere in the tree)
        const checkToRender = (node, path) => {
            if (Array.isArray(node)) {
                node.forEach((item, i) => checkToRender(item, `${path}[${i}]`));
            } else if (node && typeof node === 'object') {
                if ('to_render' in node && typeof node.to_render !== 'boolean') {
                    errors.push(`${path}.to_render must be boolean`);
                }
                Object.keys(node).forEach(k => checkToRender(node[k], path ? `${path}.${k}` : k));
            }
        };
        checkToRender(data, '');

        const isValid = errors.length === 0;

        return {
            valid: isValid,
            errors: errors
        };
    }

    /**
     * +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Visibility filter (single place for to_render logic)
     * Rules (applied recursively, input is not mutated):
     *  - array item that is an object with to_render === false → removed
     *  - array item of shape {text, to_render} → replaced by its text string
     *  - missing to_render → treated as true (backward compatible)
     *  - to_render key is stripped from output objects
     * @param {*} node - raw resume data (or any subtree)
     * @returns {*} renderable copy
     */
    filterRenderable(node) {
        if (Array.isArray(node)) {
            const before = node.length;
            const result = node
                .filter(item => !(item && typeof item === 'object' && !Array.isArray(item) && item.to_render === false))
                .map(item => {
                    const isTextItem = item && typeof item === 'object' && !Array.isArray(item)
                        && typeof item.text === 'string'
                        && Object.keys(item).every(k => k === 'text' || k === 'to_render');
                    return isTextItem ? item.text : this.filterRenderable(item);
                });
            if (result.length !== before) {
                console.debug(`[ResumeDataLoader] filterRenderable: hidden ${before - result.length} of ${before} items`);
            }
            return result;
        }
        if (node && typeof node === 'object') {
            const out = {};
            Object.keys(node).forEach(k => {
                if (k !== 'to_render') {
                    out[k] = this.filterRenderable(node[k]);
                }
            });
            return out;
        }
        return node;
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