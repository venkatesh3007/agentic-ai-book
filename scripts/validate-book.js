#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const quartoPath = path.join(repoRoot, '_quarto.yml');

let failed = false;
let warned = false;

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  failed = true;
}

function warn(msg) {
  console.warn(`WARN: ${msg}`);
  warned = true;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

if (!fs.existsSync(quartoPath)) {
  fail('Missing _quarto.yml');
  process.exit(1);
}

const quarto = fs.readFileSync(quartoPath, 'utf8');
const chapterMatches = [...quarto.matchAll(/-\s+(chapters\/[A-Za-z0-9._\/-]+\.qmd)/g)].map(m => m[1]);
const uniqueChapters = [...new Set(chapterMatches)];

if (!uniqueChapters.length) {
  fail('No chapter paths found in _quarto.yml');
}

ok(`Found ${uniqueChapters.length} chapter entries in _quarto.yml`);

const templatePhrases = [
  'title: "Day 8: [TBD]"',
  'subtitle: "[Product name TBD]"',
  '## Product: [TBD]',
  '**Date**: [TBD]',
  '**Repo**: [TBD]',
  '*[To be written after we build it]*',
  '*[Real-time narrative goes here]*',
  '*[What we actually delivered]*',
  '*[What I learned]*'
];

const placeholderDayChapters = [];

for (const rel of uniqueChapters) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) {
    fail(`Referenced chapter missing: ${rel}`);
    continue;
  }
  ok(`Chapter exists: ${rel}`);

  const text = fs.readFileSync(full, 'utf8');
  const isDayChapter = /chapters\/day-\d+\.qmd$/.test(rel);
  if (!isDayChapter) continue;

  const isPlaceholder = templatePhrases.some(phrase => text.includes(phrase)) || /\[TBD\]/.test(text);
  if (isPlaceholder) {
    placeholderDayChapters.push(rel);
  }
}

if (placeholderDayChapters.length) {
  warn(`Placeholder day chapters still present (${placeholderDayChapters.length}):`);
  for (const rel of placeholderDayChapters) {
    console.warn(`WARN:   - ${rel}`);
  }
}

if (failed) {
  process.exit(1);
}

if (warned) {
  process.exit(2);
}

ok('Book validation passed');
