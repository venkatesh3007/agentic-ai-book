# Audit Refresh Report

- Generated: 2026-04-21T07:30:56.623Z
- Overall status: ⚠️ **WARN**
- Commands run: 9

## Results

### ✅ Placeholder Audit
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/validate-book.js`
- Exit code: 0
- Duration: 73 ms
- Reports:
  - `PLACEHOLDER_CHAPTERS.md`
  - `placeholder-chapters.json`

<details>
<summary>Output</summary>

```text
OK: Found 46 chapter entries in _quarto.yml
OK: Chapter exists: chapters/01-what-is-agentic-ai.qmd
OK: Chapter exists: chapters/02-why-a-software-factory.qmd
OK: Chapter exists: chapters/03-meeting-jarvis.qmd
OK: Chapter exists: chapters/04-first-real-problem.qmd
OK: Chapter exists: chapters/05-the-toolkit.qmd
OK: Chapter exists: chapters/06-building-chatsite.qmd
OK: Chapter exists: chapters/07-deployment-hell.qmd
OK: Chapter exists: chapters/08-writing-in-the-open.qmd
OK: Chapter exists: chapters/09-planning-the-sprint.qmd
OK: Chapter exists: chapters/day-02-warmup.qmd
OK: Chapter exists: chapters/day-03-warmup.qmd
OK: Chapter exists: chapters/day-05-warmup.qmd
OK: Chapter exists: chapters/day-01.qmd
OK: Chapter exists: chapters/day-02.qmd
OK: Chapter exists: chapters/day-03.qmd
OK: Chapter exists: chapters/day-04.qmd
OK: Chapter exists: chapters/day-05.qmd
OK: Chapter exists: chapters/day-06.qmd
OK: Chapter exists: chapters/day-07.qmd
OK: Chapter exists: chapters/day-08.qmd
OK: Chapter exists: chapters/day-09.qmd
OK: Chapter exists: chapters/day-10.qmd
OK: Chapter exists: chapters/day-11.qmd
OK: Chapter exists: chapters/day-12.qmd
OK: Chapter exists: chapters/day-13.qmd
OK: Chapter exists: chapters/day-14.qmd
OK: Chapter exists: chapters/day-15.qmd
OK: Chapter exists: chapters/day-16.qmd
OK: Chapter exists: chapters/day-17.qmd
OK: Chapter exists: chapters/day-18.qmd
OK: Chapter exists: chapters/day-19.qmd
OK: Chapter exists: chapters/day-20.qmd
OK: Chapter exists: chapters/day-21.qmd
OK: Chapter exists: chapters/day-22.qmd
OK: Chapter exists: chapters/day-23.qmd
OK: Chapter exists: chapters/day-24.qmd
OK: Chapter exists: chapters/day-25.qmd
OK: Chapter exists: chapters/day-26.qmd
OK: Chapter exists: chapters/day-27.qmd
OK: Chapter exists: chapters/day-28.qmd
OK: Chapter exists: chapters/day-29.qmd
OK: Chapter exists: chapters/day-30.qmd
OK: Chapter exists: chapters/day-31.qmd
OK: Chapter exists: chapters/patterns.qmd
OK: Chapter exists: chapters/failures.qmd
OK: Chapter exists: chapters/factory.qmd
OK: Wrote report: PLACEHOLDER_CHAPTERS.md
OK: Wrote report: placeholder-chapters.json
OK: Book validation passed
```
</details>

### ✅ Internal Link Audit
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/check-internal-links.js`
- Exit code: 0
- Duration: 66 ms
- Reports:
  - `reports/link-check-report.md`
  - `reports/link-check-report.json`

<details>
<summary>Output</summary>

```text
Scanned 54 files with Markdown/QMD content
Found 20 links to inspect
Internal link check passed.
```
</details>

### ✅ Image Asset Audit
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/check-image-assets.js`
- Exit code: 0
- Duration: 55 ms
- Reports:
  - `reports/image-audit-report.md`
  - `reports/image-audit-report.json`

<details>
<summary>Output</summary>

```text
Scanned 54 content files
Found 0 image reference(s)
Image asset audit passed.
```
</details>

### ✅ Frontmatter Audit
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/check-frontmatter.js`
- Exit code: 0
- Duration: 76 ms
- Reports:
  - `reports/frontmatter-audit-report.md`
  - `reports/frontmatter-audit-report.json`

<details>
<summary>Output</summary>

```text
Scanned 49 QMD file(s)
Inspected 46 chapter frontmatter block(s)
Found 0 error(s) and 0 warning(s)
Frontmatter audit passed.
```
</details>

### ⚠️ Render Environment Doctor
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/render-environment-doctor.js`
- Exit code: 2
- Duration: 325 ms
- Reports:
  - `reports/render-environment-report.md`
  - `reports/render-environment-report.json`

<details>
<summary>Output</summary>

```text
[OK] Node.js runtime — Detected v22.22.0, required ≥ v18.0.0
[OK] npm CLI — Detected v10.9.4
[OK] git — Detected v2.43.0
[OK] Quarto CLI — Detected v1.6.42 via PATH
[WARN] Pandoc — Command `pandoc` was not found in PATH.
      ↳ Install Pandoc 3.1+ or rely on the copy bundled with Quarto.
[WARN] LaTeX engine (tectonic/pdflatex) — Command `tectonic` was not found in PATH.
      ↳ Install Tectonic (preferred) or TeX Live to enable PDF output.
