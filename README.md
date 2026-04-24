# @thermal-label/contracts

[![npm version](https://img.shields.io/npm/v/@thermal-label/contracts.svg)](https://www.npmjs.com/package/@thermal-label/contracts)
[![CI](https://github.com/thermal-label/contracts/actions/workflows/ci.yml/badge.svg)](https://github.com/thermal-label/contracts/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Shared types and interfaces for the thermal-label printer driver
ecosystem. Pure TypeScript — zero runtime dependencies beyond a type
re-export from [`@mbtech-nl/bitmap`][bitmap]. Safe to import from Node,
the browser, or any bundler.

## Install

```bash
pnpm add @thermal-label/contracts
```

## What's in the box

This package is **types and interfaces only**. For transport
implementations (USB, TCP, WebUSB, Web Bluetooth), see
[`@thermal-label/transport`][transport].

### Interfaces

| Export              | Purpose                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| `Transport`         | Bidirectional byte channel to a printer. Implemented per transport type.              |
| `PrinterAdapter`    | High-level printer interface. `print()`, `createPreview()`, `getStatus()`, `close()`. |
| `PrinterDiscovery`  | Enumerate and open printers for a driver family.                                      |
| `DeviceDescriptor`  | Static description of a supported printer model (VID/PID, transports, BLE config).    |
| `MediaDescriptor`   | Base media shape (width, height, type, `colorCapable`). Drivers extend it.            |
| `PrinterStatus`     | Runtime status including `detectedMedia` and structured `PrinterError[]`.             |
| `PrintOptions`      | Per-call print options (copies, density).                                             |
| `PreviewOptions`    | Media override for `createPreview()`.                                                 |
| `PreviewResult`     | Preview with separated colour planes and an `assumed` flag.                           |
| `PreviewPlane`      | One colour plane — bitmap + display colour.                                           |
| `DiscoveredPrinter` | One entry returned by `PrinterDiscovery.listPrinters()`.                              |
| `OpenOptions`       | Filter for `PrinterDiscovery.openPrinter()`.                                          |
| `BluetoothConfig`   | GATT UUIDs and MTU for a BLE-capable device.                                          |
| `TransportType`     | `'usb' \| 'tcp' \| 'webusb' \| 'web-bluetooth'`.                                      |

### Errors

| Export                       | Thrown when                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `TransportError`             | Base class for all transport-layer failures.                    |
| `TransportTimeoutError`      | A read timed out waiting for bytes.                             |
| `TransportClosedError`       | The transport was closed mid-operation.                         |
| `DeviceNotFoundError`        | No device matches the requested VID/PID filter.                 |
| `UnsupportedOperationError`  | Operation not supported by this driver/printer/media.           |
| `MediaNotSpecifiedError`     | `print()` / `createPreview()` called without a known media.     |

### Bitmap re-exports

`LabelBitmap` and `RawImageData` are re-exported from
[`@mbtech-nl/bitmap`][bitmap] so drivers and consumers need only one
import for everything they pass through `PrinterAdapter`.

## Example: implementing `PrinterAdapter`

A sketch — see each driver's `*-core` / `*-node` / `*-web` packages
for real implementations.

```ts
import type {
  DeviceDescriptor,
  MediaDescriptor,
  PreviewOptions,
  PreviewResult,
  PrinterAdapter,
  PrinterStatus,
  PrintOptions,
  RawImageData,
} from '@thermal-label/contracts';
import { MediaNotSpecifiedError } from '@thermal-label/contracts';

export class MyPrinter implements PrinterAdapter {
  readonly family = 'my-driver';
  readonly model: string;
  readonly device: DeviceDescriptor;

  private lastStatus?: PrinterStatus;

  constructor(device: DeviceDescriptor) {
    this.device = device;
    this.model = device.name;
  }

  get connected(): boolean {
    /* ... */
    return true;
  }

  async print(
    image: RawImageData,
    media?: MediaDescriptor,
    options?: PrintOptions,
  ): Promise<void> {
    const m = media ?? this.lastStatus?.detectedMedia;
    if (!m) throw new MediaNotSpecifiedError();
    // render RGBA → native format, stream to the printer...
  }

  async createPreview(
    image: RawImageData,
    options?: PreviewOptions,
  ): Promise<PreviewResult> {
    // return { planes: [...], media, assumed: ... }
  }

  async getStatus(): Promise<PrinterStatus> {
    // query the printer, cache `lastStatus`, return it
  }

  async close(): Promise<void> {
    /* ... */
  }
}
```

## Example: rendering `PreviewResult` in a UI

```ts
import type { PreviewResult } from '@thermal-label/contracts';

function renderPreview(canvas: HTMLCanvasElement, preview: PreviewResult): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (preview.assumed) {
    showWarning(
      'Preview may differ from print — select media or connect printer for an accurate result.',
    );
  }

  // Each plane renders in its own colour; composite them on the canvas.
  for (const plane of preview.planes) {
    drawBitmap(ctx, plane.bitmap, plane.displayColor);
  }
}
```

## Drivers that implement these contracts

| Family       | Package                               | Status      |
| ------------ | ------------------------------------- | ----------- |
| Brother QL   | `@thermal-label/brother-ql-*`         | Retrofitting |
| LabelWriter  | `@thermal-label/labelwriter-*`        | Retrofitting |
| LabelManager | `@thermal-label/labelmanager-*`       | Retrofitting |

> Applying these contracts to existing drivers is covered in separate
> driver retrofit amendments. This package defines the interface; each
> driver implements it in its own repository.

A contributor guide for writing new drivers will live in the
`@thermal-label/transport` package once it ships.

## Key design decisions

- **`MediaDescriptor.heightMm` is optional** — undefined = continuous
  media, a number = fixed length. No magic zero.
- **`PrinterStatus` has only `detectedMedia?`** — no redundant scalar
  `mediaWidthMm` / `mediaType`. One source of truth.
- **`PrinterStatus.errors` is `PrinterError[]`** with `{ code, message }`
  — programmatic branching, not string matching.
- **`PrintOptions.density` is `string`** — drivers validate internally.
  `'normal'` is universally supported; drivers throw
  `UnsupportedOperationError` for values they don't recognise.
- **`DeviceDescriptor.vid` / `pid` are optional** — required only when
  `transports` includes USB or WebUSB. Network-only printers omit them.
- **Two-colour splitting is driver knowledge** — the contract says
  `colorCapable: boolean`. What "red" means is up to the driver.
- **`print()` is one label per call** — batch = loop. Drivers manage job
  framing internally.

## Attribution

Not affiliated with Dymo, Brother, Seiko Epson, or any other printer
manufacturer. Trademarks belong to their respective owners.

## Funding

If you rely on this package commercially, please consider sponsoring:

- [GitHub Sponsors](https://github.com/sponsors/mannes)
- [Ko-fi](https://ko-fi.com/mannes)

## License

[MIT](./LICENSE) © Mannes Brak

[bitmap]: https://www.npmjs.com/package/@mbtech-nl/bitmap
[transport]: https://www.npmjs.com/package/@thermal-label/transport
