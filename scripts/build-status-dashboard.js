#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const reportDir = path.join(repoRoot, 'reports');
const dashboardMdPath = path.join(reportDir, 'status-dashboard.md');
const dashboardJsonPath = path.join(reportDir, 'status-dashboard.json');
const placeholderJsonPath = path.join(repoRoot, 'placeholder-chapters.json');
const healthJsonPath = path.join(reportDir, 'healthcheck-report.json');
const frontmatterJsonPath = path.join(reportDir, 'frontmatter-audit-report.json');
const linkJsonPath = path.join(reportDir, 'link-check-report.json');
const imageJsonPath = path.join(reportDir, 'image-audit-report.json');
const renderJsonPath = path.join(reportDir, 'render-environment-report.json');
const refreshJsonPath = path.join(reportDir, 'refresh-audits-report.json');
const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000;

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureReportDir() {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

function statusEmoji(status) {
  switch ((status || '').toLowerCase()) {
    case 'pass': return '✅';
    case 'warn': return '⚠️';
    case 'fail': return '❌';
    default: return '❓';
  }
}

function statusWord(status) {
  return (status || 'unknown').toString().toUpperCase();
}

function rel(p) {
  return path.relative(repoRoot, p).split(path.sep).join('/');
}

function parseGeneratedAt(payload) {
  if (!payload || !payload.generatedAt) return null;
  const time = Date.parse(payload.generatedAt);
  return Number.isNaN(time) ? null : time;
}

function formatAge(ms) {
  if (ms == null) return 'unknown age';
  const minutes = Math.round(ms / (60 * 1000));
  if (minutes < 60) return `${minutes} minute(s)`;
  const hours = (ms / (60 * 60 * 1000)).toFixed(1);
  return `${hours} hour(s)`;
}

function freshnessStatus(ageMs) {
  if (ageMs == null) return 'unknown';
  return ageMs > STALE_THRESHOLD_MS ? 'stale' : 'fresh';
}

function main() {
  ensureReportDir();

  const placeholder = readJson(placeholderJsonPath);
  const health = readJson(healthJsonPath);
  const frontmatter = readJson(frontmatterJsonPath);
  const links = readJson(linkJsonPath);
  const images = readJson(imageJsonPath);
  const render = readJson(renderJsonPath);
  const refresh = readJson(refreshJsonPath);

  if (!placeholder || !health || !frontmatter || !links || !images || !render) {
    console.error('ERROR: Missing one or more prerequisite JSON reports. Run the audits first.');
    process.exit(1);
  }

  const placeholderCount = placeholder.placeholderDayChapters?.length ?? null;
  const nextPriority = placeholder.nextPriority ?? [];
  const frontmatterWarnings = frontmatter.warnings?.length ?? 0;
  const frontmatterErrors = frontmatter.errors?.length ?? 0;
  const linkIssues = links.issues?.length ?? 0;
  const imageIssues = images.issues?.length ?? 0;
  const renderRequiredFailures = render.requiredFailures ?? [];
  const renderWarnings = render.warnings ?? [];
  const checks = health.checks ?? [];
  const generatedAtValues = [placeholder, health, frontmatter, links, images, render]
    .map(parseGeneratedAt)
    .filter((value) => value != null);
  const oldestGeneratedAt = generatedAtValues.length ? Math.min(...generatedAtValues) : null;
  const newestGeneratedAt = generatedAtValues.length ? Math.max(...generatedAtValues) : null;
  const now = Date.now();
  const oldestAgeMs = oldestGeneratedAt == null ? null : now - oldestGeneratedAt;
  const newestAgeMs = newestGeneratedAt == null ? null : now - newestGeneratedAt;
  const snapshotFreshness = freshnessStatus(oldestAgeMs);

  const blockers = [];
  if (snapshotFreshness === 'stale') {
    blockers.push(`Audit snapshot is stale (oldest report is ${formatAge(oldestAgeMs)} old); run \`npm run audit:refresh\``);
  }
  if (renderRequiredFailures.length) {
    blockers.push(`Render tooling missing required dependency: ${renderRequiredFailures.join(', ')}`);
  }
  if (placeholderCount) {
    blockers.push(`${placeholderCount} placeholder day chapters still need honest rewrites`);
  }
  if (frontmatterErrors) {
    blockers.push(`${frontmatterErrors} frontmatter error(s) remain`);
  }
  if (linkIssues) {
    blockers.push(`${linkIssues} broken internal link issue(s) remain`);
  }
  if (imageIssues) {
    blockers.push(`${imageIssues} image asset issue(s) remain`);
  }

  const wins = [];
  if (snapshotFreshness === 'fresh') wins.push(`Audit snapshot is fresh (oldest report age: ${formatAge(oldestAgeMs)})`);
  wins.push(`Bulk audit refresh command available via \`npm run audit:refresh\``);
  if (linkIssues === 0) wins.push('Internal link audit is clean');
  if (imageIssues === 0) wins.push('Image asset audit is clean');
  if (frontmatterErrors === 0) wins.push('Frontmatter audit has zero errors');
  wins.push(`Placeholder backlog currently at ${placeholderCount}`);

  const summary = {
    generatedAt: new Date().toISOString(),
    overallStatus: health.overallStatus,
    snapshotFreshness,
    snapshotGeneratedAt: {
      oldest: oldestGeneratedAt == null ? null : new Date(oldestGeneratedAt).toISOString(),
      newest: newestGeneratedAt == null ? null : new Date(newestGeneratedAt).toISOString(),
      oldestAgeMs,
      newestAgeMs
    },
    refreshReportGeneratedAt: refresh?.generatedAt ?? null,
    placeholderCount,
    nextPriority,
    blockers,
    wins,
    checks: checks.map((check) => ({
      id: check.id,
      title: check.title,
      status: check.status,
      exitCode: check.exitCode,
      durationMs: check.durationMs
    })),
    audits: {
      frontmatter: {
        warnings: frontmatterWarnings,
        errors: frontmatterErrors
      },
      links: {
        issues: linkIssues,
        checkedLinks: links.checkedLinks ?? null
      },
      images: {
        issues: imageIssues,
        imagesFound: images.imagesFound ?? null
      },
      render: {
        requiredFailures: renderRequiredFailures,
        warnings: renderWarnings
      }
    },
    sourceReports: [
      rel(placeholderJsonPath),
      rel(healthJsonPath),
      rel(frontmatterJsonPath),
      rel(linkJsonPath),
      rel(imageJsonPath),
      rel(renderJsonPath),
      rel(refreshJsonPath)
    ]
  };

  const lines = [];
  lines.push('# Repository Status Dashboard', '');
  lines.push(`- Generated: ${summary.generatedAt}`);
  lines.push(`- Overall status: ${statusEmoji(summary.overallStatus)} **${statusWord(summary.overallStatus)}**`);
  lines.push(`- Audit snapshot freshness: ${snapshotFreshness === 'fresh' ? '✅' : snapshotFreshness === 'stale' ? '⚠️' : '❓'} **${statusWord(snapshotFreshness)}**`);
  lines.push(`- Oldest source report: ${summary.snapshotGeneratedAt.oldest || 'unknown'} (${formatAge(oldestAgeMs)} old)`);
  lines.push(`- Newest source report: ${summary.snapshotGeneratedAt.newest || 'unknown'} (${formatAge(newestAgeMs)} old)`);
  lines.push(`- Placeholder day chapters remaining: **${placeholderCount}**`);
  lines.push('');

  lines.push('## Current Wins', '');
  if (wins.length) {
    for (const win of wins) lines.push(`- ${win}`);
  } else {
    lines.push('- None yet');
  }
  lines.push('');

  lines.push('## Current Blockers', '');
  if (blockers.length) {
    for (const blocker of blockers) lines.push(`- ${blocker}`);
  } else {
    lines.push('- None 🎉');
  }
  lines.push('');

  lines.push('## Next Priority Rewrites', '');
  if (nextPriority.length) {
    for (const item of nextPriority) {
      lines.push(`- Day ${String(item.day).padStart(2, '0')} — \`${item.path}\``);
    }
  } else {
    lines.push('- None');
  }
  lines.push('');

  lines.push('## Audit Snapshot', '');
  for (const check of checks) {
    lines.push(`- ${statusEmoji(check.status)} **${check.title}** — ${statusWord(check.status)} (exit ${check.exitCode}, ${check.durationMs} ms)`);
  }
  lines.push('');

  lines.push('## Detailed Counts', '');
  lines.push(`- Frontmatter warnings: **${frontmatterWarnings}**`);
  lines.push(`- Frontmatter errors: **${frontmatterErrors}**`);
  lines.push(`- Internal link issues: **${linkIssues}**`);
  lines.push(`- Image asset issues: **${imageIssues}**`);
  lines.push(`- Render required failures: **${renderRequiredFailures.length}**`);
  lines.push(`- Render warnings: **${renderWarnings.length}**`);
  lines.push('');

  lines.push('## Refresh Workflow', '');
  lines.push('- Run `npm run audit:refresh` to regenerate the prerequisite audit JSON files in one pass before rebuilding the dashboard.');
  if (summary.refreshReportGeneratedAt) {
    lines.push(`- Last bulk refresh report: ${summary.refreshReportGeneratedAt}`);
  } else {
    lines.push('- No bulk refresh report has been generated yet.');
  }
  lines.push('');

  lines.push('## Source Reports', '');
  for (const source of summary.sourceReports) {
    lines.push(`- \`${source}\``);
  }
  lines.push('');
  lines.push('---', '', '*Generated from existing repo-local audit JSON files so sessions can see the current state without reopening every full report.*', '');

  fs.writeFileSync(dashboardMdPath, lines.join('\n'));
  fs.writeFileSync(dashboardJsonPath, JSON.stringify(summary, null, 2) + '\n');

  console.log(`Wrote ${rel(dashboardMdPath)}`);
  console.log(`Wrote ${rel(dashboardJsonPath)}`);
}

try {
  main();
} catch (error) {
  console.error('Dashboard build failed:', error);
  process.exit(1);
}
