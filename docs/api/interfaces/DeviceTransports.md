# Interface: DeviceTransports

Per-transport schema for a device.

Only the keys this device actually supports are present. Each key
carries the parameters its transport needs — VID/PID under `usb`,
port under `tcp`, etc. — instead of bunching them at the top level.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-bluetooth-gatt"></a> `bluetooth-gatt?` | [`BluetoothGattTransport`](BluetoothGattTransport.md) |
| <a id="property-bluetooth-spp"></a> `bluetooth-spp?` | [`BluetoothSppTransport`](BluetoothSppTransport.md) |
| <a id="property-serial"></a> `serial?` | [`SerialTransport`](SerialTransport.md) |
| <a id="property-tcp"></a> `tcp?` | [`TcpTransport`](TcpTransport.md) |
| <a id="property-usb"></a> `usb?` | [`UsbTransport`](UsbTransport.md) |
