[README.md](https://github.com/user-attachments/files/34395987/README.md)
# SOTIF Lab — Engineering safety through scenarios

An independent **educational website** exploring Safety of the Intended Functionality (SOTIF / ISO 21448:2022), with a fictional AEB pedestrian case study, a browser-only scenario ledger, and a basic stopping-distance calculator.

## Features

- Responsive, six-section engineering website; no framework, accounts or build tools required.
- Original introductions to intended functionality, functional insufficiency, triggering conditions, and V&V.
- Fictional AEB-pedestrian case study, test matrix, and one-click transfer into the scenario ledger.
- Scenario ledger with add / edit / duplicate / delete / filter / search and three labeled sample records.
- Browser `localStorage` saving, JSON import/export backup, CSV export, and printable report.
- Adjustable AEB **physics sandbox** showing `d = v*t + v²/(2*a)` for a stationary obstacle.
- Official reference links to ISO, Euro NCAP, and MathWorks.

**Important:** No application feature assesses ISO 21448 conformity, determines acceptability of risk, validates an actual AEB system, or provides a vehicle release decision. The numeric braking sandbox ignores crucial dynamics and uncertainty. This is **not** validated safety engineering software.

## Open the website locally

Open `index.html` in your browser. Most features work directly, though running a local server is recommended:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000 . No package installation or credentials are needed.

## Publish free on GitHub Pages

1. Create a GitHub repository such as `sotif-lab`.
2. Upload **the contents of this folder** to the root of that repository (`index.html`, `styles.css`, `app.js`, `favicon.svg`, `.nojekyll`, and `README.md`). Do not upload them inside a nested `sotif-lab` directory.
3. Commit the changes to your default branch (usually `main`).
4. Open **Settings → Pages → Build and deployment → Source: Deploy from a branch**, select `main` and `/(root)`, then save.
5. The resulting address should be of the form `https://YOUR-USERNAME.github.io/sotif-lab/` (exact address depends on repository settings).
6. Optional: configure a custom domain in GitHub Pages settings, then update DNS as indicated by GitHub.

Reference: [GitHub Pages official documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## How data is saved

Records are saved exclusively to the **current browser** using `localStorage` with the key `sotif-lab-scenarios-v1`. There is **no backend, sync, login, or encryption**. Clearing the browser's site data or switching devices can erase records; export JSON to back them up. Anyone with access to that browser profile may be able to view them. Do not input confidential project data or personal data.

The first visit shows three **fictional sample records**. They can be edited or deleted. JSON import replaces (rather than merges with) current records after confirmation. The CSV export is a table; the JSON export is the restore format. Print report uses your browser print dialog. Each record tracks simple workflow status and evidence notes; it does **not** compute formal SOTIF risk acceptance.

## Engineering references

- [ISO 21448:2022 official overview](https://www.iso.org/standard/77490.html)
- [ISO 26262-1:2018 official overview](https://www.iso.org/standard/68383.html)
- [Euro NCAP VRU Protection protocols](https://www.euroncap.com/vru-protection/)
- [Euro NCAP Safety Assist protocols](https://www.euroncap.com/safety-assist/)
- [MathWorks: AEB with Sensor Fusion](https://www.mathworks.com/help/driving/ug/autonomous-emergency-braking-with-sensor-fusion.html)
- [MathWorks: Automated Testing for AEB](https://www.mathworks.com/help/driving/ug/automate-testing-for-autonomous-emergency-braking.html)

The material is independently authored and does not reproduce normative clauses of the ISO standard. It is not endorsed by ISO, Euro NCAP or MathWorks. Official documents may be copyrighted or require a license.

## Customize

- `index.html` — content, navigation, illustrations, and source links.
- `styles.css` — colors, responsive layout, typography and print appearance.
- `app.js` — example records, scenario workspace, CSV/JSON operations and braking calculations.
- `favicon.svg` — logo.

The externally hosted Google Fonts are optional: the site falls back to installed system fonts when offline.

## Suggested phase 2

- Add real traceability linking functional requirements, scenario variants, tests and evidence IDs.
- Add scenario parameterization with OpenSCENARIO export, validation rules and provenance.
- Add authenticated project storage and access control **before** any organizational collaboration or confidential use.
- Run domain-expert reviews and formal tool validation before any safety-critical workflow.

© 2026 SOTIF Lab. Educational demonstration.
