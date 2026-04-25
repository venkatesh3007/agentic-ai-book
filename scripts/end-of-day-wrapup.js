#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const validateScript = path.join(repoRoot, 'scripts', 'validate-book.js');
const healthcheckScript = path.join(repoRoot, 'scripts', 'run-healthcheck.js');
const localRenderScript = path.join(repoRoot, 'scripts', 'render-with-local-quarto.js');
const summaryPath = path.join(repoRoot, 'END_OF_DAY_WRAPUP.md');
const placeholderJsonPath = path.join(repoRoot, 'placeholder-chapters.json');
const healthcheckJsonPath = path.join(repoRoot, 'reports', 'healthcheck-report.json');
const localRenderJsonPath = path.join(repoRoot, 'reports', 'local-render-report.json');
const dashboardScript = path.join(repoRoot, 'scripts', 'build-status-dashboard.js');
const dashboardJsonPath = path.join(repoRoot, 'reports', 'status-dashboard.json');
const statusSyncScript = path.join(repoRoot, 'scripts', 'sync-status-md.js');

const args = process.argv.slice(2);
const tagArgIndex = args.indexOf('--tag');
const wantsTag = tagArgIndex >= 0;
const tagNameArgIndex = args.indexOf('--tag-name');
const explicitTagName = tagNameArgIndex >= 0
  ? args[tagNameArgIndex + 1]
  : (wantsTag && args[tagArgIndex + 1] && !args[tagArgIndex + 1].startsWith('--') ? args[tagArgIndex + 1] : null);

function run(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
    ...options
  });
}

function formatCommand(command, commandArgs) {
  return [command, ...commandArgs].join(' ');
}

function section(title, bodyLines) {
  return [`## ${title}`, '', ...bodyLines, ''];
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function cleanText(value) {
  if (!value) return '';
  return value.trim();
}

function codeBlock(text) {
  const cleaned = cleanText(text);
  if (!cleaned) return ['```text', '(no output)', '```'];
  return ['```text', cleaned, '```'];
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`WARN: Failed to parse ${path.relative(repoRoot, filePath)}: ${error.message}`);
    return null;
  }
}

if (!fs.existsSync(validateScript)) {
  console.error(`ERROR: Missing validator script at ${path.relative(repoRoot, validateScript)}`);
  process.exit(1);
}

const validationCommand = formatCommand(process.execPath, [path.relative(repoRoot, validateScript)]);
const healthcheckCommand = formatCommand(process.execPath, [path.relative(repoRoot, healthcheckScript)]);
const localRenderCommand = formatCommand(process.execPath, [path.relative(repoRoot, localRenderScript), '.', '--to', 'html']);
const dashboardCommand = formatCommand(process.execPath, [path.relative(repoRoot, dashboardScript)]);
const statusSyncCommand = formatCommand(process.execPath, [path.relative(repoRoot, statusSyncScript)]);

