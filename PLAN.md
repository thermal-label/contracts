# @thermal-label/contracts — Implementation Plan

> Pure types and interfaces for the thermal-label printer driver ecosystem.
> Zero runtime dependencies. Zero Node.js built-ins. Safe to import from
> any environment. This package defines the contracts that all drivers
> implement and all consumers program against.
>
> **This is the source of truth for the driver interface.** When contracts
> says `PrinterAdapter.print()` accepts `RawImageData`, every driver
> implements that. When contracts defines `MediaDescriptor`, every driver
> extends it. Changes here are intentional and propagate everywhere.

---

## 1. Repository

`github.com/thermal-label/contracts`

Single package — not a monorepo. Small, stable, rarely changes.

```
contracts/
├── .github/
│   ├── FUNDING.yml
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── src/
│   ├── index.ts
│   ├── transport.ts          # Transport interface
│   ├── adapter.ts            # PrinterAdapter
│   ├── media.ts              # MediaDescriptor
│   ├── preview.ts            # PreviewOptions, PreviewResult, PreviewPlane
│   ├── device.ts             # DeviceDescriptor, BluetoothConfig, TransportType
│   ├── discovery.ts          # PrinterDiscovery, DiscoveredPrinter, OpenOptions
│   ├── status.ts             # PrinterStatus, PrintOptions
│   ├── errors.ts             # error classes
│   ├── bitmap.ts             # re-export LabelBitmap, RawImageData from @mbtech-nl/bitmap
│   └── __tests__/
│       ├── errors.test.ts
│       └── types.test.ts     # compile-time type checks
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.build.json       # narrow emit scope (see sheet-templates lesson)
└── eslint.config.js
```

---

## 2. Interfaces

### 2.1 Transport

```typescript
/**
 * A bidirectional byte channel to a printer.
 * Implemented by @thermal-label/transport for each transport type
 * (USB, TCP, WebUSB, Web Bluetooth).
 */
export interface Transport {
  /** Send bytes to the printer. */
  write(data: Uint8Array): Promise<void>;

  /**
   * Read bytes from the printer.
   * Buffers until `length` bytes are available or timeout occurs.
   * @throws TransportTimeoutError on timeout.
   * @throws TransportClosedError if closed mid-read.
   */
  read(length: number, timeout?: number): Promise<Uint8Array>;

  /** Close the connection. Always safe to call multiple times. Always await. */
  close(): Promise<void>;

  /** Whether the transport is currently connected. */
  readonly connected: boolean;
}
```

### 2.2 MediaDescriptor

```typescript
/**
 * Base media descriptor. Each driver extends with family-specific fields
 * (print area, margins, head geometry, etc.).
 *
 * Contracts defines the minimum shape that PrinterAdapter methods accept.
 * Structural typing means any superset passes cleanly.
 */
export interface MediaDescriptor {
  /** Unique identifier within the driver family. */
  id: string | number;

  /** Human-readable name, e.g. "62mm continuous" or "DK-22251". */
  name: string;

  /** Physical width in mm. */
  widthMm: number;

  /** Physical height/length in mm. 0 = continuous (variable length). */
  heightMm: number;

  /** Media type classification — driver-specific values. */
  type: string;  // e.g. 'continuous' | 'die-cut' | 'tape'

  /**
   * Whether this media supports multi-colour printing.
   * false for most media. true for Brother QL DK-22251 (black + red).
   * The driver uses this to decide whether to split colour planes.
   */
  colorCapable: boolean;
}
```

### 2.3 PrinterAdapter

