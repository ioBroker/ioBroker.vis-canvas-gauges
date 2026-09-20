# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

`iobroker.vis-canvas-gauges` is a **widget set for ioBroker.vis and vis-2**, not a running adapter.
`io-package.json` declares `"mode": "none"`, `"onlyWWW": true`, `"type": "visualization-widgets"` — there is **no
Node.js runtime code**. Everything ships in `widgets/` and runs in the browser inside vis.

The widgets draw with [canvas-gauges](https://canvas-gauges.com) (MIT, Mykhailo Stadnyk) into a `<canvas>`. Four
of them exist **twice**, with the same widget ids and the same attribute names; `CGProgress` was added for vis-2
and has no vis-1 template:

| | vis (vis-1) | vis-2 |
|---|---|---|
| source | `widgets/canvas-gauges.html` + `widgets/canvas-gauges/` (hand-maintained) | `src-widgets/src/*.tsx` |
| library | `widgets/canvas-gauges/js/gauge.min.js`, a vendored copy loaded as a global | the `canvas-gauges` npm package, bundled |
| technique | EJS templates, jQuery | React + TypeScript |
| shipped as | the same files | `widgets/vis-2-widgets-canvas-gauges/` (generated) |

vis-2 loads both and **a React widget replaces the EJS widget of the same id** (`visWidgetsCatalog.tsx`:
`visWidgetTypes.findIndex(item => item.name === widgetObj.name)` → replace; the runtime then resolves
`VisWidgetsCatalog.rxWidgets[widget.tpl]` first). That is the whole migration mechanism, and it only works while
three things hold:

1. `getWidgetInfo().id` equals the vis-1 `<script id="tplCG…">`.
2. `getWidgetInfo().visSet` is `'canvas-gauges'`.
3. Every attribute name of the vis-1 template still exists — widget data is stored per attribute name, so a
   renamed field silently drops the user's setting.

`npm run check-widgets` enforces all three; see below.

## Commands

```bash
npm run build          # sync version into the vis-1 set, then npm i + tsc + vite build + copy to widgets/
npm run tsc            # type-check src-widgets only
npm run check-widgets  # validate the widget declarations against the vis-1 templates (see below)
npm run preview        # vite dev server with a stub of vis-2 - shows all widgets without an ioBroker
npm run screenshots    # render the images of docs/img/ with a headless Chrome (see below)
npm run lint           # eslint with @iobroker/eslint-config
npm test               # mocha --exit -> test/testPackageFiles.js (package/io-package validation)
npm run npm            # install in root and src-widgets
npm run release-patch  # release-script; runs lint before the check and build before the commit
```

`npm run build` must not be replaced by a plain vite build: `tasks.js` deletes **only**
`widgets/vis-2-widgets-canvas-gauges` and `src-widgets/build`, never the whole `widgets/` folder — the vis-1 set
lives there and is maintained by hand.

### Version bumps

The version lives in `package.json`, `io-package.json` (both handled by `release-script`), plus the header comment
of `widgets/canvas-gauges.html` and the `version:` field of `vis.binds['canvas-gauges']` in the same file.
`tasks.js` rewrites the latter two by regex from `package.json` on every build (`node tasks --version` does only
that), so keep those literals in a shape the regex still matches.

### `npm run check-widgets`

`src-widgets/checkWidgets.mjs` bundles the widget sources for node — with `canvas-gauges` aliased to a stub, since
the real library needs a DOM — stubs `window.visRxWidget`, calls every `getWidgetInfo()` and checks the three
migration invariants above plus that every `label`/`tooltip`/select option exists in `src-widgets/src/i18n/en.json`
and that every `visPrev` file is in `src-widgets/public/`. Dropping an attribute of a vis-1 template is an error;
adding one is only reported (`| new: …`), and the eight options the vis-1 set never offered show up there.

A widget id in its `VIS2_ONLY` set is not compared against the vis-1 file at all — that is how `tplCGprogress`
passes. Put a new vis-2-only widget in that set instead of writing an EJS template for it.

It looks the templates up by `<script id="tpl…"` and not by `id="tpl…"`, because an older, shorter version of
`tplCGlinearGauge` stands commented out above the real one and does not declare the groups of the bar.

## Architecture of the vis-2 widget set (`src-widgets/`)

Vite + `@module-federation/vite`, federation name `visCanvasGauges`, remote entry `customWidgets.js`. The exposed
component names and the URL are repeated in `io-package.json` under `common.visWidgets.visCanvasGauges` — adding a
widget means touching `vite.config.ts` (`exposes`) **and** that block.

`moduleFederationShared(pack)` from `@iobroker/types-vis-2` filters the shared modules by the dependencies in
`src-widgets/package.json`. React and `react/jsx-runtime` must stay shared, otherwise vis-2's
`visWidgetSetCompatibility.ts` refuses to load the set.

`canvas-gauges` ships a single UMD file, so `build.commonjsOptions.transformMixedEsModules` and an
`optimizeDeps.include` entry are needed — in both `vite.config.ts` and `preview/vite.config.mts`.

`@swc/core` is pinned to `1.15.30` via `overrides` — `vite-plugin-top-level-await` fails on 1.16 with
`missing field 'type'` while printing the AST.

### Widget classes

The five widgets are the **same gauge with different presets**, so almost everything lives in two shared files:

- `src/gaugeOptions.ts` — `buildOptions(data, type, width, height, borderRadius)` turns the widget attributes into
  the option object of the library. It is the counterpart of `vis.binds['canvas-gauges'].gauge()` plus
  `linearGauge()` / `radialGauge()` in `widgets/canvas-gauges.html`.
- `src/Components/GaugeBase.tsx` — the abstract widget class plus one `groupXxx(defaults)` helper per attribute
  group. Every widget composes its `visAttrs` from those helpers and its own `DEFAULTS` map, which holds exactly
  the `name[default]` values of its vis-1 template (`CGProgress` has none, so its map is a design of its own).

`CGLinearGauge`, `CGRadialGauge`, `CGCompas`, `CGFlatGauge` and `CGProgress` therefore only declare
`getWidgetInfo()`, their `DEFAULTS` and `getGaugeType()` (`'radial'` or `'linear'`).

`src/Components/GaugeCanvas.tsx` owns the library instance. It is created once and afterwards only fed with
`update()` and `value`; re-creating it on every render would restart the animation on every state change.

### Conventions that come from the vis-1 set

- **An attribute the user never touched must not reach the options.** `isSet()` guards almost every option in
  `buildOptions`, because writing `undefined` would override the default of the library. Only the block at the top
  of `buildOptions` is written unconditionally — the vis-1 widget did the same, which is why an unchecked *Stroke
  ticks* really turns the strokes off instead of falling back to the library default `true`.
- **Attribute values arrive as strings.** `utils.ts` has the coercions (`isTrue`, `isSet`, `toNumber`, `toInt`).
- **`valueText` is passed in, not formatted by the library.** Firefox otherwise keeps the text of the previous
  frame in the value box; that workaround is from 1.0.1 (oweitman) and `padValue()` in `utils.ts` reproduces its
  formatting, including the default of 0 digits when *Before/After comma* are empty.
- **`factor` and `offset` are not options of the library.** They ride along in the option object (the library
  keeps unknown keys) but the widget applies them itself before setting `value`.
- **Highlights are counted differently per type.** The radial gauge takes the values of the scale, the linear one
  counts from `minValue` — as in vis-1.
- **The dark theme is a fallback palette, not a repaint.** `DARK_PALETTE` in `GaugeBase.tsx` holds the colours
  that replace the light defaults; `getThemePalette()` puts one into the palette only while the field is empty or
  still carries the widget's own preset (`data[name] === getFieldDefaults()[name]`), and `optionalString()` then
  lets the palette win over the stored value - otherwise the white plate of the flat gauge, which comes from its
  preset, would stay white. A widget overrides `getThemeExceptions()` for colours that are a decision rather than
  a light-theme value; `CGProgress` does that for its transparent plate and its invisible numbers.
  The needle, the bar progress and the shadows are deliberately not in the palette: they belong to the instrument.
- **`followTheme` only reaches widgets that are created after it existed.** `Editor.addWidget` writes
  `field.default` into the widget data when a widget is placed (`if (field.default != null)`), and nothing
  materialises defaults later - not on render, not on load. That is what keeps migrated vis-1 projects untouched,
  and it is also why `getFieldDefaults()` may be compared against the stored data at all.
- **The value box of a linear gauge is drawn only while the widget stands upright.** `se()` in the library ends in
  `barDimensions.isVertical && drawValueBox(...)`, and `isVertical` is `height >= width`. That is why `CGProgress`
  ships with `valueBox: false` and why the documentation carries a note under *Value box*.
- **`highlightsWidth` / `highlightsLineCap` are not per section.** They sit in the `common` group next to `hCount`
  and are hidden with `'!data.hCount'`; the indexed `highlights` group would repeat them per section.
- The widget **measures itself** with a `ResizeObserver` and passes `width`/`height` into the options; the canvas
  has a fixed pixel size, so every resize has to reach the library. `borderRadius` is read from the computed style
  of the root, which is what the linear gauge draws its plate with.

### `src-widgets/preview/` — the development page

`npm run preview` starts a vite dev server (port 4173) with a page that renders all five widgets against a stub of
`VisRxWidget`. No ioBroker needed, and editing a widget hot-reloads it. The value lives in the page, so one slider
drives every widget at once; a "run" checkbox walks the value up and down, which is the fastest way to see whether
the animation is smooth.

`preview/stub.tsx` (the `VisRxWidget` stub) and `preview/widgets.ts` are shared by two pages: `index.html`, the
interactive page above, and `shots.html`, fixed scenes for the documentation. Every `<section data-shot="name">`
of `shots.tsx` becomes `docs/img/name.png`. `npm run screenshots` (`preview/screenshots.mjs`) starts its own vite
on port 4175 with its own cache dir, drives a local Chrome over the DevTools protocol (node 22 `WebSocket`, no
puppeteer) and saves the sections at 2x. `npm run screenshots -- radial compas` renders only those. The scenes set
`animation: false`, otherwise the shot would catch a needle on its way. After changing how a widget looks,
re-render the images and check the user documentation in `docs/en/README.md` and `docs/de/README.md`.

Note that the scripts of `src-widgets` have to be called with `npx` (`cd src-widgets && npx vite …`): `npm run`
only puts the `node_modules/.bin` of the **root** on the PATH.

**A blank preview page usually means a second vite is running.** Two dev servers of the same project overwrite
each other's optimized dependencies and the page then loads without any error. The config therefore uses
`strictPort: true` (a second `npm run preview` fails with "Port 4173 is already in use" instead of moving to 4174)
and its own `cacheDir`. If a server seems stuck, check with
`Get-NetTCPConnection -State Listen -LocalPort 4173` — stopping the npm wrapper does not always kill the vite
process underneath.

## The vis-1 widget set (`widgets/`)

Still shipped and still maintained by hand; only touch it for fixes that vis (vis-1) users need.

- `widgets/canvas-gauges.html` — the `systemDictionary` of the attribute labels, `vis.binds['canvas-gauges']` and
  one `<script type="text/ejs" class="vis-tpl" id="tplCG…">` per widget. The `data-vis-attrs*` mini-DSL defines
  the editor fields (`;`-separated, `group.x` opens a group, `[default]`, `/type`, `(1-hCount)` for indexed
  groups).
- `widgets/canvas-gauges/js/gauge.min.js` is a vendored third-party copy of the library, excluded from CodeQL.
- Lines ~503–526 are an **older, commented-out copy of `tplCGlinearGauge`** without the bar groups. Dead code.

Known bugs of the vis-1 code that the React widgets do **not** reproduce — they are listed in "Differences to
vis-1" of the user documentation: `ticksPadding` was written into `barBeginCircle`, `fontValueWeight` into
`fontNumbers`, the `majorTicks` loop dropped its last label on a rounding error, and a state without a value at
load time was never subscribed.

## Changelog

`README.md` carries the changelog; the release script moves the `### **WORK IN PROGRESS**` section into
`io-package.json` `common.news` with translations. Add entries as `* (author) description`.
