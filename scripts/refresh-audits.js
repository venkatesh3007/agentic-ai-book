#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'reports');
const reportMdPath = path.join(reportDir, 'refresh-audits-report.md');
const reportJsonPath = path.join(reportDir, 'refresh-audits-report.json');

const commands = [
  {
    id: 'placeholders',
    title: 'Placeholder Audit',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'validate-book.js')],
    warnOn: new Set([2]),
    reports: ['PLACEHOLDER_CHAPTERS.md', 'placeholder-chapters.json']
  },
  {
    id: 'links',
    title: 'Internal Link Audit',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'check-internal-links.js')],
    warnOn: new Set([]),
    reports: ['reports/link-check-report.md', 'reports/link-check-report.json']
  },
  {
    id: 'images',
    title: 'Image Asset Audit',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'check-image-assets.js')],
    warnOn: new Set([]),
    reports: ['reports/image-audit-report.md', 'reports/image-audit-report.json']
  },
  {
    id: 'frontmatter',
    title: 'Frontmatter Audit',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'check-frontmatter.js')],
    warnOn: new Set([2]),
    reports: ['reports/frontmatter-audit-report.md', 'reports/frontmatter-audit-report.json']
  },
  {
    id: 'render',
    title: 'Render Environment Doctor',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'render-environment-doctor.js')],
    warnOn: new Set([2]),
    reports: ['reports/render-environment-report.md', 'reports/render-environment-report.json']
  },
  {
    id: 'health',
    title: 'Combined Healthcheck',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'run-healthcheck.js')],
    warnOn: new Set([2]),
    reports: ['reports/healthcheck-report.md', 'reports/healthcheck-report.json']
  },
  {
    id: 'dashboard',
    title: 'Status Dashboard',
    command: process.execPath,
    args: [path.join(repoRoot, 'scripts', 'build-status-dashboard.js')],
    warnOn: new Set([]),
    reports: ['reports/status-dashboard.md', 'reports/status-dashboard.json']
  }
];

function ensureReportDir() {
  fs.mkdirSync(reportDir, { recursive: true });
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function formatCommand(command, args) {
  return [command, ...args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg))].join(' ');
}

function truncate(text, max = 3000) {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max)}\n… (output truncated)`;
}

function statusFromExit(exitCode, warnOn) {
  if (exitCode === 0) return 'pass';
  if (warnOn.has(exitCode)) return 'warn';
  return 'fail';
}

function runOne(def) {
  const startedAt = Date.now();
  const result = spawnSync(def.command, def.args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  const durationMs = Date.now() - startedAt;
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  const output = truncate([result.stdout || '', result.stderr || ''].filter(Boolean).join('\n').trim());
  return {
    id: def.id,
    title: def.title,
    command: formatCommand(def.command, def.args),
    exitCode,
    status: statusFromExit(exitCode, def.warnOn),
    durationMs,
    output,
    reports: def.reports
  };
}

function statusEmoji(status) {
  if (status === 'pass') return '✅';
  if (status === 'warn') return '⚠️';
  return '❌';
}

function main() {
  ensureReportDir();
  const startedAt = new Date().toISOString();
  const results = commands.map(runOne);
  const hasFail = results.some((item) => item.status === 'fail');
  const hasWarn = results.some((item) => item.status === 'warn');
  const overallStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';
  const exitCode = hasFail ? 1 : hasWarn ? 2 : 0;

  const summary = {
    generatedAt: startedAt,
    overallStatus,
    exitCode,
    results
  };

  fs.writeFileSync(reportJsonPath, JSON.stringify(summary, null, 2) + '\n');

  const md = [];
  md.push('# Audit Refresh Report', '');
  md.push(`- Generated: ${startedAt}`);
  md.push(`- Overall status: ${statusEmoji(overallStatus)} **${overallStatus.toUpperCase()}**`);
  md.push(`- Commands run: ${results.length}`);
  md.push('');
  md.push('## Results', '');
  for (const item of results) {
    md.push(`### ${statusEmoji(item.status)} ${item.title}`);
    md.push(`- Command: \`${item.command}\``);
    md.push(`- Exit code: ${item.exitCode}`);
    md.push(`- Duration: ${item.durationMs} ms`);
    if (item.reports?.length) {
      md.push('- Reports:');
      for (const report of item.reports) md.push(`  - \`${report}\``);
    }
    if (item.output) {
      md.push('', '<details>', '<summary>Output</summary>', '', '```text', item.output, '```', '</details>');
    }
    md.push('');
  }

  fs.writeFileSync(reportMdPath, md.join('\n') + '\n');

  console.log(`Wrote ${toPosix(path.relative(repoRoot, reportMdPath))}`);
  console.log(`Wrote ${toPosix(path.relative(repoRoot, reportJsonPath))}`);
  process.exit(exitCode);
}

try {
  main();
} catch (error) {
  console.error('Audit refresh failed:', error);
  process.exit(1);
}
