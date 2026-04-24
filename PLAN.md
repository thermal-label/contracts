# @thermal-label/contracts — Implementation Plan

> Pure types and interfaces for the thermal-label printer driver ecosystem.
> Zero runtime dependencies beyond `@mbtech-nl/bitmap` type re-exports.
> Zero Node.js built-ins. Safe to import from any environment.
>
> This package defines the contracts that all drivers implement and all
> consumers program against. It is the source of truth for the driver
> interface.
>
> **SCOPE: this plan covers ONLY the contracts package.** Do not modify,
> inspect, or reference code in sibling driver packages (brother-ql,
> labelwriter, labelmanager). Those will be retrofitted in separate
> amendments. This package is greenfield — build it from the plan, not
> from existing driver code.

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
│   ├── transport.ts
│   ├── adapter.ts
│   ├── media.ts
│   ├── preview.ts
│   ├── device.ts
│   ├── discovery.ts
│   ├── status.ts
│   ├── errors.ts
│   ├── bitmap.ts
│   └── __tests__/
│       ├── errors.test.ts
│       └── types.test.ts
├── PROGRESS.md
├── DECISIONS.md
├── BLOCKERS.md
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.build.json
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
   *
   * BLE implementations: there is no "read N bytes" primitive in BLE.
   * Implementations must buffer incoming GATT notifications internally
   * and satisfy read() calls from the buffer. Document this in your
   * transport class — every BLE impl must handle buffering consistently.
   *
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
 * (print area dots, margins, head geometry, etc.).
 *
 * Contracts defines the minimum shape. Structural typing means any
 * superset passes cleanly to PrinterAdapter methods.
 *
 * @example
 * // Brother QL continuous tape
 * { id: 259, name: '62mm continuous', widthMm: 62, type: 'continuous', colorCapable: false }
 *
 * @example
 * // Brother QL two-colour tape
 * { id: 251, name: 'DK-22251 62mm', widthMm: 62, type: 'continuous', colorCapable: true }
 *
 * @example
 * // Die-cut address label
 * { id: 274, name: '62×29mm', widthMm: 62, heightMm: 29, type: 'die-cut', colorCapable: false }
 */
export interface MediaDescriptor {
  /** Unique identifier within the driver family. */
  id: string | number;

  /** Human-readable name, e.g. "62mm continuous" or "DK-22251". */
  name: string;

  /** Physical width in mm. */
  widthMm: number;

  /**
   * Physical height/length in mm.
   * Undefined = continuous (variable length, printer cuts to content).
   * A number = fixed length (die-cut labels, tape segments).
   */
  heightMm?: number;

  /**
   * Media type classification — driver-specific string values.
   * Common values: 'continuous', 'die-cut', 'tape'.
   * Drivers may define additional values as needed.
   */
  type: string;

  /**
   * Whether this media supports multi-colour printing.
   * false for most media. true for e.g. Brother QL DK-22251 (black + red).
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
   * The device descriptor for the connected printer.
   * Useful for logging, diagnostics, and displaying VID/PID.
   * Undefined if the connection was established without device matching
   * (e.g. raw TCP to a known IP).
   */
  readonly device?: DeviceDescriptor;

  /**
   * Print from a full-colour RGBA image.
   *
   * The driver converts to its native format internally:
   * - Single-colour drivers threshold/dither RGBA to 1bpp
   * - Two-colour drivers check media.colorCapable and split planes if true
   *
   * Two-colour splitting: the driver decides what constitutes each colour.
   * The contracts package does NOT define what "red" means — that's
   * driver-specific knowledge (e.g. brother-ql-core's isRedish() heuristic).
   *
   * For multi-page batch jobs, call print() once per label. The driver
   * handles job framing internally (e.g. Brother QL page-break commands
   * between sequential print() calls within the same session).
   *
   * @param image — full RGBA, typically from designer.render()
   * @param media — which media to print on. Determines dimensions, margins,
   *   and colour mode. If omitted, uses detected media from last getStatus().
   * @throws MediaNotSpecifiedError if no media is known.
   */
  print(image: RawImageData, media?: MediaDescriptor, options?: PrintOptions): Promise<void>;

