# Interface: DiscoveredPrinter

A printer that was discovered on one of the supported transports.

Returned by `PrinterDiscovery.listPrinters()`. Pass the matching
fields (`vid`, `pid`, `serialNumber`, or `host`/`port`) into
`openPrinter()` to open a specific device.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-connectionid"></a> `connectionId` | `string` | Transport-specific connection identifier. Opaque to consumers — a USB device path, a TCP `host:port`, or a BLE address, depending on transport. |
| <a id="property-device"></a> `device` | [`DeviceEntry`](DeviceEntry.md) | Registry entry for the detected model. |
| <a id="property-serialnumber"></a> `serialNumber?` | `string` | Serial number, if the transport exposes it (USB descriptor, mDNS TXT, etc.). |
| <a id="property-transport"></a> `transport` | [`TransportType`](../type-aliases/TransportType.md) | Which transport this printer was discovered on. |
