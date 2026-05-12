# Interface: OpenOptions

Options for `PrinterDiscovery.openPrinter()`.

Leave empty to open the first available printer. Provide one or more
fields to narrow the match.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-baudrate"></a> `baudRate?` | `number` | Serial baud rate. Default 9600. Ignored for RFCOMM / Bluetooth SPP (the underlying link handles flow control) but required by the serialport and Web Serial APIs. |
| <a id="property-devicekey"></a> `deviceKey?` | `string` | Registry key of the device descriptor to use. Required by drivers when the transport carries no model signal (serial / RFCOMM); ignored when the transport enumerates (USB / TCP / mDNS). Each driver matches the key against its own registry — pass `'LW_330'` to the labelwriter driver, `'QL_820NWB'` to the Brother driver, etc. Unknown keys behave like any other "no match" — `openPrinter` throws. |
| <a id="property-host"></a> `host?` | `string` | TCP host (IP or hostname). |
| <a id="property-pid"></a> `pid?` | `number` | Match by USB Product ID. |
| <a id="property-port"></a> `port?` | `number` | TCP port. Default 9100. |
| <a id="property-serialnumber"></a> `serialNumber?` | `string` | Match by USB / mDNS serial number. |
| <a id="property-serialpath"></a> `serialPath?` | `string` | Serial port path. Examples: `/dev/rfcomm0` (Linux, Bluetooth SPP), `/dev/ttyUSB0` (Linux, USB-serial adapter), `COM3` (Windows). |
| <a id="property-vid"></a> `vid?` | `number` | Match by USB Vendor ID. |
