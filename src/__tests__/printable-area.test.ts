import { describe, expect, expectTypeOf, it } from 'vitest';

import type { MediaDescriptor, PrintableArea, PrintEngine } from '../index.js';
import { getForcedTrailingFeedMm, getPrintableArea, ZERO_PRINTABLE_AREA } from '../index.js';

const baseEngine = (extra: Partial<PrintEngine> = {}): PrintEngine => ({
  role: 'primary',
  protocol: 'lw-450',
  dpi: 300,
  headDots: 672,
  ...extra,
});

const baseMedia = (extra: Partial<MediaDescriptor> = {}): MediaDescriptor => ({
  id: 30321,
  name: '30321',
  widthMm: 36,
  type: 'die-cut',
  ...extra,
});

describe('getPrintableArea', () => {
  it('returns zeros when neither engine nor media carries dead-zone data', () => {
    const engine = baseEngine();
    expect(getPrintableArea(engine)).toEqual({
      leading: 0,
      trailing: 0,
      left: 0,
      right: 0,
    });
    expect(getPrintableArea(engine, baseMedia())).toEqual({
      leading: 0,
      trailing: 0,
      left: 0,
      right: 0,
    });
  });

  it('returns the canonical frozen zero object when no data is present', () => {
    expect(getPrintableArea(baseEngine())).toBe(ZERO_PRINTABLE_AREA);
    expect(getPrintableArea(baseEngine(), baseMedia())).toBe(ZERO_PRINTABLE_AREA);
  });

  it('returns the engine-level field when present', () => {
    const engine = baseEngine({
      printableArea: { leading: 6, trailing: 4.2, left: 0, right: 0 },
    });
    expect(getPrintableArea(engine)).toEqual({
      leading: 6,
      trailing: 4.2,
      left: 0,
      right: 0,
    });
  });

  it('returns engine-level field unchanged when media lacks override fields', () => {
    const engine = baseEngine({
      printableArea: { leading: 6, trailing: 4.2, left: 1, right: 2 },
    });
    expect(getPrintableArea(engine, baseMedia())).toEqual({
      leading: 6,
      trailing: 4.2,
      left: 1,
      right: 2,
    });
  });

  it('returns a fresh object copy when the engine field is present (no caller-mutation)', () => {
    const source: PrintableArea = { leading: 6, trailing: 4.2, left: 0, right: 0 };
    const engine = baseEngine({ printableArea: source });
    const resolved = getPrintableArea(engine);
    expect(resolved).not.toBe(source);
    expect(resolved).toEqual(source);
  });

  it('media tag overrides engine field on the matching axes (LW 5xx NFC path)', () => {
    // The canonical §10 Q2 test: per-roll truth from the media tag wins
    // over per-device engine defaults on the axes the tag carries.
    const engine = baseEngine({
      printableArea: { leading: 6, trailing: 4.2, left: 1, right: 2 },
    });
    const skuTaggedMedia = {
      ...baseMedia(),
      // LW 5xx SkuInfo fields (parsed from the NFC tag).
      printableHorizontalOffsetMm: 3,
      printableVerticalOffsetMm: 5,
    };
    expect(getPrintableArea(engine, skuTaggedMedia)).toEqual({
      leading: 5, // overridden by printableVerticalOffsetMm
      trailing: 4.2, // engine value preserved (tag carries no trailing)
      left: 3, // overridden by printableHorizontalOffsetMm
      right: 2, // engine value preserved (tag carries no right)
    });
  });

  it('media tag override works even when the engine field is absent', () => {
    const engine = baseEngine();
    const skuTaggedMedia = {
      ...baseMedia(),
      printableHorizontalOffsetMm: 3,
      printableVerticalOffsetMm: 5,
    };
    expect(getPrintableArea(engine, skuTaggedMedia)).toEqual({
      leading: 5,
      trailing: 0,
      left: 3,
      right: 0,
    });
  });

  it('partial media override (only one axis) leaves the other axis on the engine value', () => {
    const engine = baseEngine({
      printableArea: { leading: 6, trailing: 4.2, left: 1, right: 2 },
    });
    const horizontalOnly = { ...baseMedia(), printableHorizontalOffsetMm: 3 };
    expect(getPrintableArea(engine, horizontalOnly)).toEqual({
      leading: 6,
      trailing: 4.2,
      left: 3,
      right: 2,
    });
    const verticalOnly = { ...baseMedia(), printableVerticalOffsetMm: 5 };
    expect(getPrintableArea(engine, verticalOnly)).toEqual({
      leading: 5,
      trailing: 4.2,
      left: 1,
      right: 2,
    });
  });

  it('zero-valued media tag fields override the engine value (zero is meaningful)', () => {
    // Per-roll truth saying "no inset" must win over a per-device default.
    const engine = baseEngine({
      printableArea: { leading: 6, trailing: 4.2, left: 1, right: 2 },
    });
    const zeroTagged = {
      ...baseMedia(),
      printableHorizontalOffsetMm: 0,
      printableVerticalOffsetMm: 0,
    };
    expect(getPrintableArea(engine, zeroTagged)).toEqual({
      leading: 0,
      trailing: 4.2,
      left: 0,
      right: 2,
    });
  });
});

describe('getForcedTrailingFeedMm', () => {
  it('returns 0 when the engine field is absent', () => {
    expect(getForcedTrailingFeedMm(baseEngine())).toBe(0);
  });

  it('returns the populated engine field verbatim', () => {
    expect(getForcedTrailingFeedMm(baseEngine({ forcedTrailingFeedMm: 8 }))).toBe(8);
    expect(getForcedTrailingFeedMm(baseEngine({ forcedTrailingFeedMm: 0 }))).toBe(0);
    expect(getForcedTrailingFeedMm(baseEngine({ forcedTrailingFeedMm: 7.5 }))).toBe(7.5);
  });
});

describe('PrintEngine schema', () => {
  it('PrintEngine.printableArea is optional PrintableArea', () => {
    expectTypeOf<PrintEngine['printableArea']>().toEqualTypeOf<PrintableArea | undefined>();
  });

  it('PrintEngine.forcedTrailingFeedMm is optional number', () => {
    expectTypeOf<PrintEngine['forcedTrailingFeedMm']>().toEqualTypeOf<number | undefined>();
  });

  it('PrintableArea requires all four edges as readonly numbers', () => {
    expectTypeOf<PrintableArea>().toEqualTypeOf<{
      readonly leading: number;
      readonly trailing: number;
      readonly left: number;
      readonly right: number;
    }>();
  });

  it('a PrintEngine without printableArea / forcedTrailingFeedMm still satisfies the type', () => {
    const engine: PrintEngine = {
      role: 'primary',
      protocol: 'lw-450',
      dpi: 300,
      headDots: 672,
    };
    expectTypeOf(engine).toExtend<PrintEngine>();
  });
});