function buildWrapupMarkdown({
  generatedAt,
  gitHeadShort,
  validation,
  placeholderCount,
  missingCount,
  nextPriority,
  hasHealthcheckScript,
  healthcheck,
  healthSummary,
  hasLocalRenderScript,
  localRender,
  localRenderSummary,
  hasDashboardScript,
  dashboard,
  dashboardSummary,
  hasStatusSyncScript,
  statusSync,
  dirtyTreeBeforeWrap,
  gitStatusBeforeWrap,
  tagMessage,
  validationCommand,
  healthcheckCommand,
  localRenderCommand,
  dashboardCommand,
  statusSyncCommand,
  localRenderPassed
}) {
  const summary = [];
  summary.push('# End-of-Day Wrap-Up', '');
  summary.push(`Generated: ${generatedAt}`, '');
  summary.push(`Git HEAD: ${gitHeadShort || 'unknown'}`, '');

  const overallStatus = [];
  if (validation.status === 0 && localRenderPassed) {
    overallStatus.push('- Overall result: manuscript validation passed and local HTML render passed.');
  } else {
    overallStatus.push('- Overall result: not fully green.');
    if (validation.status === 1) {
      overallStatus.push('- Validation found broken manuscript references.');
    } else if (validation.status === 2) {
      overallStatus.push(`- Validation found placeholder day chapters still needing honest rewrites (${placeholderCount ?? 'unknown'} remaining).`);
    } else if (validation.status !== 0) {
      overallStatus.push(`- Validation exited with status ${validation.status}.`);
    } else {
      overallStatus.push('- Validation passed.');
    }

    if (!hasLocalRenderScript) {
      overallStatus.push('- Local render wrapper is missing, so a render check could not be performed.');
    } else if (localRenderPassed) {
      overallStatus.push('- Local HTML render passed via the Quarto wrapper.');
    } else {
      overallStatus.push(`- Local HTML render failed${typeof localRender?.status === 'number' ? ` with status ${localRender.status}` : ''}.`);
    }
  }
  summary.push(...section('Summary', overallStatus));

  const manuscriptLines = [
    `- Referenced chapter files missing: ${missingCount ?? 'unknown'}`,
    `- Placeholder day chapters remaining: ${placeholderCount ?? 'unknown'}`
  ];
  if (nextPriority.length) {
    manuscriptLines.push('- Next priority rewrites:');
    for (const item of nextPriority) {
      manuscriptLines.push(`  - Day ${String(item.day).padStart(2, '0')} — \`${item.path}\``);
    }
  }
  summary.push(...section('Manuscript Integrity', manuscriptLines));

  summary.push(...section('Validation Command', [
    `- Command: \`${validationCommand}\``,
    `- Exit status: ${validation.status}`,
    ...codeBlock([validation.stdout, validation.stderr].filter(Boolean).join('\n'))
  ]));

  const healthLines = [];
  if (!hasHealthcheckScript) {
    healthLines.push('- Combined healthcheck script not found; skipping.');
  } else {
    healthLines.push(`- Command: \`${healthcheckCommand}\``);
    const exitValue = typeof healthcheck?.status === 'number' ? healthcheck.status : 'unknown';
    healthLines.push(`- Exit status: ${exitValue}`);
    if (healthSummary) {
      const overall = (healthSummary.overallStatus || 'unknown').toString().toUpperCase();
      healthLines.push(`- Overall status: ${overall} (exit ${healthSummary.exitCode ?? 'unknown'})`);
      if (Array.isArray(healthSummary.checks) && healthSummary.checks.length) {
        healthLines.push('- Checks:');
        for (const check of healthSummary.checks) {
          const title = check.title || check.id || 'Untitled';
          const status = (check.status || 'unknown').toString().toUpperCase();
          const exitCode = typeof check.exitCode === 'number' ? check.exitCode : 'n/a';
          const duration = typeof check.durationMs === 'number' ? `${Math.round(check.durationMs)} ms` : 'n/a';
          healthLines.push(`  - ${title}: ${status} (exit ${exitCode}, ${duration})`);
        }
      }
      healthLines.push('- Reports:');
      healthLines.push('  - `reports/healthcheck-report.md`');
      healthLines.push('  - `reports/healthcheck-report.json`');
    } else {
      healthLines.push('- Healthcheck JSON summary is missing or unreadable.');
    }
    const healthOutput = [healthcheck?.stdout || '', healthcheck?.stderr || ''].filter(Boolean).join('\n');
    healthLines.push(...codeBlock(healthOutput));
  }
  summary.push(...section('Combined Healthcheck', healthLines));

  const renderLines = [];
  if (!hasLocalRenderScript) {
    renderLines.push('- Render check not run: local render wrapper script is missing.');
    renderLines.push(...codeBlock('scripts/render-with-local-quarto.js: not found'));
  } else {
    renderLines.push(`- Command: \`${localRenderCommand}\``);
    renderLines.push(`- Exit status: ${typeof localRender?.status === 'number' ? localRender.status : 'unknown'}`);
    if (localRenderSummary?.quartoPath) {
      renderLines.push(`- Quarto binary: \`${localRenderSummary.quartoPath}\``);
    }
    if (localRenderSummary?.quartoVersion) {
      renderLines.push(`- Quarto version: ${localRenderSummary.quartoVersion}`);
    }
    if (typeof localRenderSummary?.outputDirExists === 'boolean') {
      renderLines.push(`- Output directory present: ${localRenderSummary.outputDirExists ? 'yes' : 'no'}`);
    }
    renderLines.push('- Reports:');
    renderLines.push('  - `reports/local-render-report.md`');
    renderLines.push('  - `reports/local-render-report.json`');
    renderLines.push(...codeBlock(localRenderSummary?.output || [localRender?.stdout, localRender?.stderr].filter(Boolean).join('\n')));
  }
  summary.push(...section('Render Check', renderLines));

  const dashboardLines = [];
  if (!hasDashboardScript) {
    dashboardLines.push('- Status dashboard script not found; skipping.');
  } else {
    dashboardLines.push(`- Command: \`${dashboardCommand}\``);
    dashboardLines.push(`- Exit status: ${typeof dashboard?.status === 'number' ? dashboard.status : 'unknown'}`);
    if (dashboardSummary) {
      dashboardLines.push(`- Overall status: ${(dashboardSummary.overallStatus || 'unknown').toString().toUpperCase()}`);
      dashboardLines.push(`- Snapshot freshness: ${(dashboardSummary.snapshotFreshness || 'unknown').toString().toUpperCase()}`);
      if (dashboardSummary.audits?.localRender) {
        const localStatus = (dashboardSummary.audits.localRender.status || 'unknown').toString().toUpperCase();
        const localExit = dashboardSummary.audits.localRender.exitCode;
        dashboardLines.push(`- Dashboard local render status: ${localStatus}${typeof localExit === 'number' ? ` (exit ${localExit})` : ''}`);
      }
      dashboardLines.push('- Reports:');
      dashboardLines.push('  - `reports/status-dashboard.md`');
      dashboardLines.push('  - `reports/status-dashboard.json`');
    } else {
      dashboardLines.push('- Dashboard JSON summary is missing or unreadable.');
    }
    const dashboardOutput = [dashboard?.stdout || '', dashboard?.stderr || ''].filter(Boolean).join('\n');
    dashboardLines.push(...codeBlock(dashboardOutput));
  }
  summary.push(...section('Status Dashboard', dashboardLines));

  const statusSyncLines = [];
  if (!hasStatusSyncScript) {
    statusSyncLines.push('- STATUS.md sync script not found; skipping.');
  } else {
    statusSyncLines.push(`- Command: \`${statusSyncCommand}\``);
    statusSyncLines.push(`- Exit status: ${typeof statusSync?.status === 'number' ? statusSync.status : 'unknown'}`);
    statusSyncLines.push('- Reports:');
    statusSyncLines.push('  - `STATUS.md`');
    const statusSyncOutput = [statusSync?.stdout || '', statusSync?.stderr || ''].filter(Boolean).join('\n');
    statusSyncLines.push(...codeBlock(statusSyncOutput));
  }
  summary.push(...section('STATUS.md Sync', statusSyncLines));

  const gitLines = [
    `- Working tree dirty before wrap-up write: ${dirtyTreeBeforeWrap ? 'yes' : 'no'}`,
    ...codeBlock(gitStatusBeforeWrap.stdout || gitStatusBeforeWrap.stderr)
  ];
  summary.push(...section('Git Working Tree', gitLines));
  summary.push(...section('Tagging', [tagMessage]));
  summary.push('## Notes', '', '- This wrap-up is intentionally honest: placeholder chapters or failed health checks keep the day from being marked fully green.', '- Local render success is recorded separately from the stricter PATH-based healthcheck so infrastructure reality is visible instead of flattened.', '- No network operations are performed by this script.', '');

  return summary.join('\n');
}

