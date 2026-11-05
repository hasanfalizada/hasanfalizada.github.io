#!/usr/bin/env node
// +++===+++ 2026-11-05 Asia/Baku — Hasan Alizada — Static fallback builder (no npm, no external services).
//
// index.html and article.html contain blocks
//     <!-- GENERATED:<name> BEGIN ... -->  ...  <!-- GENERATED:<name> END -->
// that this script fills from data/resume.json (default CV profile):
//     seo    — <title>, description, keywords, author, canonical, Open Graph / Twitter texts, Person JSON-LD
//              (values from SEOOptimizer.getPageSeo — the same method main.js uses at runtime, so static and runtime match)
//     brand  — name and headline in the header
//     footer — copyright line (JS adds the current year at runtime)
// Everything else in these files is hand-written. Never edit inside the GENERATED blocks.
//
// Usage (from the repository root, after changing data/resume.json):
//     node tools/build-static.js        (or node tools/build.js to rebuild everything)

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const rel = (...p) => path.join(ROOT, ...p);
const log = (...a) => console.log('[build-static]', ...a);

const ResumeDataLoader = require(rel('atoms/resume-data-loader/impl.js'));
const SEOOptimizer = require(rel('atoms/seo-optimizer/impl.js'));
console.debug = () => {}; // silence atoms' debug logging in CLI output

const raw = JSON.parse(fs.readFileSync(rel('data/resume.json'), 'utf8'));
const loader = new ResumeDataLoader();
const validation = loader.validateResumeStructure(raw);
if (!validation.valid) throw new Error('resume.json is invalid: ' + validation.errors.join('; '));
const data = loader.filterRenderable(loader.applyProfile(raw));
const seoAtom = new SEOOptimizer();
seoAtom.initialize(data);
const pi = data.personal_info || {};

const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const meta = (attr, key, content) => `<meta ${attr}="${key}" content="${esc(content)}">`;

// full head block for the site root (index.html)
const homeSeo = () => {
    const s = seoAtom.getPageSeo('blog');
    const ld = JSON.stringify(s.person, null, 4).split('\n').map(l => '        ' + l).join('\n');
    return [
        `<title>${esc(s.title)}</title>`,
        meta('name', 'description', s.description),
        meta('name', 'keywords', s.keywords.join(', ')),
        meta('name', 'author', s.author),
        `<link rel="canonical" href="${esc(s.canonicalUrl)}">`,
        meta('property', 'og:title', s.title),
        meta('property', 'og:description', s.description),
        meta('property', 'og:url', s.canonicalUrl),
        meta('property', 'og:site_name', s.siteName),
        meta('property', 'og:image:alt', s.author),
        meta('name', 'twitter:title', s.title),
        meta('name', 'twitter:description', s.description),
        ...(s.twitterHandle ? [meta('name', 'twitter:creator', s.twitterHandle)] : []),
        `<script type="application/ld+json" id="structured-data-person">\n${ld}\n    </script>`,
        `<link rel="alternate" type="application/json" href="data/resume.json" title="${esc(s.author)} — resume data (JSON)">`
    ];
};

// minimal head block for the article template (article.html?slug=…; runtime sets the real article values)
const articleSeo = () => {
    const s = seoAtom.getPageSeo('article');
    return [
        `<title>${esc(s.title)}</title>`,
        meta('name', 'description', `Article by ${s.author}`),
        meta('name', 'author', s.author)
    ];
};

const brand = () => [
    `<h1 class="brand-name">${esc(pi.name)}</h1>`,
    `<p class="brand-title">${esc(pi.headline)}</p>`
];
const footer = () => [`<p>&copy; ${esc(pi.name)}. All rights reserved.</p>`];

const fill = (file, blocks) => {
    let html = fs.readFileSync(rel(file), 'utf8');
    for (const [name, lines] of Object.entries(blocks)) {
        const re = new RegExp(`([ \\t]*)(<!-- GENERATED:${name} BEGIN[^\\n]*-->\\n)[\\s\\S]*?([ \\t]*<!-- GENERATED:${name} END -->)`);
        const m = html.match(re);
        if (!m) throw new Error(`${file}: GENERATED:${name} block not found`);
        const indent = m[1];
        const body = lines().map(l => l.split('\n').map((x, i) => (i ? x : indent + x)).join('\n')).join('\n');
        html = html.replace(re, `${indent}$2${body}\n$3`);
        log(`${file}: ${name} (${lines().length} item(s))`);
    }
    fs.writeFileSync(rel(file), html);
};

fill('index.html', {seo: homeSeo, brand, footer});
fill('article.html', {seo: articleSeo, brand, footer});
log('done');
