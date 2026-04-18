# Render Environment Doctor

Generated: 2026-04-18T10:32:15.171Z

## Host Overview

- Platform: linux 6.8.0-107-generic
- Architecture: x64
- CPU: DO-Regular (2 cores)
- Memory (GB): 3.82
- Timezone: UTC

## Check Summary

- All required checks passed.
- Additional warnings: Pandoc, LaTeX engine (tectonic/pdflatex), Quarto user config directory
- Exit code: 2
- Repo bootstrap PATH includes: `/home/openclaw/quarto/bin`
- Repo bootstrap added PATH entry this run: yes

## Detailed Checks

| Check | Required | Status | Details | Recommendation |
| --- | --- | --- | --- | --- |
| Node.js runtime | Yes | ✅ PASS | Detected v22.22.0, required ≥ v18.0.0 |  |
| npm CLI | Yes | ✅ PASS | Detected v10.9.4 |  |
| git | Yes | ✅ PASS | Detected v2.43.0 |  |
| Quarto CLI | Yes | ✅ PASS | Detected v1.6.42 via PATH |  |
| Pandoc | No | ⚠️ WARN | Command `pandoc` was not found in PATH. | Install Pandoc 3.1+ or rely on the copy bundled with Quarto. |
| LaTeX engine (tectonic/pdflatex) | No | ⚠️ WARN | Command `tectonic` was not found in PATH. | Install Tectonic (preferred) or TeX Live to enable PDF output. |
| Quarto user config directory | No | ⚠️ WARN | Not found. Quarto usually initializes this on first run. | Run `quarto check` after Quarto is available on PATH so the user config directory is created. |

## Next Actions

- Nice-to-have fixes:
  - Pandoc: Install Pandoc 3.1+ or rely on the copy bundled with Quarto.
  - LaTeX engine (tectonic/pdflatex): Install Tectonic (preferred) or TeX Live to enable PDF output.
  - Quarto user config directory: Run `quarto check` after Quarto is available on PATH so the user config directory is created.