```typescript
/**
 * High-level printer interface. Each driver family implements this.
 * Consumers (burnmark-cli, label-maker app) program against this
 * interface and don't need to know which driver is behind it.
 */
export interface PrinterAdapter {
  /** Driver family identifier, e.g. 'brother-ql', 'labelwriter'. */
  readonly family: string;

  /** Human-readable model name from device registry. */
  readonly model: string;

  /** Whether the printer is currently connected. */
  readonly connected: boolean;

  /**
   * Print from a full-colour RGBA image.
   *
   * The driver converts to its native format internally:
   * - Single-colour drivers threshold/dither to 1bpp
   * - Two-colour drivers check media.colorCapable and split planes if true
   *
   * @param image — full RGBA, typically from designer.render()
   * @param media — which media to print on. Determines dimensions, margins,
   *   and colour mode. If omitted, uses detected media from last getStatus().
   *   Throws if no media is known.
   * @param options — copies, density, etc.
   */
  print(image: RawImageData, media?: MediaDescriptor, options?: PrintOptions): Promise<void>;

  /**
   * Generate a preview showing how this printer would reproduce the design
   * on the given media. Returns separated 1bpp planes with display colours.
   *
   * @param image — full RGBA, typically from designer.render()
   * @param options — optional media override and render settings.
   *   If media is omitted, uses detected media from last getStatus().
   *   If no status available, defaults to single-colour at the printer's
   *   native head width.
   */
  createPreview(image: RawImageData, options?: PreviewOptions): Promise<PreviewResult>;

  /** Query printer status including detected media. */
  getStatus(): Promise<PrinterStatus>;

  /** Close the connection. Always call in finally blocks. */
  close(): Promise<void>;
}
```

### 2.4 Preview Types

```typescript
export interface PreviewOptions {
  /**
   * Override detected media. Use when:
   * - Printer can't detect media (LabelWriter 450, LabelManager)
   * - Designing offline for a specific media type
   * - Testing with a specific media configuration
   */
  media?: MediaDescriptor;

  /** Threshold for 1bpp conversion (0-255, default 128). */
  threshold?: number;

  /** Use Floyd-Steinberg dithering (default true). */
  dither?: boolean;
}

export interface PreviewResult {
  /** One entry per colour plane the printer would produce. */
  planes: PreviewPlane[];

  /** The media used for this preview (detected, overridden, or defaulted). */
  media: MediaDescriptor;

  /**
   * True if media was assumed/defaulted because detection wasn't available
   * and no override was provided. The consuming app should communicate this
   * to the user: "preview may differ from print — select media or connect
   * printer for accurate result."
   */
  assumed: boolean;
}

export interface PreviewPlane {
  /** Plane name — e.g. 'black', 'red'. */
  name: string;

  /** The 1bpp bitmap for this plane. */
  bitmap: LabelBitmap;

  /**
   * CSS colour to display this plane in the preview UI.
   * e.g. '#000000' for black, '#ff0000' for red.
   */
  displayColor: string;
}
```

### 2.5 PrintOptions and PrinterStatus

```typescript
export interface PrintOptions {
  copies?: number;
  density?: 'light' | 'normal' | 'dark';
}

export interface PrinterStatus {
  /** Printer is ready to accept a print job. */
  ready: boolean;

  /** Media is loaded and detected (if printer supports detection). */
  mediaLoaded: boolean;

  /** Detected media width in mm (undefined if printer can't detect). */
  mediaWidthMm?: number;

  /** Detected media type string (undefined if printer can't detect). */
  mediaType?: string;

  /**
   * Full detected media descriptor, if the printer supports detection.
   * Undefined if printer can't detect (LabelWriter 450, LabelManager)
   * or no status has been queried yet.
   *
   * When present, this is what PrinterAdapter.print() and createPreview()
   * use as the default when no explicit media is provided.
   */
  detectedMedia?: MediaDescriptor;

  /** Human-readable error descriptions. Empty array = no errors. */
  errors: string[];

  /** Raw status bytes from the printer — for diagnostics and debugging. */
  rawBytes: Uint8Array;
}
```

### 2.6 DeviceDescriptor

