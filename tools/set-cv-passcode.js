#!/usr/bin/env node
// +++===+++ 2026-11-09 Asia/Baku — Hasan Alizada — Sets the passcode of the CV page cv/: asks for it without showing it,
// stores only its hash in site_config.cv_hub_passcode_sha256 of data/resume.json. Then run: node tools/build.js
//
// Usage (from the repository root):
//     node tools/set-cv-passcode.js

'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {Writable} = require('stream');
const {hashPasscode} = require('./lib/cv-passcode.js');

const file = path.resolve(__dirname, '..', 'data', 'resume.json');
const muted = new Writable({write(chunk, encoding, done) { done(); }});
const rl = readline.createInterface({input: process.stdin, output: muted, terminal: !!process.stdin.isTTY});

process.stdout.write('New passcode for the CV page (input hidden): ');
rl.once('line', (line) => {
    rl.close();
    process.stdout.write('\n');
    const passcode = line.trim();
    if (passcode.length < 4) {
        console.error('Too short: use at least 4 characters. Nothing changed.');
        process.exit(1);
    }
    const hash = hashPasscode(passcode);
    let text = fs.readFileSync(file, 'utf8');
    const existing = /"cv_hub_passcode_sha256": "[^"]*"/;
    text = existing.test(text)
        ? text.replace(existing, `"cv_hub_passcode_sha256": "${hash}"`)
        : text.replace('  "site_config": {\n', `  "site_config": {\n    "cv_hub_passcode_sha256": "${hash}",\n`);
    JSON.parse(text);
    fs.writeFileSync(file, text);
    console.log('Hash saved to data/resume.json. Now run: node tools/build.js');
});
