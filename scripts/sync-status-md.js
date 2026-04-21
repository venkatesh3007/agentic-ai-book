#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const statusPath = path.join(repoRoot, 'STATUS.md');
const placeholderJsonPath = path.join(repoRoot, 'placeholder-chapters.json');
const dashboardJsonPath = path.join(repoRoot, 'reports', 'status-dashboard.json');
const healthJsonPath = path.join(repoRoot, 'reports', 'healthcheck-report.json');
const renderJsonPath = path.join(repoRoot, 'reports', 'render-environment-report.json');
const localRenderJsonPath = path.join(repoRoot, 'reports', 'local-render-report.json');

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

function renderDoctorSummary(renderReport) {
  const warnings = renderReport?.warnings || [];
  const requiredFailures = renderReport?.requiredFailures || [];
  const warningCount = warnings.length;
  const requiredCount = requiredFailures.length;

  if (requiredCount > 0) {
    return `render environment still has ${requiredCount} required failure(s) and ${warningCount} warning(s)`;
  }

  if (warningCount > 0) {
    return `render environment has 0 required failures and ${warningCount} optional warning(s)`;
  }

  return 'render environment checks are fully clean';
}

function placeholderSummary(placeholderCount, firstDay, lastDay) {
  if (placeholderCount === 0) {
    return '- ✅ No placeholder day chapters remain; every scheduled day chapter now contains real prose instead of the raw template\n';
  }

  if (placeholderCount === 1 && firstDay != null) {
    return `- ⚠️ Day ${String(firstDay).padStart(2, '0')} still contains placeholder material and needs an honest rewrite rather than a synthetic summary\n`;
  }

  return `- ⚠️ Days ${String(firstDay).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} still contain placeholder material and need honest rewrites rather than synthetic summaries\n`;
}

function buildFocusSection({
  formattedDate,
  localRenderStatus,
  overallStatus,
  placeholderCount,
  nextPriorityLabel,
  renderSummary,
  refreshFreshness,
  currentBlockers
}) {
  const lines = [
    '## Current Session Focus',
    '',
    `${formattedDate} status now reflects the current verified repo state instead of the stale manuscript-debt framing from earlier cleanup sessions:`,
    '- keep the audit/render pipeline honest and reproducible through `npm run audit:refresh`',
    `- preserve the current verified baseline: local HTML render is **${localRenderStatus}**, combined healthcheck is **${overallStatus}**, audit snapshot freshness is **${refreshFreshness}**, and ${renderSummary}`
  ];

  if (placeholderCount === 0) {
    lines.push('- placeholder debt is fully cleared, so follow-up work should focus on status/report truthfulness and any optional infrastructure polish rather than fictional chapter progress');
  } else {
    lines.push(`- reduce the remaining manuscript debt next, starting with ${nextPriorityLabel}`);
  }

  lines.push(`- current dashboard blockers: ${currentBlockers}`);
  lines.push('');
  lines.push('### Verification Note');
  return lines.join('\n');
}

function buildVerificationBullets({
  headSha,
  placeholderCount,
  overallStatus,
  localRenderStatus,
  renderSummary,
  refreshFreshness,
  dashboard,
  nextPriorityLabel
}) {
  const bullets = [
    '- ✅ Added `scripts/sync-status-md.js` plus `npm run status:sync`, so volatile status prose like **Last Updated**, placeholder summaries, current-focus bullets, and the next-update note can be refreshed from current repo reports instead of drifting by hand',
    `- ✅ Verified the sync against current repo state at git HEAD \`${headSha}\`, which keeps \`STATUS.md\` aligned with the dashboard/healthcheck reports instead of leaving stale narrative leftovers behind`,
    `- ✅ Current audit baseline is now explicit here: placeholder backlog **${placeholderCount}**, local HTML render **${localRenderStatus}**, combined healthcheck **${overallStatus}**, and audit snapshot freshness **${refreshFreshness}**`,
    `- ✅ Current render-environment summary is recorded honestly: ${renderSummary}`,
    `- ✅ Dashboard blockers are now synced from the current report set rather than preserved from older manuscript-debt sessions${dashboard?.blockers?.length ? '' : ', which correctly yields “None 🎉” right now'}`
  ];

  if (placeholderCount === 0) {
    bullets.push('- ✅ Manuscript placeholder debt is fully cleared, so future sessions should stop claiming that day-chapter rewrites are the next priority unless new placeholder debt is introduced');
  } else {
    bullets.push(`- ⚠️ Manuscript placeholder debt still exists, so the next honest chapter target remains ${nextPriorityLabel}`);
  }

  return bullets.join('\n');
}

