# Room Control — portfolio case

## Problem

Make a visual idea tangible through a small interactive experience that can be explored without an account.

## Contribution

- Original procedural furniture and room geometry
- Three independently controlled lights, master dimmer and four presets
- Two camera views and constrained pointer rotation
- Temperature target, local state persistence, defensive state validation and JSON export

The room and furniture geometry are original procedural work. Three.js 0.149.0 is vendored with its MIT notice.

## What a reviewer can try

1. Original procedural furniture and room geometry.
2. Three independently controlled lights, master dimmer and four presets.
3. Two camera views and constrained pointer rotation.
4. Temperature target, local state persistence, defensive state validation and JSON export.

## Verification boundary

- Node syntax, static local asset links and anchor targets checked by scripts/verify.mjs.
- Room Control additionally checks persisted-state sanitization, preset isolation and watt estimates.
- Layer Lab additionally checks palette/export consistency and hidden-layer exclusion.
- No real browser, mobile screenshot or WebGL runtime verification was available during this build.
- No performance, conversion, revenue or client-use results are claimed.

## Product scope

- Local simulation only; no real devices or home network are connected.
- Temperature is a target, not a sensor reading.
- Lighting watts are an estimate from fictional lamp ratings, not measured consumption.
- WebGL visual output has not been manually inspected in this environment.