const validation = run(process.execPath, [validateScript]);

const hasHealthcheckScript = fs.existsSync(healthcheckScript);
let healthcheck = null;
let healthSummary = null;
if (hasHealthcheckScript) {
  healthcheck = run(process.execPath, [healthcheckScript]);
  healthSummary = readJsonIfExists(healthcheckJsonPath);
}

const placeholderData = readJsonIfExists(placeholderJsonPath);
const placeholderCount = placeholderData?.placeholderDayChapters?.length ?? null;
const missingCount = placeholderData?.missingChapters?.length ?? null;
const nextPriority = placeholderData?.nextPriority ?? [];

const hasLocalRenderScript = fs.existsSync(localRenderScript);
let localRender = null;
let localRenderSummary = null;
if (hasLocalRenderScript) {
  localRender = run(process.execPath, [localRenderScript, '.', '--to', 'html']);
  localRenderSummary = readJsonIfExists(localRenderJsonPath);
}

const hasDashboardScript = fs.existsSync(dashboardScript);
let dashboard = null;
let dashboardSummary = null;
if (hasDashboardScript) {
  dashboard = run(process.execPath, [dashboardScript]);
  dashboardSummary = readJsonIfExists(dashboardJsonPath);
}

const hasStatusSyncScript = fs.existsSync(statusSyncScript);
let statusSync = null;
if (hasStatusSyncScript) {
  statusSync = run(process.execPath, [statusSyncScript]);
}

const gitHead = run('git', ['rev-parse', '--short', 'HEAD']);
const gitStatusBeforeWrap = run('git', ['status', '--short']);
const dirtyTreeBeforeWrap = cleanText(gitStatusBeforeWrap.stdout).length > 0;

