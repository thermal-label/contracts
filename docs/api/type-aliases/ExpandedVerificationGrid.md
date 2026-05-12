# Type Alias: ExpandedVerificationGrid

```ts
type ExpandedVerificationGrid = Partial<Record<TransportType, ExpandedCell>>;
```

Per-device expanded grid: `transport → ExpandedCell`. Only
transports the device declares appear; any cell with no direct
observation and no propagation lift surfaces as
`{ status: 'unverified' }`.
