# Interface: BluetoothSppTransport

Bluetooth SPP (Serial Port Profile, classic Bluetooth).

Verified working on Windows and Linux via the OS-paired RFCOMM
device path (the runtime's serial implementation satisfies both
`serial` and `bluetooth-spp` transport keys). macOS still untested.
Baud rate is deliberately absent: SPP negotiates its own framing,
and the value on /dev/rfcomm0 is fictional.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-nameprefix"></a> `namePrefix?` | `string` | Bluetooth name prefix for OS pickers. |
| <a id="property-rfcommchannel"></a> `rfcommChannel?` | `number` | RFCOMM channel; some printers publish via SDP, others fix it. |
