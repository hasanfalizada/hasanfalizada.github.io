// +++===+++ 2025-08-26 16:30 UTC — Hasan Alizada — SEO Optimizer atom implementation

class SEOOptimizer {
    constructor() {
        this.defaultConfig = {
            siteName: 'Hasan Alizada Portfolio',
            siteUrl: 'https://hasanfalizada.github.io',
            siteDescription: 'Technology Principal with extensive experience in scalable and fault-tolerant architectures',
            author: 'Hasan Alizada',
            keywords: ['technology principal', 'TOGAF', 'hasan alizada', 'IT architecture', 'system design'],
            language: 'en',
            favicon: 'assets/favicon.svg'
        };
        console.log('+++===+++ SEOOptimizer initialized');
    }

    /**
     * Generates HTML meta tags for specific page type with SEO optimization
     * @param {string} pageType - Page type (home, resume, blog, article)
     * @param {object} pageData - Page-specific data
     * @param {object} siteConfig - Site configuration
     * @returns {{success: boolean, metaTags: string, error: string|null}}
     */
    generateMetaTags(pageType, pageData, siteConfig) {
        console.log(`+++===+++ Generating meta tags for page type: ${pageType}`);

        try {
            const config = {...this.defaultConfig, ...siteConfig};
            let metaTags = '';

            // Basic meta tags
            metaTags += this.generateBasicMetaTags(pageType, pageData, config);

            // SEO meta tags
            metaTags += this.generateSEOMetaTags(pageType, pageData, config);

            // Viewport and mobile optimization
            metaTags += this.generateViewportTags();

            console.log('+++===+++ Meta tags generated successfully');
            return {
                success: true,
                metaTags: metaTags,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error generating meta tags:', error);
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
     * Generate page title based on type and data
     * @param {string} pageType - Page type
     * @param {object} pageData - Page data
     * @param {object} config - Site config
     * @returns {string}
     */
    generatePageTitle(pageType, pageData, config) {
        switch (pageType) {
            case 'resume':
                return `${config.author} - Technology Principal | TOGAF®, PMP®, ITIL®, OCP®`;
            case 'blog':
                return `Technical Blog - ${config.author}`;
            case 'article':
                return pageData.title ? `${pageData.title} - ${config.author}` : `Article - ${config.author}`;
            default:
                return `${config.author} - Technology Principal | TOGAF®, PMP®, ITIL®, OCP®`; // Default to resume
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
                return `Professional resume of ${config.author}, Technology Principal with expertise in TOGAF, system design, and digital transformation.`;
            case 'blog':
                return `Technical blog by ${config.author} covering enterprise architecture, system design, and modern development practices.`;
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
                return [...baseKeywords, 'technical blog', 'articles', 'insights'];
            case 'article':
                const articleKeywords = pageData.tags || [];
                return [...baseKeywords, ...articleKeywords, 'technical article'];
            default:
                return [...baseKeywords, 'resume', 'CV', 'professional experience']; // Default to resume keywords
        }
    }

    /**
     * Generate canonical URL
     * @param {string} pageType - Page type
     * @param {object} pageData - Page data
     * @param {object} config - Site config
     * @returns {string}
     */
    generateCanonicalUrl(pageType, pageData, config) {
        switch (pageType) {
            case 'resume':
                return config.siteUrl; // Resume is now the root
            case 'blog':
                return `${config.siteUrl}#blog`;
            case 'article':
                return pageData.permalink || `${config.siteUrl}/articles/${pageData.slug}.html`;
            default:
                return config.siteUrl; // Default to root (resume)
        }
    }

    /**
     * Creates JSON-LD structured data markup for search engines
     * @param {string} schemaType - Schema type (Person, Article, WebSite, Organization)
     * @param {object} data - Data for structured markup
     * @param {string} context - Schema context URL
     * @returns {{success: boolean, structuredData: string, error: string|null}}
     */
    createStructuredData(schemaType, data, context = 'https://schema.org') {
        console.log(`+++===+++ Creating structured data for schema type: ${schemaType}`);

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

            console.log('+++===+++ Structured data created successfully');
            return {
                success: true,
                structuredData: jsonLD,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error creating structured data:', error);
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
    createPersonSchema(data, context) {
        return {
            '@context': context,
            '@type': 'Person',
            'name': data.name || 'Hasan Alizada',
            'jobTitle': data.jobTitle || 'Technology Principal',
            'description': data.description || this.defaultConfig.siteDescription,
            'url': data.url || this.defaultConfig.siteUrl,
            'email': data.email || 'ha@hasanalizada.net',
            'telephone': data.telephone || '+994702011302',
            'address': {
                '@type': 'PostalAddress',
                'addressLocality': data.addressLocality || 'Baku',
                'addressCountry': data.addressCountry || 'Azerbaijan'
            },
            'sameAs': data.sameAs || [
                'https://linkedin.com/in/hasanalizada',
                'https://twitter.com/hasanfalizada',
                'https://github.com/hasanfalizada'
            ],
            'knowsAbout': data.knowsAbout || [
                'Enterprise Architecture',
                'TOGAF',
                'System Design',
                'Java Development',
                'Spring Boot',
                'Microservices',
                'Cloud Architecture'
            ]
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
                'name': data.author || 'Hasan Alizada'
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
        console.log('+++===+++ Generating social media meta tags');

        try {
            const config = {...this.defaultConfig, ...socialConfig};
            let socialTags = '';

            // Open Graph tags
            socialTags += this.generateOpenGraphTags(pageData, config);

            // Twitter Card tags
            socialTags += this.generateTwitterCardTags(pageData, config);

            console.log('+++===+++ Social media tags generated successfully');
            return {
                success: true,
                socialTags: socialTags,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error generating social media tags:', error);
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
    <meta name="twitter:site" content="@hasanfalizada">
    <meta name="twitter:creator" content="@hasanfalizada">
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
        console.log(`+++===+++ Optimizing page title: ${baseTitle}`);

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
            if (pageType !== 'home' && !optimizedTitle.includes('Hasan Alizada')) {
                const brandSuffix = ' - Hasan Alizada';
                if (optimizedTitle.length + brandSuffix.length <= maxLength) {
                    optimizedTitle += brandSuffix;
                }
            }

            console.log(`+++===+++ Title optimized: ${optimizedTitle}`);
            return {
                success: true,
                optimizedTitle: optimizedTitle,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error optimizing title:', error);
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
        console.log(`+++===+++ Generating sitemap for ${pages.length} pages`);

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

            console.log('+++===+++ Sitemap generated successfully');
            return {
                success: true,
                sitemapXml: sitemapXml,
                error: null
            };

        } catch (error) {
            console.error('+++===+++ Error generating sitemap:', error);
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