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

Useful commands:

```bash
npm run validate
npm run audit:placeholders
```

This is not a substitute for `quarto render`, but it gives the repo a real integrity gate even on machines where Quarto is not installed.

## Author

**Venkatesh Rao** — Founder of [Aikaara](https://aikaara.com), an AI-native holding company building "the machine that builds software factories."

## License

Creative Commons BY-NC-SA 4.0 — Free to read and share, no commercial use without permission.
