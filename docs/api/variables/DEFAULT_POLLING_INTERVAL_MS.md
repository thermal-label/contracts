# Variable: DEFAULT\_POLLING\_INTERVAL\_MS

```ts
const DEFAULT_POLLING_INTERVAL_MS: 4000 = 4000;
```

Default poll cadence used by `pollingOnStatus`. Picked to match the
harness shell's pre-refactor `setInterval` cadence so the visible
status-pill freshness stays the same.
