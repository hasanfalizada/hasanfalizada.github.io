#!/usr/bin/env node
// +++===+++ 2026-10-09 Asia/Baku — Hasan Alizada — Static article builder (no npm, no external services, works on any host).
//
// Single source of an article = articles/<slug>.md (front matter + Markdown). This script generates:
//   1) articles/<slug>.html — complete static page (text, title, description, canonical, Open Graph, JSON-LD) readable
//      by every robot without JS; main.js on it only fills header icons, footer year and the Resume button
//   2) articles/index.json  — article list for the blog page, built from the front matter of all .md files
//   3) sitemap.xml          — site root + every article
// Uses the project's own code: BlogRenderer (front matter parsing + Markdown rendering), local marked.js,
// ResumeDataLoader.filterRenderable (name/headline from data/resume.json). Version (?v=) is read from index.html.
//
// Usage (from the repository root, after adding or editing any article):
//     node tools/build-articles.js

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const rel = (...p) => path.join(ROOT, ...p);
const log = (...a) => console.log('[build-articles]', ...a);

// ---------- project code ----------
global.marked = require(rel('assets/js/marked.min.js'));
const BlogRenderer = require(rel('atoms/blog-renderer/impl.js'));
const ResumeDataLoader = require(rel('atoms/resume-data-loader/impl.js'));
console.debug = () => {}; // silence atoms' debug logging in CLI output

const renderer = new BlogRenderer();
const resume = new ResumeDataLoader().filterRenderable(JSON.parse(fs.readFileSync(rel('data/resume.json'), 'utf8')));
const pi = resume.personal_info || {};
const AUTHOR = pi.name || '';
const HEADLINE = pi.headline || '';
const SITE_URL = String((resume.site_config || {}).url || '').replace(/\/+$/, '');
log('author =', AUTHOR, '| headline =', HEADLINE, '| site =', SITE_URL);

