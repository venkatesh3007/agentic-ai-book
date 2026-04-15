#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  discoverLocalQuartoBinaries,
  extractVersion,
  runCommand
} = require('./lib/quarto-local');
const { withRepoToolPath } = require('./lib/runtime-env');

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, 'reports');
const markdownReportPath = path.join(reportsDir, 'render-environment-report.md');
const jsonReportPath = path.join(reportsDir, 'render-environment-report.json');

const REQUIRED_MIN_VERSIONS = {
  node: '18.0.0',
  npm: '9.0.0',
  git: '2.30.0',
  quarto: '1.4.0'
};

function ensureReportsDir() {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function parseSemver(value) {
  if (!value) return null;
  const cleaned = value.trim().replace(/^v/, '');
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2] || 0), Number(match[3] || 0)];
}

function compareSemver(a, b) {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (!parsedA || !parsedB) return 0;
  for (let i = 0; i < 3; i++) {
    const diff = (parsedA[i] || 0) - (parsedB[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

function formatStatus(status) {
  if (status === 'pass') return '✅ PASS';
  if (status === 'warn') return '⚠️ WARN';
  return '❌ FAIL';
}

function escapePipes(value = '') {
  return String(value).replace(/\|/g, '\\|');
}

function checkNode() {
  const version = process.version.replace(/^v/, '');
  const min = REQUIRED_MIN_VERSIONS.node;
  const status = compareSemver(version, min) >= 0 ? 'pass' : 'fail';
  return {
    name: 'Node.js runtime',
    required: true,
    status,
    detail: `Detected v${version}, required ≥ v${min}`,
    recommendation: status === 'pass' ? '' : 'Install Node.js 18 LTS or later.'
  };
}

function checkBinary({ name, command, args = ['--version'], required = false, minVersion = null, recommendation = '', env = process.env }) {
  const result = runCommand(command, args, { env });
  if (result.status === 'not-found') {
    return {
      name,
      required,
      status: required ? 'fail' : 'warn',
      detail: `Command \`${command}\` was not found in PATH.`,
      recommendation: recommendation || `Install ${name} and ensure it is discoverable via PATH.`
    };
  }

  const version = extractVersion(result.stdout || result.stderr);
  let status = 'pass';
  let detail = version ? `Detected v${version}` : 'Command responded but no semantic version detected.';
  if (minVersion) {
    if (!version) {
      status = required ? 'fail' : 'warn';
      detail += ` (unable to confirm ≥ v${minVersion})`;
    } else if (compareSemver(version, minVersion) < 0) {
      status = required ? 'fail' : 'warn';
      detail += ` (< v${minVersion} required)`;
    }
  }

  return {
    name,
    required,
    status,
    detail,
    recommendation: status === 'pass' ? '' : recommendation
  };
}

function checkQuartoCli(envDetails) {
  const pathResult = runCommand('quarto', ['--version'], { env: envDetails.env });
  if (pathResult.status !== 'not-found') {
    const version = extractVersion(pathResult.stdout || pathResult.stderr);
    let status = 'pass';
    let detail = version
      ? `Detected v${version} via PATH`
      : 'Quarto responded via PATH but no semantic version was detected.';

    if (!version) {
      status = 'fail';
      detail += ` (unable to confirm ≥ v${REQUIRED_MIN_VERSIONS.quarto})`;
    } else if (compareSemver(version, REQUIRED_MIN_VERSIONS.quarto) < 0) {
      status = 'fail';
      detail += ` (< v${REQUIRED_MIN_VERSIONS.quarto} required)`;
    }

    return {
      name: 'Quarto CLI',
      required: true,
      status,
      detail,
      recommendation: status === 'pass' ? '' : 'Upgrade Quarto to a supported version and keep it on PATH.',
      discoveredPaths: []
    };
  }

  const discoveredPaths = discoverLocalQuartoBinaries();

  if (discoveredPaths.length) {
    const best = discoveredPaths.find((item) => item.version) || discoveredPaths[0];
    const versionText = best.version ? `v${best.version}` : 'unknown version';
    const pathList = discoveredPaths.map((item) => item.path).join(', ');
    return {
      name: 'Quarto CLI',
      required: true,
      status: 'fail',
      detail: `Quarto is not on PATH, but candidate binary/binaries exist: ${pathList}. Best detected version: ${versionText}.`,
      recommendation: `Add one of these binaries to PATH or invoke Quarto explicitly from ${best.path}.`,
      discoveredPaths
    };
  }

  return {
    name: 'Quarto CLI',
    required: true,
    status: 'fail',
    detail: 'Command `quarto` was not found in PATH and no common local Quarto install path was detected.',
    recommendation: 'Install Quarto from https://quarto.org/docs/get-started/ for local renders.',
    discoveredPaths: []
  };
}

function checkQuartoConfigDir() {
  const expectedDir = path.join(os.homedir(), '.quarto');
  const exists = fs.existsSync(expectedDir);
  return {
    name: 'Quarto user config directory',
    required: false,
    status: exists ? 'pass' : 'warn',
    detail: exists ? `Found ${expectedDir}` : 'Not found. Quarto usually initializes this on first run.',
    recommendation: exists ? '' : 'Run `quarto check` after Quarto is available on PATH so the user config directory is created.'
  };
}

function gatherHostInfo() {
  const cpus = os.cpus() || [];
  return {
    platform: `${os.platform()} ${os.release()}`,
    arch: os.arch(),
    cpu: cpus.length ? cpus[0].model : 'unknown',
    cores: cpus.length,
    memoryGb: (os.totalmem() / (1024 ** 3)).toFixed(2),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  };
}

function buildReports(checkResults, hostInfo, generatedAt, envDetails) {
  const requiredFailures = checkResults.filter((c) => c.required && c.status !== 'pass');
  const warnings = checkResults.filter((c) => !c.required && c.status !== 'pass');
  const quartoCheck = checkResults.find((c) => c.name === 'Quarto CLI');
  const exitCode = requiredFailures.length ? 1 : warnings.length ? 2 : 0;

  const markdown = [];
  markdown.push('# Render Environment Doctor', '');
  markdown.push(`Generated: ${generatedAt}`);
  markdown.push('', '## Host Overview', '');
  markdown.push(`- Platform: ${hostInfo.platform}`);
  markdown.push(`- Architecture: ${hostInfo.arch}`);
  markdown.push(`- CPU: ${hostInfo.cpu} (${hostInfo.cores} cores)`);
  markdown.push(`- Memory (GB): ${hostInfo.memoryGb}`);
  markdown.push(`- Timezone: ${hostInfo.timezone}`);

  markdown.push('', '## Check Summary', '');
  if (requiredFailures.length === 0) {
    markdown.push('- All required checks passed.');
  } else {
    markdown.push(`- Required checks failing: ${requiredFailures.map((c) => `**${c.name}**`).join(', ')}`);
  }
  if (warnings.length) {
    markdown.push(`- Additional warnings: ${warnings.map((c) => c.name).join(', ')}`);
  } else {
    markdown.push('- No optional warnings.');
  }
  markdown.push(`- Exit code: ${exitCode}`);

  if (envDetails?.quartoBinDir) {
    markdown.push(`- Repo bootstrap PATH includes: \`${envDetails.quartoBinDir}\``);
    markdown.push(`- Repo bootstrap added PATH entry this run: ${envDetails.addedToPath ? 'yes' : 'no'}`);
  }
  if (quartoCheck?.discoveredPaths?.length) {
    markdown.push(`- Quarto binaries discovered outside raw shell PATH: ${quartoCheck.discoveredPaths.map((item) => `\`${item.path}\``).join(', ')}`);
  }

  markdown.push('', '## Detailed Checks', '');
  markdown.push('| Check | Required | Status | Details | Recommendation |');
  markdown.push('| --- | --- | --- | --- | --- |');
  for (const check of checkResults) {
    const row = [
      check.name,
      check.required ? 'Yes' : 'No',
      formatStatus(check.status),
      escapePipes(check.detail || ''),
      escapePipes(check.recommendation || '')
    ];
    markdown.push(`| ${row.join(' | ')} |`);
  }

  if (quartoCheck?.discoveredPaths?.length) {
    markdown.push('', '## Quarto Discovery', '');
    markdown.push('| Path | Detected Version | Probe Status |');
    markdown.push('| --- | --- | --- |');
    for (const item of quartoCheck.discoveredPaths) {
      markdown.push(`| ${escapePipes(item.path)} | ${escapePipes(item.version || 'unknown')} | ${escapePipes(item.status)} |`);
    }
  }

  if (requiredFailures.length || warnings.length) {
    markdown.push('', '## Next Actions', '');
    if (requiredFailures.length) {
      markdown.push('- Fix these before claiming render readiness:');
      for (const check of requiredFailures) {
        markdown.push(`  - ${check.name}: ${check.recommendation || check.detail}`);
      }
    }
    if (warnings.length) {
      markdown.push('- Nice-to-have fixes:');
      for (const check of warnings) {
        markdown.push(`  - ${check.name}: ${check.recommendation || check.detail}`);
      }
    }
  }

  const jsonPayload = {
    generatedAt,
    exitCode,
    host: hostInfo,
    checks: checkResults,
    requiredFailures: requiredFailures.map((c) => c.name),
    warnings: warnings.map((c) => c.name),
    quartoDiscoveredPaths: quartoCheck?.discoveredPaths || [],
    bootstrapPath: envDetails?.quartoBinDir || null,
    bootstrapAddedPathEntry: Boolean(envDetails?.addedToPath)
  };

  return { markdown: markdown.join('\n') + '\n', json: JSON.stringify(jsonPayload, null, 2) + '\n', exitCode };
}

function main() {
  ensureReportsDir();
  const hostInfo = gatherHostInfo();
  const generatedAt = new Date().toISOString();

  const envDetails = withRepoToolPath(process.env);

  const results = [];
  results.push(checkNode());
  results.push(
    checkBinary({
      name: 'npm CLI',
      command: 'npm',
      required: true,
      minVersion: REQUIRED_MIN_VERSIONS.npm,
      recommendation: 'Install Node.js 18+ which includes npm ≥ 9.',
      env: envDetails.env
    })
  );
  results.push(
    checkBinary({
      name: 'git',
      command: 'git',
      required: true,
      minVersion: REQUIRED_MIN_VERSIONS.git,
      recommendation: 'Install git 2.30+ to match GitHub Actions runners.',
      env: envDetails.env
    })
  );
  results.push(checkQuartoCli(envDetails));
  results.push(
    checkBinary({
      name: 'Pandoc',
      command: 'pandoc',
      required: false,
      minVersion: '3.1.0',
      recommendation: 'Install Pandoc 3.1+ or rely on the copy bundled with Quarto.',
      env: envDetails.env
    })
  );
  results.push(
    checkBinary({
      name: 'LaTeX engine (tectonic/pdflatex)',
      command: 'tectonic',
      args: ['--version'],
      required: false,
      minVersion: '0.9.0',
      recommendation: 'Install Tectonic (preferred) or TeX Live to enable PDF output.',
      env: envDetails.env
    })
  );
  results.push(checkQuartoConfigDir());

  const { markdown, json, exitCode } = buildReports(results, hostInfo, generatedAt, envDetails);
  fs.writeFileSync(markdownReportPath, markdown);
  fs.writeFileSync(jsonReportPath, json);

  results.forEach((check) => {
    const prefix = check.status === 'pass' ? 'OK' : check.status === 'warn' ? 'WARN' : 'FAIL';
    console.log(`[${prefix}] ${check.name} — ${check.detail}`);
    if (check.discoveredPaths?.length) {
      console.log(`      ↳ Discovered candidate paths: ${check.discoveredPaths.map((item) => item.path).join(', ')}`);
    }
    if (check.recommendation && check.status !== 'pass') {
      console.log(`      ↳ ${check.recommendation}`);
    }
  });

  console.log(`Reports written to: ${path.relative(repoRoot, markdownReportPath)} and ${path.relative(repoRoot, jsonReportPath)}`);
  process.exit(exitCode);
}

main();
