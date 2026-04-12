# Render Environment Doctor

Generated: 2026-04-12T04:32:56.248Z

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

## Detailed Checks

| Check | Required | Status | Details | Recommendation |
| --- | --- | --- | --- | --- |
| Node.js runtime | Yes | ✅ PASS | Detected v22.22.0, required ≥ v18.0.0 |  |
| npm CLI | Yes | ✅ PASS | Detected v10.9.4 |  |
| git | Yes | ✅ PASS | Detected v2.43.0 |  |
| Quarto CLI | Yes | ❌ FAIL | Command `quarto` was not found in PATH. | Install Quarto from https://quarto.org/docs/get-started/ for local renders. |
| Pandoc | No | ⚠️ WARN | Command `pandoc` was not found in PATH. | Install Pandoc 3.1+ or rely on the copy bundled with Quarto. |
| LaTeX engine (tectonic/pdflatex) | No | ⚠️ WARN | Command `tectonic` was not found in PATH. | Install Tectonic (preferred) or TeX Live to enable PDF output. |
| Quarto user config directory | No | ⚠️ WARN | Not found. Quarto usually initializes this on first run. | Run `quarto check` after installation so the user config directory is created. |

## Next Actions

- Fix these before claiming render readiness:
  - Quarto CLI: Install Quarto from https://quarto.org/docs/get-started/ for local renders.
- Nice-to-have fixes:
  - Pandoc: Install Pandoc 3.1+ or rely on the copy bundled with Quarto.
  - LaTeX engine (tectonic/pdflatex): Install Tectonic (preferred) or TeX Live to enable PDF output.
  - Quarto user config directory: Run `quarto check` after installation so the user config directory is created.
