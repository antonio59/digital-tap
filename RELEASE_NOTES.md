# Release notes

## 2026-09-22 — Expanded FOI evidence, data pack, agent skills

**Landing page stats.** The social feed now shows the newer TfL disclosure
alongside the 2023 annual figures: **£231.5m charged on 36.3m incomplete
contactless journeys** in the 13 months to 28 Feb 2024, **£134.0m on phones
alone**, an average of **£6.39 per journey** (FOI-4349-2324). The annual
£164.7m / 22.2m headline (FOI-4311-2324) is unchanged.

**Cron.** `internal.foi.refresh` now fetches both FOI pages; the device split
is parsed separately (absolute figures, not "Xm" shorthand) and stored on
`foiStats` as optional fields. A device-fetch failure never blocks the annual
update; previously stored values persist on parse failure. Fallback constants
in `components/social-feed.tsx` mirror the new fields so the stat renders
before the first refresh.

**Content.** Tweet-brief standing stats cite both FOIs. About page corrected:
all **45** DLR stations (was 41).

**Docs.** New `docs/data-pack.md` — the sourced evidence base for the TfL
submission: headline figures, device clash, enforcement angle, market
readiness, accessibility, precedents (DfT digital PAYG trials, FAIRTIQ Go
BIBO, Wayfindr BLE on TfL), framing caveats and suggested formulations.

**Tooling.** Installed the `typesafe-ai` agent skill via `npx skills`
(`.agents/skills/`, symlinked into `.devin/skills/` and `.claude/skills/`);
`skills-lock.json` tracks the install.
