# Variable: ZERO\_PRINTABLE\_AREA

```ts
const ZERO_PRINTABLE_AREA: PrintableArea;
```

The all-zero `PrintableArea` returned by `getPrintableArea` when
neither the engine nor the media carries dead-zone data.

Frozen so callers can rely on referential identity if they choose to.
