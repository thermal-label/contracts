# @thermal-label/contracts

> Shared TypeScript interfaces and types for the thermal-label printer ecosystem. Types only, zero runtime dependencies.

[![npm version](https://img.shields.io/npm/v/@thermal-label/contracts.svg)](https://www.npmjs.com/package/@thermal-label/contracts)
[![CI](https://github.com/thermal-label/contracts/actions/workflows/ci.yml/badge.svg)](https://github.com/thermal-label/contracts/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Install

```bash
pnpm add @thermal-label/contracts
```

## Quick example

```ts
import type {
  PrinterAdapter,
  MediaDescriptor,
  PrinterStatus,
  RawImageData,
} from '@thermal-label/contracts';
import { MediaNotSpecifiedError } from '@thermal-label/contracts';

export class MyPrinter implements PrinterAdapter {
  readonly family = 'my-driver';
  readonly model = 'XYZ-100';
  // ... implement print(), createPreview(), getStatus(), close() ...

  async print(image: RawImageData, media?: MediaDescriptor): Promise<void> {
    const m = media ?? this.lastStatus?.detectedMedia;
    if (!m) throw new MediaNotSpecifiedError();
    // render RGBA → native format, stream to the printer...
  }
}
```

## Documentation

Full docs at **<https://thermal-label.github.io/contracts/>**.

- Interface reference (Transport, PrinterAdapter, PrinterDiscovery, MediaDescriptor, PrinterStatus, errors)
- Implementation sketches
- Key design decisions

## Compatibility

| | |
|---|---|
| Runtime | Node ≥ 24, modern browsers (types only — no runtime gate) |
| Peer | `@mbtech-nl/bitmap` for `LabelBitmap` / `RawImageData` re-exports |
| License | MIT |

## Contributing

See [`CONTRIBUTING/`](https://github.com/thermal-label/.github/tree/main/CONTRIBUTING)
on the org `.github` repo.
