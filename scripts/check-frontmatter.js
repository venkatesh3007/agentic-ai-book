#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'reports');
const reportJsonPath = path.join(reportDir, 'frontmatter-audit-report.json');
const reportMarkdownPath = path.join(reportDir, 'frontmatter-audit-report.md');
const quartoPath = path.join(repoRoot, '_quarto.yml');

const ignoredDirectories = new Set(['.git', 'node_modules', '_book', 'reports']);
const contentExtensions = new Set(['.qmd']);

const issues = [];
const scannedFiles = [];
const warnings = [];
const chapterEntries = [];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function ensureReportDir() {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

function recordIssue(file, type, message, extra = {}) {
  issues.push({ file, type, message, ...extra });
  console.error(`ERROR [${type}] ${file} — ${message}`);
}

function recordWarning(file, type, message, extra = {}) {
  warnings.push({ file, type, message, ...extra });
  console.warn(`WARN [${type}] ${file} — ${message}`);
}

function walkDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!contentExtensions.has(ext)) continue;
    scannedFiles.push(fullPath);
  }
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return null;
  }

  const lines = content.split(/\r?\n/);
  if (!lines.length || lines[0].trim() !== '---') return null;

  const data = {};
  let index = 1;
  for (; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '---') {
      return { data, endLine: index + 1 };
    }
    if (!line.trim()) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[match[1]] = value;
  }

  return null;
}

function parseQuartoChapters() {
  if (!fs.existsSync(quartoPath)) {
    throw new Error('Missing _quarto.yml');
  }
  const quarto = fs.readFileSync(quartoPath, 'utf8');
  const matches = [...quarto.matchAll(/-\s+((?:chapters\/)?[A-Za-z0-9._\/-]+\.qmd)/g)].map((m) => m[1]);
  return new Set(matches.map((entry) => toPosix(entry)));
}

