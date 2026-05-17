# Interface: BatteryStatus

Battery state of a printer, when the device exposes one.

Minimal and normalised: every battery-bearing driver maps its
vendor-specific reading onto a single `fraction` in `0..1`. A
device that reports a coarse bucket (e.g. a 0..3 level) normalises
it — `level / levelMax` — rather than carrying a parallel
`level` + `levelMax` representation. Drivers that distinguish
specific states (empty, charging) surface those as `errors[]` /
`charging` rather than as extra battery fields.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-charging"></a> `charging?` | `boolean` | Charging cable connected. Undefined when the device cannot report it. |
| <a id="property-fraction"></a> `fraction?` | `number` | Normalised charge level in `0..1` (0 = empty, 1 = full). Undefined when the device reports charging state but not a level. Coarse readings are normalised into this range — a consumer renders it as a percentage or a glyph and never needs to know the device's native granularity. |
