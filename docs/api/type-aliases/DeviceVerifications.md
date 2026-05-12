# Type Alias: DeviceVerifications

```ts
type DeviceVerifications = Partial<Record<TransportType, VerificationCell>>;
```

Per-device authoring block.

Keys are `TransportType` values; only transports the device actually
declares should appear, and only when there is an observation worth
recording. Absent transport key = `'unverified'` (no claim).

Engine-level verifications are deliberately not in this iteration —
forward-compatible to add an `engines` axis later without breaking
existing transport authoring.
