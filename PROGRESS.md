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

- [x] `src/index.ts` — export everything
- [x] `src/__tests__/types.test.ts` — structural compatibility checks
- [x] Gate: typecheck + lint + test + build
- [x] Commit + push

## Step 6 — README

- [x] `README.md` publish-ready (per PLAN §7)
- [x] Commit + push

## Step 7 — Final

- [x] `pnpm test:coverage` — thresholds pass (100% on runtime files)
- [x] `pnpm pack` tarball verified: LICENSE + README + full dist
- [x] All PROGRESS.md checkboxes ticked (this one excepted until commit)
- [ ] Publish to npm — **deferred to operator, see BLOCKERS.md B1**
- [x] Commit + push

## Step 8 — MediaDescriptor refactor + orientation

> Plan: [MEDIA_DESCRIPTOR_REFACTOR.md](../brother-ql/MEDIA_DESCRIPTOR_REFACTOR.md)

- [x] Bump self to `0.2.0`
- [x] Bump `@mbtech-nl/bitmap` to `^1.2.0`
- [x] `src/bitmap.ts` re-export `PaletteEntry`
- [x] `src/media.ts` drop `colorCapable`, add `palette` / `defaultOrientation` / `printMargins` / `cornerRadiusMm`
- [x] `src/orientation.ts` (new) — `pickRotation` + `RotateDirection`
- [x] `src/index.ts` export `PaletteEntry`, `pickRotation`, `RotateDirection`
- [x] `src/adapter.ts` — JSDoc updated for palette + orientation strategy
- [x] `src/__tests__/types.test.ts` — assertions for new fields
- [x] `src/__tests__/orientation.test.ts` (new) — pickRotation truth table
- [x] Gates green (typecheck, lint, format, test, build)

## Step 9 — Generic device & media library (contracts shape)

> Plan: [plans/backlog/generic-device-media-library.md](plans/backlog/generic-device-media-library.md)
>
> Scoped to contracts only — driver migrations land separately per their own plans.

- [x] `src/media.ts` — add `skus` / `category` / `targetModels`
- [x] `src/device.ts` — full rewrite to the registry shape (BREAKING):
  - [x] Narrow `TransportType` to wire-protocol-only (`usb` / `tcp` / `serial` / `bluetooth-spp` / `bluetooth-gatt`)
  - [x] Per-transport schemas: `UsbTransport` / `TcpTransport` / `SerialTransport` / `BluetoothSppTransport` / `BluetoothGattTransport`
  - [x] `DeviceTransports` keyed object replacing the old transport string array
  - [x] `PrintEngine` with `bind` (USB-composite + protocol-layer routing) and `PrintEngineCapabilities`
  - [x] `DeviceSupport` / `DeviceReport` folding the per-driver `hardware-status.yaml` overlay inline
  - [x] `DeviceEntry` replacing `DeviceDescriptor`
  - [x] `DeviceRegistry` pinned to `schemaVersion: 1`
- [x] `src/adapter.ts` / `src/discovery.ts` — switch to `DeviceEntry`
- [x] `src/status.ts` — add `PrintOptions.engine`
- [x] `src/errors.ts` — add `EngineRequiredError`
- [x] `src/compatibility.ts` (new) — `mediaCompatibleWith` / `compatibleMediaFor` / `mediaIdentitiesMatch`
- [x] `src/resolution.ts` (new) — `resolveSupportedDevices`, `EngineDescriptor`, `SupportedDevice` (uses `allEnginesDrivable` + `drivableTransports` / `undrivableTransports`, no combined `fullySupported` flag)
- [x] `src/index.ts` — export the new surface
- [x] `src/__tests__/types.test.ts` — assertions for the new shape
- [x] `src/__tests__/errors.test.ts` — drop dead transport literals; add `EngineRequiredError`
- [x] `src/__tests__/compatibility.test.ts` (new)
- [x] `src/__tests__/resolution.test.ts` (new)
- [x] Gates green (typecheck, lint, test, build) and 100 % coverage on runtime files

> Driver migrations are tracked in each driver's own backlog plan
> (`migrate-to-contracts-shape.md` in `labelwriter`, `brother-ql`,
> `labelmanager`). Niimbot will conform on first non-stub commit.