  /**
   * Generate a preview showing how this printer would reproduce the design
   * on the given media. Returns separated 1bpp planes with display colours.
   *
   * The driver uses its own colour-splitting logic (same code that print()
   * uses internally) to produce the planes. The consuming app renders
   * whatever planes come back without needing to know the splitting rules.
   *
   * For offline preview without a live connection, use the static
   * createPreviewOffline() function exported from the driver's *-core
   * package instead.
   *
   * @param image — full RGBA, typically from designer.render()
   * @param options — optional media override.
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
   *
   * If omitted, uses detected media from last getStatus().
   * If no status available and no override, driver defaults to
   * single-colour at its native head width with assumed: true.
   */
  media?: MediaDescriptor;
}

export interface PreviewResult {
  /** One entry per colour plane the printer would produce. */
  planes: PreviewPlane[];

  /** The media used for this preview (detected, overridden, or defaulted). */
  media: MediaDescriptor;

  /**
   * True if media was assumed/defaulted because detection wasn't available
   * and no override was provided.
   *
   * The consuming app MUST communicate this to the user, e.g.:
   * "Preview may differ from print — select media or connect printer
   * for accurate result."
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
   * The app uses this to render the bitmap in the correct colour.
   */
  displayColor: string;
}
```

### 2.5 PrintOptions and PrinterStatus

```typescript
export interface PrintOptions {
  copies?: number;

  /**
   * Driver-specific density setting.
   * Common values: 'light', 'normal', 'dark'.
   * Some drivers support additional values: 'medium', 'high'.
   * The driver throws UnsupportedOperationError for unrecognised values.
   * 'normal' is universally supported across all drivers.
   */
  density?: string;
}

export interface PrinterStatus {
  /** Printer is ready to accept a print job. */
  ready: boolean;

  /** Media is loaded (if printer supports detection). */
  mediaLoaded: boolean;

  /**
   * Detected media descriptor, if the printer supports detection.
   * Undefined if printer can't detect (LabelWriter 450, LabelManager)
   * or no status has been queried yet.
   *
   * When present, this is what PrinterAdapter.print() and createPreview()
   * use as the default when no explicit media is provided.
   */
  detectedMedia?: MediaDescriptor;

  /**
   * Structured error list. Empty array = no errors.
   * Use code for programmatic branching, message for display.
   */
  errors: PrinterError[];

  /** Raw status bytes from the printer — for diagnostics and debugging. */
  rawBytes: Uint8Array;
}

export interface PrinterError {
  /** Machine-readable error code, e.g. 'no_media', 'cover_open', 'cutter_jam'. */
  code: string;
  /** Human-readable error description. */
  message: string;
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

  /**
   * USB Vendor ID. Required when transports includes 'usb' or 'webusb'.
   * Undefined for network-only printers (e.g. LabelWriter 550 Turbo
   * accessed purely over Ethernet).
   */
  vid?: number;

  /**
   * USB Product ID. Required when transports includes 'usb' or 'webusb'.
   * Undefined for network-only printers.
   */
  pid?: number;

  /** Driver family this device belongs to. */
  family: string;

  /** Supported transport types for this device. */
  transports: TransportType[];

  /**
   * BLE connection parameters. Present only when transports includes
   * 'web-bluetooth'. Discovered by sniffing GATT traffic from the
   * manufacturer's mobile app — use nRF Connect or LightBlue on the
   * live device.
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
 * The unified CLI uses discoverAll() across all installed drivers.
 */
export interface PrinterDiscovery {
  /** Driver family identifier — matches DeviceDescriptor.family. */
  readonly family: string;

  /** List connected printers on this transport. */
  listPrinters(): Promise<DiscoveredPrinter[]>;

