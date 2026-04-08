#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const validateScript = path.join(repoRoot, 'scripts', 'validate-book.js');
const summaryPath = path.join(repoRoot, 'END_OF_DAY_WRAPUP.md');
const placeholderJsonPath = path.join(repoRoot, 'placeholder-chapters.json');

const args = process.argv.slice(2);
const wantsTag = args.includes('--tag');
const tagNameArgIndex = args.indexOf('--tag-name');
const explicitTagName = tagNameArgIndex >= 0 ? args[tagNameArgIndex + 1] : null;

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

if (!fs.existsSync(validateScript)) {
  console.error(`ERROR: Missing validator script at ${path.relative(repoRoot, validateScript)}`);
  process.exit(1);
}

const validationCommand = formatCommand(process.execPath, [path.relative(repoRoot, validateScript)]);
const validation = run(process.execPath, [validateScript]);

let placeholderData = null;
if (fs.existsSync(placeholderJsonPath)) {
  placeholderData = JSON.parse(fs.readFileSync(placeholderJsonPath, 'utf8'));
}

const placeholderCount = placeholderData?.placeholderDayChapters?.length ?? null;
const missingCount = placeholderData?.missingChapters?.length ?? null;
const nextPriority = placeholderData?.nextPriority ?? [];

const quartoCheck = run('quarto', ['--version']);
const quartoAvailable = quartoCheck.status === 0;

let renderAttempt = null;
if (quartoAvailable) {
  renderAttempt = run('quarto', ['render']);
}

const gitHead = run('git', ['rev-parse', '--short', 'HEAD']);
const gitStatus = run('git', ['status', '--short']);
const dirtyTree = cleanText(gitStatus.stdout).length > 0;

const summary = [];
summary.push('# End-of-Day Wrap-Up', '');
summary.push(`Generated: ${new Date().toISOString()}`, '');
summary.push(`Git HEAD: ${cleanText(gitHead.stdout) || 'unknown'}`, '');

const overallStatus = [];
if (validation.status === 0 && quartoAvailable && renderAttempt?.status === 0) {
  overallStatus.push('- Overall result: local validation passed and Quarto render passed.');
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

  if (!quartoAvailable) {
    overallStatus.push('- Quarto CLI is not available in this environment, so a render check could not be performed.');
  } else if (renderAttempt && renderAttempt.status !== 0) {
    overallStatus.push(`- Quarto render ran but failed with status ${renderAttempt.status}.`);
  } else if (renderAttempt && renderAttempt.status === 0) {
    overallStatus.push('- Quarto render passed.');
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

const renderLines = [];
if (!quartoAvailable) {
  renderLines.push('- Render check not run: `quarto` command not found.');
  renderLines.push(...codeBlock(quartoCheck.stderr || quartoCheck.stdout || 'quarto: command not found'));
} else {
  renderLines.push('- Command: `quarto render`');
  renderLines.push(`- Exit status: ${renderAttempt.status}`);
  renderLines.push(...codeBlock([renderAttempt.stdout, renderAttempt.stderr].filter(Boolean).join('\n')));
}
summary.push(...section('Render Check', renderLines));

const gitLines = [
  `- Working tree dirty at wrap-up time: ${dirtyTree ? 'yes' : 'no'}`,
  ...codeBlock(gitStatus.stdout || gitStatus.stderr)
];
summary.push(...section('Git Working Tree', gitLines));

let tagMessage = '- No tag requested.';
if (wantsTag) {
  const tagName = explicitTagName || `eod-${todayStamp()}`;
  if (dirtyTree) {
    tagMessage = `- Tag request skipped: working tree is dirty, so local tag \`${tagName}\` was not created.`;
  } else {
    const existingTag = run('git', ['tag', '--list', tagName]);
    if (cleanText(existingTag.stdout)) {
      tagMessage = `- Tag request skipped: local tag \`${tagName}\` already exists.`;
    } else {
      const tagResult = run('git', ['tag', '-a', tagName, '-m', `End-of-day wrap-up ${todayStamp()}`]);
      if (tagResult.status === 0) {
        tagMessage = `- Local tag created: \`${tagName}\`.`;
      } else {
        tagMessage = `- Tag request failed for \`${tagName}\` (status ${tagResult.status}).`;
      }
    }
  }
}
summary.push(...section('Tagging', [tagMessage]));

summary.push('## Notes', '', '- This wrap-up is intentionally honest: placeholder chapters or missing render tooling keep the day from being marked fully green.', '- No network operations are performed by this script.', '');

fs.writeFileSync(summaryPath, summary.join('\n'));
console.log(`Wrote ${path.basename(summaryPath)}`);
console.log(cleanText(tagMessage).replace(/^-\s*/, ''));

if (validation.status === 1) {
  process.exit(1);
}
if (validation.status === 2 || !quartoAvailable || (renderAttempt && renderAttempt.status !== 0)) {
  process.exit(2);
}
process.exit(0);
