#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'reports');
const markdownPath = path.join(reportDir, 'healthcheck-report.md');
const jsonPath = path.join(reportDir, 'healthcheck-report.json');
const MAX_LOG_CHARS = 4000;

const checks = [
  {
    id: 'placeholder-audit',
    title: 'Placeholder Audit',
    description: 'Validates _quarto.yml references and flags day chapters that are still placeholder templates.',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'validate-book.js')],
    reportPaths: ['PLACEHOLDER_CHAPTERS.md', 'placeholder-chapters.json'],
    warnOn: new Set([2])
  },
  {
    id: 'internal-links',
    title: 'Internal Link Audit',
    description: 'Scans Markdown/QMD files for broken repo-local links and missing anchors.',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'check-internal-links.js')],
    reportPaths: ['reports/link-check-report.md', 'reports/link-check-report.json']
  },
  {
    id: 'image-assets',
    title: 'Image Asset Audit',
    description: 'Ensures every referenced image exists inside the repository with a valid extension.',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'check-image-assets.js')],
    reportPaths: ['reports/image-audit-report.md', 'reports/image-audit-report.json']
  },
  {
    id: 'frontmatter-audit',
    title: 'Frontmatter Audit',
    description: 'Checks QMD frontmatter for required metadata and placeholder leftovers.',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'check-frontmatter.js')],
    reportPaths: ['reports/frontmatter-audit-report.md', 'reports/frontmatter-audit-report.json'],
    warnOn: new Set([2])
  },
  {
    id: 'render-doctor',
    title: 'Render Environment Doctor',
    description: 'Checks the local machine for the tools required to run a trustworthy `quarto render`.',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'render-environment-doctor.js')],
    reportPaths: ['reports/render-environment-report.md', 'reports/render-environment-report.json'],
    warnOn: new Set([2])
  }
];

function ensureReportDir() {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

function truncate(text) {
  if (!text) return '';
  if (text.length <= MAX_LOG_CHARS) return text;
  return text.slice(0, MAX_LOG_CHARS) + '\n… (output truncated)';
}

function toPosix(relPath) {
  return relPath.split(path.sep).join('/');
}

function normalizeRel(p) {
  const absolute = p.startsWith(repoRoot) ? p : path.join(repoRoot, p);
  return toPosix(path.relative(repoRoot, absolute));
}

function formatCommand(command, args) {
  const renderedArgs = args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg));
  return [command, ...renderedArgs].join(' ').trim();
}

function runCheck(def) {
  const startedAt = Date.now();
  const result = spawnSync(def.command, def.args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  const durationMs = Date.now() - startedAt;
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  const logs = truncate([result.stdout || '', result.stderr || ''].filter(Boolean).join('\n').trim());
  const errorMessage = result.error ? result.error.message : null;
  const warnSet = def.warnOn || new Set();

  let status = 'pass';
  if (exitCode !== 0) {
    status = warnSet.has(exitCode) ? 'warn' : 'fail';
  }

  return {
    id: def.id,
    title: def.title,
    description: def.description,
    command: formatCommand(def.command, def.args),
    exitCode,
    durationMs,
    status,
    logs,
    error: errorMessage,
    reportPaths: (def.reportPaths || []).map((p) => normalizeRel(path.join(repoRoot, p)))
  };
}

function statusLabel(status) {
  if (status === 'pass') return '✅ PASS';
  if (status === 'warn') return '⚠️ WARN';
  return '❌ FAIL';
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function writeMarkdown(summary) {
  const lines = [];
  lines.push('# Repository Healthcheck Report', '');
  lines.push(`- Generated: ${summary.generatedAt}`);
  lines.push(`- Overall status: **${summary.overallStatus.toUpperCase()}** (${statusLabel(summary.overallStatus)})`);
  lines.push(`- Checks run: ${summary.checks.length}`);
  lines.push(`- Exit code: ${summary.exitCode}`);
  lines.push('');

  lines.push('## Check Results', '');
  for (const check of summary.checks) {
    lines.push(`### ${check.title} — ${statusLabel(check.status)}`);
    lines.push('');
    lines.push(`- Description: ${check.description}`);
    lines.push(`- Command: \`${check.command}\``);
    lines.push(`- Exit code: ${check.exitCode}`);
    lines.push(`- Duration: ${formatDuration(check.durationMs)}`);
    if (check.reportPaths.length) {
      lines.push('- Reports:');
      for (const report of check.reportPaths) {
        lines.push(`  - \`${report}\``);
      }
    }
    if (check.error) {
      lines.push(`- Spawn error: ${check.error}`);
    }
    if (check.logs) {
      lines.push('', '<details>', '<summary>Output</summary>', '', '```text', check.logs, '```', '</details>');
    }
    lines.push('');
  }

  lines.push('---', '', '*This combined healthcheck runs entirely repo-local audits without invoking Quarto render.*');
  fs.writeFileSync(markdownPath, lines.join('\n'));
}

function writeJson(summary) {
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2) + '\n');
}

function main() {
  ensureReportDir();
  const results = checks.map(runCheck);
  const hasFail = results.some((result) => result.status === 'fail');
  const hasWarn = results.some((result) => result.status === 'warn');

  const overallStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';
  const exitCode = hasFail ? 1 : hasWarn ? 2 : 0;

  const summary = {
    generatedAt: new Date().toISOString(),
    overallStatus,
    exitCode,
    checks: results
  };

  writeMarkdown(summary);
  writeJson(summary);

  console.log(`Healthcheck ${overallStatus.toUpperCase()} (exit ${exitCode}). Report written to ${toPosix(path.relative(repoRoot, markdownPath))}`);
  process.exit(exitCode);
}

try {
  main();
} catch (error) {
  console.error('Healthcheck crashed:', error);
  process.exit(1);
}
