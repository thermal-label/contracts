# Interface: ExpandedCell

Derived per-cell view emitted by `expandVerifications`.

`propagatedFrom` is present iff `status === 'expected'`. Each entry
names the verified cell that lifted this one and which propagation
vector did the lifting:

 - `'sibling-protocol'` — same transport, different device, same
   `engines[].protocol` (single-engine devices only).
 - `'cross-transport'` — same device, a different transport carries
   a `verified` cell.

UI consumers read this directly instead of reinventing provenance
lookup against the registry.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-propagatedfrom"></a> `propagatedFrom?` | readonly \{ `from`: \{ `deviceKey`: `string`; `transport`: [`TransportType`](../type-aliases/TransportType.md); \}; `vector`: `"sibling-protocol"` \| `"cross-transport"`; \}[] |
| <a id="property-status"></a> `status` | [`EffectiveStatus`](../type-aliases/EffectiveStatus.md) |
