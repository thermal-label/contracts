---
name: wide-tier-media-compatibility
description: Convention for using `targetModels` / `mediaCompatibility` to gate wide-format media (102mm DK, 24mm D1, 4×6 shipping) away from standard-chassis devices that physically can't accept it.
type: project
---

# contracts — Wide-tier media compatibility

> Pin down how drivers express the standard-chassis vs wide-chassis
> split using the existing `targetModels` (media side) and
> `mediaCompatibility` (engine side) string sets. No schema change —
> the helper already does set intersection. This plan settles the
> naming convention, the validator rules, and the per-driver
> migration so a 102mm shipping label correctly reports as
> incompatible with a QL-700 / LW 450.

---

## 1. The problem

`generic-device-media-library.md` shipped the contracts shape with
`PrintEngine.mediaCompatibility` and `MediaDescriptor.targetModels`
as parallel string sets, intersected by `mediaCompatibleWith()`.
What it left open was *what strings to put in those sets*.

Today every driver uses one tag per substrate family
(`'standard'`, `'dk'`, `'d1'`) and applies it uniformly across the
family's media and engines. That correctly gates substrates apart
(no D1 cartridge ever shows on a DK printer), but it does **not**
gate by chassis width: a 102mm DK roll and a 12mm DK roll both
carry `'dk'`, and a QL-700 and QL-1100 both declare engine
`['dk']`, so `mediaCompatibleWith()` reports the 102mm roll as
compatible with the QL-700 — which physically can't accept it.

The same hole exists across the lineup:

| Family | Standard chassis | Wide chassis | Wide-only media |
| --- | --- | --- | --- |
| LabelWriter | LW 4xx / 5xx / 550 (672–728 dots) | LW 4XL / 5XL (1152 / 1248 dots) | 102×59mm Shipping XL, 104×159mm ExtraLarge |
| Brother QL | QL-5xx / 7xx / 8xx (720 dots) | QL-1050 / 1060N / 1100 / 1110NWB / 1115NWB (1296 dots) | DK-22243 (102mm continuous), DK-11240 (102×51), DK-11241 (102×152) |
| LabelManager | All current models (64 dots, ≤19mm tape) | None today; future 24mm-capable models | 24mm D1 cartridges (rasterizer cap lifted) |

The user-facing failure mode is "picker shows me a 4×6 label, I
print, the printer chokes on a roll it can't physically take."
We want the picker to never offer it in the first place.

---

## 2. The convention

Each media entry's `targetModels` and each engine's
`mediaCompatibility` are sets drawn from the same per-family
namespace:

- **Substrate tag** — required on every media entry. One of
  `'standard'` (Dymo paper roll), `'dk'` (Brother die-cut/continuous
  rolls), `'tze'` / `'hse-2to1'` / `'hse-3to1'` (Brother laminated
  tape / heat-shrink), `'d1'` (Dymo D1 cartridge). Drivers extend.
- **Wide tier** — optional `'<substrate>-wide'` tag, present on
  media that requires the wider chassis (LabelWriter XL series,
  Brother QL-1xxx series, future 24mm D1) and present on engines
  belonging to that wider chassis class.

Wide-tier engines list **both** the bare substrate tag and the
wide tag, so they remain compatible with standard media:

```
QL-700:   mediaCompatibility: ['dk']
QL-1100:  mediaCompatibility: ['dk', 'dk-wide']

DK-22210 (29mm continuous):  targetModels: ['dk']
DK-22243 (102mm continuous): targetModels: ['dk-wide']
```

Resolution under existing `mediaCompatibleWith()`:

| Media tags | Engine tags | Intersection | Compatible |
| --- | --- | --- | --- |
| `['dk']` | `['dk']` | `{'dk'}` | yes |
| `['dk']` | `['dk', 'dk-wide']` | `{'dk'}` | yes |
| `['dk-wide']` | `['dk']` | ∅ | no |
| `['dk-wide']` | `['dk', 'dk-wide']` | `{'dk-wide'}` | yes |

No helper change. The convention rides on the existing intersection
semantics; the only structural rule is "every media row declares
its substrate."

### 2.1 Why `-wide` and not `-xl`

`-xl` reads as a marketing tier ("the XL model") and the LabelWriter
lineup actually markets itself as 4XL / 5XL. `-wide` keeps the tag
descriptive of what the chassis *is* (a wider chassis that takes
wider rolls) rather than borrowing one vendor's product naming. It
also leaves room for `-wide` to mean different absolute widths in
different families (~102mm in DK / standard, 24mm in D1) without
the tag pretending to be a cross-family size.

### 2.2 Why categorical and not derived from `headDots`

A derived check (`media.widthMm * dpi/25.4 ≤ engine.headDots`) was
considered. Trade-off: derivation uses one authoritative number per
engine and never drifts; categorical tags are explicit and
grep-able but introduce one redundant axis with `headDots`.

Categorical wins for this codebase because:

- The break is real and lined up with vendor product tiers — Dymo's
  XL line, Brother's QL-1xxx line. There aren't intermediate
  widths to disambiguate.
