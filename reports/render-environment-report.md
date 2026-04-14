# Render Environment Doctor

Generated: 2026-04-14T10:32:07.917Z

## Host Overview

- Platform: linux 6.8.0-107-generic
- Architecture: x64
- CPU: DO-Regular (2 cores)
- Memory (GB): 3.82
- Timezone: UTC

## Check Summary

- Required checks failing: **Quarto CLI**
- Additional warnings: Pandoc, LaTeX engine (tectonic/pdflatex), Quarto user config directory
- Exit code: 1
- Quarto binaries discovered outside PATH: `/home/openclaw/quarto/bin/quarto`, `/home/openclaw/bin/quarto`, `/home/openclaw/bin/bin/quarto`

## Detailed Checks

| Check | Required | Status | Details | Recommendation |
| --- | --- | --- | --- | --- |
| Node.js runtime | Yes | ✅ PASS | Detected v22.22.0, required ≥ v18.0.0 |  |
| npm CLI | Yes | ✅ PASS | Detected v10.9.4 |  |
| git | Yes | ✅ PASS | Detected v2.43.0 |  |
| Quarto CLI | Yes | ❌ FAIL | Quarto is not on PATH, but candidate binary/binaries exist: /home/openclaw/quarto/bin/quarto, /home/openclaw/bin/quarto, /home/openclaw/bin/bin/quarto. Best detected version: v1.6.42. | Add one of these binaries to PATH or invoke Quarto explicitly from /home/openclaw/quarto/bin/quarto. |
| Pandoc | No | ⚠️ WARN | Command `pandoc` was not found in PATH. | Install Pandoc 3.1+ or rely on the copy bundled with Quarto. |
| LaTeX engine (tectonic/pdflatex) | No | ⚠️ WARN | Command `tectonic` was not found in PATH. | Install Tectonic (preferred) or TeX Live to enable PDF output. |
| Quarto user config directory | No | ⚠️ WARN | Not found. Quarto usually initializes this on first run. | Run `quarto check` after Quarto is available on PATH so the user config directory is created. |

## Quarto Discovery

| Path | Detected Version | Probe Status |
| --- | --- | --- |
| /home/openclaw/quarto/bin/quarto | 1.6.42 | ok |
| /home/openclaw/bin/quarto | 1.6.42 | ok |
| /home/openclaw/bin/bin/quarto | 1.6.42 | ok |

## Next Actions

- Fix these before claiming render readiness:
  - Quarto CLI: Add one of these binaries to PATH or invoke Quarto explicitly from /home/openclaw/quarto/bin/quarto.
- Nice-to-have fixes:
  - Pandoc: Install Pandoc 3.1+ or rely on the copy bundled with Quarto.
  - LaTeX engine (tectonic/pdflatex): Install Tectonic (preferred) or TeX Live to enable PDF output.
  - Quarto user config directory: Run `quarto check` after Quarto is available on PATH so the user config directory is created.
