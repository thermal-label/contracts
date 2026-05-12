# Function: getPrintableArea()

```ts
function getPrintableArea(engine: PrintEngine, media?: MediaDescriptor): PrintableArea;
```

Resolve the chassis dead-zone for a print, with the standard
precedence: per-roll media tag (when present) > engine-level field >
zeros.

The `media` argument is optional so the helper is usable from
encoders that haven't resolved a media yet (e.g. status probes).
When `media` carries `printableHorizontalOffsetMm` /
`printableVerticalOffsetMm`, those values override the matching
edges on the engine field; the unaffected edges (`right`,
`trailing`) keep their engine-level values.

Always returns a fully-populated object — callers never need to
`?? 0` individual edges.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `engine` | [`PrintEngine`](../interfaces/PrintEngine.md) |
| `media?` | [`MediaDescriptor`](../interfaces/MediaDescriptor.md) |

## Returns

[`PrintableArea`](../interfaces/PrintableArea.md)
