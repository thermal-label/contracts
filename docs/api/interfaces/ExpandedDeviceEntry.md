# Interface: ExpandedDeviceEntry

One device after expansion: original entry plus the derived grid
and the rolled-up `supportStatus` (worst-case across declared
transports, mapped to `EffectiveStatus`).

## Extends

- [`DeviceEntry`](DeviceEntry.md)

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities?` | `Readonly`\<`Record`\<`string`, `unknown`\>\> | Chassis-level capability flags — properties of the box, not the printhead. Most boolean capabilities are engine-level; this bag is for genuinely chassis-y things (Brother's `editorLite` USB-Mass-Storage trick, eventual battery / display flags). Open shape so drivers can extend without touching contracts. | [`DeviceEntry`](DeviceEntry.md).[`capabilities`](DeviceEntry.md#property-capabilities) |
| <a id="property-engines"></a> `engines` | readonly [`PrintEngine`](PrintEngine.md)[] | Print engines in this device. Always an array, never empty — single-engine devices fabricate a `'primary'` entry. Composite devices (Duo, Twin) carry one entry per independent engine. | [`DeviceEntry`](DeviceEntry.md).[`engines`](DeviceEntry.md#property-engines) |
| <a id="property-family"></a> `family` | `string` | Driver family this device belongs to, e.g. `'labelwriter'`. | [`DeviceEntry`](DeviceEntry.md).[`family`](DeviceEntry.md#property-family) |
| <a id="property-hardwarequirks"></a> `hardwareQuirks?` | `string` | In-source hardware quirks — immutable facts about the chassis. Distinct from `support.quirks`, which is editorial and changes with firmware revisions. Example: "PID collides with the LabelManager PnP variant; needs usb_modeswitch on Linux". | [`DeviceEntry`](DeviceEntry.md).[`hardwareQuirks`](DeviceEntry.md#property-hardwarequirks) |
| <a id="property-key"></a> `key` | `string` | Stable key used as the registry export name (e.g. `'LW_450'`). | [`DeviceEntry`](DeviceEntry.md).[`key`](DeviceEntry.md#property-key) |
| <a id="property-name"></a> `name` | `string` | Human-readable model name, e.g. `'LabelWriter 450'`. | [`DeviceEntry`](DeviceEntry.md).[`name`](DeviceEntry.md#property-name) |
| <a id="property-support"></a> ~~`support`~~ | [`DeviceSupport`](DeviceSupport.md) | Always defined; defaults to `{ status: 'untested' }`. **Deprecated** Author `verifications` instead. Kept populated by codegen (synthesised from `verifications` if present, else mapped from legacy authoring) so existing consumers keep working unchanged. Removed in the cleanup PR once all drivers migrate. | [`DeviceEntry`](DeviceEntry.md).[`support`](DeviceEntry.md#property-support) |
| <a id="property-supportstatus"></a> `supportStatus` | [`EffectiveStatus`](../type-aliases/EffectiveStatus.md) | - | - |
| <a id="property-transports"></a> `transports` | [`DeviceTransports`](DeviceTransports.md) | Wire-protocol transports this device exposes. | [`DeviceEntry`](DeviceEntry.md).[`transports`](DeviceEntry.md#property-transports) |
| <a id="property-verificationgrid"></a> `verificationGrid` | [`ExpandedVerificationGrid`](../type-aliases/ExpandedVerificationGrid.md) | - | - |
| <a id="property-verifications"></a> `verifications?` | `Partial`\<`Record`\<[`TransportType`](../type-aliases/TransportType.md), [`VerificationCell`](VerificationCell.md)\>\> | Per-transport stored verifications. Authored by hardware-report PRs; expanded at codegen time into a derived grid (see `expandVerifications` in `./expand.js`). When absent, codegen falls back to legacy `support.status`. | [`DeviceEntry`](DeviceEntry.md).[`verifications`](DeviceEntry.md#property-verifications) |
