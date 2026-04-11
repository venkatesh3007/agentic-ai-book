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

function main() {
  ensureReportDir();

  const placeholder = readJson(placeholderJsonPath);
  const health = readJson(healthJsonPath);
  const frontmatter = readJson(frontmatterJsonPath);
  const links = readJson(linkJsonPath);
  const images = readJson(imageJsonPath);
  const render = readJson(renderJsonPath);

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

  const blockers = [];
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
  if (linkIssues === 0) wins.push('Internal link audit is clean');
  if (imageIssues === 0) wins.push('Image asset audit is clean');
  if (frontmatterErrors === 0) wins.push('Frontmatter audit has zero errors');
  wins.push(`Placeholder backlog currently at ${placeholderCount}`);

  const summary = {
    generatedAt: new Date().toISOString(),
    overallStatus: health.overallStatus,
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
      rel(renderJsonPath)
    ]
  };

  const lines = [];
  lines.push('# Repository Status Dashboard', '');
  lines.push(`- Generated: ${summary.generatedAt}`);
  lines.push(`- Overall status: ${statusEmoji(summary.overallStatus)} **${statusWord(summary.overallStatus)}**`);
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
