# Interface: ExpandedRegistry

Registry projection emitted by `expandVerifications`.

## Extends

- `Omit`\<[`DeviceRegistry`](DeviceRegistry.md), `"devices"`\>

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="property-devices"></a> `devices` | readonly [`ExpandedDeviceEntry`](ExpandedDeviceEntry.md)[] | - | - |
| <a id="property-driver"></a> `driver` | `string` | Driver family identifier — matches `DeviceEntry.family`. | [`DeviceRegistry`](DeviceRegistry.md).[`driver`](DeviceRegistry.md#property-driver) |
| <a id="property-schemaversion"></a> `schemaVersion` | `1` | - | [`DeviceRegistry`](DeviceRegistry.md).[`schemaVersion`](DeviceRegistry.md#property-schemaversion) |