  /**
   * Open a printer matching the given options.
   * If no options provided, opens the first available printer.
   */
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
    super(vid != null && pid != null
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
    super(
      'No media specified and none detected. ' +
      'Provide media explicitly or call getStatus() first.'
    );
    this.name = 'MediaNotSpecifiedError';
  }
}
```

---

## 4. Recommended Patterns

These are guidance for driver implementers — documented here so every
driver follows the same conventions, but not enforced as interfaces.

### 4.1 Offline Preview

Each driver's `*-core` package should export a standalone preview function
for hardware-free previews:

```typescript
// Recommended export from each *-core package
export function createPreviewOffline(
  image: RawImageData,
  media: FamilySpecificMedia,  // driver's extended MediaDescriptor
): PreviewResult;
```

**Why separate from the instance method?** The instance `createPreview()`
can use detected media from `getStatus()` as a fallback. The static
function requires explicit media — there's no printer to query.
Implementers should share the core splitting/rendering logic between
both to avoid duplication.

### 4.2 Media Auto-Detection Flow

```
printer.getStatus()
  → PrinterStatus.detectedMedia is populated (or undefined)

printer.print(image)
  → no explicit media → check this.lastStatus.detectedMedia
  → if present: use it
  → if absent: throw MediaNotSpecifiedError

printer.print(image, explicitMedia)
  → use explicitMedia, ignore detection

printer.createPreview(image)
  → same fallback logic as print()

printer.createPreview(image, { media: override })
  → use the override
```

### 4.3 Single-Colour Driver Shortcut

Drivers that only support single-colour output (LabelWriter, LabelManager)
have a trivial `createPreview()`:

```typescript
async createPreview(image, options?) {
  const media = options?.media ?? this.detectedMedia ?? this.defaultMedia();
  const bitmap = renderImage(image, { dither: true });
  return {
    planes: [{ name: 'black', bitmap, displayColor: '#000000' }],
    media,
    assumed: !options?.media && !this.detectedMedia,
  };
}
```

No colour splitting needed. `colorCapable` on their media descriptors is
always `false`.

### 4.4 Two-Colour Contract

The contracts package does NOT define what "red" means. That's driver
knowledge:

- Brother QL's `splitTwoColor()` uses an `isRedish(r, g, b)` heuristic
- A future printer with different colours would use a different heuristic
- The contract says: `MediaDescriptor.colorCapable: boolean`. If true,
  the driver splits. If false, everything goes to one black plane.
- The preview's `PreviewPlane.displayColor` communicates the colour to
  the UI — the UI doesn't need to know the splitting rules.

### 4.5 Multi-Page Batch Printing

`print()` handles one label per call. For batch jobs:

```typescript
for (const row of csvRows) {
  const image = await designer.render(row);
  await printer.print(image, media);
}
```

The driver manages internal job state across sequential `print()` calls
(Brother QL page-break commands, LabelWriter form feeds, etc.). If a
future driver needs explicit batch framing, add `beginBatch()` /
`endBatch()` methods — don't overload `print()`.

---

## 5. Package Setup

```json
{
  "name": "@thermal-label/contracts",
  "version": "0.1.0",
  "description": "Shared types and interfaces for thermal-label printer drivers",
  "keywords": ["thermal-label", "printer", "driver", "types", "interfaces"],
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

**No `engines` field.** This is a pure types package — works on any Node
version. Don't restrict consumers unnecessarily.

Use `tsconfig.json` (wide scope, noEmit, for typecheck + lint) and
`tsconfig.build.json` (narrow scope, emit only `src/`). Same pattern as
sheet-templates — required by `@mbtech-nl/eslint-config`'s `projectService`.

---

## 6. Tests

### 6.1 Error Types (`errors.test.ts`)

- `TransportTimeoutError` — correct name, message includes timeout value, transport field set
- `TransportClosedError` — correct name, transport field set
- `DeviceNotFoundError` — formats VID/PID in hex when provided, generic message when not
- `MediaNotSpecifiedError` — helpful message mentioning getStatus()
- `UnsupportedOperationError` — message includes operation and reason
- All `Transport*Error` subtypes are instanceof both `TransportError` and `Error`
- `DeviceNotFoundError` is instanceof `Error` but not `TransportError`

### 6.2 Type Checks (`types.test.ts`)

Compile-time structural compatibility checks. Use whichever vitest type
assertion API is current — check docs for your installed version:

```typescript
// A driver's extended device descriptor satisfies the base
interface TestDevice extends DeviceDescriptor {
  family: 'test';
  customField: number;
}

// A driver's extended media descriptor satisfies the base
interface TestMedia extends MediaDescriptor {
  printAreaDots: number;
  leftMarginPins: number;
}

// PreviewResult.planes is PreviewPlane[]
// PrinterStatus.errors is PrinterError[]
// PrinterAdapter has all required methods
```

---

## 7. README

- Package name + one-line description
- Install snippet: `pnpm add @thermal-label/contracts`
- Interface overview — one-line per exported type/interface
- "This package is types and interfaces only — for transport implementations
  see `@thermal-label/transport`"
- Example: sketch of a `PrinterAdapter` implementation
- Example: using `PreviewResult` in a UI
- Table of existing drivers that will implement these contracts
- Link to contributor guide (in transport package, once it ships)
- "Applying these contracts to existing drivers is covered in separate
  driver retrofit amendments."
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

Release workflow: standard npm trusted publishing.

---

## 9. Implementation Sequence

```
1. Scaffold
   - LICENSE (MIT, Mannes Brak)
   - .github/FUNDING.yml
   - package.json (NO engines field), tsconfig.json, tsconfig.build.json,
     eslint.config.js
   - GitHub Actions: ci.yml, release.yml
   - .gitignore
   - PROGRESS.md, DECISIONS.md, BLOCKERS.md
   - pnpm install — must complete without errors
   - Commit + push

2. Core types
   - src/transport.ts — Transport interface (with BLE buffering note)
   - src/media.ts — MediaDescriptor (heightMm optional, type is string)
   - src/status.ts — PrinterStatus (detectedMedia only, no scalar
     mediaWidthMm/mediaType), PrintOptions (density is string),
     PrinterError
   - src/device.ts — DeviceDescriptor (vid/pid optional),
     TransportType, BluetoothConfig
   - src/discovery.ts — PrinterDiscovery, DiscoveredPrinter, OpenOptions
   - src/bitmap.ts — re-export LabelBitmap, RawImageData
   - Gate: typecheck + build
   - Commit + push

3. Adapter and preview types
   - src/adapter.ts — PrinterAdapter (with device? field, print takes
     RawImageData + optional media, createPreview documented)
   - src/preview.ts — PreviewOptions (media only, no threshold/dither),
     PreviewResult, PreviewPlane
   - Gate: typecheck + build
   - Commit + push

4. Error types
   - src/errors.ts — all error classes including MediaNotSpecifiedError
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

**Scope:**
- **ONLY implement this package.** Do not modify, inspect, or import from
  sibling driver packages. Do not check how brother-ql or labelwriter
  currently structure their types. Build from this plan only.
- Driver retrofits are a separate follow-up — not part of this work.

**Design decisions (locked in):**
- **`MediaDescriptor.heightMm` is optional** — undefined = continuous.
  No magic zero value.
- **`PrinterStatus` has `detectedMedia?: MediaDescriptor` only** — no
  separate `mediaWidthMm` or `mediaType` scalars. One source of truth.
- **`PrinterStatus.errors` is `PrinterError[]`** with `{ code, message }` —
  not `string[]`. Enables programmatic branching.
- **`PrintOptions.density` is `string`** — drivers validate internally.
  `'normal'` is universally supported. Drivers throw
  `UnsupportedOperationError` for unrecognised values.
- **`DeviceDescriptor.vid` and `pid` are optional** — required only when
  transports includes USB or WebUSB. Network-only printers omit them.
- **`PrinterAdapter.device?` is exposed** — optional readonly, for logging
  and diagnostics.
- **`PreviewOptions` has only `media?`** — no `threshold`/`dither`. Those
  are driver-specific rendering concerns, not preview contract concerns.
- **Two-colour splitting is driver knowledge** — contracts says
  `colorCapable: boolean`. What "red" means is up to brother-ql-core.
- **`print()` is one label per call** — batch = loop. Driver manages job
  framing internally.
- **No `engines` field** — pure types work on any Node version.

**Tooling:**
- Two tsconfigs: `tsconfig.json` wide for lint, `tsconfig.build.json`
  narrow for emit.
- `@mbtech-nl/eslint-config`, `prettier-config`, `tsconfig` as usual.
- `publishConfig: { access: "public" }`.
- `pnpm prettier --check` in CI.
- `sideEffects: false`.
- At 0.x, break freely — no deprecation ceremony.
