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

For cross-file integrity, run the internal link audit:

```bash
npm run audit:links
```

This inspects every `.md` and `.qmd` file for internal Markdown links, verifies that relative paths resolve to real files, and ensures any `#anchor` fragments actually exist in the target document. Results are saved to `reports/link-check-report.md` plus a JSON copy for downstream tooling.

Useful commands:

```bash
npm run validate
npm run audit:placeholders
npm run audit:links
npm run wrapup:eod
node scripts/end-of-day-wrapup.js --tag
npm run doctor:render
```

The end-of-day wrap-up script writes `END_OF_DAY_WRAPUP.md`, reruns the placeholder audit, reports whether Quarto render tooling is actually available, and only creates a local git tag when `--tag` is explicitly requested and the working tree is clean.

### Render environment doctor

`npm run doctor:render` runs `scripts/render-environment-doctor.js`, which audits the local machine for the prerequisites required to run a trustworthy `quarto render`. The doctor script:
- checks version requirements for Node.js, npm, git, and the Quarto CLI,
- verifies whether auxiliary tools such as Pandoc and Tectonic are installed,
- records host metadata (platform, architecture, memory, timezone),
- writes a detailed report to `reports/render-environment-report.md` plus a machine-readable JSON copy, and
- exits with status `1` if required tooling is missing, or `2` when only optional warnings remain.

This is not a substitute for `quarto render`, but it gives the repo a real integrity gate even on machines where Quarto is not installed.

### Internal link audit

`npm run audit:links` runs `scripts/check-internal-links.js`, which performs a repo-local Markdown/QMD link check. The audit:
- scans every tracked `.md` and `.qmd` file, skipping generated artifacts like `_book/`,
- verifies that relative links resolve to real files within the repository,
- confirms that same-file and cross-file `#anchor` fragments match real headings, and
- records its findings in `reports/link-check-report.md` plus a JSON copy for automation or dashboards.

The command exits non-zero if any internal link or anchor is broken, giving us a cheap but honest integrity signal even when Quarto is unavailable.

## Author

**Venkatesh Rao** — Founder of [Aikaara](https://aikaara.com), an AI-native holding company building "the machine that builds software factories."

## License

Creative Commons BY-NC-SA 4.0 — Free to read and share, no commercial use without permission.
