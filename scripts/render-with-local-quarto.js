#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { findWorkingLocalQuarto } = require('./lib/quarto-local');

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, 'reports');
const markdownReportPath = path.join(reportsDir, 'local-render-report.md');
const jsonReportPath = path.join(reportsDir, 'local-render-report.json');

function ensureReportsDir() {
  fs.mkdirSync(reportsDir, { recursive: true });
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function truncate(text, max = 8000) {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max)}\n… (output truncated)`;
}

function main() {
  ensureReportsDir();
  const generatedAt = new Date().toISOString();
  const target = process.argv[2] || '.';
  const extraArgs = process.argv.slice(3);
  const quarto = findWorkingLocalQuarto();

  if (!quarto) {
    const summary = {
      generatedAt,
      status: 'fail',
      exitCode: 1,
      target,
      command: null,
      quartoPath: null,
      quartoVersion: null,
      output: 'No local Quarto binary could be discovered.'
    };
    fs.writeFileSync(jsonReportPath, JSON.stringify(summary, null, 2) + '\n');
    fs.writeFileSync(markdownReportPath, `# Local Quarto Render Report\n\n- Generated: ${generatedAt}\n- Status: **FAIL**\n- Target: \`${target}\`\n- Quarto binary: not found\n\n## Output\n\n\`\`\`text\nNo local Quarto binary could be discovered.\n\`\`\`\n`);
    console.error('No local Quarto binary could be discovered.');
    process.exit(1);
  }

  const commandArgs = ['render', target, ...extraArgs];
  const result = spawnSync(quarto.path, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  const exitCode = typeof result.status === 'number' ? result.status : 1;
  const status = exitCode === 0 ? 'pass' : 'fail';
  const output = truncate([result.stdout || '', result.stderr || ''].filter(Boolean).join('\n').trim());
  const commandString = [quarto.path, ...commandArgs.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg))].join(' ');

  const summary = {
    generatedAt,
    status,
    exitCode,
    target,
    command: commandString,
    quartoPath: quarto.path,
    quartoVersion: quarto.version,
    outputDirExists: fs.existsSync(path.join(repoRoot, '_book')),
    output
  };

  const md = [];
  md.push('# Local Quarto Render Report', '');
  md.push(`- Generated: ${generatedAt}`);
  md.push(`- Status: **${status.toUpperCase()}**`);
  md.push(`- Exit code: ${exitCode}`);
  md.push(`- Target: \`${target}\``);
  md.push(`- Quarto binary: \`${quarto.path}\``);
  md.push(`- Quarto version: ${quarto.version || 'unknown'}`);
  md.push(`- Output directory present: ${summary.outputDirExists ? 'yes' : 'no'}`);
  md.push(`- Command: \`${commandString}\``);
  md.push('', '## Output', '', '```text', output || '(no output)', '```', '');

  fs.writeFileSync(jsonReportPath, JSON.stringify(summary, null, 2) + '\n');
  fs.writeFileSync(markdownReportPath, md.join('\n'));

  console.log(`Wrote ${toPosix(path.relative(repoRoot, markdownReportPath))}`);
  console.log(`Wrote ${toPosix(path.relative(repoRoot, jsonReportPath))}`);
  if (output) console.log(output);
  process.exit(exitCode);
}

try {
  main();
} catch (error) {
  console.error('Local Quarto render wrapper crashed:', error);
  process.exit(1);
}