```typescript
/**
 * Static description of a supported printer model.
 * Each driver's device registry extends this with family-specific fields.
 */
export interface DeviceDescriptor {
  /** Human-readable model name. */
  name: string;

  /** USB Vendor ID. */
  vid: number;

  /** USB Product ID. */
  pid: number;

  /** Driver family this device belongs to. */
  family: string;

  /** Supported transport types for this device. */
  transports: TransportType[];

  /**
   * BLE connection parameters. Present only when transports includes
   * 'web-bluetooth'. Discovered by sniffing GATT traffic from the
   * manufacturer's mobile app.
   */
  bluetooth?: BluetoothConfig;
}

export type TransportType = 'usb' | 'tcp' | 'webusb' | 'web-bluetooth';

export interface BluetoothConfig {
  /** Primary GATT service UUID for this printer family. */
  serviceUuid: string;
  /** GATT characteristic UUID for write (TX to printer). */
  txCharacteristicUuid: string;
  /** GATT characteristic UUID for read/notify (RX from printer). Omit if same as TX. */
  rxCharacteristicUuid?: string;
  /** Device name prefix for the browser picker filter, e.g. "QL-820". */
  namePrefix?: string;
  /** Maximum transmission unit in bytes. Default 20, negotiate larger if supported. */
  mtu?: number;
}
```

### 2.7 PrinterDiscovery

```typescript
/**
 * Interface for discovering available printers.
 * Each driver implements this for its supported transports.
 * The unified CLI uses discoverAll() to auto-detect printers
 * across all installed driver packages.
 */
export interface PrinterDiscovery {
  /** Driver family identifier — matches DeviceDescriptor.family. */
  readonly family: string;

  /** List connected printers on this transport. */
  listPrinters(): Promise<DiscoveredPrinter[]>;

  /** Open a specific printer by identifier. */
  openPrinter(options?: OpenOptions): Promise<PrinterAdapter>;
}

export interface DiscoveredPrinter {
  device: DeviceDescriptor;
  serialNumber?: string;
  transport: TransportType;
  /** Transport-specific connection info (USB path, TCP host:port, BLE address). */
  connectionId: string;
}

export interface OpenOptions {
  vid?: number;
  pid?: number;
  serialNumber?: string;
  host?: string;       // TCP
  port?: number;       // TCP, default 9100
}
```

### 2.8 Bitmap Re-exports

```typescript
/**
 * Re-export from @mbtech-nl/bitmap so drivers and consumers only need
 * one import for the types they pass through the PrinterAdapter interface.
 */
export type { LabelBitmap, RawImageData } from '@mbtech-nl/bitmap';
```

---

## 3. Error Types

```typescript
export class TransportError extends Error {
  constructor(message: string, public readonly transport: TransportType) {
    super(message);
    this.name = 'TransportError';
  }
}

export class TransportTimeoutError extends TransportError {
  constructor(transport: TransportType, timeoutMs: number) {
    super(`Read timed out after ${timeoutMs}ms`, transport);
    this.name = 'TransportTimeoutError';
  }
}

export class TransportClosedError extends TransportError {
  constructor(transport: TransportType) {
    super('Transport is closed', transport);
    this.name = 'TransportClosedError';
  }
}

export class DeviceNotFoundError extends Error {
  constructor(vid?: number, pid?: number) {
    super(vid && pid
      ? `No device found with VID=0x${vid.toString(16)} PID=0x${pid.toString(16)}`
      : 'No compatible device found');
    this.name = 'DeviceNotFoundError';
  }
}

export class UnsupportedOperationError extends Error {
  constructor(operation: string, reason: string) {
    super(`${operation}: ${reason}`);
    this.name = 'UnsupportedOperationError';
  }
}

export class MediaNotSpecifiedError extends Error {
  constructor() {
    super('No media specified and none detected — provide media explicitly or call getStatus() first');
    this.name = 'MediaNotSpecifiedError';
  }
}
```

---

## 4. Recommended Patterns (not interfaces — guidance for implementers)

### 4.1 Offline Preview

Each driver's `*-core` package should export a standalone preview function
that works without a live printer connection:

```typescript
// Recommended export from @thermal-label/brother-ql-core
export function createPreviewOffline(
  image: RawImageData,
  media: BrotherQLMedia,
  options?: { threshold?: number; dither?: boolean },
): PreviewResult;

// Recommended export from @thermal-label/labelwriter-core
export function createPreviewOffline(
  image: RawImageData,
  media: LabelWriterMedia,
  options?: { threshold?: number; dither?: boolean },
): PreviewResult;
```

This enables the label-maker app to show previews when designing for a
specific printer/media combination without hardware connected. The app
imports the target driver's core package and calls `createPreviewOffline`.

