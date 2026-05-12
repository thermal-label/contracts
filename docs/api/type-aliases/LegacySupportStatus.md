# ~~Type Alias: LegacySupportStatus~~

```ts
type LegacySupportStatus = "verified" | "partial" | "broken" | "untested";
```

Legacy four-state verification status backing `DeviceSupport.status`
and `DeviceReport.result`.

Superseded by `SupportStatus` (3-state stored) + `EffectiveStatus`
(5-state rendered) in `./verifications.js`. Retained so the existing
`support: { status: 'untested' }` authoring shape keeps type-checking
during the alias transition; codegen maps the legacy rungs to the
new ones (`'broken'` → `'unsupported'`, `'untested'` → absent).

## Deprecated

Use `SupportStatus` from `./verifications.js` for stored
rungs and `EffectiveStatus` for rendered status. Removed once all
drivers have migrated their JSON5 to `verifications`.
