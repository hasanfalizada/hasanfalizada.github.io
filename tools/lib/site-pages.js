// +++===+++ 2026-11-09 Asia/Baku — Hasan Alizada — Shared rendering for the static site pages (no npm, no external services).
// Single place for the menu, brand, footer and the pages built from site_pages in data/resume.json.
// Used by tools/build-static.js, tools/build-pages.js, tools/build-articles.js and tools/check-site.js.
//
// Switches:
//   Services — site_pages.services.to_render: false removes the page, its menu item and every link to it.
//   Work     — appears by itself once any group in site_pages.work.groups has an item, hidden while all are empty.
// Work item format (fields except name and role are optional; the role must be exact):
//   {"name": "...", "url": "https://...", "role": "...", "context": "...", "decisions": "...",
//    "personal": "what I did myself", "team": "what the team did", "result": "result in numbers"}

'use strict';

const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const workItems = (data) => ((((data.site_pages || {}).work || {}).groups) || [])
    .reduce((n, g) => n + ((g.items || []).length), 0);

const isEnabled = (data) => ({
    services: !!(data.site_pages || {}).services,
    work: workItems(data) > 0
});

// href values are relative to the site root: every page outside the root sets <base href="../">
// active: 'blog-home' on index.html (section link handled by main.js), 'blog' on article pages, otherwise a page id
const nav = (data, active) => {
    const on = isEnabled(data);
    const blog = active === 'blog-home'
        ? '<a href="#blog" class="nav-link active" data-section="blog">Blog</a>'
        : `<a href="./" class="nav-link${active === 'blog' ? ' active' : ''}">Blog</a>`;
    const link = (id, label, enabled) => (enabled
        ? [`<a href="${id}/" class="nav-link${active === id ? ' active' : ''}"${active === id ? ' aria-current="page"' : ''}>${label}</a>`]
        : []);
    return [
        blog,
        ...link('work', 'Work', on.work),
        ...link('services', 'Services', on.services),
        '<a href="#" id="download-pdf-btn" class="nav-link" title="Download resume (PDF)">Resume</a>'
    ];
};

// tag: h1 on the home page, p elsewhere (those pages have their own h1)
const brand = (data, tag = 'p') => {
    const pi = data.personal_info || {};
    return [
        '<a href="./" class="brand-link">',
        `    <${tag} class="brand-name">${esc(pi.name)}</${tag}>`,
        `    <p class="brand-title">${esc(pi.headline)}</p>`,
        '</a>'
    ];
};

