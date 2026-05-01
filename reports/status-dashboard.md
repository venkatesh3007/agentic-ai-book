# Repository Status Dashboard

- Generated: 2026-05-01T04:30:16.310Z
- Overall status: ⚠️ **WARN**
- Audit snapshot freshness: ⚠️ **STALE**
- Snapshot source window: 2026-04-30T13:30:11.069Z → 2026-04-30T13:32:24.074Z
- Oldest source report age: 15.0 hour(s)
- Newest source report age: 15.0 hour(s)
- Latest validation signal: 2026-04-30T13:34:20.314Z
- Latest validation signal age: 14.9 hour(s)
- Placeholder day chapters remaining: **0**
- Latest local HTML render: ✅ **PASS** (exit 0)

## Current Wins

- Bulk audit refresh command available via `npm run audit:refresh`
- Internal link audit is clean
- Image asset audit is clean
- Frontmatter audit has zero errors
- Latest local HTML render passed via /home/openclaw/quarto/bin/quarto
- Placeholder backlog currently at 0

## Current Blockers

- Audit snapshot is stale (latest validation signal is 14.9 hour(s) old); run `npm run audit:refresh`

## Next Priority Rewrites

- None

## Audit Snapshot

- ✅ **Placeholder Audit** — PASS (exit 0, 131 ms)
- ✅ **Internal Link Audit** — PASS (exit 0, 109 ms)
- ✅ **Image Asset Audit** — PASS (exit 0, 106 ms)
- ✅ **Frontmatter Audit** — PASS (exit 0, 119 ms)
- ⚠️ **Render Environment Doctor** — WARN (exit 2, 625 ms)
- ✅ **Local HTML Render** — PASS (exit 0, 131958 ms)

## Detailed Counts

- Frontmatter warnings: **0**
- Frontmatter errors: **0**
- Internal link issues: **0**
- Image asset issues: **0**
- Render required failures: **0**
- Render warnings: **3**
- Quarto candidate paths discovered: **3**
- Local render output directory present: **yes**

## Quarto Discovery

- `/home/openclaw/quarto/bin/quarto` — version 1.6.42
- `/home/openclaw/bin/quarto` — version 1.6.42
- `/home/openclaw/bin/bin/quarto` — version 1.6.42

## Refresh Workflow

- Run `npm run audit:refresh` to regenerate the prerequisite audit JSON files in one pass before rebuilding the dashboard.
- `npm run wrapup:eod` reruns validation/health/render/dashboard/status-sync, but it does not rewrite `reports/refresh-audits-report.json`; the bulk-refresh and wrap-up timestamps can diverge honestly.
- Last bulk refresh report: 2026-04-22T04:30:39.521Z
- Last end-of-day wrap-up validation: 2026-04-30T13:34:20.314Z

## Source Reports

- `placeholder-chapters.json`
- `reports/healthcheck-report.json`
- `reports/frontmatter-audit-report.json`
- `reports/link-check-report.json`
- `reports/image-audit-report.json`
- `reports/render-environment-report.json`
- `reports/local-render-report.json`
- `reports/refresh-audits-report.json`

---

*Generated from existing repo-local audit JSON files so sessions can see the current state without reopening every full report.*
