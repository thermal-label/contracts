# Interface: VerificationCell

One cell of the verification grid — direct observation against one
transport on one device.

`issues` is bounded at 2 entries (codegen-enforced): one canonical
report, optionally one conflict-corroboration. Duplicate reports
link via GitHub's "linked issues" panel rather than growing the
array. Issue numbers are scoped to the driver's own repo (same
convention as `engines[].protocol`).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-issues"></a> `issues?` | readonly `number`[] | GitHub issue numbers, same-repo. Max 2 entries (codegen-enforced). |
| <a id="property-lastreported"></a> `lastReported?` | `string` | ISO date (YYYY-MM-DD) of the latest report. Manually authored. |
| <a id="property-reason"></a> `reason?` | `string` | Short tagline; one line max. Convention-discouraged on `verified`. |
| <a id="property-status"></a> `status` | [`SupportStatus`](../type-aliases/SupportStatus.md) | - |
