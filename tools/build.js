#!/usr/bin/env node
// +++===+++ 2026-11-05 Asia/Baku — Hasan Alizada — One command to rebuild every generated file after changing data/resume.json,
// articles/*.md or cv_profiles (no npm). Order: static blocks in index.html/article.html → article pages, index.json,
// sitemap.xml → CV variant pages. Bump ?v= in index.html and article.html first when CSS/JS changed.
//
// Usage (from the repository root):
//     node tools/build.js

'use strict';
const {execFileSync} = require('child_process');
const path = require('path');

for (const script of ['build-static.js', 'build-articles.js', 'build-cv-pages.js']) {
    console.log(`\n=== ${script}`);
    execFileSync(process.execPath, [path.join(__dirname, script)], {stdio: 'inherit'});
}
console.log('\n=== build done');
