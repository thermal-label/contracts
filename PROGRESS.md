# Implementation Progress

Tracks completion of the steps in `PLAN.md` §9.

## Step 1 — Scaffold

- [x] LICENSE (MIT, Mannes Brak)
- [x] .github/FUNDING.yml
- [x] package.json (NO engines field)
- [x] tsconfig.json (wide, noEmit)
- [x] tsconfig.build.json (narrow, emits to dist)
- [x] eslint.config.js
- [x] vitest.config.ts
- [x] .github/workflows/ci.yml
- [x] .github/workflows/release.yml
- [x] .gitignore
- [x] PROGRESS.md / DECISIONS.md / BLOCKERS.md
- [x] `pnpm install` completes cleanly
- [x] Commit + push

## Step 2 — Core types

- [x] `src/transport.ts` — `Transport` interface (with BLE buffering note)
- [x] `src/media.ts` — `MediaDescriptor` (heightMm optional, type is string)
- [x] `src/status.ts` — `PrinterStatus` (detectedMedia only), `PrintOptions`, `PrinterError`
- [x] `src/device.ts` — `DeviceDescriptor` (vid/pid optional), `TransportType`, `BluetoothConfig`
- [x] `src/bitmap.ts` — re-export `LabelBitmap`, `RawImageData`
- [x] Gate: typecheck + build
- [x] Commit + push

> `discovery.ts` was moved to Step 3 — see DECISIONS.md D7.

## Step 3 — Adapter, preview, and discovery types

- [x] `src/adapter.ts` — `PrinterAdapter` (with `device?`, `print` takes `RawImageData` + optional media)
- [x] `src/preview.ts` — `PreviewOptions` (media only), `PreviewResult`, `PreviewPlane`
- [x] `src/discovery.ts` — `PrinterDiscovery`, `DiscoveredPrinter`, `OpenOptions`
- [x] Gate: typecheck + build
- [x] Commit + push

## Step 4 — Error types

- [x] `src/errors.ts` — all error classes incl. `MediaNotSpecifiedError`
- [x] `src/__tests__/errors.test.ts`
- [x] Gate: typecheck + lint + test + build
- [x] Commit + push

## Step 5 — Index and type tests

- [ ] `src/index.ts` — export everything
- [ ] `src/__tests__/types.test.ts` — structural compatibility checks
- [ ] Gate: typecheck + lint + test + build
- [ ] Commit + push

## Step 6 — README

- [ ] `README.md` publish-ready (per PLAN §7)
- [ ] Commit + push

## Step 7 — Final

- [ ] `pnpm test:coverage` — thresholds pass
- [ ] All PROGRESS.md checkboxes ticked
- [ ] Publish to npm (requires operator approval — see BLOCKERS.md)
- [ ] Commit + push
