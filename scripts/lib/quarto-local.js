const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const QUARTO_CANDIDATE_PATHS = [
  path.join(os.homedir(), 'quarto', 'bin', 'quarto'),
  path.join(os.homedir(), 'bin', 'quarto'),
  path.join(os.homedir(), 'bin', 'bin', 'quarto'),
  '/usr/local/bin/quarto',
  '/usr/bin/quarto',
  '/opt/quarto/bin/quarto'
];

function runCommand(command, args = []) {
  try {
    const result = spawnSync(command, args, { encoding: 'utf8' });
    if (result.error && result.error.code === 'ENOENT') {
      return { status: 'not-found' };
    }
    return {
      status: result.status === 0 ? 'ok' : 'error',
      exitCode: result.status,
      stdout: result.stdout?.trim() || '',
      stderr: result.stderr?.trim() || ''
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'not-found' };
    return { status: 'error', stderr: String(error) };
  }
}

function extractVersion(text) {
  if (!text) return null;
  const match = text.match(/(\d+\.\d+\.\d+)/);
  if (match) return match[1];
  const shorter = text.match(/(\d+\.\d+)/);
  return shorter ? `${shorter[1]}.0` : null;
}

function probeQuartoBinary(candidatePath) {
  const probe = runCommand(candidatePath, ['--version']);
  if (probe.status !== 'ok') {
    return {
      path: candidatePath,
      version: extractVersion(probe.stdout || probe.stderr),
      status: probe.status
    };
  }

  return {
    path: candidatePath,
    version: extractVersion(probe.stdout || probe.stderr),
    status: 'ok'
  };
}

function discoverLocalQuartoBinaries() {
  const discovered = [];
  for (const candidate of QUARTO_CANDIDATE_PATHS) {
    if (!fs.existsSync(candidate)) continue;
    discovered.push(probeQuartoBinary(candidate));
  }
  return discovered;
}

function findWorkingLocalQuarto() {
  return discoverLocalQuartoBinaries().find((item) => item.status === 'ok') || null;
}

module.exports = {
  QUARTO_CANDIDATE_PATHS,
  discoverLocalQuartoBinaries,
  extractVersion,
  findWorkingLocalQuarto,
  runCommand
};
