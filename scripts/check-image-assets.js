#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'reports');
const reportJsonPath = path.join(reportDir, 'image-audit-report.json');
const reportMarkdownPath = path.join(reportDir, 'image-audit-report.md');

const allowedContentExtensions = new Set(['.md', '.qmd']);
const allowedImageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif']);
const ignoredDirectories = new Set(['.git', 'node_modules', '_book', 'reports']);
const externalSchemes = ['http://', 'https://', 'data:', 'mailto:', 'tel:', 'ftp://'];

const filesScanned = new Set();
const imageReferences = [];
const issues = [];
let externalImages = 0;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function ensureReportDir() {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

function readFileLinesBeforeIndex(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function normalizeTarget(rawTarget) {
  let target = String(rawTarget || '').trim();
  if (!target) return '';

  if (target.startsWith('<') && target.endsWith('>')) {
    target = target.slice(1, -1).trim();
  }

  target = target.replace(/\s+("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*$/, '').trim();
  return target;
}

function stripQueryAndHash(target) {
  const hashIndex = target.indexOf('#');
  const queryIndex = target.indexOf('?');
  let endIndex = target.length;
  if (hashIndex !== -1) endIndex = Math.min(endIndex, hashIndex);
  if (queryIndex !== -1) endIndex = Math.min(endIndex, queryIndex);
  return target.slice(0, endIndex);
}

function isExternal(target) {
  const lower = target.toLowerCase();
  return externalSchemes.some((scheme) => lower.startsWith(scheme));
}

function recordIssue({ file, line, target, type, message }) {
  issues.push({ file, line, target, type, message });
  console.error(`ERROR [${type}] ${file}:${line} → ${target} — ${message}`);
}

function walkDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!allowedContentExtensions.has(ext)) continue;
      const relPath = toPosix(path.relative(repoRoot, fullPath));
      filesScanned.add(relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      extractImageReferences({ relPath, fullPath, content });
    }
  }
}

function extractImageReferences({ relPath, fullPath, content }) {
  const markdownRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of content.matchAll(markdownRegex)) {
    const targetRaw = match[1];
    imageReferences.push({
      file: relPath,
      fileAbsolute: fullPath,
      line: readFileLinesBeforeIndex(content, match.index ?? 0),
      rawTarget: targetRaw,
      type: 'markdown'
    });
  }

  const htmlRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  for (const match of content.matchAll(htmlRegex)) {
    const targetRaw = match[1];
    imageReferences.push({
      file: relPath,
      fileAbsolute: fullPath,
      line: readFileLinesBeforeIndex(content, match.index ?? 0),
      rawTarget: targetRaw,
      type: 'html'
    });
  }
}

function validateImageReference(ref) {
  let normalized = normalizeTarget(ref.rawTarget);
  if (!normalized) {
    recordIssue({
      file: ref.file,
      line: ref.line,
      target: ref.rawTarget,
      type: 'invalid-target',
      message: 'Image target could not be parsed'
    });
    return;
  }

  normalized = normalized.replace(/\\/g, '/');
  if (isExternal(normalized)) {
    externalImages += 1;
    return;
  }

  const stripped = stripQueryAndHash(normalized);
  if (!stripped) {
    recordIssue({
      file: ref.file,
      line: ref.line,
      target: normalized,
      type: 'invalid-target',
      message: 'Image path is empty after removing query/fragment'
    });
    return;
  }

  const resolved = stripped.startsWith('/')
    ? path.join(repoRoot, stripped.replace(/^\/+/, ''))
    : path.resolve(path.dirname(ref.fileAbsolute), stripped);

  if (!resolved.startsWith(repoRoot)) {
    recordIssue({
      file: ref.file,
      line: ref.line,
      target: normalized,
      type: 'path-traversal',
      message: 'Image path resolves outside of the repository'
    });
    return;
  }

  const ext = path.extname(resolved).toLowerCase();
  if (ext && !allowedImageExtensions.has(ext)) {
    recordIssue({
      file: ref.file,
      line: ref.line,
      target: normalized,
      type: 'unsupported-extension',
      message: `Expected an image file extension but found "${ext || '(none)'}"`
    });
  }

  if (!fs.existsSync(resolved)) {
    recordIssue({
      file: ref.file,
      line: ref.line,
      target: normalized,
      type: 'missing-file',
      message: `Referenced image does not exist: ${toPosix(path.relative(repoRoot, resolved))}`
    });
    return;
  }
}

function validateImages() {
  for (const ref of imageReferences) {
    validateImageReference(ref);
  }
}

function writeReports() {
  ensureReportDir();
  const summary = {
    generatedAt: new Date().toISOString(),
    scannedFiles: filesScanned.size,
    imagesFound: imageReferences.length,
    externalImages,
    issues
  };
  fs.writeFileSync(reportJsonPath, JSON.stringify(summary, null, 2) + '\n');

  const md = [];
  md.push('# Image Asset Audit Report', '');
  md.push('- Generated by `node scripts/check-image-assets.js`');
  md.push(`- Files scanned: **${summary.scannedFiles}**`);
  md.push(`- Image references found: **${summary.imagesFound}**`);
  md.push(`- External images skipped: **${summary.externalImages}**`);
  md.push(`- Issues found: **${issues.length}**`, '');

  md.push('## Issues', '');
  if (!issues.length) {
    md.push('- None 🎉');
  } else {
    for (const issue of issues) {
      md.push(`- **${issue.type}** — File \`${issue.file}\` (line ${issue.line}) → Target \`${issue.target}\` — ${issue.message}`);
    }
  }

  md.push('', '## Coverage Notes', '');
  md.push('- Markdown images like `![alt](path)` are checked.');
  md.push('- HTML images like `<img src="path">` are also checked.');
  md.push('- External image URLs are skipped; this audit only verifies repo-local assets.');
  md.push('', '---', '', '*This audit checks that every referenced image exists inside the repository, but it does not render the manuscript.*');
  fs.writeFileSync(reportMarkdownPath, md.join('\n') + '\n');
}

function main() {
  walkDir(repoRoot);
  console.log(`Scanned ${filesScanned.size} content files`);
  console.log(`Found ${imageReferences.length} image reference(s)`);
  if (externalImages) {
    console.log(`Skipped ${externalImages} external image(s)`);
  }
  validateImages();
  writeReports();

  if (issues.length) {
    console.error(`Image asset audit failed with ${issues.length} issue(s). See ${path.relative(repoRoot, reportMarkdownPath)} for details.`);
    process.exit(1);
  }
  console.log('Image asset audit passed.');
}

try {
  main();
} catch (error) {
  console.error('Image asset audit crashed:', error);
  process.exit(1);
}
