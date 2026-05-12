# Function: getForcedTrailingFeedMm()

```ts
function getForcedTrailingFeedMm(engine: PrintEngine): number;
```

Resolve the post-print forced trailing feed for an engine.

Returns the engine's `forcedTrailingFeedMm` when set, `0` otherwise.
Distinct from the chassis dead-zone (`getPrintableArea`): this
scalar describes blank tape the printer (or this driver's encoder)
forces *after* the printed bitmap — cut-clearance feed, encoder-
emitted padding rows, etc.

`0` legitimately means "no forced feed modelled" — drivers whose
firmware advances a variable amount (LabelWriter `ESC E` to next
tear bar, Brother autocut) leave the field empty so its zero
default surfaces.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `engine` | [`PrintEngine`](../interfaces/PrintEngine.md) |

## Returns

`number`
