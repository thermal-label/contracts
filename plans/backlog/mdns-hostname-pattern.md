---
name: mdns-hostname-pattern
description: Extend `TcpTransport.mdns` to capture per-device hostname/instance-name patterns (e.g. Dymo LW 550 Turbo's `DYMOLW550T<MAC>E`).
type: project
---

# contracts — `TcpTransport.mdns.hostnamePattern`

> Add an optional `hostnamePattern` field to `TcpTransport.mdns`,
> and make `serviceType` optional. Driven by the LabelWriter 550
> family — the spec gives a per-model hostname pattern but no
> service type, and the current shape can't capture the former
> without inventing the latter.

---

## 1. Why this isn't already there

`TcpTransport.mdns` was designed around standard mDNS-SD discovery:

```ts
mdns?: { serviceType: string; subtypes?: readonly string[] };
```

`serviceType` is the `_<service>._<proto>` identifier you browse
for (`_ipp._tcp`, `_pdl-datastream._tcp`, etc.). That works for
families where the manufacturer publishes a service type — most
network printers do.

Dymo doesn't. The `LW 550 Technical Reference.pdf` (p.10)
documents only the per-model **instance-name pattern**:

| Printer | mDNS instance pattern |
| --- | --- |
| LabelWriter 550 Turbo | `DYMOLW550T<6-hex MAC>E` |
| LabelWriter 5XL | `DYMOLW5XL<6-hex MAC>E` |

No service type. No SRV record convention. The discovery flow per
spec is "browse mDNS, match instance name against the pattern,
take the IP from the A record."

Today these patterns live in JSON5 comments on `LW_550_TURBO.json5`
and `LW_5XL.json5` because there's nowhere structured to put them.

---

## 2. Shape

```ts
export interface TcpTransport {
  /** TCP port (JetDirect printers use 9100). */
  port: number;

  /**
   * mDNS discovery hints. All fields optional — populate what the
   * vendor actually documents.
   *
   * - `serviceType` — standard `_<service>._<proto>` browse target
   *   (e.g. `_ipp._tcp`). Use when the vendor publishes one.
   * - `subtypes` — service-type subtypes per RFC 6763 §7.
   * - `hostnamePattern` — instance-name pattern when the vendor
   *   publishes a per-model hostname convention rather than a
   *   service-type. Placeholders use `<…>` (e.g. `<MAC>` for the
   *   6-hex-character MAC suffix). Used by the discovery layer
   *   to filter mDNS responses to "printers of this model."
   */
  mdns?: {
    serviceType?: string;
    subtypes?: readonly string[];
    hostnamePattern?: string;
  };
}
```

Two changes from today:

1. `serviceType` becomes optional (`string` → `string | undefined`).
2. `hostnamePattern` added.

Both fields are optional inside an optional `mdns` block, so
existing data files compile unchanged.

---

## 3. Convention for `hostnamePattern`

Use `<MAC>` for the 6-hex-character MAC suffix the spec describes.
Other placeholders we may need over time: `<SN>` for serial number,
`<MODEL>` for a model code. Keep it informal — the pattern is a
hint for the discovery layer, not a regex it has to lint.

For Dymo:

```json5
{
  // LW 550 Turbo
  tcp: {
    port: 9100,
    mdns: { hostnamePattern: 'DYMOLW550T<MAC>E' },
  },
}
{
  // LW 5XL
  tcp: {
    port: 9100,
    mdns: { hostnamePattern: 'DYMOLW5XL<MAC>E' },
  },
}
```

---

## 4. Why not …

### 4.1 … abuse `subtypes` for the hostname pattern?

`subtypes` per RFC 6763 §7 has a specific meaning ("subtypes within
a service type"). Stuffing a hostname pattern there would break
anyone who consumes the field correctly. Don't.

### 4.2 … fabricate a service type?

We don't know whether the Dymo printers publish on
`_pdl-datastream._tcp`, `_printer._tcp`, both, or neither. Inventing
one would mislead implementers and might point future discovery
code at the wrong browse target. Better to leave `serviceType`
unset and let real-world capture tell us.

### 4.3 … leave the patterns in JSON5 comments?

That's where they live today. Fine for now, but a comment is not
queryable — when someone implements mDNS discovery, they'd have
to grep the data files and re-parse the patterns by hand. A
structured field makes the eventual implementation a one-liner.

---

## 5. Versioning

Strictly additive (new optional field; existing required field
becomes optional). Patch bump: `@thermal-label/contracts@0.3.x`.

Downstream peer-deps don't need to bump in lockstep.

---

## 6. Tests

- `types.test.ts` — `TcpTransport.mdns` accepts `{ hostnamePattern: 'X' }` alone, `{ serviceType: '_ipp._tcp' }` alone, and the combination.

---

## 7. Out of scope

- The discovery implementation itself (which package owns mDNS,
  how matching against `<MAC>` placeholders works, dependency
  picks like `bonjour` vs `mdns-js`). All driver-side concerns,
  not contracts.
- Other placeholder syntaxes (`<SN>`, `<MODEL>`). Add when a real
  device needs them.

---

## 8. Implementation checklist

```
□ src/device.ts — make serviceType optional, add hostnamePattern
□ src/__tests__/types.test.ts — extend assertions
□ Update README — document the new field with the LW 550 example
□ Gate: typecheck + lint + test + build
□ Bump version (patch), publish
□ Coordinate labelwriter-core: promote LW_550_TURBO and LW_5XL
  comments to structured `tcp.mdns.hostnamePattern` entries
```