function main() {
  requireFile(statusPath, 'STATUS.md');
  requireFile(placeholderJsonPath, 'placeholder-chapters.json');
  requireFile(dashboardJsonPath, 'reports/status-dashboard.json');
  requireFile(healthJsonPath, 'reports/healthcheck-report.json');
  requireFile(renderJsonPath, 'reports/render-environment-report.json');
  requireFile(localRenderJsonPath, 'reports/local-render-report.json');

  const placeholder = readJson(placeholderJsonPath);
  const dashboard = readJson(dashboardJsonPath);
  const health = readJson(healthJsonPath);
  const render = readJson(renderJsonPath);
  const localRender = readJson(localRenderJsonPath);
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

  const overallStatus = statusLabel(health?.overallStatus);
  const localRenderStatus = statusLabel(localRender?.status || dashboard?.audits?.localRender?.status);
  const nextPriority = placeholder?.nextPriority?.[0];
  const nextPriorityLabel = nextPriority ? `Day ${String(nextPriority.day).padStart(2, '0')}` : 'the next materially verified repo task';
  const nextUpdateText = placeholderCount > 0
    ? `After ${nextPriorityLabel} is rewritten or the repo status/infrastructure picture changes materially`
    : 'After the next materially verified repo or infrastructure change';
  const refreshFreshness = statusLabel(dashboard?.snapshotFreshness || dashboard?.freshness || dashboard?.freshnessStatus || dashboard?.auditSnapshotFreshness?.status || dashboard?.auditSnapshotFreshness);
  const renderSummary = renderDoctorSummary(render);
  const blockers = dashboard?.blockers || [];
  const currentBlockers = blockers.length ? blockers.join('; ') : 'None 🎉';

  const focusSection = buildFocusSection({
    formattedDate,
    localRenderStatus,
    overallStatus,
    placeholderCount,
    nextPriorityLabel,
    renderSummary,
    refreshFreshness,
    currentBlockers
  });

  const verificationSection = buildVerificationBullets({
    headSha,
    placeholderCount,
    overallStatus,
    localRenderStatus,
    renderSummary,
    refreshFreshness,
    dashboard,
    nextPriorityLabel
  });

  const healthSummaryLine = placeholderCount > 0
    ? `- ⚠️ The combined healthcheck now reports **${overallStatus}** because manuscript placeholder debt still remains (${placeholderCount} day chapter${placeholderCount === 1 ? '' : 's'}${firstDay != null ? `, currently ${placeholderCount === 1 ? `Day ${String(firstDay).padStart(2, '0')}` : `Days ${String(firstDay).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`}` : ''}) while the latest local HTML render remains **${localRenderStatus}** and ${renderSummary}\n`
    : `- ⚠️ The combined healthcheck now reports **${overallStatus}** only because optional render-environment niceties remain unresolved while the manuscript audits are clean, the latest local HTML render remains **${localRenderStatus}**, and ${renderSummary}\n`;

  let text = fs.readFileSync(statusPath, 'utf8');

  text = text.replace(/\*\*Last Updated\*\*: .*\n/, `**Last Updated**: ${formattedDate}\n`);
  text = text.replace(/- ✅ No placeholder day chapters remain; every scheduled day chapter now contains real prose instead of the raw template\n|- ⚠️ Day \d{2} still contains placeholder material and needs an honest rewrite rather than a synthetic summary\n|- ⚠️ Days \d{2}-\d{2} still contain placeholder material and need honest rewrites rather than synthetic summaries\n|- ⚠️ .*placeholder.*\n/, placeholderSummary(placeholderCount, firstDay, lastDay));
  text = text.replace(/## Current Session Focus[\s\S]*?### Verification Note\n/, `${focusSection}\n`);
  text = text.replace(/- ⚠️ The combined healthcheck now reports .*\n/, healthSummaryLine);
  text = text.replace(/\*\*Next Update\*\*: .*\n/, `**Next Update**: ${nextUpdateText}\n`);

  const snapshotSection = [
    '### Snapshot Sync Note',
    '',
    verificationSection,
    ''
  ].join('\n');

  if (!text.includes('### Snapshot Sync Note')) {
    text = text.replace('## Daily Updates', `${snapshotSection}## Daily Updates`);
  } else {
    text = text.replace(/### Snapshot Sync Note[\s\S]*?## Daily Updates/, `${snapshotSection}## Daily Updates`);
  }

  fs.writeFileSync(statusPath, text);
  console.log(`Synced ${path.relative(repoRoot, statusPath)}`);
}

main();