// Version: ?v= of main.js in index.html (the single place it is bumped)
const indexHtml = fs.readFileSync(rel('index.html'), 'utf8');
const vMatch = indexHtml.match(/assets\/js\/main\.js\?v=([^"']+)/);
const VERSION = vMatch ? vMatch[1] : '';
log('version (from index.html) =', VERSION || '(none)');

const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const v = VERSION ? `?v=${encodeURIComponent(VERSION)}` : '';
const asArray = (x) => Array.isArray(x) ? x : (x ? [x] : []);

// ---------- read articles ----------
const files = fs.readdirSync(rel('articles')).filter(f => f.endsWith('.md')).sort();
log('markdown files:', files.join(', ') || '(none)');

const articles = files.map(file => {
    const raw = fs.readFileSync(rel('articles', file), 'utf8').replace(/\r\n/g, '\n');
    const {content, metadata: fm} = renderer.extractFrontmatter(raw);
    const slug = String(fm.slug || path.basename(file, '.md'));
    if (!/^[a-z0-9-]+$/i.test(slug)) throw new Error(`${file}: invalid slug "${slug}"`);
    if (!fm.title) throw new Error(`${file}: front matter "title" is required`);
    if (!fm.date) throw new Error(`${file}: front matter "date" is required`);

    const rendered = renderer.renderMarkdown(raw);
    if (!rendered.success) throw new Error(`${file}: ${rendered.error}`);

    const words = content.replace(/[#*_`>\-\[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
    const article = {
        title: String(fm.title),
        slug,
        filename: file,
        path: `articles/${file}`,
        date: String(fm.date),
        author: String(fm.author || AUTHOR),
        tags: asArray(fm.tags).map(String),
        description: String(fm.description || ''),
        readingTime: Number(fm.readingTime) || Math.max(1, Math.ceil(words / 200)),
        wordCount: Number(fm.wordCount) || words,
        permalink: `articles/${slug}.html`
    };
    log(`parsed ${file}:`, JSON.stringify({slug, title: article.title, date: article.date, tags: article.tags}));
    return {article, html: rendered.htmlContent};
});
articles.sort((a, b) => new Date(b.article.date) - new Date(a.article.date));

// ---------- 1) static article pages ----------
const formatDate = (d) => renderer.formatDate(d);
const pageFor = ({article: a, html}) => {
    const url = `${SITE_URL}/${a.permalink}`;
    const pageTitle = `${a.title} - ${AUTHOR}`;
    const meta = `<div class="article-meta">
                <span class="article-date">${esc(formatDate(a.date))}</span>
                <span class="article-reading-time">${a.readingTime} min read</span>
                ${a.tags.length ? `<div class="article-tags">${a.tags.map(t => `<span class="article-tag">${esc(t)}</span>`).join('')}</div>` : ''}
            </div>`;
    // date · reading time and tags right under the article's own H1 (same as the dynamic page)
    const body = /<\/h1>/i.test(html) ? html.replace(/<\/h1>/i, `</h1>\n            ${meta}`) : `${meta}\n${html}`;
    const ld = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: a.title,
        description: a.description,
        datePublished: a.date,
        dateModified: a.date,
        author: {'@type': 'Person', name: a.author, url: SITE_URL},
        mainEntityOfPage: url,
        url,
        keywords: a.tags.join(', '),
        wordCount: a.wordCount
    };
    return `<!DOCTYPE html>
<html lang="en">
<!--
GENERATED by tools/build-articles.js from ${a.path} — do not edit by hand; edit the .md and run: node tools/build-articles.js
-->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- all relative URLs (styles, scripts, data, logos, links) resolve from the site root -->
    <base href="../">
    <title>${esc(pageTitle)}</title>
    <meta name="description" content="${esc(a.description)}">
    <meta name="keywords" content="${esc(a.tags.join(', '))}">
    <meta name="author" content="${esc(a.author)}">
    <link rel="canonical" href="${esc(url)}">
    <link rel="alternate" type="text/markdown" href="${esc(a.path)}" title="Source (Markdown)">

    <meta property="og:title" content="${esc(a.title)}">
    <meta property="og:description" content="${esc(a.description)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${esc(url)}">
    <meta property="og:site_name" content="${esc(AUTHOR)}">
    <meta property="og:image" content="${esc(SITE_URL)}/assets/og-image.jpg">
    <meta property="article:published_time" content="${esc(a.date)}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${esc(a.title)}">
    <meta name="twitter:description" content="${esc(a.description)}">
    <meta name="twitter:image" content="${esc(SITE_URL)}/assets/og-image.jpg">

    <script type="application/ld+json">
${JSON.stringify(ld, null, 4).split('\n').map(l => '        ' + l).join('\n')}
    </script>

    <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
    <link rel="stylesheet" href="assets/css/main.css${v}">
</head>

<body data-page="article-static">

<header id="header" class="header" role="banner">
    <div class="container">
        <nav class="navigation" role="navigation" aria-label="Main navigation">
            <div class="nav-brand">
                <p class="brand-name">${esc(AUTHOR)}</p>
                <p class="brand-title">${esc(HEADLINE)}</p>
            </div>
            <div class="nav-center">
                <div class="social-links"></div>
            </div>
            <div class="nav-links">
                <a href="./" class="nav-link active">Blog</a>
                <a href="#" id="download-pdf-btn" class="nav-link" title="Download resume (PDF)">Resume</a>
            </div>
        </nav>
    </div>
</header>

<main id="main-content" role="main">
    <section id="article" class="section active">
        <div class="container">
            <article class="article-content">
            <a class="article-back" href="./">← All articles</a>
            ${body}
            </article>
        </div>
    </section>
</main>

<footer id="footer" class="footer" role="contentinfo">
    <div class="container">
        <div class="footer-content">
            <div class="footer-text">
                <p>&copy; ${esc(AUTHOR)}. All rights reserved.</p>
            </div>
        </div>
    </div>
</footer>

<script src="assets/js/main.js${v}" defer></script>
<script>
    document.addEventListener('DOMContentLoaded', function () {
        const init = () => (window.App ? window.App.initialize() : setTimeout(init, 100));
        init();
    });
</script>
</body>
</html>
`;
};

articles.forEach(item => {
    const out = rel(item.article.permalink);
    fs.writeFileSync(out, pageFor(item), 'utf8');
    log('written', path.relative(ROOT, out));
});

// ---------- 2) articles/index.json ----------
const indexPath = rel('articles/index.json');
const prevIndex = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};
const list = articles.map(x => x.article);
const index = {
    articles: list,
    metadata: {
        lastUpdated: list.length ? list[0].date : '',
        totalArticles: list.length,
        categories: [...new Set(list.flatMap(a => a.tags))],
        notes: 'GENERATED by tools/build-articles.js from articles/*.md front matter — do not edit by hand'
    }
};
fs.writeFileSync(indexPath, JSON.stringify(index, null, 4) + '\n', 'utf8');
log('written articles/index.json:', list.length, 'article(s)', prevIndex.articles ? `(was ${prevIndex.articles.length})` : '');

// ---------- 3) sitemap.xml ----------
const sitemapPath = rel('sitemap.xml');
const prevSitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
const rootLastmod = (prevSitemap.match(new RegExp(`<loc>${SITE_URL}/</loc>\\s*<lastmod>([^<]+)</lastmod>`)) || [])[1]
    || new Date().toISOString().slice(0, 10);
const urlEntry = (loc, lastmod, changefreq, priority) => `    <url>
        <loc>${esc(loc)}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[urlEntry(`${SITE_URL}/`, rootLastmod, 'monthly', '1.0'),
   ...list.map(a => urlEntry(`${SITE_URL}/${a.permalink}`, a.date, 'yearly', '0.6'))].join('\n')}
</urlset>
`;
fs.writeFileSync(sitemapPath, sitemap, 'utf8');
log('written sitemap.xml:', 1 + list.length, 'url(s)');
log('done');