This is a recommended pattern, not a contracts interface — it's a static
function export, not a method on an instance.

### 4.2 Media Auto-Detection Flow

```
printer.getStatus()
  → PrinterStatus.detectedMedia is populated (or undefined)

printer.print(image)
  → no explicit media provided
  → driver checks this.lastStatus.detectedMedia
  → if present: use it (auto-detected)
  → if absent: throw MediaNotSpecifiedError

printer.print(image, explicitMedia)
  → explicit media provided
  → use it, ignore detection

printer.createPreview(image)
  → same fallback logic as print()

printer.createPreview(image, { media: manuallySelected })
  → use the provided media override
```

### 4.3 Single-Colour Driver Shortcut

Single-colour drivers (LabelWriter, LabelManager) always return one
plane from `createPreview()`:

```typescript
async createPreview(image, options?) {
  const media = options?.media ?? this.detectedMedia ?? this.defaultMedia();
  const bitmap = renderImage(image, { dither: options?.dither ?? true });
  return {
    planes: [{ name: 'black', bitmap, displayColor: '#000000' }],
    media,
    assumed: !options?.media && !this.detectedMedia,
  };
}
```

No colour splitting logic needed. `colorCapable` on their media descriptors
is always `false`.

---

## 5. Package Setup

```json
{
  "name": "@thermal-label/contracts",
  "version": "0.1.0",
  "description": "Shared interfaces for thermal-label printer drivers",
  "keywords": ["thermal-label", "printer", "driver", "interfaces", "contracts", "usb", "bluetooth"],
  "type": "module",
  "author": "Mannes Brak",
  "license": "MIT",
  "homepage": "https://github.com/thermal-label/contracts",
  "repository": { "type": "git", "url": "https://github.com/thermal-label/contracts.git" },
  "bugs": { "url": "https://github.com/thermal-label/contracts/issues" },
  "funding": [
    { "type": "github", "url": "https://github.com/sponsors/mannes" },
    { "type": "ko-fi", "url": "https://ko-fi.com/mannes" }
  ],
  "files": ["dist", "README.md"],
  "engines": { "node": ">=24.0.0" },
  "publishConfig": { "access": "public" },
  "sideEffects": false,
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./src/index.ts"
    }
  },
  "dependencies": {
    "@mbtech-nl/bitmap": "^0.1.0"
  },
  "devDependencies": {
    "@mbtech-nl/eslint-config": "^1.0.0",
    "@mbtech-nl/prettier-config": "^1.0.0",
    "@mbtech-nl/tsconfig": "^1.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "typescript": "~5.5.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0"
  }
}
```

Zero runtime deps beyond the bitmap types re-export. No `usb`, no
`@types/node`, no platform-specific anything.

Use `tsconfig.json` (wide scope, noEmit, for typecheck + lint) and
`tsconfig.build.json` (narrow scope, emit) — same pattern as sheet-templates.

---

## 6. Tests

### 6.1 Error Types (`errors.test.ts`)

- `TransportTimeoutError` has correct name, message, transport field
- `TransportClosedError` has correct name
- `DeviceNotFoundError` formats VID/PID in hex
- `MediaNotSpecifiedError` has helpful message
- All error types are instanceof their parent classes
- `TransportError` subtypes are instanceof both `TransportError` and `Error`

### 6.2 Type Checks (`types.test.ts`)

Compile-time structural compatibility checks:

```typescript
import { expectTypeOf } from 'vitest';

// A driver's extended device descriptor satisfies the base
interface TestDevice extends DeviceDescriptor {
  family: 'test';
  customField: number;
}
expectTypeOf<TestDevice>().toMatchTypeOf<DeviceDescriptor>();

// A driver's extended media descriptor satisfies the base
interface TestMedia extends MediaDescriptor {
  printAreaDots: number;
}
expectTypeOf<TestMedia>().toMatchTypeOf<MediaDescriptor>();

// PreviewResult.planes is an array of PreviewPlane
expectTypeOf<PreviewResult['planes']>().toMatchTypeOf<PreviewPlane[]>();
```

---

## 7. README

