# Function: expandVerifications()

```ts
function expandVerifications(registry: DeviceRegistry): ExpandedRegistry;
```

Expand a registry's `verifications` blocks into a derived grid per
device.

Propagation rules (per the foundation plan):
 - Only `'verified'` triggers propagation.
 - Sibling-protocol vector: single-engine devices sharing
   `engines[0].protocol` lift each other's matching transport to
   `'expected'`.
 - Cross-transport vector: a `'verified'` cell on any one transport
   of a device lifts that device's other declared transports to
   `'expected'`.
 - `'partial'` does not propagate.
 - Direct `'partial'` and `'unsupported'` beat propagated
   `'expected'` (observation beats inference).
 - Multi-engine devices skip propagation entirely (forward-compatible
   carve-out — engine-aware grid can lift this later).
 - Single-transport devices trivially no-op the cross-transport
   vector.
 - Per-repo only — protocol keys are scoped to the driver.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `registry` | [`DeviceRegistry`](../interfaces/DeviceRegistry.md) |

## Returns

[`ExpandedRegistry`](../interfaces/ExpandedRegistry.md)
