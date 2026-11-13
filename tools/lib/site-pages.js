// +++===+++ 2026-11-09 Asia/Baku — Hasan Alizada — Shared rendering for the static site pages (no npm, no external services).
// Single place for the menu, brand, footer and the pages built from site_pages in data/resume.json.
// Used by tools/build-static.js, tools/build-pages.js, tools/build-articles.js and tools/check-site.js.
//
// Switches:
//   Services — site_pages.services.to_render: false removes the page, its menu item and every link to it.
//   Work     — appears by itself once any group in site_pages.work.groups has an item, hidden while all are empty.
// +++===+++ 2026-11-13 21:30 Asia/Baku — Hasan Alizada — Work items are cards; Role, Decisions, What I did and Result removed by his decision
// Work item format (only name is required):
//   {"name": "...", "url": "https://... (source)", "demo": "https://... (live demo)",
//    "logo": "assets/img/projects/<name>.svg (shown instead of the name)", "context": "one or two sentences",
//    "stack": [{"name": "TypeScript", "icon": "typescript"}, ...], "team": "what the team did"}
//   icon = file name in assets/img/stack/ without .svg (Simple Icons 16.37.0, CC0, brand colour added as fill);
//   icons show without text, the name is in alt and title

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
    const stack = (list) => ((list || []).length ? `<ul class="work-stack" aria-label="Technology stack">${list.map(t => `<li><img src="assets/img/stack/${esc(t.icon)}.svg" alt="${esc(t.name)}" title="${esc(t.name)}" width="36" height="36" loading="lazy"></li>`).join('')}</ul>` : '');
    const title = (i) => (i.logo ? `<img class="work-card__logo" src="${esc(i.logo)}" alt="${esc(i.name)}" height="64">` : esc(i.name));
    const link = (url, label, cls) => (url ? `<a class="work-card__button${cls}" href="${esc(url)}" target="_blank" rel="noopener">${label}</a>` : '');
    const links = (i) => ((i.demo || i.url) ? `<p class="work-card__links">${link(i.demo, 'Live demo', ' work-card__button--primary')}${link(i.url, 'Source code', '')}</p>` : '');
    const item = (i) => `<article class="work-card">
                    <h3 class="work-card__title">${i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${title(i)}</a>` : title(i)}</h3>
                    ${i.context ? `<p class="work-card__context">${esc(i.context)}</p>` : ''}
                    ${stack(i.stack)}
                    ${field('What the team did', i.team)}
                    ${links(i)}
                </article>`;
    // +++===+++ 2026-11-13 21:40 Asia/Baku — Hasan Alizada — group title is optional: an empty title shows no heading
    const groups = (w.groups || []).filter(g => (g.items || []).length).map(g => `<section class="page-block">
                ${g.title ? `<h2>${esc(g.title)}</h2>` : ''}
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
