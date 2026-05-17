# Function: pollingOnStatus()

```ts
function pollingOnStatus(
   printer: Pick<PrinterAdapter, "getStatus">, 
   cb: (status: PrinterStatus) => void, 
   intervalMs?: number): () => void;
```

Build an `onStatus` implementation for drivers whose printers don't
push spontaneous status frames (LM / LW today; anything where
`getStatus()` is a discrete request/response cycle).

Returns a function with the same shape as `PrinterAdapter.onStatus` —
subscribe a callback, get back an unsubscribe function. Internally
it kicks an immediate `getStatus()` so the subscriber resolves
quickly, then polls at `intervalMs` until the unsubscribe handle
fires.

Errors during a poll are swallowed silently — a missed read keeps
the last-known status visible upstream rather than flickering the
pill on every transient timeout. The cadence matches the harness
shell's pre-plan-11 polling timer (4 s) so visible status freshness
is unchanged.

Multi-subscriber: each call returns its own unsubscribe; the
underlying poll loop runs once per subscriber. Drivers that need a
shared loop should implement their own `onStatus` directly.

Usage on a driver-web printer class:
```ts
onStatus(cb: (s: PrinterStatus) => void): () => void {
  return pollingOnStatus(this, cb);
}
```

Per plan 11 §`onStatus` parity: lifting the harness's pull-side
timer into each driver collapses the shell's push-vs-pull branch
down to a single subscription path. Every driver looks like a
push driver to the shell.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `printer` | `Pick`\<[`PrinterAdapter`](../interfaces/PrinterAdapter.md), `"getStatus"`\> | `undefined` |
| `cb` | (`status`: [`PrinterStatus`](../interfaces/PrinterStatus.md)) => `void` | `undefined` |
| `intervalMs` | `number` | `DEFAULT_POLLING_INTERVAL_MS` |

## Returns

() => `void`
