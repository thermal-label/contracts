# Function: mediaIdentitiesMatch()

```ts
function mediaIdentitiesMatch(a: MediaDescriptor, b: MediaDescriptor): boolean;
```

Returns `true` iff two media descriptors describe the same
physical media.

Strategy:
1. If both `id` fields are non-null and equal, they are the same.
2. Otherwise, fall back to dimension equality (`widthMm` and
   `heightMm`) — covers the common case of comparing a
   detected-from-printer descriptor (id may be absent) against a
   registry entry.

Apps use this for "is the loaded media the one I selected?" — what
to *do* on mismatch (silent print, confirm, refuse) is the app's
call. The contracts library does not enforce a policy.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | [`MediaDescriptor`](../interfaces/MediaDescriptor.md) |
| `b` | [`MediaDescriptor`](../interfaces/MediaDescriptor.md) |

## Returns

`boolean`
