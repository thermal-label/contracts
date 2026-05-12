# Interface: SerialTransport

Physical serial transport parameters (UART / USB-serial).

For Bluetooth SPP printers — even though most platforms surface the
RFCOMM channel as a /dev/rfcomm or COM port — use the
`bluetooth-spp` key instead so the runtime picker can present it as
"Bluetooth" rather than "Serial port".

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-defaultbaud"></a> `defaultBaud` | `number` | - |
| <a id="property-flowcontrol"></a> `flowControl?` | `"none"` \| `"hardware"` \| `"software"` | Optional flow-control hint; most label printers want 'none'. |
| <a id="property-supportedbauds"></a> `supportedBauds?` | readonly `number`[] | - |
