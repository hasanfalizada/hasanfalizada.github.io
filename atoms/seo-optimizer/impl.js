// +++===+++ 2025-08-26 16:30 UTC — Hasan Alizada — SEO Optimizer atom implementation

class SEOOptimizer {
    constructor() {
        // +++===+++ 2025-11-26 UTC — Hasan Alizada — Removed hardcoded defaults, will be loaded from resume.json
        this.defaultConfig = null;
        this.isInitialized = false;
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Initialize with resume data (single source of truth)
     * @param {object} resumeData - Data from resume.json
     */
    // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Added headline, twitterHandle, person (JSON-LD) — all derived from resume data
    initialize(resumeData) {
        const pi = resumeData.personal_info || {};
        const sc = resumeData.site_config || {};
        const contact = pi.contact || {};
        const socials = pi.social_links || {};
        const toUrl = (v) => /^https?:\/\//i.test(String(v)) ? String(v) : `https://${String(v).replace(/^\/+/, '')}`;

        // Twitter handle derived from social_links.twitter (e.g. "x.com/hasanfalizada" → "@hasanfalizada")
        const twitterPath = socials.twitter ? String(socials.twitter).replace(/\/+$/, '').split('/').pop() : '';
        const twitterHandle = twitterPath ? `@${twitterPath.replace(/^@/, '')}` : '';

        // Location "City, Country" → locality / country
        const locationParts = String(contact.location || '').split(',').map(s => s.trim()).filter(Boolean);

        this.defaultConfig = {
            siteName: `${pi.name || 'Portfolio'} Portfolio`,
            siteUrl: sc.url || 'https://localhost',
            siteDescription: pi.summary || '',
            author: pi.name || '',
            headline: pi.headline || '',
            twitterHandle: twitterHandle,
            keywords: sc.keywords || [],
            language: sc.language || 'en',
            favicon: sc.favicon || 'assets/favicon.svg',
            person: {
                name: pi.name || '',
                jobTitle: pi.headline || '',
                description: pi.summary || '',
                url: sc.url || '',
                email: contact.email || '',
                telephone: contact.phone || '',
                address: {
                    '@type': 'PostalAddress',
                    'addressLocality': locationParts[0] || '',
                    'addressCountry': locationParts[locationParts.length - 1] || ''
                },
                sameAs: Object.values(socials).filter(Boolean).map(toUrl),
                knowsAbout: (resumeData.skills && Array.isArray(resumeData.skills.professional)) ? resumeData.skills.professional : []
            }
        };

        console.debug('[SEOOptimizer] initialized, config =', this.defaultConfig);
        this.isInitialized = true;
        return this.defaultConfig;
    }

    /**
     * +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Apply SEO for a page type to the live document (title, meta, OG, Twitter, JSON-LD)
     * Static tags in index.html are only a fallback for crawlers without JS; this overwrites them from resume data.
     * @param {string} pageType - Page type (resume, blog)
     * @returns {{success: boolean, error: string|null}}
     */
    applyToDocument(pageType) {
        try {
            if (!this.isInitialized) {
                throw new Error('SEOOptimizer is not initialized');
            }
            const config = this.defaultConfig;

            const title = this.generatePageTitle(pageType, {}, config);
            const description = this.generatePageDescription(pageType, {}, config);
            const keywords = this.generatePageKeywords(pageType, {}, config);
            const canonicalUrl = this.generateCanonicalUrl(pageType, {}, config);
            console.debug('[SEOOptimizer] applyToDocument', {pageType, title, description, canonicalUrl});

            // Upsert <meta> by attribute name/property
            const setMeta = (attr, key, content) => {
                let el = document.head.querySelector(`meta[${attr}="${key}"]`);
                if (!el) {
                    el = document.createElement('meta');
                    el.setAttribute(attr, key);
                    document.head.appendChild(el);
                }
                el.setAttribute('content', content);
            };

            document.title = title;
            setMeta('name', 'description', description);
            setMeta('name', 'keywords', keywords.join(', '));
            setMeta('name', 'author', config.author);

            setMeta('property', 'og:title', title);
            setMeta('property', 'og:description', description);
            setMeta('property', 'og:url', canonicalUrl);
            setMeta('property', 'og:site_name', config.siteName);

            setMeta('name', 'twitter:title', title);
            setMeta('name', 'twitter:description', description);
            if (config.twitterHandle) {
                setMeta('name', 'twitter:creator', config.twitterHandle);
            }

            let canonical = document.head.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', canonicalUrl);

            // Person JSON-LD
            let ld = document.getElementById('structured-data-person');
            if (!ld) {
                ld = document.createElement('script');
                ld.type = 'application/ld+json';
                ld.id = 'structured-data-person';
                document.head.appendChild(ld);
            }
            ld.textContent = JSON.stringify(this.createPersonSchema(config.person, 'https://schema.org'), null, 2);

            console.debug('[SEOOptimizer] document updated');
            return {success: true, error: null};
        } catch (error) {
            console.error('[SEOOptimizer] applyToDocument failed:', error.message);
            return {success: false, error: error.message};
        }
    }

    /**
     * Generates HTML meta tags for specific page type with SEO optimization
     * @param {string} pageType - Page type (home, resume, blog, article)
     * @param {object} pageData - Page-specific data
     * @param {object} siteConfig - Site configuration
     * @returns {{success: boolean, metaTags: string, error: string|null}}
     */
    generateMetaTags(pageType, pageData, siteConfig) {
        try {
            const config = {...this.defaultConfig, ...siteConfig};
            let metaTags = '';

            // Basic meta tags
            metaTags += this.generateBasicMetaTags(pageType, pageData, config);

            // SEO meta tags
            metaTags += this.generateSEOMetaTags(pageType, pageData, config);

            // Viewport and mobile optimization
            metaTags += this.generateViewportTags();

            return {
                success: true,
                metaTags: metaTags,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                metaTags: '',
                error: error.message
            };
        }
    }

    /**
     * Generate basic meta tags
     * @param {string} pageType - Page type
     * @param {object} pageData - Page data
     * @param {object} config - Site config
     * @returns {string}
     */
    generateBasicMetaTags(pageType, pageData, config) {
        const title = this.generatePageTitle(pageType, pageData, config);
        const description = this.generatePageDescription(pageType, pageData, config);
        const keywords = this.generatePageKeywords(pageType, pageData, config);

        return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="${keywords.join(', ')}">
    <meta name="author" content="${config.author}">
    <meta name="language" content="${config.language}">
    <link rel="canonical" href="${this.generateCanonicalUrl(pageType, pageData, config)}">
        `.trim();
    }

    /**
     * Generate SEO-specific meta tags
     * @param {string} pageType - Page type
     * @param {object} pageData - Page data
     * @param {object} config - Site config
     * @returns {string}
     */
    generateSEOMetaTags(pageType, pageData, config) {
        return `
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <meta name="theme-color" content="#ffffff">
    <link rel="icon" type="image/svg+xml" href="${config.favicon}">
        `.trim();
    }

    /**
     * Generate viewport and mobile optimization tags
     * @returns {string}
     */
    generateViewportTags() {
        return `
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
        `.trim();
    }

    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Generate page title from resume data (no hardcoding)
     * @param {string} pageType - Page type
     * @param {object} pageData - Page data
     * @param {object} config - Site config
     * @returns {string}
     */
    generatePageTitle(pageType, pageData, config) {
        switch (pageType) {
            case 'resume':
                // Format: "Resume - Name" (similar to blog)
                return `Resume - ${config.author}`;
            case 'blog':
                return `Blog - ${config.author}`;
            case 'article':
                return pageData.title ? `${pageData.title} - ${config.author}` : `Article - ${config.author}`;
            default:
                // Default to resume format
                return `Resume - ${config.author}`;
        }
    }

    /**
     * Generate page description based on type and data
     * @param {string} pageType - Page type
     * @param {object} pageData - Page data
     * @param {object} config - Site config
     * @returns {string}
     */
    generatePageDescription(pageType, pageData, config) {
        switch (pageType) {
            case 'resume':
                // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — headline from resume data instead of hardcoded text
                return `Professional resume of ${config.author}${config.headline ? `, ${config.headline}` : ''}. ${config.siteDescription}`.trim();
            case 'blog':
                return `Blog by ${config.author} covering enterprise architecture, system design, and modern development practices.`;
            case 'article':
                return pageData.description || pageData.summary || config.siteDescription;
            default:
                return config.siteDescription; // Default to main description
        }
    }

    /**
     * Generate page keywords based on type and data
     * @param {string} pageType - Page type
     * @param {object} pageData - Page data
     * @param {object} config - Site config
     * @returns {array}
     */
    generatePageKeywords(pageType, pageData, config) {
        const baseKeywords = [...config.keywords];

        switch (pageType) {
            case 'resume':
                return [...baseKeywords, 'resume', 'CV', 'professional experience', 'skills'];
            case 'blog':
                return [...baseKeywords, 'blog', 'articles', 'insights'];
            case 'article':
                const articleKeywords = pageData.tags || [];
                return [...baseKeywords, ...articleKeywords, 'technical article'];
            default:
                return [...baseKeywords, 'resume', 'CV', 'professional experience']; // Default to resume keywords
        }
    }

    /**
     * +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Fixed canonical: blog is the default section (root);
     * sections are hash routes (#resume) of ONE document and search engines ignore fragments,
     * so every section's canonical is the site root. Only articles have their own URL.
     * @param {string} pageType - Page type
     * @param {object} pageData - Page data
     * @param {object} config - Site config
     * @returns {string}
     */
    generateCanonicalUrl(pageType, pageData, config) {
        const root = `${String(config.siteUrl || '').replace(/\/+$/, '')}/`;
        let url;
        switch (pageType) {
            case 'article':
                url = pageData.permalink || `${root}articles/${pageData.slug}.html`;
                break;
            case 'blog':
            case 'resume':
            default:
                url = root;
        }
        console.debug('[SEOOptimizer] generateCanonicalUrl', pageType, '→', url);
        return url;
    }

    /**
     * Creates JSON-LD structured data markup for search engines
     * @param {string} schemaType - Schema type (Person, Article, WebSite, Organization)
     * @param {object} data - Data for structured markup
     * @param {string} context - Schema context URL
     * @returns {{success: boolean, structuredData: string, error: string|null}}
     */
    createStructuredData(schemaType, data, context = 'https://schema.org') {
        try {
            let structuredData = {};

            switch (schemaType) {
                case 'Person':
                    structuredData = this.createPersonSchema(data, context);
                    break;
                case 'Article':
                    structuredData = this.createArticleSchema(data, context);
                    break;
                case 'WebSite':
                    structuredData = this.createWebSiteSchema(data, context);
                    break;
                case 'Organization':
                    structuredData = this.createOrganizationSchema(data, context);
                    break;
                default:
                    throw new Error(`Unsupported schema type: ${schemaType}`);
            }

            const jsonLD = `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n</script>`;

            return {
                success: true,
                structuredData: jsonLD,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                structuredData: '',
                error: error.message
            };
        }
    }

    /**
     * Create Person schema
     * @param {object} data - Person data
     * @param {string} context - Schema context
     * @returns {object}
     */
    /**
     * +++===+++ 2025-11-26 UTC — Hasan Alizada — Removed hardcoded values, use data or defaults from config
     */
    createPersonSchema(data, context) {
        return {
            '@context': context,
            '@type': 'Person',
            'name': data.name || (this.defaultConfig ? this.defaultConfig.author : ''),
            'jobTitle': data.jobTitle || '',
            'description': data.description || (this.defaultConfig ? this.defaultConfig.siteDescription : ''),
            'url': data.url || (this.defaultConfig ? this.defaultConfig.siteUrl : ''),
            'email': data.email || '',
            'telephone': data.telephone || '',
            'address': data.address || {
                '@type': 'PostalAddress',
                'addressLocality': data.addressLocality || '',
                'addressCountry': data.addressCountry || ''
            },
            'sameAs': data.sameAs || [],
            'knowsAbout': data.knowsAbout || []
        };
    }

    /**
     * Create Article schema
     * @param {object} data - Article data
     * @param {string} context - Schema context
     * @returns {object}
     */
    createArticleSchema(data, context) {
        return {
            '@context': context,
            '@type': 'Article',
            'headline': data.headline || data.title,
            'description': data.description,
            'author': {
                '@type': 'Person',
                'name': data.author || (this.defaultConfig ? this.defaultConfig.author : '')
            },
            'datePublished': data.datePublished || data.date,
            'dateModified': data.dateModified || data.date,
            'wordCount': data.wordCount || 0,
            'url': data.url || data.permalink,
            'mainEntityOfPage': data.mainEntityOfPage || data.permalink
        };
    }

    /**
     * Create WebSite schema
     * @param {object} data - Website data
     * @param {string} context - Schema context
     * @returns {object}
     */
    createWebSiteSchema(data, context) {
        return {
            '@context': context,
            '@type': 'WebSite',
            'name': data.name || this.defaultConfig.siteName,
            'description': data.description || this.defaultConfig.siteDescription,
            'url': data.url || this.defaultConfig.siteUrl,
            'author': {
                '@type': 'Person',
                'name': data.author || this.defaultConfig.author
            },
            'inLanguage': data.language || this.defaultConfig.language
        };
    }

    /**
     * Create Organization schema
     * @param {object} data - Organization data
     * @param {string} context - Schema context
     * @returns {object}
     */
    createOrganizationSchema(data, context) {
        return {
            '@context': context,
            '@type': 'Organization',
            'name': data.name,
            'url': data.url,
            'description': data.description,
            'contactPoint': data.contactPoint || {}
        };
    }

    /**
     * Generates Open Graph and Twitter Card meta tags for social media sharing
     * @param {object} pageData - Page data
     * @param {object} socialConfig - Social media configuration
     * @returns {{success: boolean, socialTags: string, error: string|null}}
     */
    setSocialMediaTags(pageData, socialConfig) {
        try {
            const config = {...this.defaultConfig, ...socialConfig};
            let socialTags = '';

            // Open Graph tags
            socialTags += this.generateOpenGraphTags(pageData, config);

            // Twitter Card tags
            socialTags += this.generateTwitterCardTags(pageData, config);

            return {
                success: true,
                socialTags: socialTags,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                socialTags: '',
                error: error.message
            };
        }
    }

    /**
     * Generate Open Graph tags
     * @param {object} pageData - Page data
     * @param {object} config - Configuration
     * @returns {string}
     */
    generateOpenGraphTags(pageData, config) {
        const title = pageData.title || config.siteName;
        const description = pageData.description || config.siteDescription;
        const url = pageData.url || pageData.permalink || config.siteUrl;
        const image = pageData.image || config.defaultImage || `${config.siteUrl}/assets/og-image.jpg`;
        const type = pageData.type || (pageData.title ? 'article' : 'website');

        return `
    <!-- Open Graph Tags -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="${type}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:site_name" content="${config.siteName}">
    <meta property="og:locale" content="${config.language}_${config.language.toUpperCase()}">
        `.trim();
    }

    /**
     * Generate Twitter Card tags
     * @param {object} pageData - Page data
     * @param {object} config - Configuration
     * @returns {string}
     */
    generateTwitterCardTags(pageData, config) {
        const title = pageData.title || config.siteName;
        const description = pageData.description || config.siteDescription;
        const image = pageData.image || config.defaultImage || `${config.siteUrl}/assets/twitter-card.jpg`;

        return `
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${config.twitterHandle || ''}">
    <meta name="twitter:creator" content="${config.twitterHandle || ''}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
        `.trim();
    }

    /**
     * Creates SEO-optimized page titles with proper length and keywords
     * @param {string} baseTitle - Base title
     * @param {string} pageType - Page type
     * @param {string} additionalContext - Additional context
     * @returns {{success: boolean, optimizedTitle: string, error: string|null}}
     */
    optimizePageTitles(baseTitle, pageType, additionalContext = '') {
        try {
            let optimizedTitle = baseTitle;
            const maxLength = 60; // Google's recommended title length

            // Add context based on page type
            if (pageType && additionalContext) {
                optimizedTitle = `${baseTitle} - ${additionalContext}`;
            }

            // Truncate if too long
            if (optimizedTitle.length > maxLength) {
                optimizedTitle = optimizedTitle.substring(0, maxLength - 3) + '...';
            }

            // Ensure it ends with site branding for non-home pages
            // +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — brand from resume data instead of hardcoded name
            const brand = (this.defaultConfig && this.defaultConfig.author) || '';
            if (brand && pageType !== 'home' && !optimizedTitle.includes(brand)) {
                const brandSuffix = ` - ${brand}`;
                if (optimizedTitle.length + brandSuffix.length <= maxLength) {
                    optimizedTitle += brandSuffix;
                }
            }

            return {
                success: true,
                optimizedTitle: optimizedTitle,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                optimizedTitle: baseTitle,
                error: error.message
            };
        }
    }

    /**
     * Generates XML sitemap for search engine crawling
     * @param {array} pages - Array of page objects
     * @param {string} siteUrl - Base site URL
     * @returns {{success: boolean, sitemapXml: string, error: string|null}}
     */
    generateSitemap(pages, siteUrl) {
        try {
            const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

            const urls = pages.map(page => {
                const url = page.url.startsWith('http') ? page.url : `${siteUrl}${page.url}`;
                const lastmod = page.lastModified ? new Date(page.lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                const changefreq = page.changeFrequency || 'weekly';
                const priority = page.priority || '0.5';

                return `    <url>
        <loc>${url}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>`;
            }).join('\n');

            const footer = '</urlset>';
            const sitemapXml = `${header}\n${urls}\n${footer}`;

            return {
                success: true,
                sitemapXml: sitemapXml,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                sitemapXml: '',
                error: error.message
            };
        }
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOOptimizer;
} else {
    window.SEOOptimizer = SEOOptimizer;
}