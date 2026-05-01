# Implementation Decisions

Judgment calls made during implementation that deviate from, or fill gaps
in, `PLAN.md`. Operator was unavailable — decisions documented here for
later review.

## D1 — `@mbtech-nl/bitmap` version

**Plan said:** `^0.1.0`.
**Actual:** `^1.0.0` (npm latest is `1.0.1`).

**Why:** `@mbtech-nl/bitmap` has already shipped 1.0. The plan's version
was stale. The other `@mbtech-nl/*` packages in the plan are pinned to
`^1.0.0`, so `^1` is consistent.

## D2 — vitest config

**Plan said:** nothing specific about vitest config.
**Chose:** `vitest.config.ts` with v8 coverage, `src/**/*.test.ts` for
test discovery, 100% thresholds on lines/functions/branches/statements.

**Why:** This package has exactly one runtime file (`errors.ts`) — every
constructor path is directly testable. 100% is achievable without
gymnastics and guards against coverage regressions.

## D3 — `eslint.config.js` shape

**Plan said:** use `@mbtech-nl/eslint-config`.
**Chose:** a minimal re-export: `import config from '@mbtech-nl/eslint-config'; export default config;`.

**Why:** `@mbtech-nl/eslint-config` already ships a complete flat config
with TS/unicorn/import-x rules and a relaxed override for `__tests__/`.
No project-specific overrides are needed.

## D4 — `tsconfig.json` extends `@mbtech-nl/tsconfig/base`

**Plan said:** "same pattern as sheet-templates — required by
`@mbtech-nl/eslint-config`'s `projectService`".
**Chose:** extend `@mbtech-nl/tsconfig/base` (not `/browser` or `/node`).

**Why:** contracts is a pure types package. No DOM globals, no Node
globals. `base` has `verbatimModuleSyntax`, `exactOptionalPropertyTypes`,
and the rest of the strictness we want without pulling in either
`lib.dom.d.ts` or `@types/node`.

## D5 — Tests are not included in `dist`

**Plan said:** `files: ["dist", "README.md"]` and `tsconfig.build.json`
"narrow scope, emit only src/".
**Chose:** `tsconfig.build.json` excludes `src/__tests__` and any
`*.test.ts` / `*.spec.ts` files.

**Why:** The wide `tsconfig.json` must see tests so eslint's
`projectService` can lint them. The build tsconfig must NOT see them
so `dist/` stays clean. Two tsconfigs with different `exclude` is how
that separation works.

## D6 — Step 7 publish is not executed

**Plan said:** "Publish to npm".
**Chose:** Build the dist, verify coverage thresholds, commit. DO NOT
run `npm publish` / `pnpm publish`.

**Why:** Publishing is an external, hard-to-reverse action that affects
the public npm registry. The operator is not available to approve it
this session. See `BLOCKERS.md` for the hand-off. Everything else that
can be done locally is done.

## D7 — `discovery.ts` moved from Step 2 to Step 3

**Plan said:** `src/discovery.ts` lives in Step 2.
**Chose:** moved it to Step 3 alongside `adapter.ts` and `preview.ts`.

**Why:** `PrinterDiscovery.openPrinter()` returns `Promise<PrinterAdapter>`,
so `discovery.ts` has a hard type dependency on `adapter.ts`. The plan
puts adapter in Step 3, so discovery can't typecheck in Step 2 without
a forward stub. Cleaner to co-locate them in Step 3.

Step 2 gate remains "typecheck + build" — just over a smaller set of
files. Step 3 gate picks up discovery in addition to adapter/preview.

## D9 — Disable `import-x/consistent-type-specifier-style` (RESOLVED in 1.0.1)

**Historical context:** `@mbtech-nl/eslint-config@1.0.0` shipped two
rules that contradicted each other for pure type-only imports:

- `@typescript-eslint/no-import-type-side-effects: error` — forbids
  inline `import { type X }` for type-only imports because with
  `verbatimModuleSyntax: true` it leaves an empty runtime `import {}`
  behind (a side-effect import).
- `import-x/consistent-type-specifier-style: prefer-inline` — forces
  inline `import { type X }` for every type import.

For files importing only types, these couldn't both be satisfied.
We worked around it with a local `'import-x/consistent-type-specifier-style': 'off'`
override.

**Resolution:** `@mbtech-nl/eslint-config@1.0.1` (plus matching
`@mbtech-nl/prettier-config@1.0.1` and `@mbtech-nl/tsconfig@1.0.1`)
fixes the conflict upstream. Lockfile bumped; the local override has
been removed — `eslint.config.js` is back to a plain re-export.

## D10 — `release.yml` uses trusted publishing

**Plan said:** "standard npm trusted publishing".
**Chose:** `pnpm publish --provenance --access public` triggered by
`v*` git tags, with `id-token: write` permission for OIDC.

**Why:** Trusted publishing via OIDC avoids long-lived npm tokens. The
`provenance` flag attaches a supply-chain attestation to the published
package. This mirrors the modern npm best practice for CI publishing.

## D11 — `EngineBind.tcp` not stubbed

**Plan said (§3.1, point 4):** "Transport keys (`bind.usb`, future
`bind.tcp`) carry transport-specific fields".
**Chose:** Only `bind.usb` is defined today. `bind.tcp` is mentioned
in JSDoc as a future extension but no field exists in the type.

**Why:** A `tcp?: never` placeholder is meaningless from a type
perspective and creates a contract claim ("you can pass tcp here, it
just won't accept anything") that is worse than silence. When a
non-USB composite device actually exists, add the key with a real
schema — that is the right time to commit to a shape.

## D12 — `compatibility.ts` helpers type against `Pick<PrintEngine, …>`

**Plan said (§3.6):** signatures of `mediaCompatibleWith` and
`compatibleMediaFor` use `EngineDescriptor`.
**Chose:** Type the engine parameter as
`Pick<PrintEngine, 'mediaCompatibility'>`.

**Why:** The helpers only read `engine.mediaCompatibility`. Typing
against the structural minimum lets the same helpers serve docs use
(raw `PrintEngine` from a registry, no resolver involved) and runtime
use (`EngineDescriptor` from `resolveSupportedDevices`) without an
unnecessary import or type widening. `EngineDescriptor extends
PrintEngine`, so it satisfies the constraint either way.

## D13 — `DeviceEntry.capabilities` typed as `Readonly<Record<string, unknown>>`

**Plan said (§3.1, point 6):** chassis-level capabilities are an
"open shape — drivers can extend without touching contracts".
**Chose:** `Readonly<Record<string, unknown>>`.

**Why:** ESLint's `@typescript-eslint/consistent-indexed-object-style`
rejects pure `[k: string]: unknown` interfaces; `Record` is the
preferred form. `Readonly<Record<…>>` matches the read-only intent
of the registry shape (everything in the entry is a static fact, not
a mutable bag). `PrintEngineCapabilities` keeps the inline index
signature because it has named members alongside, which the rule
permits.

## D14 — `resolveSupportedDevices` filters out undrivable devices entirely

**Plan said (§3.5):** describes the resolver's behaviour but doesn't
explicitly say what to do with devices that are completely
undrivable.
**Chose:** Return only devices with ≥1 drivable transport AND ≥1
drivable engine. Devices with zero of either are filtered out.

**Why:** A picker showing a device the runtime cannot open or print
to is a false promise. The resolver is for the "what can this build
actually drive" question; a separate registry-introspection helper
(if ever needed) can return the full list with drivability metadata.
