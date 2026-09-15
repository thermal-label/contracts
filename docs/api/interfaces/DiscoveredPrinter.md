# Interface: DiscoveredPrinter

A printer that was discovered on one of the supported transports.

Returned by `PrinterDiscovery.listPrinters()`. Pass the matching
fields (`vid`, `pid`, `serialNumber`, or `host`/`port`) into
`openPrinter()` to open a specific device.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-connectionid"></a> `connectionId` | `string` | Transport-specific connection identifier. Opaque to consumers — a USB device path, a TCP `host:port`, or a BLE address, depending on transport. Never parse it; for network printers use `host` / `port` instead. |
| <a id="property-device"></a> `device` | [`DeviceEntry`](DeviceEntry.md) | Registry entry for the detected model. |
| <a id="property-host"></a> `host?` | `string` | Network address the printer was discovered at. Set for network-discovered printers (`transport: 'tcp'`) so callers can re-open with `openPrinter({ host, port, deviceKey: device.key })` without a second identification round trip. |
| <a id="property-port"></a> `port?` | `number` | TCP port that goes with `host`; the registry entry's `transports.tcp.port`. |
| <a id="property-serialnumber"></a> `serialNumber?` | `string` | Serial number, if the transport exposes it (USB descriptor, mDNS TXT, etc.). |
| <a id="property-transport"></a> `transport` | [`TransportType`](../type-aliases/TransportType.md) | Which transport this printer was discovered on. |
