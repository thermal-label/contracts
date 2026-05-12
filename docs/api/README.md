# @thermal-label/contracts

## Classes

| Class | Description |
| ------ | ------ |
| [DeviceIdentificationRequiredError](classes/DeviceIdentificationRequiredError.md) | A driver-web `requestPrinters(opts)` factory opened the browser picker and got a port/device back, but couldn't decide which registry entry it corresponds to. The picker may have offered an unidentifiable serial port (Web Serial doesn't expose BT device names) or the picked USB device's VID/PID didn't match anything in the driver's registry. |
| [DeviceNotFoundError](classes/DeviceNotFoundError.md) | No device matching the requested filter was found on the host. |
| [EngineRequiredError](classes/EngineRequiredError.md) | `PrinterAdapter.print()` was called on a multi-engine device whose protocol does not support firmware-side auto-routing, without an explicit `engine` in `PrintOptions`. |
| [MediaNotSpecifiedError](classes/MediaNotSpecifiedError.md) | `PrinterAdapter.print()` or `createPreview()` was called without a media argument and no detected media was available. |
| [TransportClosedError](classes/TransportClosedError.md) | The transport was closed while a read or write was in flight, or a new operation was attempted on a closed transport. |
| [TransportError](classes/TransportError.md) | Base class for transport-layer errors. |
| [TransportTimeoutError](classes/TransportTimeoutError.md) | A read timed out waiting for bytes from the printer. |
| [UnsupportedOperationError](classes/UnsupportedOperationError.md) | The requested operation is not supported by this driver, printer, or media. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [BluetoothGattTransport](interfaces/BluetoothGattTransport.md) | Bluetooth Low Energy GATT. |
| [BluetoothSppTransport](interfaces/BluetoothSppTransport.md) | Bluetooth SPP (Serial Port Profile, classic Bluetooth). |
| [DeviceEntry](interfaces/DeviceEntry.md) | A device entry in a driver's registry. |
| [DeviceRegistry](interfaces/DeviceRegistry.md) | A driver's full device registry. |
| [~~DeviceReport~~](interfaces/DeviceReport.md) | A single accepted verification report against a device. |
| [~~DeviceSupport~~](interfaces/DeviceSupport.md) | Verification state for a device. |
| [DeviceTransports](interfaces/DeviceTransports.md) | Per-transport schema for a device. |
| [DiscoveredPrinter](interfaces/DiscoveredPrinter.md) | A printer that was discovered on one of the supported transports. |
| [EngineBind](interfaces/EngineBind.md) | Per-engine routing hints. |
| [EngineDescriptor](interfaces/EngineDescriptor.md) | A `PrintEngine` enriched with whether the host runtime has a registered protocol implementation for it. Returned per-engine by `resolveSupportedDevices`. |
| [ExpandedCell](interfaces/ExpandedCell.md) | Derived per-cell view emitted by `expandVerifications`. |
| [ExpandedDeviceEntry](interfaces/ExpandedDeviceEntry.md) | One device after expansion: original entry plus the derived grid and the rolled-up `supportStatus` (worst-case across declared transports, mapped to `EffectiveStatus`). |
| [ExpandedRegistry](interfaces/ExpandedRegistry.md) | Registry projection emitted by `expandVerifications`. |
| [LabelBitmap](interfaces/LabelBitmap.md) | A 1-bit-per-pixel bitmap. Row-major, MSB-first within each byte. |
| [MediaDescriptor](interfaces/MediaDescriptor.md) | Base media descriptor. |
| [OpenOptions](interfaces/OpenOptions.md) | Options for `PrinterDiscovery.openPrinter()`. |
| [PaletteEntry](interfaces/PaletteEntry.md) | One ink/foil colour the printer can place on the substrate. |
| [PreviewOptions](interfaces/PreviewOptions.md) | Options for `PrinterAdapter.createPreview()`. |
| [PreviewPlane](interfaces/PreviewPlane.md) | A single colour plane in a preview. |
| [PreviewResult](interfaces/PreviewResult.md) | Result of `PrinterAdapter.createPreview()`. |
| [PrintableArea](interfaces/PrintableArea.md) | Chassis-physical dead-zone insets around the printable rectangle. |
| [PrintEngine](interfaces/PrintEngine.md) | A print engine — one printhead with one protocol. |
| [PrintEngineCapabilities](interfaces/PrintEngineCapabilities.md) | Engine-level capability flags. |
| [PrinterAdapter](interfaces/PrinterAdapter.md) | High-level printer interface implemented by each driver family. |
| [PrinterDiscovery](interfaces/PrinterDiscovery.md) | Interface for discovering available printers. |
| [PrinterError](interfaces/PrinterError.md) | A single error reported by the printer. |
| [PrinterStatus](interfaces/PrinterStatus.md) | Runtime status of a printer. |
| [PrintOptions](interfaces/PrintOptions.md) | Options for a single `PrinterAdapter.print()` call. |
| [RawImageData](interfaces/RawImageData.md) | Raw RGBA image data, compatible with browser ImageData and @napi-rs/canvas ImageData. |
| [SerialTransport](interfaces/SerialTransport.md) | Physical serial transport parameters (UART / USB-serial). |
| [SupportedDevice](interfaces/SupportedDevice.md) | A device entry resolved against the host runtime's protocol and transport implementations. |
| [TcpTransport](interfaces/TcpTransport.md) | TCP transport parameters. |
| [Transport](interfaces/Transport.md) | A bidirectional byte channel to a printer. |
| [UsbTransport](interfaces/UsbTransport.md) | USB transport parameters. |
| [VerificationCell](interfaces/VerificationCell.md) | One cell of the verification grid — direct observation against one transport on one device. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ConnectOptions](type-aliases/ConnectOptions.md) | Options for the unified driver-web `requestPrinters(opts)` factory. |
| [DeviceVerifications](type-aliases/DeviceVerifications.md) | Per-device authoring block. |
| [EffectiveStatus](type-aliases/EffectiveStatus.md) | Render-time status surfaced after `expandVerifications`. |
| [ExpandedVerificationGrid](type-aliases/ExpandedVerificationGrid.md) | Per-device expanded grid: `transport → ExpandedCell`. Only transports the device declares appear; any cell with no direct observation and no propagation lift surfaces as `{ status: 'unverified' }`. |
| [~~LegacySupportStatus~~](type-aliases/LegacySupportStatus.md) | Legacy four-state verification status backing `DeviceSupport.status` and `DeviceReport.result`. |
| [PrinterAdapterMap](type-aliases/PrinterAdapterMap.md) | Map from engine role → PrinterAdapter for a connected device. |
| [RotateDirection](type-aliases/RotateDirection.md) | Direction the printer family rotates landscape input. |
| [SupportStatus](type-aliases/SupportStatus.md) | Stored verification rung — what a maintainer has directly observed. |
| [TransportType](type-aliases/TransportType.md) | Wire-protocol-only transport types. |