// main.js replaces the first <p> with the same text plus the current year
const footer = (data) => {
    const pi = data.personal_info || {};
    const email = (pi.contact || {}).email;
    return [
        `<p>&copy; ${esc(pi.name)}. All rights reserved.</p>`,
        `<p class="footer-links">${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a> · ` : ''}<a href="privacy/">Privacy</a> · <a href="#" class="cookie-settings-link" onclick="window.openCookieSettings(); return false;">Cookie settings</a></p>`
    ];
};

const listOf = (items) => `<ul class="page-list">${(items || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;

const renderServices = (data) => {
    const s = data.site_pages.services;
    const email = ((data.personal_info || {}).contact || {}).email;
    const offers = (s.offers || []).map(o => `<section class="page-block">
                <h2>${esc(o.name)}</h2>
                <p class="page-block__summary">${esc(o.summary)}</p>
                <p>${esc(o.fit)}</p>
                ${listOf(o.includes)}
            </section>`).join('\n            ');
    return `<h1>${esc(s.title)}</h1>
            <p class="page-lead">${esc(s.manifesto)}</p>
            ${offers}
            <section class="page-block">
                <h2>${esc(s.direct_title)}</h2>
                <p>${esc(s.direct)}</p>
            </section>
            <section class="page-block">
                <h2>${esc(s.not_do_title)}</h2>
                ${listOf(s.not_do)}
            </section>
            <section class="page-block page-cta">
                <p>${esc(s.cta_text)}</p>
                <a class="page-button" href="mailto:${esc(email)}?subject=${encodeURIComponent(s.cta_subject)}">${esc(s.cta_label)}</a>
            </section>`;
};

const renderWork = (data) => {
    const w = data.site_pages.work;
    const field = (label, value) => (value ? `<p><strong>${label}:</strong> ${esc(value)}</p>` : '');
    const item = (i) => `<article class="work-item">
                    <h3>${i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.name)}</a>` : esc(i.name)}</h3>
                    ${field('Role', i.role)}
                    ${field('Context', i.context)}
                    ${field('Decisions', i.decisions)}
                    ${field('What I did', i.personal)}
                    ${field('What the team did', i.team)}
                    ${field('Result', i.result)}
                </article>`;
    const groups = (w.groups || []).filter(g => (g.items || []).length).map(g => `<section class="page-block">
                <h2>${esc(g.title)}</h2>
                ${g.items.map(item).join('\n                ')}
            </section>`).join('\n            ');
    return `<h1>${esc(w.title)}</h1>
            ${groups}`;
};

const renderPrivacy = (data) => {
    const p = data.site_pages.privacy;
    const email = ((data.personal_info || {}).contact || {}).email;
    const sections = (p.sections || []).map(s => `<section class="page-block">
                <h2>${esc(s.heading)}</h2>
                <p>${esc(s.text)}</p>
            </section>`).join('\n            ');
    return `<h1>${esc(p.title)}</h1>
            ${sections}
            <p class="page-note"><a href="mailto:${esc(email)}">${esc(email)}</a> · Last updated ${esc(data.site_pages.updated)}</p>`;
};

// sitemap: null keeps a page out of sitemap.xml and marks it noindex
const pageDefs = (data) => {
    const on = isEnabled(data);
    return [
        ...(on.work ? [{id: 'work', sitemap: '0.8', render: renderWork}] : []),
        ...(on.services ? [{id: 'services', sitemap: '0.8', render: renderServices}] : []),
        {id: 'privacy', sitemap: null, render: renderPrivacy}
    ];
};

const ALL_PAGE_IDS = ['work', 'services', 'privacy'];

const sitemapPages = (data) => pageDefs(data).filter(p => p.sitemap)
    .map(p => ({path: `${p.id}/`, priority: p.sitemap}));

const shell = (data, def, version) => {
    const pi = data.personal_info || {};
    const conf = data.site_pages[def.id];
    const site = String((data.site_config || {}).url || '').replace(/\/+$/, '');
    const v = version ? `?v=${encodeURIComponent(version)}` : '';
    const url = `${site}/${def.id}/`;
    const title = `${conf.title} - ${pi.name}`;
    const indent = (lines, n) => lines.map(l => ' '.repeat(n) + l).join('\n');
    return `<!DOCTYPE html>
<html lang="en">
<!-- GENERATED by tools/build-pages.js from site_pages in data/resume.json — do not edit by hand -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="../">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(conf.description)}">
    <meta name="author" content="${esc(pi.name)}">
${def.sitemap ? '' : '    <meta name="robots" content="noindex">\n'}    <link rel="canonical" href="${esc(url)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(conf.description)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${esc(url)}">
    <meta property="og:site_name" content="${esc(pi.name)}">
    <meta property="og:image" content="${esc(site)}/assets/og-image.jpg">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(conf.description)}">
    <meta name="twitter:image" content="${esc(site)}/assets/og-image.jpg">
    <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
    <link rel="stylesheet" href="assets/css/main.css${v}">
    <script src="assets/js/consent.js${v}"></script>
</head>

<body data-page="static">

<header id="header" class="header" role="banner">
    <div class="container">
        <nav class="navigation" role="navigation" aria-label="Main navigation">
            <div class="nav-brand">
${indent(brand(data), 16)}
            </div>
            <div class="nav-center">
                <div class="social-links"></div>
            </div>
            <div class="nav-links">
${indent(nav(data, def.id), 16)}
            </div>
        </nav>
    </div>
</header>

<main id="main-content" role="main">
    <section id="${def.id}" class="section active">
        <div class="container">
            <div class="page-content">
            ${def.render(data)}
            </div>
        </div>
    </section>
</main>

<footer id="footer" class="footer" role="contentinfo">
    <div class="container">
        <div class="footer-content">
            <div class="footer-text">
${indent(footer(data), 16)}
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

// Pure: returns [{path, html}], so tools/check-site.js can test switches without touching the disk
const renderPages = (data, version) => pageDefs(data)
    .map(def => ({path: `${def.id}/index.html`, html: shell(data, def, version)}));

module.exports = {esc, isEnabled, nav, brand, footer, renderPages, sitemapPages, ALL_PAGE_IDS};
