# Interface: UsbTransport

USB transport parameters.

VID/PID stored as hex strings (e.g. `'0x0922'`) matching what every
datasheet, lsusb output, and forum post uses. Consumers that need
numbers parseInt at the boundary.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-pid"></a> `pid` | `string` | Hex string, e.g. `'0x0020'`. |
| <a id="property-vid"></a> `vid` | `string` | Hex string, e.g. `'0x0922'`. |
