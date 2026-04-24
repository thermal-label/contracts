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

## D7 — `release.yml` uses trusted publishing

**Plan said:** "standard npm trusted publishing".
**Chose:** `pnpm publish --provenance --access public` triggered by
`v*` git tags, with `id-token: write` permission for OIDC.

**Why:** Trusted publishing via OIDC avoids long-lived npm tokens. The
`provenance` flag attaches a supply-chain attestation to the published
package. This mirrors the modern npm best practice for CI publishing.
