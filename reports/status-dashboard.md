# Repository Status Dashboard

- Generated: 2026-04-12T10:33:15.492Z
- Overall status: ❌ **FAIL**
- Audit snapshot freshness: ✅ **FRESH**
- Oldest source report: 2026-04-12T10:33:14.921Z (0 minute(s) old)
- Newest source report: 2026-04-12T10:33:15.445Z (0 minute(s) old)
- Placeholder day chapters remaining: **21**

## Current Wins

- Audit snapshot is fresh (oldest report age: 0 minute(s))
- Bulk audit refresh command available via `npm run audit:refresh`
- Internal link audit is clean
- Image asset audit is clean
- Frontmatter audit has zero errors
- Placeholder backlog currently at 21

## Current Blockers

- Quarto exists on disk but is not wired into PATH (/home/openclaw/quarto/bin/quarto, /home/openclaw/bin/quarto, /home/openclaw/bin/bin/quarto)
- 21 placeholder day chapters still need honest rewrites

## Next Priority Rewrites

- Day 09 — `chapters/day-09.qmd`
- Day 10 — `chapters/day-10.qmd`
- Day 11 — `chapters/day-11.qmd`
- Day 12 — `chapters/day-12.qmd`
- Day 13 — `chapters/day-13.qmd`

## Audit Snapshot

- ⚠️ **Placeholder Audit** — WARN (exit 2, 54 ms)
- ✅ **Internal Link Audit** — PASS (exit 0, 65 ms)
- ✅ **Image Asset Audit** — PASS (exit 0, 62 ms)
- ⚠️ **Frontmatter Audit** — WARN (exit 2, 70 ms)
- ❌ **Render Environment Doctor** — FAIL (exit 1, 317 ms)

## Detailed Counts

- Frontmatter warnings: **21**
- Frontmatter errors: **0**
- Internal link issues: **0**
- Image asset issues: **0**
- Render required failures: **1**
- Render warnings: **3**
- Quarto candidate paths discovered: **3**

## Quarto Discovery

- `/home/openclaw/quarto/bin/quarto` — version 1.6.42
- `/home/openclaw/bin/quarto` — version 1.6.42
- `/home/openclaw/bin/bin/quarto` — version 1.6.42

## Refresh Workflow

- Run `npm run audit:refresh` to regenerate the prerequisite audit JSON files in one pass before rebuilding the dashboard.
- Last bulk refresh report: 2026-04-12T10:33:14.290Z

## Source Reports

- `placeholder-chapters.json`
- `reports/healthcheck-report.json`
- `reports/frontmatter-audit-report.json`
- `reports/link-check-report.json`
- `reports/image-audit-report.json`
- `reports/render-environment-report.json`
- `reports/refresh-audits-report.json`

---

*Generated from existing repo-local audit JSON files so sessions can see the current state without reopening every full report.*
