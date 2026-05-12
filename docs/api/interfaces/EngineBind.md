# Interface: EngineBind

Per-engine routing hints.

Transport-layer routing is keyed by transport (`bind.usb`, future
`bind.tcp`) and consumed by the transport implementation.
Protocol-layer routing (`bind.address`) sits as a flat sibling and
is consumed by the protocol implementation — opaque to the
registry.

**USB-composite example (LabelWriter Duo):** each engine binds to
its own USB interface via `bind.usb.bInterfaceNumber`.

**Protocol-addressed example (LabelWriter Twin Turbo):** both
engines share the chassis USB endpoint and select via
`bind.address` — for `lw-450`, `bind.address: 1` is encoded as
`ESC q 0x01` prepended to the job. `'auto'` is not a stored value
— it is a routing mode in `PrintOptions.engine`.

If a future protocol grows more than one in-band routing
dimension, promote `bind.address` to `bind.protocol: { ... }`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-address"></a> `address?` | `number` | Opaque protocol-layer address; protocol module knows how to encode. |
| <a id="property-usb"></a> `usb?` | \{ `bInterfaceNumber`: `number`; \} | USB-composite routing — engine bound to a specific USB interface. |
| `usb.bInterfaceNumber` | `number` | - |
