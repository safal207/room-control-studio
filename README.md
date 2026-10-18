# Room Control

A tactile local smart-home simulator with a fully procedural 3D room.

Умная комната: оригинальная геометрия мебели, освещение, четыре сценария, климат, сохранение настроек и экспорт.

## Explore

- [Public demo](https://safal207.github.io/room-control-studio/)
- [Portfolio and learning paths](https://safal207.github.io/test-it-python/ai-path/)
- [Scope, contribution and evidence](PORTFOLIO.md)

## Features

- Original procedural furniture and room geometry
- Three independently controlled lights, master dimmer and four presets
- Two camera views and constrained pointer rotation
- Temperature target, local state persistence, defensive state validation and JSON export

## Run locally

No package installation, API keys or CDN are required. Serve the static directory:

```bash
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Opening index.html directly as file:// is not supported because the application uses browser modules.

## Validate

```bash
npm run check
```

Checks cover local links, unique HTML IDs, JavaScript syntax and relevant state/export contracts. This is not a browser-rendering certification.

## Scope and limitations

- Local simulation only; no real devices or home network are connected.
- Temperature is a target, not a sensor reading.
- Lighting watts are an estimate from fictional lamp ratings, not measured consumption.
- WebGL visual output has not been manually inspected in this environment.

## Credits and licensing

The room and furniture geometry are original procedural work. Three.js 0.149.0 is vendored with its MIT notice.

Creative direction and implementation: Alexey Safonov, with AI assistance. Code under MIT; preserve all third-party notices. Inspiration: the supplied Meng To visual references. No commercial relationship or endorsement is implied.

## Loading-state regression

Camera choices made while the 3D module loads are retained and applied when it becomes ready. `npm run check` covers the deferred import race, scenario switches and thermostat bounds using a mocked DOM/renderer. It does not certify real WebGL rendering.

## Learning flow and reliable visual fallback

`#process` demonstrates **Away → Evening → Custom light**. Each step changes the actual shared state: zero lights / 0 W, three lights at 75% / 32 W, then one floor lamp at 50% / 4 W. The result sentence explains the current lights, brightness and estimated power.

The original `diagram.js` floor plan is visible before the first successful 3D frame and after rendering or context-loss errors. It reacts to the same lighting, day/night and climate state as the 3D room. A visible switch lets learners compare the scheme and 3D. `assets/room-preview.svg` is generated from this scheme with the evening preset; it is an illustration, not a 3D screenshot.

The controller hides the scheme only after the first state update renders successfully. Late state, resize and drag-render failures restore it, retain controls and expose a retry. The bounded controller test covers first-frame and late failures, context loss, retry, retained settings, the three lesson steps and the existing camera-loading race. DOM and GPU are mocked; real device rendering remains unverified.
