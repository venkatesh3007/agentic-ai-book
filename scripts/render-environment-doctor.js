#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

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

function extractVersion(text) {
  if (!text) return null;
  const match = text.match(/(\d+\.\d+\.\d+)/);
  if (match) return match[1];
  const shorter = text.match(/(\d+\.\d+)/);
  return shorter ? `${shorter[1]}.0` : null;
}

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
    if (error.code === 'ENOENT') {
      return { status: 'not-found' };
    }
    return { status: 'error', stderr: String(error) };
  }
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

function checkBinary({ name, command, args = ['--version'], required = false, minVersion = null, recommendation = '' }) {
  const result = runCommand(command, args);
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

function checkQuartoConfigDir() {
  const expectedDir = path.join(os.homedir(), '.quarto');
  const exists = fs.existsSync(expectedDir);
  return {
    name: 'Quarto user config directory',
    required: false,
    status: exists ? 'pass' : 'warn',
    detail: exists ? `Found ${expectedDir}` : 'Not found. Quarto usually initializes this on first run.',
    recommendation: exists ? '' : 'Run `quarto check` after installation so the user config directory is created.'
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

function buildReports(checkResults, hostInfo, generatedAt) {
  const requiredFailures = checkResults.filter((c) => c.required && c.status !== 'pass');
  const warnings = checkResults.filter((c) => !c.required && c.status !== 'pass');
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
    warnings: warnings.map((c) => c.name)
  };

  return { markdown: markdown.join('\n') + '\n', json: JSON.stringify(jsonPayload, null, 2) + '\n', exitCode };
}

function main() {
  ensureReportsDir();
  const hostInfo = gatherHostInfo();
  const generatedAt = new Date().toISOString();

  const results = [];
  results.push(checkNode());
  results.push(
    checkBinary({
      name: 'npm CLI',
      command: 'npm',
      required: true,
      minVersion: REQUIRED_MIN_VERSIONS.npm,
      recommendation: 'Install Node.js 18+ which includes npm ≥ 9.'
    })
  );
  results.push(
    checkBinary({
      name: 'git',
      command: 'git',
      required: true,
      minVersion: REQUIRED_MIN_VERSIONS.git,
      recommendation: 'Install git 2.30+ to match GitHub Actions runners.'
    })
  );
  results.push(
    checkBinary({
      name: 'Quarto CLI',
      command: 'quarto',
      required: true,
      minVersion: REQUIRED_MIN_VERSIONS.quarto,
      recommendation: 'Install Quarto from https://quarto.org/docs/get-started/ for local renders.'
    })
  );
  results.push(
    checkBinary({
      name: 'Pandoc',
      command: 'pandoc',
      required: false,
      minVersion: '3.1.0',
      recommendation: 'Install Pandoc 3.1+ or rely on the copy bundled with Quarto.'
    })
  );
  results.push(
    checkBinary({
      name: 'LaTeX engine (tectonic/pdflatex)',
      command: 'tectonic',
      args: ['--version'],
      required: false,
      minVersion: '0.9.0',
      recommendation: 'Install Tectonic (preferred) or TeX Live to enable PDF output.'
    })
  );
  results.push(checkQuartoConfigDir());

  const { markdown, json, exitCode } = buildReports(results, hostInfo, generatedAt);
  fs.writeFileSync(markdownReportPath, markdown);
  fs.writeFileSync(jsonReportPath, json);

  results.forEach((check) => {
    const prefix = check.status === 'pass' ? 'OK' : check.status === 'warn' ? 'WARN' : 'FAIL';
    console.log(`[${prefix}] ${check.name} — ${check.detail}`);
    if (check.recommendation && check.status !== 'pass') {
      console.log(`      ↳ ${check.recommendation}`);
    }
  });

  console.log(`Reports written to: ${path.relative(repoRoot, markdownReportPath)} and ${path.relative(repoRoot, jsonReportPath)}`);
  process.exit(exitCode);
}

main();