function normalizeTitle(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function checkDayTitle(file, title) {
  const base = path.basename(file);
  const match = base.match(/^day-(\d+)\.qmd$/);
  if (!match) return;
  const dayNumber = String(Number(match[1]));
  if (!title) {
    recordIssue(file, 'missing-title', 'Day chapter is missing a title in frontmatter');
    return;
  }
  const expectedPrefix = `Day ${dayNumber}:`;
  if (!title.startsWith(expectedPrefix)) {
    recordWarning(file, 'day-title-format', `Expected title to start with "${expectedPrefix}" but found "${title}"`);
  }
}

function checkPlaceholderMetadata(file, frontmatter) {
  const title = frontmatter.title || '';
  const subtitle = frontmatter.subtitle || '';
  if (/\[TBD\]/.test(title) || /\[TBD\]/.test(subtitle)) {
    recordWarning(file, 'placeholder-metadata', 'Frontmatter still contains [TBD] placeholder text');
  }
}

function auditFile(fullPath, chapterSet) {
  const relPath = toPosix(path.relative(repoRoot, fullPath));
  const content = fs.readFileSync(fullPath, 'utf8');
  const frontmatter = parseFrontmatter(content);

  if (!frontmatter) {
    recordIssue(relPath, 'missing-frontmatter', 'File is missing YAML frontmatter block');
    return;
  }

  if (!frontmatter.data.title) {
    recordIssue(relPath, 'missing-title', 'Frontmatter is missing required `title`');
  }

  if (chapterSet.has(relPath) && relPath.startsWith('chapters/')) {
    const isDayChapter = /^chapters\/day-\d+\.qmd$/.test(relPath);
    chapterEntries.push({
      file: relPath,
      title: frontmatter.data.title || '',
      subtitle: frontmatter.data.subtitle || '',
      normalizedTitle: normalizeTitle(frontmatter.data.title || '')
    });

    if (isDayChapter && !frontmatter.data.subtitle) {
      recordWarning(relPath, 'missing-subtitle', 'Day chapter has no `subtitle` in frontmatter');
    }
    checkDayTitle(relPath, frontmatter.data.title || '');
    checkPlaceholderMetadata(relPath, frontmatter.data);
  }
}

function checkDuplicateTitles() {
  const titleMap = new Map();
  for (const entry of chapterEntries) {
    if (!entry.normalizedTitle) continue;
    const arr = titleMap.get(entry.normalizedTitle) || [];
    arr.push(entry);
    titleMap.set(entry.normalizedTitle, arr);
  }

  for (const entries of titleMap.values()) {
    if (entries.length < 2) continue;
    const files = entries.map((entry) => entry.file).join(', ');
    for (const entry of entries) {
      recordWarning(entry.file, 'duplicate-title', `Title "${entry.title}" is duplicated across: ${files}`, {
        duplicates: entries.map((item) => item.file)
      });
    }
  }
}

function writeReports(summary) {
  ensureReportDir();
  fs.writeFileSync(reportJsonPath, JSON.stringify(summary, null, 2) + '\n');

  const md = [];
  md.push('# Frontmatter Audit Report', '');
  md.push('- Generated by `node scripts/check-frontmatter.js`');
  md.push(`- QMD files scanned: **${summary.scannedFiles}**`);
  md.push(`- Chapter entries inspected: **${summary.chapterEntries}**`);
  md.push(`- Errors: **${summary.errors.length}**`);
  md.push(`- Warnings: **${summary.warnings.length}**`, '');

  md.push('## Checks', '');
  md.push('- Ensures every `.qmd` file has a YAML frontmatter block.');
  md.push('- Ensures every `.qmd` file has a `title`.');
  md.push('- Warns when day chapters are missing a `subtitle`.');
  md.push('- Warns when day chapter titles do not follow the `Day N:` convention.');
  md.push('- Warns when frontmatter still contains `[TBD]` placeholders.');
  md.push('- Warns when two or more book chapters reuse the same title.', '');

  md.push('## Errors', '');
  if (!summary.errors.length) {
    md.push('- None 🎉');
  } else {
    for (const issue of summary.errors) {
      md.push(`- **${issue.type}** — \`${issue.file}\` — ${issue.message}`);
    }
  }

  md.push('', '## Warnings', '');
  if (!summary.warnings.length) {
    md.push('- None 🎉');
  } else {
    for (const warning of summary.warnings) {
      md.push(`- **${warning.type}** — \`${warning.file}\` — ${warning.message}`);
    }
  }

  md.push('', '---', '', '*This audit checks manuscript metadata consistency, not prose quality or render correctness.*');
  fs.writeFileSync(reportMarkdownPath, md.join('\n') + '\n');
}

function main() {
  const chapterSet = parseQuartoChapters();
  walkDir(repoRoot);

  scannedFiles
    .sort((a, b) => a.localeCompare(b))
    .forEach((file) => auditFile(file, chapterSet));

  checkDuplicateTitles();

  const summary = {
    generatedAt: new Date().toISOString(),
    scannedFiles: scannedFiles.length,
    chapterEntries: chapterEntries.length,
    errors: issues,
    warnings
  };

  writeReports(summary);

  console.log(`Scanned ${summary.scannedFiles} QMD file(s)`);
  console.log(`Inspected ${summary.chapterEntries} chapter frontmatter block(s)`);
  console.log(`Found ${summary.errors.length} error(s) and ${summary.warnings.length} warning(s)`);

  if (summary.errors.length) {
    console.error(`Frontmatter audit failed with ${summary.errors.length} error(s). See ${toPosix(path.relative(repoRoot, reportMarkdownPath))} for details.`);
    process.exit(1);
  }

  if (summary.warnings.length) {
    console.warn(`Frontmatter audit completed with warnings. See ${toPosix(path.relative(repoRoot, reportMarkdownPath))} for details.`);
    process.exit(2);
  }

  console.log('Frontmatter audit passed.');
}

try {
  main();
} catch (error) {
  console.error('Frontmatter audit crashed:', error);
  process.exit(1);
}
