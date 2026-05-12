# ~~Interface: DeviceReport~~

A single accepted verification report against a device.

Mirrors the fields the org-level `hardware-status.yaml` schema
already records — issue number, reporter, date, result. Folded
inline into the device entry so there is one source of truth per
driver instead of a parallel YAML overlay.

## Deprecated

Superseded by `VerificationCell` in `./verifications.js`.
The new shape drops `notes`, `reporter`, `os`, `selfVerified`, `result`
— the linked GitHub issue carries those. Retained during the alias
transition; removed in the cleanup PR once all drivers have migrated.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-date"></a> ~~`date`~~ | `string` | ISO date (YYYY-MM-DD) the report was filed. |
| <a id="property-issue"></a> ~~`issue`~~ | `number` | Issue / PR number where the report was accepted. |
| <a id="property-notes"></a> ~~`notes?`~~ | `string` | Free-form notes (markdown allowed). |
| <a id="property-os"></a> ~~`os?`~~ | `"Linux"` \| `"macOS"` \| `"Windows"` | - |
| <a id="property-reporter"></a> ~~`reporter`~~ | `string` | Reporter's GitHub handle or attribution string. |
| <a id="property-result"></a> ~~`result`~~ | [`LegacySupportStatus`](../type-aliases/LegacySupportStatus.md) | Verification outcome from this report. |
| <a id="property-selfverified"></a> ~~`selfVerified?`~~ | `boolean` | True if the reporter is also the implementer / maintainer. |