[WARN] Quarto user config directory — Not found. Quarto usually initializes this on first run.
      ↳ Run `quarto check` after Quarto is available on PATH so the user config directory is created.
Reports written to: reports/render-environment-report.md and reports/render-environment-report.json
```
</details>

### ✅ Local HTML Render
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/render-with-local-quarto.js . --to html`
- Exit code: 0
- Duration: 97834 ms
- Reports:
  - `reports/local-render-report.md`
  - `reports/local-render-report.json`

<details>
<summary>Output</summary>

```text
Wrote reports/local-render-report.md
Wrote reports/local-render-report.json
[1m[34m[ 1/49] index.qmd[39m[22m
[1m[34m[ 2/49] preface.qmd[39m[22m
[1m[34m[ 3/49] chapters/01-what-is-agentic-ai.qmd[39m[22m
[1m[34m[ 4/49] chapters/02-why-a-software-factory.qmd[39m[22m
[1m[34m[ 5/49] chapters/03-meeting-jarvis.qmd[39m[22m
[1m[34m[ 6/49] chapters/04-first-real-problem.qmd[39m[22m
[1m[34m[ 7/49] chapters/05-the-toolkit.qmd[39m[22m
[1m[34m[ 8/49] chapters/06-building-chatsite.qmd[39m[22m
[1m[34m[ 9/49] chapters/07-deployment-hell.qmd[39m[22m
[1m[34m[10/49] chapters/08-writing-in-the-open.qmd[39m[22m
[1m[34m[11/49] chapters/09-planning-the-sprint.qmd[39m[22m
[1m[34m[12/49] chapters/day-02-warmup.qmd[39m[22m
[1m[34m[13/49] chapters/day-03-warmup.qmd[39m[22m
[1m[34m[14/49] chapters/day-05-warmup.qmd[39m[22m
[1m[34m[15/49] chapters/day-01.qmd[39m[22m
[1m[34m[16/49] chapters/day-02.qmd[39m[22m
[1m[34m[17/49] chapters/day-03.qmd[39m[22m
[1m[34m[18/49] chapters/day-04.qmd[39m[22m
[1m[34m[19/49] chapters/day-05.qmd[39m[22m
[1m[34m[20/49] chapters/day-06.qmd[39m[22m
[1m[34m[21/49] chapters/day-07.qmd[39m[22m
[1m[34m[22/49] chapters/day-08.qmd[39m[22m
[1m[34m[23/49] chapters/day-09.qmd[39m[22m
[1m[34m[24/49] chapters/day-10.qmd[39m[22m
[1m[34m[25/49] chapters/day-11.qmd[39m[22m
[1m[34m[26/49] chapters/day-12.qmd[39m[22m
[1m[34m[27/49] chapters/day-13.qmd[39m[22m
[1m[34m[28/49] chapters/day-14.qmd[39m[22m
[1m[34m[29/49] chapters/day-15.qmd[39m[22m
[1m[34m[30/49] chapters/day-16.qmd[39m[22m
[1m[34m[31/49] chapters/day-17.qmd[39m[22m
[1m[34m[32/49] chapters/day-18.qmd[39m[22m
[1m[34m[33/49] chapters/day-19.qmd[39m[22m
[1m[34m[34/49] chapters/day-20.qmd[39m[22m
[1m[34m[35/49] chapters/day-21.qmd[39m[22m
[1m[34m[36/49] chapters/day-22.qmd[39m[22m
[1m[34m[37/49] chapters/day-23.qmd[39m[22m
[1m[34m[38/49] chapters/day-24.qmd[39m[22m
[1m[34m[39/49] chapters/day-25.qmd[39m[22m
[1m[34m[40/49] chapters/day-26.qmd[39m[22m
[1m[34m[41/49] chapters/day-27.qmd[39m[22m
[1m[34m[42/49] chapters/day-28.qmd[39m[22m
[1m[34m[43/49] chapters/day-29.qmd[39m[22m
[1m[34m[44/49] chapters/day-30.qmd[39m[22m
[1m[34m[45/49] chapters/day-31.qmd[39m[22m
[1m[34m[46/49] chapters/patterns.qmd[39m[22m
[1m[34m[47/49] chapters/failures.qmd[39m[22m
[1m[34m[48/49] chapters/factory.qmd[39m[22m
[1m[34m[49/49] references.qmd[39m[22m

Output created: _book/index.html
```
</details>

### ⚠️ Combined Healthcheck
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/run-healthcheck.js`
- Exit code: 2
- Duration: 94745 ms
- Reports:
  - `reports/healthcheck-report.md`
  - `reports/healthcheck-report.json`

<details>
<summary>Output</summary>

```text
Healthcheck WARN (exit 2). Report written to reports/healthcheck-report.md
```
</details>

### ✅ Status Dashboard
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/build-status-dashboard.js`
- Exit code: 0
- Duration: 49 ms
- Reports:
  - `reports/status-dashboard.md`
  - `reports/status-dashboard.json`

<details>
<summary>Output</summary>

```text
Wrote reports/status-dashboard.md
Wrote reports/status-dashboard.json
```
</details>

### ✅ STATUS.md Sync
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/sync-status-md.js`
- Exit code: 0
- Duration: 80 ms
- Reports:
  - `STATUS.md`

<details>
<summary>Output</summary>

```text
Synced STATUS.md
```
</details>

