// +++===+++ 2025-08-26 16:30 UTC — Hasan Alizada — Blog Renderer atom implementation - Complete rewrite

class BlogRenderer {
    constructor() {
        this.articlesCache = new Map();
        this.articlesListCache = null;
        this.baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
    }

    /**
     * Loads list of available articles from articles directory
     * @returns {Promise<{success: boolean, articles: array, error: string|null}>}
     */
    async loadArticleList() {
        if (this.articlesListCache) {
            return {
                success: true,
                articles: this.articlesListCache,
                error: null
            };
        }

        try {
            // Try to load articles index
            const articlesIndex = await this.loadArticlesIndex();
            let articles;

            if (articlesIndex && articlesIndex.articles) {
                articles = articlesIndex.articles.map(article => this.enrichArticleMetadata(article));
            } else {
                articles = this.getManualArticlesList();
            }

            // Sort by date (newest first)
            articles.sort((a, b) => new Date(b.date) - new Date(a.date));

            this.articlesListCache = articles;

            return {
                success: true,
                articles: articles,
                error: null
            };

        } catch (error) {
            // Fallback to manual list
            const articles = this.getManualArticlesList();
            this.articlesListCache = articles;

            return {
                success: true,
                articles: articles,
                error: `Error loading articles: ${error.message}`
            };
        }
    }

    /**
     * Load articles index file
     * @returns {Promise<object|null>}
     */
    async loadArticlesIndex() {
        try {
            const response = await fetch('articles/index.json');
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    /**
     * Get manual articles list (fallback)
     * @returns {array}
     */
    getManualArticlesList() {
        return [
            {
                title: 'Welcome to My Technical Blog',
                slug: 'welcome',
                filename: 'welcome.md',
                path: 'articles/welcome.md',
                date: '2025-08-26',
                author: 'Hasan Alizada',
                tags: ['welcome', 'introduction'],
                description: 'Welcome to my technical blog where I share insights about enterprise architecture, system design, and modern development practices.',
                readingTime: 2,
                wordCount: 300,
                permalink: `${this.baseUrl}/articles/welcome.html`
            }
        ];
    }

    /**
     * Enrich article metadata with additional information
     * @param {object} article - Basic article metadata
     * @returns {object}
     */
    enrichArticleMetadata(article) {
        if (!article.permalink) {
            article.permalink = `${this.baseUrl}/articles/${article.slug}.html`;
        }
        if (!article.readingTime && article.wordCount) {
            article.readingTime = Math.ceil(article.wordCount / 200);
        }
        if (!article.author) {
            article.author = 'Hasan Alizada';
        }
        if (!Array.isArray(article.tags)) {
            article.tags = [];
        }
        return article;
    }

    /**
     * Converts markdown content to HTML with metadata extraction
     * @param {string} markdownContent - Raw markdown content
     * @param {object} options - Markdown rendering options
     * @returns {{success: boolean, htmlContent: string, metadata: object, error: string|null}}
     */
    renderMarkdown(markdownContent, options = {}) {
        try {
            if (typeof marked === 'undefined') {
                throw new Error('Marked.js library not loaded');
            }

            // Configure marked
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
                mangle: false
            });

            // Extract frontmatter
            const { content, metadata } = this.extractFrontmatter(markdownContent);

            // Render to HTML
            const htmlContent = marked.parse(content);

            // Enhance HTML
            const enhancedHtml = this.enhanceHtml(htmlContent, options);

            return {
                success: true,
                htmlContent: enhancedHtml,
                metadata: metadata,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                htmlContent: '',
                metadata: {},
                error: error.message
            };
        }
    }

