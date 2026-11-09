#!/usr/bin/env node
// +++===+++ 2026-11-09 Asia/Baku — Hasan Alizada — Site checks (no npm, no browser, no network). Run after node tools/build.js.
// Checks generated files, links, canonical, sitemap, absence of a phone number, the Services and Work switches and text rules.
// Exit code 1 when any check fails.
//
// Usage (from the repository root):
//     node tools/check-site.js

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const rel = (...p) => path.join(ROOT, ...p);
const read = (p) => fs.readFileSync(rel(p), 'utf8');
const exists = (p) => fs.existsSync(rel(p));

const ResumeDataLoader = require(rel('atoms/resume-data-loader/impl.js'));
const site = require('./lib/site-pages.js');
console.debug = () => {}; // silence atoms' debug logging in CLI output

let passed = 0;
const failures = [];
const check = (name, problems) => {
    const list = Array.isArray(problems) ? problems : (problems ? [] : ['failed']);
    if (list.length) failures.push({name, list});
    else passed += 1;
    console.log(`${list.length ? 'FAIL' : 'ok  '} ${name}${list.length ? '\n     ' + list.join('\n     ') : ''}`);
};

const raw = JSON.parse(read('data/resume.json'));
const loader = new ResumeDataLoader();
const prepare = (r) => loader.filterRenderable(loader.applyProfile(r));
const data = prepare(raw);
const clone = () => JSON.parse(JSON.stringify(raw));
const SITE = String(data.site_config.url).replace(/\/+$/, '');
const version = (read('index.html').match(/assets\/js\/main\.js\?v=([^"']+)/) || [])[1] || '';
const on = site.isEnabled(data);

const walk = (dir, out = []) => {
    for (const name of fs.readdirSync(rel(dir))) {
        if (['.git', '.idea', 'node_modules'].includes(name)) continue;
        const p = path.join(dir, name);
        if (fs.statSync(rel(p)).isDirectory()) walk(p, out);
        else out.push(p);
    }
    return out;
};
const files = walk('.');
const pagePaths = site.renderPages(data, version).map(p => p.path);
const htmlPages = ['index.html', 'article.html', ...pagePaths];
const textFiles = files.filter(f => /\.(html|json|xml|txt|js|css|md)$/.test(f)
    && !/assets\/js\/(jspdf|marked|pdfmake|vfs_fonts)/.test(f));

// ---------- generated files ----------
check('generated pages match data/resume.json (run node tools/build.js if not)',
    site.renderPages(data, version)
        .filter(p => !exists(p.path) || read(p.path) !== p.html).map(p => p.path));

for (const id of site.ALL_PAGE_IDS) {
    if (!pagePaths.includes(`${id}/index.html`)) {
        check(`${id}/ is absent while switched off`, !exists(`${id}/index.html`));
    }
}

// ---------- old address and phone ----------
const OLD_HOST = ['hasanfalizada', 'github', 'io'].join('.');
check('old address is not in any file', textFiles.filter(f => read(f).includes(OLD_HOST)));

const contact = (raw.personal_info || {}).contact || {};
check('no phone in contact data', !('phone' in contact));
check('no phone on public pages', [...htmlPages, ...textFiles.filter(f => f.startsWith('cv/') || f.startsWith('articles/'))]
    .filter(f => /tel:|\+994/.test(read(f))));
check('no phone pattern in data/resume.json', !/\+994|tel:/.test(read('data/resume.json')));

// ---------- SEO ----------
const canonicalOf = (html) => (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
const expected = {'index.html': `${SITE}/`};
pagePaths.forEach(p => { expected[p] = `${SITE}/${path.dirname(p)}/`; });
check('canonical of every page', Object.entries(expected)
    .filter(([f, url]) => canonicalOf(read(f)) !== url)
    .map(([f, url]) => `${f}: ${canonicalOf(read(f))} instead of ${url}`));

const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const toFile = (u) => {
    const p = u.replace(`${SITE}/`, '');
    return p === '' ? 'index.html' : (p.endsWith('/') ? `${p}index.html` : p);
};
check('every sitemap URL is on this domain and exists', locs
    .filter(u => !u.startsWith(`${SITE}/`) || !exists(toFile(u))));
check('sitemap has no noindex pages', locs.filter(u => exists(toFile(u)) && /name="robots" content="noindex/.test(read(toFile(u)))));
check('sitemap lists home and enabled pages', [`${SITE}/`, ...site.sitemapPages(data).map(p => `${SITE}/${p.path}`)]
    .filter(u => !locs.includes(u)));
check('robots.txt points to the sitemap', read('robots.txt').includes(`Sitemap: ${SITE}/sitemap.xml`));
check('privacy page is noindex', /name="robots" content="noindex/.test(read('privacy/index.html')));
check('CV pages are noindex and not in the sitemap', Object.keys(raw.cv_profiles)
    .filter(id => id !== 'default')
    .filter(id => !/noindex/.test(read(`cv/${id}/index.html`)) || locs.some(u => u.includes(`/cv/${id}`))));
check('JSON-LD on the home page is valid and has no phone', (() => {
    const m = read('index.html').match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return ['not found'];
    try { return JSON.parse(m[1]).telephone ? ['telephone present'] : []; } catch (e) { return [e.message]; }
})());

// ---------- CV page ----------
{
    const hub = exists('cv/index.html') ? read('cv/index.html') : '';
    const hash = data.site_config.cv_hub_passcode_sha256 || '';
    check('CV page: noindex, not in sitemap, lists every role, keeps role pages', [
        ...(/noindex, nofollow/.test(hub) ? [] : ['no noindex']),
        ...(locs.some(u => /\/cv\/$/.test(u)) ? ['in sitemap'] : []),
        ...Object.keys(raw.cv_profiles).filter(id => !hub.includes(`"id":"${id}"`)).map(id => `missing ${id}`),
        ...(/"phone"|tel:/.test(hub) ? ['phone'] : [])
    ]);
    check('CV page: stored passcode value is a SHA-256 hash or empty, and matches the page', [
        ...(hash === '' || /^[0-9a-f]{64}$/.test(hash) ? [] : ['not a hash']),
        ...(hub.includes(`var HASH = ${JSON.stringify(hash)};`) ? [] : ['page is out of date'])
    ]);
}

// ---------- links ----------
const stripTags = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const linkProblems = [];
for (const page of [...htmlPages, ...textFiles.filter(f => /^articles\/.*\.html$/.test(f))]) {
    const html = stripTags(read(page));
    const base = (html.match(/<base href="([^"]+)"/) || [])[1];
    const from = base ? path.join(path.dirname(page), base) : path.dirname(page);
    for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
        const link = m[1];
        if (/^(https?:|mailto:|#|data:)/.test(link) || link === base) continue;
        let target = path.normalize(path.join(from, link.split(/[?#]/)[0]));
        if (target === '.' || target.endsWith('/')) target = path.join(target, 'index.html');
        if (!exists(target)) linkProblems.push(`${page}: ${link}`);
    }
}
check('internal links and assets exist', linkProblems);
check('old URLs stay: articles/welcome.html and every CV page', ['articles/welcome.html',
    ...Object.keys(raw.cv_profiles).filter(id => id !== 'default').map(id => `cv/${id}/index.html`)]
    .filter(f => !exists(f)));

// ---------- pages ----------
const NAV = /<a href="[^"]*" (?:id="download-pdf-btn" )?class="nav-link[^"]*"[^>]*>([^<]+)<\/a>/g;
const menuOf = (html) => [...html.matchAll(NAV)].map(m => m[1]);
const expectedMenu = ['Blog', ...(on.work ? ['Work'] : []), ...(on.services ? ['Services'] : []), 'Resume'];
check(`menu on every page is ${expectedMenu.join(' · ')}`, htmlPages
    .filter(f => JSON.stringify(menuOf(read(f))) !== JSON.stringify(expectedMenu))
    .map(f => `${f}: ${menuOf(read(f)).join(' · ')}`));
check('name links to home on every page', htmlPages.filter(f => !/<a href="\.\/" class="brand-link">/.test(read(f))));
check('footer has email and privacy link on every page', htmlPages
    .filter(f => !read(f).includes(`mailto:${contact.email}`) || !read(f).includes('href="privacy/"')));
check('consent script on every page, no Google tag loaded directly', [...htmlPages, ...textFiles.filter(f => /^articles\/.*\.html$/.test(f) && f !== path.join('articles', 'welcome.html'))]
    .filter(f => !read(f).includes('assets/js/consent.js') || /googletagmanager|GTM-/.test(read(f))));
check('same ?v= on all pages', htmlPages.filter(f => {
    const versions = [...read(f).matchAll(/\.(?:css|js)\?v=([^"']+)["']/g)].map(m => m[1]);
    return !versions.length || versions.some(x => x !== version);
}));

const home = read('index.html');
check('home is the blog', home.includes('id="blog-content"') && /section--blog active/.test(home));
check('no AI note in the code of the pages', htmlPages.filter(f => /Built with AI/i.test(read(f))));

// +++===+++ 2026-11-09 Asia/Baku — Hasan Alizada — Decision: employers appear only in the Resume PDF, so this covers hidden JSON-LD too (whole files, not visible text)
const EMPLOYERS = /\b(Visa|Kapital|BirBank|MüştəriBank|Railways|ADY|Azerfon|Bank Standard|British American)\b/;
check('no employer names on any page, in JSON-LD or in site_pages', [
    ...htmlPages.filter(f => EMPLOYERS.test(read(f))),
    ...(EMPLOYERS.test(JSON.stringify(raw.site_pages)) ? ['site_pages'] : [])
]);
check('arcade stays with the blog in main.js', /mountArcade/.test(read('assets/js/main.js')) && exists('atoms/arcade/impl.js'));
check('search console tag and file stay', home.includes('name="google-site-verification"') && exists('googlef59f83c169932802.html') && exists('CNAME'));

// ---------- texts ----------
const words = (html) => stripTags(html).replace(/<[^>]+>/g, ' ');
const servicesText = on.services ? words(read('services/index.html')) : '';
if (on.services) {
    check('Services: first person, no studio language', ['\\bwe\\b', '\\bour\\b', 'leading provider', 'latest technologies', 'boutique']
        .filter(w => new RegExp(w, 'i').test(servicesText)));
    check('Services: agreed wording present', ['Vəssalam', 'Security architecture review', 'You work directly with me',
        'Penetration tests', 'Discuss a project']
        .filter(w => !servicesText.includes(w)));
    check('Services: no prices, no claimed fractional history, no presentations line', ['\\$\\s?\\d', 'former CTO', 'testimonial', 'presentation', 'discovery:', 'paid discovery', 'fixed-price']
        .filter(w => new RegExp(w, 'i').test(servicesText)));
    check('Services: one call to action', (read('services/index.html').match(/class="page-button"/g) || []).length === 1);
}
check('removed Services blocks stay removed', [...(/written record|What you can hold me to|\bStack\b|Background:/i.test(servicesText) ? ['found on Services'] : [])]);
check('site does not mention LLM or AI tools in visible text', ['index.html', ...pagePaths]
    .filter(f => /\b(LLM|AI agents?|Claude|ChatGPT)\b/.test(words(read(f)))));

// ---------- switches (on copies of the data, disk untouched) ----------
{
    const r = clone();
    r.site_pages.services.to_render = false;
    const d = prepare(r);
    const pages = site.renderPages(d, version);
    check('switch: Services off removes page, menu item, sitemap entry and home link', [
        ...(pages.some(p => p.path.startsWith('services/')) ? ['page rendered'] : []),
        ...(site.nav(d, 'home').join('').includes('services/') ? ['in menu'] : []),
        ...(site.sitemapPages(d).some(p => p.path === 'services/') ? ['in sitemap'] : []),
        ...(pages.some(p => p.html.includes('href="services/"')) ? ['linked from a page'] : [])
    ]);
}
{
    const d = prepare(clone());
    d.site_pages.work.groups.forEach(g => { g.items = []; });
    const pages = site.renderPages(d, version);
    check('switch: empty Work is hidden', [
        ...(pages.some(p => p.path.startsWith('work/')) ? ['page rendered'] : []),
        ...(site.nav(d, 'home').join('').includes('work/') ? ['in menu'] : []),
    ]);
}
{
    const r = clone();
    r.site_pages.work.groups[0].items = [{name: 'Test <project>', role: 'Author', url: 'https://example.com/', result: '10 users'}];
    const d = prepare(r);
    const pages = site.renderPages(d, version);
    const work = (pages.find(p => p.path === 'work/index.html') || {}).html || '';
    check('switch: Work with one item shows page, menu, home link, only the filled group, escaped text', [
        ...(work ? [] : ['page missing']),
        ...(site.nav(d, 'home').join('').includes('work/') ? [] : ['not in menu']),
        ...(work.includes('Own projects and open source') ? [] : ['group title missing']),
        ...(work.includes('Client work') ? ['empty group shown'] : []),
        ...(work.includes('Test &lt;project&gt;') ? [] : ['not escaped'])
    ]);
}
{
    const r = clone();
    r.site_pages.work.groups[0].items = [{name: 'Hidden', role: 'Author', to_render: false}];
    check('switch: Work item with to_render false stays hidden', !site.isEnabled(prepare(r)).work);
}

// ---------- old hash links in main.js (minimal DOM stub, no browser) ----------
{
    const vm = require('vm');
    const route = (hash) => {
        const elements = {blog: true, resume: true, footer: false}; // id → is it a .section
        const calls = {replace: null, cleaned: false};
        const noop = () => {};
        const sandbox = {
            console: {debug: noop, log: noop, error: noop},
            URL,
            URLSearchParams,
            setTimeout,
            document: {currentScript: null, getElementById: (id) => (id in elements ? {classList: {contains: () => elements[id]}} : null), querySelector: () => null, querySelectorAll: () => []},
            window: {location: {hash, pathname: '/', search: '', replace: (u) => { calls.replace = u; }}},
            history: {replaceState: () => { calls.cleaned = true; }}
        };
        vm.runInNewContext(read('assets/js/main.js'), sandbox);
        return {section: sandbox.window.App.resolveSectionFromHash(), ...calls};
    };
    const problems = [];
    const expect = (hash, want, got) => {
        for (const k of Object.keys(want)) {
            if (got[k] !== want[k]) problems.push(`${hash || '(empty)'}: ${k} = ${got[k]}, expected ${want[k]}`);
        }
    };
    expect('', {section: 'blog', replace: null}, route(''));
    expect('#blog', {section: 'blog', replace: null}, route('#blog'));
    expect('#resume', {section: 'blog', cleaned: true}, route('#resume'));
    expect('#abc', {section: 'blog', replace: null, cleaned: false}, route('#abc'));
    expect('#footer', {section: 'blog', replace: null, cleaned: false}, route('#footer'));
    check('hash links: empty, #blog, #resume, unknown and non-section', problems);
}

// ---------- result ----------
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
