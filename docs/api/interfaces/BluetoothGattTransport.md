# Interface: BluetoothGattTransport

Bluetooth Low Energy GATT.

UUIDs are typically discovered by sniffing GATT traffic from the
manufacturer's mobile app (nRF Connect, LightBlue) — they are
rarely published in printer documentation.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-mtu"></a> `mtu?` | `number` | Negotiable BLE MTU; default 20 (BLE 4.0 minimum). |
| <a id="property-nameprefix"></a> `namePrefix?` | `string` | Device name prefix for the browser picker filter, e.g. `'QL-820'`. |
| <a id="property-rxcharacteristicuuid"></a> `rxCharacteristicUuid?` | `string` | GATT characteristic UUID for read/notify (RX from printer). Omit if the TX characteristic also handles notifications. |
| <a id="property-serviceuuid"></a> `serviceUuid` | `string` | Primary GATT service UUID for this printer family. |
| <a id="property-txcharacteristicuuid"></a> `txCharacteristicUuid` | `string` | GATT characteristic UUID for write (TX to printer). |
