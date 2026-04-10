#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'reports');
const reportJsonPath = path.join(reportDir, 'link-check-report.json');
const reportMarkdownPath = path.join(reportDir, 'link-check-report.md');

const allowedExtensions = new Set(['.md', '.qmd']);
const ignoredDirectories = new Set(['.git', 'node_modules', '_book', 'reports']);
const externalSchemes = ['http://', 'https://', 'mailto:', 'tel:', 'data:', 'javascript:', 'ftp://'];

const fileMetadata = new Map();
const issues = [];
let totalLinks = 0;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[#A-Za-z0-9]+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractAnchors(content) {
  const anchors = new Set();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (!match) continue;
    const heading = match[2].trim();
    const slug = slugify(heading);
    if (slug) anchors.add(slug);
  }
  return anchors;
}

function readLineNumber(content, index) {
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

function extractLinks(content) {
  const links = [];
  const patterns = [
    /\[([^\]]+)\]\(([^)]+)\)/g,
    /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis
  ];

  for (const regex of patterns) {
    for (const match of content.matchAll(regex)) {
      const index = match.index ?? 0;
      const full = match[0];
      const precedingChar = index > 0 ? content[index - 1] : '';
      if (precedingChar === '!') continue;

      const targetRaw = regex.source.startsWith('\\[') ? match[2] : match[1];
      const label = regex.source.startsWith('\\[') ? match[1] : match[2];
      links.push({
        label,
        target: normalizeTarget(targetRaw),
        line: readLineNumber(content, index),
        raw: full
      });
    }
  }

  return links;
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
      if (!allowedExtensions.has(ext)) continue;
      const relPath = toPosix(path.relative(repoRoot, fullPath));
      const content = fs.readFileSync(fullPath, 'utf8');
      const anchors = extractAnchors(content);
      const links = extractLinks(content);
      totalLinks += links.length;
      fileMetadata.set(relPath, { fullPath, anchors, links });
    }
  }
}

function isExternal(target) {
  return externalSchemes.some((scheme) => target.toLowerCase().startsWith(scheme));
}

function recordIssue({ file, line, target, type, message }) {
  issues.push({ file, line, target, type, message });
  console.error(`ERROR [${type}] ${file}:${line} → ${target} — ${message}`);
}

function resolveRepoPath(baseFile, targetPath) {
  if (targetPath.startsWith('/')) {
    return path.resolve(repoRoot, targetPath.slice(1));
  }
  return path.resolve(path.dirname(baseFile), targetPath);
}

function getTargetMeta(resolvedPath) {
  const relPosix = toPosix(path.relative(repoRoot, resolvedPath));
  let meta = fileMetadata.get(relPosix);
  if (meta) return meta;

  const content = fs.readFileSync(resolvedPath, 'utf8');
  meta = {
    fullPath: resolvedPath,
    anchors: extractAnchors(content),
    links: extractLinks(content)
  };
  fileMetadata.set(relPosix, meta);
  return meta;
}

function validateLinks() {
  for (const [relPath, meta] of fileMetadata.entries()) {
    for (const link of meta.links) {
      const target = link.target;
      if (!target || isExternal(target)) continue;

      if (target.startsWith('#')) {
        const anchorSlug = slugify(target.slice(1));
        if (!anchorSlug) {
          recordIssue({
            file: relPath,
            line: link.line,
            target,
            type: 'invalid-anchor',
            message: 'Anchor text could not be slugified'
          });
          continue;
        }
        if (!meta.anchors.has(anchorSlug)) {
          recordIssue({
            file: relPath,
            line: link.line,
            target,
            type: 'missing-anchor',
            message: 'Anchor not found in the same file'
          });
        }
        continue;
      }

      const [pathPartRaw, ...anchorRest] = target.split('#');
      const pathPart = pathPartRaw.trim();
      const anchorPartRaw = anchorRest.join('#').trim();
      if (!pathPart) continue;

      const resolvedPath = resolveRepoPath(meta.fullPath, pathPart);
      if (!resolvedPath.startsWith(repoRoot)) {
        recordIssue({
          file: relPath,
          line: link.line,
          target,
          type: 'path-traversal',
          message: 'Resolved path escapes repository root'
        });
        continue;
      }

      const normalizedRelPosix = toPosix(path.relative(repoRoot, resolvedPath));
      if (!fs.existsSync(resolvedPath)) {
        recordIssue({
          file: relPath,
          line: link.line,
          target,
          type: 'missing-file',
          message: `Referenced file does not exist: ${normalizedRelPosix}`
        });
        continue;
      }

      if (!anchorPartRaw) continue;

      const targetExt = path.extname(resolvedPath).toLowerCase();
      if (!allowedExtensions.has(targetExt)) {
        recordIssue({
          file: relPath,
          line: link.line,
          target,
          type: 'unsupported-anchor-target',
          message: 'Anchor references a file type that cannot expose headings'
        });
        continue;
      }

      const anchorSlug = slugify(anchorPartRaw);
      if (!anchorSlug) {
        recordIssue({
          file: relPath,
          line: link.line,
          target,
          type: 'invalid-anchor',
          message: 'Linked anchor could not be slugified'
        });
        continue;
      }

      const targetMeta = getTargetMeta(resolvedPath);
      if (!targetMeta.anchors.has(anchorSlug)) {
        recordIssue({
          file: relPath,
          line: link.line,
          target,
          type: 'missing-anchor',
          message: 'Anchor not found in target file'
        });
      }
    }
  }
}

function ensureReportDir() {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

function writeReports() {
  ensureReportDir();
  const summary = {
    generatedAt: new Date().toISOString(),
    scannedFiles: fileMetadata.size,
    checkedLinks: totalLinks,
    issues
  };
  fs.writeFileSync(reportJsonPath, JSON.stringify(summary, null, 2) + '\n');

  const md = [];
  md.push('# Internal Link Check Report', '');
  md.push('- Generated by `node scripts/check-internal-links.js`');
  md.push(`- Files scanned: **${summary.scannedFiles}**`);
  md.push(`- Links checked: **${summary.checkedLinks}**`);
  md.push(`- Issues found: **${issues.length}**`, '');

  if (issues.length) {
    md.push('## Issues', '');
    for (const issue of issues) {
      md.push(`- **${issue.type}** — File \`${issue.file}\` (line ${issue.line}) → Target: \`${issue.target}\` — ${issue.message}`);
    }
  } else {
    md.push('## Issues', '', '- None 🎉');
  }

  md.push('', '## Coverage Notes', '');
  md.push('- Markdown links like `[label](target)` are checked.');
  md.push('- HTML links like `<a href="target">` are also checked.');
  md.push('- External links are skipped; this is a repo-local integrity audit only.');
  md.push('', '---', '', '*This is a manuscript-integrity check, not a render check.*');
  fs.writeFileSync(reportMarkdownPath, md.join('\n') + '\n');
}

function main() {
  walkDir(repoRoot);
  console.log(`Scanned ${fileMetadata.size} files with Markdown/QMD content`);
  console.log(`Found ${totalLinks} links to inspect`);
  validateLinks();
  writeReports();

  if (issues.length) {
    console.error(`Internal link check failed with ${issues.length} issue(s). See ${path.relative(repoRoot, reportMarkdownPath)} for details.`);
    process.exit(1);
  }
  console.log('Internal link check passed.');
}

try {
  main();
} catch (error) {
  console.error('Internal link check crashed:', error);
  process.exit(1);
}
