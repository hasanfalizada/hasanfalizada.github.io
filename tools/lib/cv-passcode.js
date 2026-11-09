// +++===+++ 2026-11-09 Asia/Baku — Hasan Alizada — Primitive gate of the CV page cv/ (his decision): a convenience, not security.
// The repository is public, CV pages and resume.json stay reachable directly. Only a salted hash is stored, never the passcode.
'use strict';
const crypto = require('crypto');

const SALT = 'hasanalizada.net/cv:';
const hashPasscode = (passcode) => crypto.createHash('sha256').update(SALT + passcode, 'utf8').digest('hex');

module.exports = {SALT, hashPasscode};
