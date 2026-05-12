# Interface: TcpTransport

TCP transport parameters.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-mdns"></a> `mdns?` | \{ `serviceType`: `string`; `subtypes?`: readonly `string`[]; \} | mDNS service type for zero-config discovery. |
| `mdns.serviceType` | `string` | - |
| `mdns.subtypes?` | readonly `string`[] | - |
| <a id="property-port"></a> `port` | `number` | TCP port (JetDirect printers use 9100). |