- Package name + one-line description
- Install snippet
- Interface overview — one-line description per exported type
- "This package is types and interfaces only — for transport implementations
  see `@thermal-label/transport`"
- Example: implementing `PrinterAdapter` for a hypothetical driver
- Example: using `createPreview` return value in a UI
- Table of existing drivers that implement these contracts
- Link to contributor guide in the transport package
- Attribution: not affiliated with Dymo, Brother, etc.
- License badge, funding links

---

## 8. CI/CD

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
        with: { version: 9 }
      - uses: actions/setup-node@v6
        with: { node-version: '24', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm prettier --check "src/**/*.ts"
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v5
        with: { token: '${{ secrets.CODECOV_TOKEN }}' }
      - run: pnpm build
```

Release workflow: standard npm trusted publishing, same pattern as all
other packages.

---

## 9. Implementation Sequence

```
1. Scaffold
   - LICENSE (MIT, Mannes Brak)
   - .github/FUNDING.yml
   - package.json, tsconfig.json, tsconfig.build.json, eslint.config.js
   - GitHub Actions: ci.yml, release.yml
   - .gitignore
   - PROGRESS.md with all steps as checkboxes
   - pnpm install — must complete without errors
   - Commit + push

2. Core types
   - src/transport.ts — Transport interface
   - src/media.ts — MediaDescriptor
   - src/status.ts — PrinterStatus, PrintOptions
   - src/device.ts — DeviceDescriptor, TransportType, BluetoothConfig
   - src/discovery.ts — PrinterDiscovery, DiscoveredPrinter, OpenOptions
   - src/bitmap.ts — re-export LabelBitmap, RawImageData
   - Gate: typecheck + build
   - Commit + push

3. Adapter and preview types
   - src/adapter.ts — PrinterAdapter (print, createPreview, getStatus, close)
   - src/preview.ts — PreviewOptions, PreviewResult, PreviewPlane
   - Gate: typecheck + build
   - Commit + push

4. Error types
   - src/errors.ts — all error classes
   - src/__tests__/errors.test.ts
   - Gate: typecheck + lint + test + build
   - Commit + push

5. Index and type tests
   - src/index.ts — export everything
   - src/__tests__/types.test.ts — structural compatibility checks
   - Gate: typecheck + lint + test + build
   - Commit + push

6. README
   - Complete, publish-ready per section 7
   - Commit + push

7. Final
   - pnpm test:coverage — verify thresholds
   - Verify all PROGRESS.md checkboxes ticked
   - Publish to npm
   - Commit + push
```

---

## 10. Key Constraints

- **Pure types** — zero runtime code beyond error class constructors.
  No platform deps, no `usb`, no `@types/node`.
- **`MediaDescriptor` is a base type** — each driver extends it with
  family-specific fields. Structural typing means any superset passes.
- **`PrinterAdapter.print()` accepts `RawImageData`** — the driver does
  RGBA → 1bpp conversion internally. The caller never touches bitmaps
  directly for printing.
- **`createPreview()` returns `PreviewResult` with `assumed` flag** —
  the consuming app MUST communicate to the user whether the preview
  is based on detected media or a guess.
- **`MediaNotSpecifiedError`** — thrown when `print()` or `createPreview()`
  has no media (not passed explicitly, not detected). The caller must
  either pass media or call `getStatus()` first.
- **`createPreviewOffline` is a recommended pattern, not an interface** —
  it's a static function export from each `*-core` package, documented
  in section 4.1 as guidance for implementers.
- **Web Bluetooth config on DeviceDescriptor** — `bluetooth?: BluetoothConfig`
  is optional, present only when `transports` includes `'web-bluetooth'`.
  UUIDs are discovered by GATT sniffing, not from documentation.
- **This package defines the interface. Drivers implement it. Consumers
  program against it.** Changes here propagate everywhere — be intentional.
- **`publishConfig: { access: "public" }`** in package.json.
- **`pnpm prettier --check`** in CI.
- **`sideEffects: false`** in package.json.
- **Two tsconfigs** — `tsconfig.json` wide scope for lint/typecheck,
  `tsconfig.build.json` narrow scope for emit.
- **At 0.x, break freely** — no deprecation ceremony. Bump and move on.