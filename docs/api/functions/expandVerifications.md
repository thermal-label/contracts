# Function: expandVerifications()

```ts
function expandVerifications(registry: DeviceRegistry): ExpandedRegistry;
```

Expand a registry's `verifications` blocks into a derived grid per
device.

Propagation rules (per the foundation plan):
 - Only `'verified'` triggers propagation.
 - Sibling-protocol vector: devices sharing a canonical engine
   signature (sorted engine protocols, see `engineSignature`) lift
   each other's matching transport to `'expected'`. Single-engine
   devices match on their lone protocol; multi-engine devices match
   only when their full engine set agrees.
 - Cross-transport vector: a `'verified'` cell on any one transport
   of a device lifts that device's other declared transports to
   `'expected'`.
 - `'partial'` does not propagate.
 - Direct `'partial'` and `'unsupported'` beat propagated
   `'expected'` (observation beats inference).
 - Single-transport devices trivially no-op the cross-transport
   vector.
 - Per-repo only — protocol keys are scoped to the driver.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `registry` | [`DeviceRegistry`](../interfaces/DeviceRegistry.md) |

## Returns

[`ExpandedRegistry`](../interfaces/ExpandedRegistry.md)
