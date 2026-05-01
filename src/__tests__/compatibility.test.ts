import { describe, expect, it } from 'vitest';

import { compatibleMediaFor, mediaCompatibleWith, mediaIdentitiesMatch } from '../compatibility.js';
import type { MediaDescriptor, PrintEngine } from '../index.js';

const engine = (mediaCompatibility?: readonly string[]): PrintEngine => ({
  role: 'primary',
  protocol: 'lw-450',
  dpi: 300,
  headDots: 672,
  ...(mediaCompatibility !== undefined ? { mediaCompatibility } : {}),
});

const media = (id: string | number, extra: Partial<MediaDescriptor> = {}): MediaDescriptor => ({
  id,
  name: `media-${String(id)}`,
  widthMm: 62,
  type: 'die-cut',
  ...extra,
});

describe('mediaCompatibleWith', () => {
  it('compatible when both sides omit their compatibility sets', () => {
    expect(mediaCompatibleWith(media(1), engine())).toBe(true);
  });

  it('compatible when only the engine restricts', () => {
    expect(mediaCompatibleWith(media(1), engine(['standard']))).toBe(true);
  });

  it('compatible when only the media restricts', () => {
    expect(mediaCompatibleWith(media(1, { targetModels: ['standard'] }), engine())).toBe(true);
  });

  it('compatible when both restrict and the sets intersect', () => {
    expect(
      mediaCompatibleWith(media(1, { targetModels: ['standard', '4xl'] }), engine(['4xl', '5xl'])),
    ).toBe(true);
  });

  it('incompatible when both restrict and the sets are disjoint', () => {
    expect(
      mediaCompatibleWith(media(1, { targetModels: ['duo'] }), engine(['standard', '4xl'])),
    ).toBe(false);
  });

  it('incompatible when an empty engine set means "no media supported"', () => {
    expect(mediaCompatibleWith(media(1, { targetModels: ['standard'] }), engine([]))).toBe(false);
  });
});

describe('compatibleMediaFor', () => {
  it('filters a media list down to compatible entries', () => {
    const list = [
      media(1, { targetModels: ['standard'] }),
      media(2, { targetModels: ['4xl'] }),
      media(3),
    ];
    const result = compatibleMediaFor(engine(['standard']), list);
    expect(result.map(m => m.id)).toEqual([1, 3]);
  });

  it('returns the full list when the engine is unrestricted', () => {
    const list = [media(1), media(2, { targetModels: ['standard'] })];
    expect(compatibleMediaFor(engine(), list)).toHaveLength(2);
  });
});

describe('mediaIdentitiesMatch', () => {
  it('matches when ids are equal', () => {
    expect(mediaIdentitiesMatch(media(42), media(42, { widthMm: 99 }))).toBe(true);
  });

  it('falls back to dimension equality when ids differ', () => {
    expect(
      mediaIdentitiesMatch(
        media(1, { widthMm: 62, heightMm: 29 }),
        media(2, { widthMm: 62, heightMm: 29 }),
      ),
    ).toBe(true);
  });

  it('does not match when ids differ and dimensions differ', () => {
    expect(
      mediaIdentitiesMatch(
        media(1, { widthMm: 62, heightMm: 29 }),
        media(2, { widthMm: 62, heightMm: 100 }),
      ),
    ).toBe(false);
  });

  it('matches continuous media (no heightMm) by width alone', () => {
    expect(mediaIdentitiesMatch(media('a', { widthMm: 62 }), media('b', { widthMm: 62 }))).toBe(
      true,
    );
  });
});
