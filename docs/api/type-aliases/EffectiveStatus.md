# Type Alias: EffectiveStatus

```ts
type EffectiveStatus = SupportStatus | "expected" | "unverified";
```

Render-time status surfaced after `expandVerifications`.

Adds two derived states on top of the stored rungs:
 - `'expected'` — inferred from sibling-protocol or cross-transport
   propagation. Never stored; computed each codegen run.
 - `'unverified'` — no claim has been recorded for this cell.