## Variables

| Variable | Description |
| ------ | ------ |
| [ZERO\_PRINTABLE\_AREA](variables/ZERO_PRINTABLE_AREA.md) | The all-zero `PrintableArea` returned by `getPrintableArea` when neither the engine nor the media carries dead-zone data. |

## Functions

| Function | Description |
| ------ | ------ |
| [compatibleMediaFor](functions/compatibleMediaFor.md) | Filter a media list to entries this engine accepts. |
| [expandVerifications](functions/expandVerifications.md) | Expand a registry's `verifications` blocks into a derived grid per device. |
| [getForcedTrailingFeedMm](functions/getForcedTrailingFeedMm.md) | Resolve the post-print forced trailing feed for an engine. |
| [getPrintableArea](functions/getPrintableArea.md) | Resolve the chassis dead-zone for a print, with the standard precedence: per-roll media tag (when present) > engine-level field > zeros. |
| [mapLegacyStatus](functions/mapLegacyStatus.md) | Map a legacy `DeviceSupport.status` value to a stored `SupportStatus`. Returns `undefined` for `'untested'` (= absent in the new shape). |
| [mediaCompatibleWith](functions/mediaCompatibleWith.md) | Returns `true` iff the media is compatible with the engine. |
| [mediaIdentitiesMatch](functions/mediaIdentitiesMatch.md) | Returns `true` iff two media descriptors describe the same physical media. |
| [pickRotation](functions/pickRotation.md) | Pick the rotation value to pass to `renderImage` / `renderMultiPlaneImage`. |
| [resolveSupportedDevices](functions/resolveSupportedDevices.md) | Filter a registry down to the devices a host runtime can actually drive, given the set of registered protocols and transport implementations. |