const localRenderPassed = localRenderSummary?.status === 'pass' || localRender?.status === 0;

let tagMessage = '- No tag requested.';
if (wantsTag) {
  const tagName = explicitTagName || `eod-${todayStamp()}`;
  const gitHeadFull = cleanText(run('git', ['rev-parse', 'HEAD']).stdout);
  if (!gitHeadFull) {
    tagMessage = `- Tag request failed: could not resolve HEAD for tag \`${tagName}\`.`;
  } else {
    const existingTag = run('git', ['tag', '--list', tagName]);
    if (cleanText(existingTag.stdout)) {
      const existingTarget = cleanText(run('git', ['rev-list', '-n', '1', tagName]).stdout);
      const currentHeadShort = cleanText(run('git', ['rev-parse', '--short', 'HEAD']).stdout);
      const existingTargetShort = existingTarget ? cleanText(run('git', ['rev-parse', '--short', existingTarget]).stdout) : '';
      if (existingTarget && gitHeadFull && existingTarget === gitHeadFull) {
        tagMessage = `- Tag request skipped: local tag \`${tagName}\` already exists at current HEAD (${currentHeadShort}).`;
      } else if (existingTargetShort) {
        tagMessage = `- Tag request skipped: local tag \`${tagName}\` already exists at ${existingTargetShort}, while current HEAD is ${currentHeadShort}.`;
      } else {
        tagMessage = `- Tag request skipped: local tag \`${tagName}\` already exists.`;
      }
    } else {
      const tagResult = run('git', ['tag', '-a', tagName, gitHeadFull, '-m', `End-of-day wrap-up ${todayStamp()}`]);
      if (tagResult.status === 0) {
        tagMessage = `- Local tag created at HEAD: \`${tagName}\`.${dirtyTreeBeforeWrap ? ' Working tree had uncommitted audit/output changes, but tagging the current commit is still valid for a daily milestone.' : ''}`;
      } else {
        tagMessage = `- Tag request failed for \`${tagName}\` (status ${tagResult.status}).`;
      }
    }
  }
}

let generatedAt = new Date().toISOString();
let wrapupText = buildWrapupMarkdown({
  generatedAt,
  gitHeadShort: cleanText(gitHead.stdout),
  validation,
  placeholderCount,
  missingCount,
  nextPriority,
  hasHealthcheckScript,
  healthcheck,
  healthSummary,
  hasLocalRenderScript,
  localRender,
  localRenderSummary,
  hasDashboardScript,
  dashboard,
  dashboardSummary,
  hasStatusSyncScript,
  statusSync,
  dirtyTreeBeforeWrap,
  gitStatusBeforeWrap,
  tagMessage,
  validationCommand,
  healthcheckCommand,
  localRenderCommand,
  dashboardCommand,
  statusSyncCommand,
  localRenderPassed
});
fs.writeFileSync(summaryPath, wrapupText);

if (hasDashboardScript) {
  dashboard = run(process.execPath, [dashboardScript]);
  dashboardSummary = readJsonIfExists(dashboardJsonPath);
}

generatedAt = new Date().toISOString();
wrapupText = buildWrapupMarkdown({
  generatedAt,
  gitHeadShort: cleanText(gitHead.stdout),
  validation,
  placeholderCount,
  missingCount,
  nextPriority,
  hasHealthcheckScript,
  healthcheck,
  healthSummary,
  hasLocalRenderScript,
  localRender,
  localRenderSummary,
  hasDashboardScript,
  dashboard,
  dashboardSummary,
  hasStatusSyncScript,
  statusSync,
  dirtyTreeBeforeWrap,
  gitStatusBeforeWrap,
  tagMessage,
  validationCommand,
  healthcheckCommand,
  localRenderCommand,
  dashboardCommand,
  statusSyncCommand,
  localRenderPassed
});
fs.writeFileSync(summaryPath, wrapupText);

console.log(`Wrote ${path.basename(summaryPath)}`);
console.log(cleanText(tagMessage).replace(/^-\s*/, ''));

let exitCode = 0;
if (validation.status === 1) {
  exitCode = 1;
} else if (validation.status === 2) {
  exitCode = Math.max(exitCode, 2);
}

if (!localRenderPassed) {
  exitCode = Math.max(exitCode, 2);
}

if (healthcheck && typeof healthcheck.status === 'number') {
  if (healthcheck.status === 1) {
    exitCode = 1;
  } else if (healthcheck.status === 2) {
    exitCode = Math.max(exitCode, 2);
  }
}

process.exit(exitCode);