- A new media entry is rare; a new device tier is rarer still.
  N-place edits ("re-tag every wide-class roll when a new tier
  emerges") happen once a decade if that.
- The tag is self-documenting in a JSON5 entry — a reviewer reads
  `targetModels: ['dk-wide']` and knows immediately what it means.
  A derivation lives in the helper, not in the data.

The drift risk between `headDots` and the wide-tier tag is real but
small: only 5 brother devices and 3 LabelWriter devices ever need
both; a validator rule covers it cheaply (§4).

---

## 3. Cross-driver naming registry

The substrate namespace is per-driver, but the suffix convention is
shared. Today's catalogue:

| Driver | Substrate tags | Wide-tier tags |
| --- | --- | --- |
| labelwriter | `'standard'` | `'standard-wide'` (LW 4XL / 5XL) |
| brother-ql | `'dk'`, `'tze'`, `'hse-2to1'`, `'hse-3to1'` | `'dk-wide'` (QL-1xxx) |
| labelmanager | `'d1'` | `'d1-wide'` (reserved; no current device) |
| niimbot | TBD on first commit | TBD |

Brother's TZe narrow/wide head-pin axis (128-pin vs 560-pin head
families, controlling wire-format encoding for the same TZe
substrate) is **not** the same as the chassis-width tier and stays
under `MediaDescriptor.geometry: { narrow, wide }`. A
`'tze-wide'` tag is reserved for a future case where TZe ever
exposes a chassis-width split (it does not today: 36mm TZe is
already filtered via `geometry.narrow` omission).

---

## 4. Validator rules

Two rules added to per-driver `validate-*.mjs` (no contracts-side
schema change):

1. **Substrate required** — every media entry must declare at
   least one substrate tag in `targetModels`. Without this, an
   undefined `targetModels` falls to "unrestricted" under
   `mediaCompatibleWith()` and the entry would silently match
   engines from any substrate family. (Today nothing crosses
   driver boundaries, so this is theoretical, but the rule
   protects against a future cross-driver registry merge.)

2. **Wide tier implies base** — if a media entry's `targetModels`
   contains `'<substrate>-wide'`, it is **not** required to also
   contain `'<substrate>'` (wide-only media is real). But if an
   engine's `mediaCompatibility` contains `'<substrate>-wide'`, it
   **must** also contain `'<substrate>'` — wide chassis always
   accept the narrower rolls of the same substrate. Catches the
   omission where a QL-1100 entry is hand-edited to
   `['dk-wide']` and silently stops matching 12-62mm DK rows.

Brother already has `validate-hardware-status.mjs`; LabelManager
will gain one as part of `migrate-to-contracts-shape.md`. Each
driver wires the two rules into its existing validator.

---

## 5. Helper additions (optional, deferred)

The compatibility-graph helpers in
`contracts/src/compatibility.ts` (`mediaCompatibleWith`,
`compatibleMediaFor`, `mediaIdentitiesMatch`) all work today
without modification. One small helper is worth adding once the
driver migrations land:

```ts
/** Coarse classification of a tag set into substrate + tier. */
export function classifyTags(tags: readonly string[]):
  { substrate: string | undefined; tier: 'standard' | 'wide' };
```

Useful for docs rendering ("Wide-format only" badges on per-media
pages) and pickers that want to surface the tier as a dimension
the user can filter on. Defer until at least one consumer asks.

---

## 6. Sequencing

1. **brother-ql** — `wide-tier-media-compatibility.md` in
   `brother-ql/plans/backlog/`. Tags 102mm DK rows, updates
   QL-1xxx engines, lands the validator rules. Unblocked, can land
   independent of any other plan because Brother's
   `data/media.json5` is already the source of truth.

2. **labelmanager** — `wide-tier-media-compatibility.md` in
   `labelmanager/plans/backlog/`. Adds `targetModels: ['d1']` to
   every existing media entry (substrate hygiene); reserves
   `'d1-wide'` for the future 24mm tier; documents the convention
   so the rasterizer-cap-lift plan inherits it.

3. **labelwriter** — deferred. Active media-registry expansion is
   in flight (300-series, Twin Turbo, Duo tape work). Re-take stock
   once `migrate-to-contracts-shape.md` lands the JSON5 media
   migration; the wide-tier plan rides on top with `'standard'` /
   `'standard-wide'` tags applied to entries and to LW 4XL / 5XL
   engines.

The contracts plan ships first (this file), but as a *convention
document* — there is no contracts code change. Each driver plan
references this file for the rules; the actual data edits live in
the driver repos.

---

## 7. Out of scope

- Replacing brother's `MediaDescriptor.tapeSystem` field with
  `targetModels`. `tapeSystem` is a single-valued protocol
  discriminator used by `protocol.ts` for encoding-branch
  selection; `targetModels` is a multi-valued compatibility set.
  They overlap (the substrate tag in `targetModels` always
  matches `tapeSystem`) but serve different purposes.
  The brother plan keeps both fields and adds a validator rule
  asserting consistency.
- Brother's narrow/wide TZe head-pin geometry (covered by
  `MediaDescriptor.geometry: { narrow, wide }`).
- Cross-driver substrate unification. Each driver keeps its own
  namespace; `'standard'` (Dymo paper) and `'dk'` (Brother
  die-cut) never cross-match because the registries don't
  cross-import.
- A derived `chassisMaxWidthMm?` override on engines for the
  hypothetical case where chassis fit diverges from `headDots`.
  Add when a real device exhibits the divergence.
- Width-class tags finer than `-wide` (e.g. `-xxl` for some
  future extra-wide tier). When such a device ships, the third
  tier gets named *then*; today's `-wide` does not pre-emptively
  carve up the space.