    /**
     * Extract frontmatter metadata from markdown content
     * @param {string} content - Raw markdown content
     * @returns {{content: string, metadata: object}}
     */
    extractFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            return { content, metadata: {} };
        }

        try {
            const frontmatterStr = match[1];
            const mainContent = match[2];
            const metadata = {};

            frontmatterStr.split('\n').forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();

                    if (value.includes(',')) {
                        metadata[key] = value.split(',').map(v => v.trim());
                    } else {
                        metadata[key] = value.replace(/^["']|["']$/g, '');
                    }
                }
            });

            return { content: mainContent, metadata };
        } catch (error) {
            return { content, metadata: {} };
        }
    }

    /**
     * Enhance HTML with additional features
     * @param {string} html - Rendered HTML content
     * @param {object} options - Enhancement options
     * @returns {string}
     */
    enhanceHtml(html, options) {
        let enhancedHtml = html;

        // Make external links open in new tabs
        enhancedHtml = enhancedHtml.replace(
            /<a href="(https?:\/\/[^"]+)"/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer"'
        );

        // Add responsive classes to images
        enhancedHtml = enhancedHtml.replace(
            /<img/g,
            '<img class="article-image"'
        );

        return enhancedHtml;
    }

    /**
     * Generates HTML links for article list with proper styling
     * @param {array} articles - Array of article metadata
     * @param {object} sortOptions - Sorting and filtering options
     * @returns {{success: boolean, htmlLinks: string, error: string|null}}
     */
    generateArticleLinks(articles, sortOptions = {}) {
        try {
            const options = {
                sortBy: 'date',
                sortOrder: 'desc',
                filterTags: [],
                ...sortOptions
            };

            // Filter by tags if specified
            let filteredArticles = articles;
            if (options.filterTags.length > 0) {
                filteredArticles = articles.filter(article =>
                    options.filterTags.some(tag => article.tags.includes(tag))
                );
            }

            // Sort articles
            filteredArticles.sort((a, b) => {
                let aValue = a[options.sortBy];
                let bValue = b[options.sortBy];

                if (options.sortBy === 'date') {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                return options.sortOrder === 'desc' ?
                    (bValue > aValue ? 1 : -1) :
                    (aValue > bValue ? 1 : -1);
            });

            // Generate HTML
            const htmlLinks = filteredArticles.map(article => `
                <div class="article-card" data-url="${article.permalink}" data-slug="${article.slug}">
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-meta">
                        <span class="article-date">${this.formatDate(article.date)}</span>
                        ${article.readingTime ? `<span class="article-reading-time">${article.readingTime} min read</span>` : ''}
                        ${article.tags.length > 0 ? `
                        <div class="article-tags">
                            ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
                        </div>` : ''}
                    </div>
                    <p class="article-description">${article.description || 'No description available.'}</p>
                </div>
            `).join('');

            const result = `<div class="articles-list">${htmlLinks}</div>`;

            return {
                success: true,
                htmlLinks: result,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                htmlLinks: '',
                error: error.message
            };
        }
    }

    /**
     * Format date for display
     * @param {string} dateStr - Date string
     * @returns {string}
     */
    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateStr;
        }
    }

    /**
     * Opens article in new tab with permanent URL
     * @param {string} articleUrl - Article URL
     * @param {string} articleSlug - Article slug (optional)
     * @returns {{success: boolean, error: string|null}}
     */
    openArticleInNewTab(articleUrl, articleSlug = '') {
        try {
            window.open(articleUrl, '_blank', 'noopener,noreferrer');
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
     * Loads markdown content from specific article file
     * @param {string} articlePath - Path to article file
     * @returns {Promise<{success: boolean, content: string, metadata: object, error: string|null}>}
     */
    async loadArticleContent(articlePath) {
        // Check cache first
        if (this.articlesCache.has(articlePath)) {
            return this.articlesCache.get(articlePath);
        }

        try {
            const response = await fetch(articlePath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch article`);
            }

            const markdownContent = await response.text();
            const renderResult = this.renderMarkdown(markdownContent);

            if (!renderResult.success) {
                throw new Error(renderResult.error);
            }

            const result = {
                success: true,
                content: renderResult.htmlContent,
                metadata: renderResult.metadata,
                error: null
            };

            // Cache the result
            this.articlesCache.set(articlePath, result);

            return result;

        } catch (error) {
            return {
                success: false,
                content: '',
                metadata: {},
                error: error.message
            };
        }
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.articlesCache.clear();
        this.articlesListCache = null;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogRenderer;
} else {
    window.BlogRenderer = BlogRenderer;
}
