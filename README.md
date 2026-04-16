# AI-Native: How I Built a Software Factory with AI Agents

**31 days. 31 products. One AI agent. Zero excuses.**

A hands-on journal of building an AI-native software factory from scratch — with real code, real failures, and real timestamps.

## 📖 Read Online

[**Read the book →**](https://venkatesh3007.github.io/agentic-ai-book/)

## 📱 Buy on Amazon

*Coming soon on Kindle Direct Publishing*

## About

This book documents a 31-day sprint where I built one product per day using an AI agent (Claude/Jarvis running on OpenClaw) as my only engineering team. Every chapter is a real day with real code, real struggles, and real shipped products.

It's written in the open. You're watching the book get written in real-time.

## Structure

- **Part I: The Setup** — Why a software factory? What tools do you need?
- **Part II: The Build** — 31 days, 31 products, each a self-contained story
- **Part III: The Lessons** — Patterns, failures, and the factory vision

## Built With

- [Quarto](https://quarto.org) — Book authoring and publishing
- [OpenClaw](https://github.com/openclaw/openclaw) — AI agent platform
- [Claude](https://anthropic.com) — The AI model behind Jarvis

## Local Validation

Before claiming a build session improved the manuscript, run the repo-local validator:

```bash
npm run validate
```

What it checks right now:
- every chapter referenced in `_quarto.yml` exists,
- daily build chapters are flagged if they are still empty `[TBD]` templates,
- it writes a human-readable audit report to `PLACEHOLDER_CHAPTERS.md`,
- and it writes machine-readable output to `placeholder-chapters.json` for future automation.

The placeholder rules used by `npm run validate` are now shared with the frontmatter audit, so placeholder cleanup criteria only need to be updated in one place instead of drifting across two separate scripts.

For cross-file integrity, run the internal link audit:

```bash
npm run audit:links
```

This inspects every `.md` and `.qmd` file for repo-local links, verifies that relative paths resolve to real files, and ensures any `#anchor` fragments actually exist in the target document. It now checks both Markdown links and HTML `<a href="...">` links, while skipping generated artifacts like `_book/` and `reports/`. Results are saved to `reports/link-check-report.md` plus a JSON copy for downstream tooling.

Useful commands:

```bash
npm run validate
npm run audit:placeholders
npm run audit:links
npm run audit:images
npm run audit:frontmatter
npm run audit:health
npm run audit:dashboard
npm run audit:refresh
npm run render:local
npm run wrapup:eod
node scripts/end-of-day-wrapup.js --tag
npm run doctor:render
npm run quarto:check
```

The end-of-day wrap-up script writes `END_OF_DAY_WRAPUP.md`, reruns the placeholder audit, records the combined healthcheck, local render, and status dashboard summaries, and only creates a local git tag when `--tag` is explicitly requested. The tag is anchored to the current `HEAD`, even if the working tree contains freshly generated audit artifacts.

As of the latest tooling pass, `npm run audit:refresh` also regenerates the standalone local render report directly, so the dashboard and refresh artifacts now describe the same validation window instead of mixing fresh audits with an older render snapshot.

### Render environment doctor

`npm run doctor:render` runs `scripts/render-environment-doctor.js`, which audits the local machine for the prerequisites required to run a trustworthy `quarto render`. The doctor now shares its local Quarto discovery logic with the render wrapper through `scripts/lib/quarto-local.js`, and it also applies the repo's bootstrap PATH through `scripts/lib/runtime-env.js`, so repo-run diagnostics and wrapper-based render execution inspect the same candidate binaries instead of maintaining parallel logic. The doctor script:
- checks version requirements for Node.js, npm, git, and the Quarto CLI,
- verifies whether auxiliary tools such as Pandoc and Tectonic are installed,
- records host metadata (platform, architecture, memory, timezone),
- writes a detailed report to `reports/render-environment-report.md` plus a machine-readable JSON copy, and
- exits with status `1` if required tooling is missing, or `2` when only optional warnings remain.

This is not a substitute for `quarto render`, but it gives the repo a real integrity gate even on machines where Quarto is not installed. It now distinguishes between the raw shell environment and the repo's own bootstrap PATH, which matters on long-lived servers where tooling may have been unpacked into `$HOME/quarto/bin` without updating login shell startup files. If you want Quarto commands to run the same way the repo tooling does, use `npm run quarto:check` or `node scripts/bootstrap-env.js quarto ...`.

### Internal link audit

`npm run audit:links` runs `scripts/check-internal-links.js`, which performs a repo-local Markdown/QMD link check. The audit:
- scans every tracked `.md` and `.qmd` file, skipping generated artifacts like `_book/` and `reports/`,
- verifies that relative links resolve to real files within the repository,
- confirms that same-file and cross-file `#anchor` fragments match real headings,
- checks both Markdown links and HTML `<a href="...">` links, and
- records its findings in `reports/link-check-report.md` plus a JSON copy for automation or dashboards.

The command exits non-zero if any internal link or anchor is broken, giving us a cheap but honest integrity signal even when Quarto is unavailable.


### Image asset audit

`npm run audit:images` runs `scripts/check-image-assets.js`, which scans every Markdown and QMD file for Markdown/HTML image references, skips generated artifacts like `_book/` and `reports/`, verifies that the referenced files live inside this repository, and fails fast when an image is missing or uses a non-image extension. Results are written to `reports/image-audit-report.{md,json}` so future sessions can spot regressions without needing Quarto.

### Frontmatter audit

`npm run audit:frontmatter` runs `scripts/check-frontmatter.js`, which audits the manuscript's QMD frontmatter for metadata drift. Its placeholder detection now shares the same rule module as `npm run validate`, so metadata warnings and placeholder-chapter warnings do not silently diverge over time. The audit:
- scans every `.qmd` source file while skipping generated artifacts like `_book/` and `reports/`,
- fails if a QMD file is missing frontmatter or a required `title`,
- warns when day chapters still contain `[TBD]` placeholder metadata,
- warns when two or more book chapters reuse the same title, and
- writes its findings to `reports/frontmatter-audit-report.{md,json}` for future cleanup passes.

This is especially useful for catching book-specific debt that link and image checks cannot see, such as day chapters that still look structurally unfinished before you even read the body text.

### Combined healthcheck

`npm run audit:health` runs `scripts/run-healthcheck.js`, which chains the placeholder audit, internal link audit, image audit, frontmatter audit, render-environment doctor, and a real local HTML render attempt through the Quarto wrapper into one command. It records every command's exit code, duration, and trimmed output, writes the combined summary to `reports/healthcheck-report.md` plus a JSON twin, and exits with `0`/`1`/`2` depending on whether the repo is clean, failed, or merely warning-laden. This makes end-of-day wrap-ups more honest because the healthcheck now verifies the actual book artifact when local Quarto is available, instead of stopping at environment inspection.

### Status dashboard

`npm run audit:dashboard` runs `scripts/build-status-dashboard.js`, which reads the existing JSON audit outputs and compiles a compact repo dashboard. It summarizes current wins, active blockers, the next priority day-chapter rewrites, the latest wrapper-based local HTML render result, and the latest per-audit status lines in `reports/status-dashboard.{md,json}`. It now also reports whether the underlying audit snapshot is fresh or stale, so a dashboard built from yesterday's JSON files cannot quietly masquerade as current state. This is useful when you want a quick “what changed and what still hurts?” view without opening every raw report.

### Bulk audit refresh

`npm run audit:refresh` runs `scripts/refresh-audits.js`, which regenerates the placeholder audit, link audit, image audit, frontmatter audit, render doctor, standalone local HTML render report, combined healthcheck, and status dashboard in one pass. Including the wrapper-based local render directly in the refresh flow keeps the dashboard's “latest local render” state tied to the same refresh window as the other prerequisite reports, instead of silently depending on an older artifact. The command writes its own execution report to `reports/refresh-audits-report.{md,json}` so future sessions can prove exactly which checks were refreshed, how long they took, and which command still failed.

### Local render wrapper

`npm run render:local` runs `scripts/render-with-local-quarto.js`, which tries known local Quarto install paths directly instead of assuming `quarto` is already on PATH. It writes a render attempt report to `reports/local-render-report.{md,json}` with the exact binary used, command line, exit code, and captured output. The wrapper now reuses the same shared local-Quarto helper as the render doctor, which keeps diagnosis and execution aligned when candidate install paths change. On this host it has been verified to render the HTML book successfully via `/home/openclaw/quarto/bin/quarto`, producing `_book/index.html`. This makes local render attempts auditable on servers where Quarto exists but shell PATH wiring is incomplete.

### STATUS.md sync

`npm run status:sync` runs `scripts/sync-status-md.js`, which refreshes the volatile summary lines in `STATUS.md` from the current repo reports and git HEAD. It keeps fields like **Last Updated**, the current placeholder-day range, the current healthcheck summary sentence, and the **Next Update** note aligned with the dashboard and healthcheck outputs instead of drifting as manual prose.

## Author

**Venkatesh Rao** — Founder of [Aikaara](https://aikaara.com), an AI-native holding company building "the machine that builds software factories."

## License

Creative Commons BY-NC-SA 4.0 — Free to read and share, no commercial use without permission.
