# Function: compatibleMediaFor()

```ts
function compatibleMediaFor(engine: EngineCompat, media: readonly MediaDescriptor[]): MediaDescriptor[];
```

Filter a media list to entries this engine accepts.

Used by docs to render the per-device "supported media" table and
by frontend pickers to scope the media selector to what the
connected printer can print.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `engine` | [`EngineCompat`](../type-aliases/EngineCompat.md) |
| `media` | readonly [`MediaDescriptor`](../interfaces/MediaDescriptor.md)[] |

## Returns

[`MediaDescriptor`](../interfaces/MediaDescriptor.md)[]
