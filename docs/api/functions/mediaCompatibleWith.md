# Function: mediaCompatibleWith()

```ts
function mediaCompatibleWith(media: MediaDescriptor, engine: EngineCompat): boolean;
```

Returns `true` iff the media is compatible with the engine.

Rule: if either side omits its set, the other is unrestricted →
true. Otherwise, compatible iff the two sets intersect.

Pure function over the registry shapes — no I/O, no runtime state.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `media` | [`MediaDescriptor`](../interfaces/MediaDescriptor.md) |
| `engine` | [`EngineCompat`](../type-aliases/EngineCompat.md) |

## Returns

`boolean`
