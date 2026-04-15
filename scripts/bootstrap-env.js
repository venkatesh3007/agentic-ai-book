#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { withRepoToolPath } = require('./lib/runtime-env');

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/bootstrap-env.js <command> [args...]');
    process.exit(1);
  }

  const [command, ...commandArgs] = args;
  const { env } = withRepoToolPath(process.env);
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    env
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(typeof result.status === 'number' ? result.status : 1);
}

main();
