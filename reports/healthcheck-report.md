# Repository Healthcheck Report

- Generated: 2026-04-10T04:31:49.976Z
- Overall status: **FAIL** (❌ FAIL)
- Checks run: 4
- Exit code: 1

## Check Results

### Placeholder Audit — ⚠️ WARN

- Description: Validates _quarto.yml references and flags day chapters that are still placeholder templates.
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/validate-book.js`
- Exit code: 2
- Duration: 57 ms
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

WARN: Placeholder day chapters still present (22):
WARN:   - Day 08: chapters/day-08.qmd
WARN:   - Day 09: chapters/day-09.qmd
WARN:   - Day 10: chapters/day-10.qmd
WARN:   - Day 11: chapters/day-11.qmd
WARN:   - Day 12: chapters/day-12.qmd
WARN:   - Day 13: chapters/day-13.qmd
WARN:   - Day 14: chapters/day-14.qmd
WARN:   - Day 15: chapters/day-15.qmd
WARN:   - Day 16: chapters/day-16.qmd
WARN:   - Day 17: chapters/day-17.qmd
WARN:   - Day 18: chapters/day-18.qmd
WARN:   - Day 19: chapters/day-19.qmd
WARN:   - Day 20: chapters/day-20.qmd
WARN:   - Day 21: chapters/day-21.qmd
WARN:   - Day 22: chapters/day-22.qmd
WARN:   - Day 23: chapters/day-23.qmd
WARN:   - Day 24: chapters/day-24.qmd
WARN:   - Day 25: chapters/day-25.qmd
WARN:   - Day 26: chapters/day-26.qmd
WARN:   - Day 27: chapters/day-27.qmd
WARN:   - Day 28: chapters/day-28.qmd
WARN:   - Day 29: chapters/day-29.qmd
```
</details>

### Internal Link Audit — ✅ PASS

- Description: Scans Markdown/QMD files for broken repo-local links and missing anchors.
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/check-internal-links.js`
- Exit code: 0
- Duration: 62 ms
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

### Image Asset Audit — ✅ PASS

- Description: Ensures every referenced image exists inside the repository with a valid extension.
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/check-image-assets.js`
- Exit code: 0
- Duration: 54 ms
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

### Render Environment Doctor — ❌ FAIL

- Description: Checks the local machine for the tools required to run a trustworthy `quarto render`.
- Command: `/usr/bin/node /home/openclaw/.openclaw/workspace/agentic-ai-book/scripts/render-environment-doctor.js`
- Exit code: 1
- Duration: 214 ms
- Reports:
  - `reports/render-environment-report.md`
  - `reports/render-environment-report.json`

<details>
<summary>Output</summary>

```text
[OK] Node.js runtime — Detected v22.22.0, required ≥ v18.0.0
[OK] npm CLI — Detected v10.9.4
[OK] git — Detected v2.43.0
[FAIL] Quarto CLI — Command `quarto` was not found in PATH.
      ↳ Install Quarto from https://quarto.org/docs/get-started/ for local renders.
[WARN] Pandoc — Command `pandoc` was not found in PATH.
      ↳ Install Pandoc 3.1+ or rely on the copy bundled with Quarto.
[WARN] LaTeX engine (tectonic/pdflatex) — Command `tectonic` was not found in PATH.
      ↳ Install Tectonic (preferred) or TeX Live to enable PDF output.
[WARN] Quarto user config directory — Not found. Quarto usually initializes this on first run.
      ↳ Run `quarto check` after installation so the user config directory is created.
Reports written to: reports/render-environment-report.md and reports/render-environment-report.json
```
</details>

---

*This combined healthcheck runs entirely repo-local audits without invoking Quarto render.*