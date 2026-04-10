# End-of-Day Wrap-Up

Generated: 2026-04-10T13:30:32.515Z

Git HEAD: 1d4ef27

## Summary

- Overall result: not fully green.
- Validation found placeholder day chapters still needing honest rewrites (22 remaining).
- Quarto CLI is not available in this environment, so a render check could not be performed.

## Manuscript Integrity

- Referenced chapter files missing: 0
- Placeholder day chapters remaining: 22
- Next priority rewrites:
  - Day 08 — `chapters/day-08.qmd`
  - Day 09 — `chapters/day-09.qmd`
  - Day 10 — `chapters/day-10.qmd`
  - Day 11 — `chapters/day-11.qmd`
  - Day 12 — `chapters/day-12.qmd`

## Validation Command

- Command: `/usr/bin/node scripts/validate-book.js`
- Exit status: 2
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

## Combined Healthcheck

- Command: `/usr/bin/node scripts/run-healthcheck.js`
- Exit status: 1
- Overall status: FAIL (exit 1)
- Checks:
  - Placeholder Audit: WARN (exit 2, 58 ms)
  - Internal Link Audit: PASS (exit 0, 67 ms)
  - Image Asset Audit: PASS (exit 0, 60 ms)
  - Frontmatter Audit: WARN (exit 2, 73 ms)
  - Render Environment Doctor: FAIL (exit 1, 243 ms)
- Reports:
  - `reports/healthcheck-report.md`
  - `reports/healthcheck-report.json`
```text
Healthcheck FAIL (exit 1). Report written to reports/healthcheck-report.md
```

## Render Check

- Render check not run: `quarto` command not found.
```text
quarto: command not found
```

## Git Working Tree

- Working tree dirty at wrap-up time: yes
```text
M placeholder-chapters.json
 M reports/frontmatter-audit-report.json
 M reports/healthcheck-report.json
 M reports/healthcheck-report.md
 M reports/image-audit-report.json
 M reports/link-check-report.json
 M reports/render-environment-report.json
 M reports/render-environment-report.md
```

## Tagging

- No tag requested.

## Notes

- This wrap-up is intentionally honest: placeholder chapters or missing render tooling keep the day from being marked fully green.
- No network operations are performed by this script.
