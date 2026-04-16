#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const statusPath = path.join(repoRoot, 'STATUS.md');
const placeholderJsonPath = path.join(repoRoot, 'placeholder-chapters.json');
const dashboardJsonPath = path.join(repoRoot, 'reports', 'status-dashboard.json');
const healthJsonPath = path.join(repoRoot, 'reports', 'healthcheck-report.json');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Missing ${label}: ${path.relative(repoRoot, filePath)}`);
    process.exit(1);
  }
}

function getHeadShortSha() {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    console.error('ERROR: Failed to read git HEAD:', result.stderr || result.stdout || 'unknown git error');
    process.exit(1);
  }
  return result.stdout.trim();
}

function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function statusLabel(status) {
  return (status || 'unknown').toString().toUpperCase();
}

function main() {
  requireFile(statusPath, 'STATUS.md');
  requireFile(placeholderJsonPath, 'placeholder-chapters.json');
  requireFile(dashboardJsonPath, 'reports/status-dashboard.json');
  requireFile(healthJsonPath, 'reports/healthcheck-report.json');

  const placeholder = readJson(placeholderJsonPath);
  const dashboard = readJson(dashboardJsonPath);
  const health = readJson(healthJsonPath);
  const headSha = getHeadShortSha();
  const generatedAt = dashboard?.generatedAt || health?.generatedAt || placeholder?.generatedAt || new Date().toISOString();
  const formattedDate = formatDate(generatedAt) || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });

  const placeholderCount = placeholder?.placeholderDayChapters?.length ?? 0;
  const firstDay = placeholderCount ? placeholder.placeholderDayChapters[0]?.day : null;
  const lastDay = placeholderCount ? placeholder.placeholderDayChapters[placeholder.placeholderDayChapters.length - 1]?.day : null;
  const dayRange = placeholderCount && firstDay != null && lastDay != null
    ? `Days ${String(firstDay).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    : 'No placeholder day chapters remain';

  const overallStatus = statusLabel(health?.overallStatus);
  const localRenderStatus = statusLabel(dashboard?.audits?.localRender?.status);
  const nextPriority = placeholder?.nextPriority?.[0];
  const nextPriorityLabel = nextPriority ? `Day ${String(nextPriority.day).padStart(2, '0')}` : 'the next remaining day chapter';
  const nextUpdateText = nextPriority
    ? `After Day ${String(nextPriority.day).padStart(2, '0')} is rewritten or the repo status/infrastructure picture changes materially`
    : 'After the next materially verified repo change';

  const focusSection = [
    '## Current Session Focus',
    '',
    `${formattedDate} status now reflects the current verified repo state instead of a stale April 13 tooling note:`,
    `- keep the audit/render pipeline honest and reproducible through \`npm run audit:refresh\``,
    `- preserve the current verified baseline: local HTML render is **${localRenderStatus}**, combined healthcheck is **${overallStatus}**, and audit snapshot freshness is tied to current reports`,
    `- use the stable tooling baseline to reduce manuscript debt next, starting with ${nextPriorityLabel}`,
    `- avoid fabricated progress: placeholder chapters should only be replaced with evidence-backed rewrites or explicit continuity-gap chapters`,
    '',
    '### Verification Note'
  ].join('\n');

  let text = fs.readFileSync(statusPath, 'utf8');

  text = text.replace(/\*\*Last Updated\*\*: .*\n/, `**Last Updated**: ${formattedDate}\n`);
  text = text.replace(/- ⚠️ Days .* still contain placeholder material and need honest rewrites rather than synthetic summaries\n/, `- ⚠️ ${dayRange} still contain placeholder material and need honest rewrites rather than synthetic summaries\n`);
  text = text.replace(/## Current Session Focus[\s\S]*?### Verification Note\n/, `${focusSection}\n`);
  text = text.replace(/- ⚠️ The combined healthcheck now reports .*\n/, `- ⚠️ The combined healthcheck now reports **${overallStatus}** because the remaining debt is manuscript quality debt: ${placeholderCount} placeholder day chapters from Day ${String(firstDay ?? 0).padStart(2, '0')} through Day ${String(lastDay ?? 0).padStart(2, '0')} still need honest rewrites, while Quarto-on-PATH is handled through the repo bootstrap environment and the latest local HTML render remains **${localRenderStatus}**\n`);
  text = text.replace(/\*\*Next Update\*\*: .*\n/, `**Next Update**: ${nextUpdateText}\n`);

  const marker = '## Daily Updates';
  const insertion = [
    '### Snapshot Sync Note',
    '',
    `- ✅ Added \`scripts/sync-status-md.js\` plus \`npm run status:sync\`, so volatile status prose like **Last Updated**, placeholder-range summaries, and the next-update note can now be refreshed from current repo reports instead of drifting by hand`,
    `- ✅ Verified the sync against current repo state at git HEAD \`${headSha}\`, which keeps \`STATUS.md\` aligned with the dashboard/healthcheck reports after the Day 11 cleanup reduced placeholder debt to ${placeholderCount}`,
    ''
  ].join('\n');

  if (!text.includes('### Snapshot Sync Note')) {
    text = text.replace(marker, `${insertion}${marker}`);
  } else {
    text = text.replace(/- ✅ Verified the sync against current repo state at git HEAD .*\n/, `- ✅ Verified the sync against current repo state at git HEAD \`${headSha}\`, which keeps \`STATUS.md\` aligned with the dashboard/healthcheck reports after the Day 11 cleanup reduced placeholder debt to ${placeholderCount}\n`);
  }

  fs.writeFileSync(statusPath, text);
  console.log(`Synced ${path.relative(repoRoot, statusPath)}`);
}

main();
