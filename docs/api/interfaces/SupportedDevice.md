# Interface: SupportedDevice

A device entry resolved against the host runtime's protocol and
transport implementations.

Only devices with at least one drivable transport AND at least one
drivable engine are returned by the resolver — anything fully
undrivable is filtered out.

## Extends

- `Omit`\<[`DeviceEntry`](DeviceEntry.md), `"engines"`\>

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="property-allenginesdrivable"></a> `allEnginesDrivable` | `boolean` | `true` iff every engine on this device has a registered protocol impl. Property of `(device, PROTOCOLS)` only — not affected by which transports the host runtime exposes. Drives the "fully supported by this driver" badge in pickers and docs. | - |
| <a id="property-capabilities"></a> `capabilities?` | `Readonly`\<`Record`\<`string`, `unknown`\>\> | Chassis-level capability flags — properties of the box, not the printhead. Most boolean capabilities are engine-level; this bag is for genuinely chassis-y things (Brother's `editorLite` USB-Mass-Storage trick, eventual battery / display flags). Open shape so drivers can extend without touching contracts. | [`DeviceEntry`](DeviceEntry.md).[`capabilities`](DeviceEntry.md#property-capabilities) |
| <a id="property-drivabletransports"></a> `drivableTransports` | readonly [`TransportType`](../type-aliases/TransportType.md)[] | Transports the host runtime has implementations for. | - |
| <a id="property-engines"></a> `engines` | readonly [`EngineDescriptor`](EngineDescriptor.md)[] | Per-engine drivability info. | - |
| <a id="property-family"></a> `family` | `string` | Driver family this device belongs to, e.g. `'labelwriter'`. | [`DeviceEntry`](DeviceEntry.md).[`family`](DeviceEntry.md#property-family) |
| <a id="property-hardwarequirks"></a> `hardwareQuirks?` | `string` | In-source hardware quirks — immutable facts about the chassis. Distinct from `support.quirks`, which is editorial and changes with firmware revisions. Example: "PID collides with the LabelManager PnP variant; needs usb_modeswitch on Linux". | [`DeviceEntry`](DeviceEntry.md).[`hardwareQuirks`](DeviceEntry.md#property-hardwarequirks) |
| <a id="property-key"></a> `key` | `string` | Stable key used as the registry export name (e.g. `'LW_450'`). | [`DeviceEntry`](DeviceEntry.md).[`key`](DeviceEntry.md#property-key) |
| <a id="property-name"></a> `name` | `string` | Human-readable model name, e.g. `'LabelWriter 450'`. | [`DeviceEntry`](DeviceEntry.md).[`name`](DeviceEntry.md#property-name) |
| <a id="property-support"></a> ~~`support`~~ | [`DeviceSupport`](DeviceSupport.md) | Always defined; defaults to `{ status: 'untested' }`. **Deprecated** Author `verifications` instead. Kept populated by codegen (synthesised from `verifications` if present, else mapped from legacy authoring) so existing consumers keep working unchanged. Removed in the cleanup PR once all drivers migrate. | [`DeviceEntry`](DeviceEntry.md).[`support`](DeviceEntry.md#property-support) |
| <a id="property-transports"></a> `transports` | [`DeviceTransports`](DeviceTransports.md) | Wire-protocol transports this device exposes. | [`DeviceEntry`](DeviceEntry.md).[`transports`](DeviceEntry.md#property-transports) |
| <a id="property-undrivabletransports"></a> `undrivableTransports` | readonly [`TransportType`](../type-aliases/TransportType.md)[] | Transports the device declares but the host runtime does not implement. Surface these as per-transport hints in the picker ("via USB only — Bluetooth requires the web package"); the device is still supported as long as `drivableTransports` is non-empty. | - |
| <a id="property-verifications"></a> `verifications?` | `Partial`\<`Record`\<[`TransportType`](../type-aliases/TransportType.md), [`VerificationCell`](VerificationCell.md)\>\> | Per-transport stored verifications. Authored by hardware-report PRs; expanded at codegen time into a derived grid (see `expandVerifications` in `./expand.js`). When absent, codegen falls back to legacy `support.status`. | [`DeviceEntry`](DeviceEntry.md).[`verifications`](DeviceEntry.md#property-verifications) |
