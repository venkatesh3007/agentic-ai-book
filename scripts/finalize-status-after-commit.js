#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const statusPath = path.join(repoRoot, 'STATUS.md');

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

if (!fs.existsSync(statusPath)) {
  console.error('ERROR: Missing STATUS.md');
  process.exit(1);
}

const headSha = getHeadShortSha();
let text = fs.readFileSync(statusPath, 'utf8');
const oldText = text;

text = text.replace(
  /- ✅ Verified the sync against current repo state at git HEAD `[^`]+`, which keeps `STATUS\.md` aligned with the dashboard\/healthcheck reports[^\n]*(?:\n|$)/,
  match => match.replace(/git HEAD `[^`]+`/, `git HEAD \`${headSha}\``)
);

if (text === oldText) {
  console.error('ERROR: Could not update Snapshot Sync Note HEAD line in STATUS.md');
  process.exit(1);
}

fs.writeFileSync(statusPath, text);
console.log(`Updated STATUS.md snapshot note to HEAD ${headSha}`);
