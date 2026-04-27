# @thermal-label/contracts

Shared TypeScript types and interfaces for the **thermal-label** printer driver
ecosystem. **Types only**, zero runtime dependencies — safe to import from Node,
the browser, or any bundler.

## Install

```bash
pnpm add @thermal-label/contracts
```

## What's in the box

This package defines **interfaces and types** that drivers, transports, and
applications agree on. For runtime transport implementations, see
[`@thermal-label/transport`](/transport/).

### Interfaces

| Export | Purpose |
|---|---|
| `Transport` | Bidirectional byte channel to a printer. |
| `PrinterAdapter` | High-level printer: `print()`, `createPreview()`, `getStatus()`, `close()`. |
| `PrinterDiscovery` | Enumerate and open printers for a driver family. |
| `DeviceDescriptor` | Static description of a supported model (VID/PID, transports, BLE config). |
| `MediaDescriptor` | Base media shape (width, height, type, `colorCapable`). Drivers extend it. |
| `PrinterStatus` | Runtime status with `detectedMedia` and structured `errors[]`. |
| `PrintOptions` | Per-call print options (copies, density). |
| `PreviewOptions` / `PreviewResult` / `PreviewPlane` | Preview API shapes. |
| `DiscoveredPrinter` / `OpenOptions` | Discovery payloads. |
| `BluetoothConfig` | GATT UUIDs and MTU for a BLE-capable device. |
| `TransportType` | `'usb' \| 'tcp' \| 'webusb' \| 'web-bluetooth' \| 'web-serial' \| 'serial'`. |

### Errors

| Export | Thrown when |
|---|---|
| `TransportError` | Base class for all transport-layer failures. |
| `TransportTimeoutError` | A read timed out waiting for bytes. |
| `TransportClosedError` | The transport was closed mid-operation. |
| `DeviceNotFoundError` | No device matches the requested VID/PID filter. |
| `UnsupportedOperationError` | Operation not supported by this driver/printer/media. |
| `MediaNotSpecifiedError` | `print()` / `createPreview()` called without a known media. |

### Bitmap re-exports

`LabelBitmap` and `RawImageData` are re-exported from
[`@mbtech-nl/bitmap`](https://www.npmjs.com/package/@mbtech-nl/bitmap) so
drivers and consumers need only one import for everything they pass through
`PrinterAdapter`.

## Sketch — implementing `PrinterAdapter`

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

  get connected(): boolean { return true; }

  async print(image: RawImageData, media?: MediaDescriptor, options?: PrintOptions) {
    const m = media ?? this.lastStatus?.detectedMedia;
    if (!m) throw new MediaNotSpecifiedError();
    // render RGBA → native format, stream to the printer...
  }

  async createPreview(image: RawImageData, options?: PreviewOptions): Promise<PreviewResult> { /* … */ }
  async getStatus(): Promise<PrinterStatus> { /* … */ }
  async close(): Promise<void> { /* … */ }
}
```

For working implementations, see the existing drivers:
[`brother-ql`](/brother-ql/), [`labelmanager`](/labelmanager/),
[`labelwriter`](/labelwriter/).

## Key design decisions

- **`MediaDescriptor.heightMm` is optional** — undefined = continuous media,
  a number = fixed length. No magic zero.
- **`PrinterStatus` has only `detectedMedia?`** — no redundant scalar
  `mediaWidthMm` / `mediaType`. One source of truth.
- **`PrinterStatus.errors` is `PrinterError[]`** with `{ code, message }` —
  programmatic branching, not string matching.
- **`PrintOptions.density` is `string`** — drivers validate internally.
  `'normal'` is universally supported; drivers throw
  `UnsupportedOperationError` for values they don't recognise.
- **`DeviceDescriptor.vid` / `pid` are optional** — required only when
  `transports` includes USB or WebUSB. Network-only printers omit them.
- **Two-colour splitting is driver knowledge** — the contract says
  `colorCapable: boolean`. What "red" means is up to the driver.
- **`print()` is one label per call** — batch = loop. Drivers manage job
  framing internally.

## Compatibility

| | |
|---|---|
| Runtime | Node ≥ 24, modern browsers (types only — no runtime gate) |
| Peer dependency | `@mbtech-nl/bitmap` (for `LabelBitmap` / `RawImageData` re-exports) |
| License | MIT |

[Source on GitHub](https://github.com/thermal-label/contracts) ·
[npm](https://www.npmjs.com/package/@thermal-label/contracts)
