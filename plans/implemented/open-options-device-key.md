# contracts — `OpenOptions.deviceKey` for non-enumerable transports

> Add a `deviceKey?: string` field to `OpenOptions` so callers can
> tell `openPrinter()` *which* registry descriptor to use when the
> transport itself carries no model signal.
>
> Driven by the labelwriter 300-series serial work
> (`../labelwriter/plans/backlog/amendment-support-300-series.md`
> §4.5): RS-232 has no enumeration, so opening `/dev/ttyUSB0` to
> talk to a LabelWriter 330 needs both the path *and* the model
> name. The path is already in `OpenOptions` (`serialPath`); the
> model is not.

---

## 1. Why this isn't already there

`OpenOptions` was designed around enumerable transports:

- **USB** — `vid`/`pid`/`serialNumber` match against `usb.getDeviceList()`. The matched device's descriptor comes back from the registry by `findDevice(vid, pid)`.
- **TCP** — `host`/`port` opens the connection; the driver picks a descriptor by "the only one that has a `tcp` transport entry" or by some similar heuristic.

Both paths recover the descriptor from a signal the transport itself carries. Serial doesn't have one. `/dev/ttyUSB0` is just a UART path. The thing on the other end could be a LW 330, an SE450, a Brother label printer, an Arduino — `SerialPort.list()` returns USB-adapter VID/PID metadata when it can, but that identifies the *adapter*, not the printer downstream of it.

`serialPath` was added (good) but the implicit assumption was "the driver will figure out the model somehow." It can't.

---

## 2. Shape

```ts
export interface OpenOptions {
  // … existing fields

  /**
   * Registry key of the device descriptor to use. Required when the
   * transport carries no model signal (serial / RFCOMM); ignored
   * when the transport enumerates (USB / TCP / mDNS).
   *
   * Each driver matches the key against its own registry — pass
   * `'LW_330'` to the labelwriter driver, `'QL_820NWB'` to the
   * Brother driver, etc. Unknown keys behave like any other "no
   * match" — `openPrinter` throws.
   */
  deviceKey?: string;
}
```

That's the entire contracts change. Strictly additive, all-optional.

---

## 3. How drivers consume it

Each driver's `openPrinter` resolves the descriptor in this order:

1. If `deviceKey` is set, look it up in the registry. Throw if unknown.
2. Else if `serialPath` is set without `deviceKey`, **throw** with a clear message ("serial open requires `deviceKey` — pass one of `<list>`"). Do not guess.
3. Else fall back to existing behaviour (USB enumeration, TCP host match).

The "throw on serialPath without deviceKey" rule is the load-bearing one. Without it, drivers either pick a default (silently wrong for most users) or write blind probe bytes to an unknown UART (rude). Failing loudly is the right answer.

---

## 4. Why not …

### 4.1 … probe the device?

A status request (`ESC A` on LabelWriter; family-specific elsewhere) would probably tell us the model. But:

- Writing arbitrary bytes to an unidentified serial device can disturb whatever is listening — flow-control bytes, configuration commands, interrupt signals.
- Different printer families have *different* probe sequences. The contracts layer can't know which to send.
- Some printers don't respond to probes until a job is in flight.

Driver-specific opt-in probing is fine as a follow-up (e.g. `serialProbe?: boolean` on a driver's own options), but not the default and not at the contracts level.

### 4.2 … list candidate ports as part of `listPrinters()`?

`SerialPort.list()` returns ports with USB-adapter VID/PID. We could surface them as `DiscoveredPrinter`-shaped entries with `device: undefined` or similar. But:

- They're not discovered printers, they're discovered *cables*.
- Mixing genuine matches with "maybes" pollutes the list every consumer iterates.
- A separate helper (e.g. `listSerialPortCandidates()`) is a better fit, and it's a driver- or app-side concern, not a contracts one.

### 4.3 … infer the model from `baudRate`?

`baudRate` correlates loosely (LW EL40/EL60 use 19 200; LW 300/330/Turbo use 115 200) but not uniquely (any 9 600 device collides with the SE450). And it requires the user to set baud rate explicitly, which we'd rather *derive* from the descriptor. Inverting the dependency makes the wrong end load-bearing.

---

## 5. Versioning

Additive, optional, single new field. Bump as a **patch**:
`@thermal-label/contracts` next release.

Downstream peer-deps don't need to bump in lockstep — drivers that don't care about serial open (Brother QL today, mostly) ignore the field; drivers that do (labelwriter 300-series, SE450) consume it on their next minor.

---

## 6. Tests

- `types.test.ts` — `OpenOptions` accepts `deviceKey` as an optional string; the all-optional invariant is preserved.

That's it. The behavioural rules in §3 are driver-side; each driver tests its own resolution logic.

---

## 7. Out of scope

- A `model` alias or `modelName` human-readable variant. `deviceKey` is the registry key; if a driver wants to expose a friendlier "by-name" lookup, that lives on the driver's own options, not on contracts.
- Cross-driver key collisions (e.g. both labelwriter and labelmanager registries having an entry with `key: 'D110'`). Each driver only checks its own registry; a unified CLI that walks all installed drivers can disambiguate by passing `family` as well — but `family` is already implicit per-`PrinterDiscovery` instance, so no contracts change needed.
- Probe-based serial discovery (see §4.1). Tracked as a possible driver-side follow-up.

---

## 8. Implementation checklist

```
□ src/discovery.ts — add `deviceKey?: string` to OpenOptions with
  doc comment explaining it's required for non-enumerable transports
□ src/__tests__/types.test.ts — extend OpenOptions assertions
□ Update README — document the new field with a serial example
□ Gate: typecheck + lint + test + build
□ Bump version (patch), publish
```
