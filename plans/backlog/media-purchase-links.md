# contracts — Media purchase links (vendor-neutral)

> A `purchaseLinks` slot on `MediaDescriptor` so the docs site (and
> downstream apps) can surface "where to buy this label/tape" without
> baking any one retailer into the open-source contracts.
>
> Split out of `generic-device-media-library.md` because it is a
> commercial concern that does not need to ride with the schema
> migration. Revisit once the schema lands and there's a real
> downstream consumer asking for it.

---

## 1. Shape

```ts
interface MediaDescriptor {
  // ... existing fields

  /**
   * Affiliate / retailer links for this media. Vendor-neutral —
   * downstream sites populate per region.
   */
  purchaseLinks?: readonly {
    retailer: string;
    url: string;
    /** ISO 3166-1 alpha-2 region(s). */
    regions?: readonly string[];
  }[];
}
```

Vendor-neutral. Contracts neither populate nor require it.

---

## 2. Two paths for populating it

- **Per-driver registries populate it** with the maintainer's choice
  of retailer (manufacturer direct, regional shops). Each link
  carries a `regions` array so the docs page can filter to the
  visitor's locale and avoid showing a Dutch shop to a US visitor or
  vice versa.
- **Downstream consumers populate it** at registry-import time. A
  hosted app could wrap the imported registries and inject affiliate
  URLs without anyone modifying open-source code. Cleaner from a
  governance standpoint — "the open library lists products, the
  hosted app monetises".

For a global default, manufacturer URLs are the safest fallback and
avoid the "is this an ad?" perception. Recommend defaulting registry
rows to **manufacturer URLs only**, leaving affiliate/regional
retailers as a deployment-time addition. 123inkt is plausible for
NL/BE if a regional consumer wants it.

---

## 3. Docs page integration

Per-device pages (see `generic-device-media-library.md` §4) render a
supported-media table. With this plan, that table gains a "Buy"
column showing `purchaseLinks` as small icons, filtered to the
visitor's region (best-effort via `Accept-Language`).

---

## 4. Open questions

- **Ship empty, manufacturer-only, or accept community PRs for
  regional retailers?** Recommend manufacturer-only as the OSS
  default; document the deployment-time injection path; community
  PRs only for non-affiliate retailers (consumer aid, not revenue).

---

## 5. Out of scope

- Affiliate-link tracking, click attribution, cookie consent — none
  of that belongs in a driver registry. The hook stops at "here is a
  URL".
- Picking a specific affiliate retailer. `purchaseLinks` is the
  hook; populating it for 123inkt or anyone else is a downstream
  decision, ideally regional.

---

## 6. Dependencies

Waits for `generic-device-media-library.md` to land — the
`MediaDescriptor` shape and the per-device docs page live there.
This plan is purely additive on top.
