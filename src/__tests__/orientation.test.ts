import { describe, expect, it } from 'vitest';

import type { MediaDescriptor } from '../media.js';
import { pickRotation } from '../orientation.js';

const horizontalDieCut: MediaDescriptor = {
  id: 'h',
  name: 'horizontal',
  widthMm: 62,
  heightMm: 29,
  type: 'die-cut',
  defaultOrientation: 'horizontal',
};

const verticalMedia: MediaDescriptor = {
  id: 'v',
  name: 'vertical',
  widthMm: 62,
  type: 'continuous',
  defaultOrientation: 'vertical',
};

const noHint: MediaDescriptor = {
  id: 'n',
  name: 'no hint',
  widthMm: 62,
  type: 'continuous',
};

describe('pickRotation', () => {
  it('returns the explicit override verbatim', () => {
    expect(pickRotation({ width: 100, height: 50 }, horizontalDieCut, 90, 180)).toBe(180);
    expect(pickRotation({ width: 100, height: 50 }, verticalMedia, 90, 270)).toBe(270);
    expect(pickRotation({ width: 100, height: 50 }, horizontalDieCut, 90, 0)).toBe(0);
  });

  it("treats 'auto' as no override and runs the heuristic", () => {
    expect(pickRotation({ width: 800, height: 200 }, horizontalDieCut, 90, 'auto')).toBe(90);
    expect(pickRotation({ width: 200, height: 800 }, horizontalDieCut, 90, 'auto')).toBe(0);
  });

  it("rotates landscape input to familyDirection on 'horizontal' media", () => {
    expect(pickRotation({ width: 800, height: 200 }, horizontalDieCut, 90)).toBe(90);
    expect(pickRotation({ width: 800, height: 200 }, horizontalDieCut, 270)).toBe(270);
  });

  it("passes through portrait input even on 'horizontal' media", () => {
    expect(pickRotation({ width: 200, height: 800 }, horizontalDieCut, 90)).toBe(0);
  });

  it("never rotates 'vertical' media regardless of input shape", () => {
    expect(pickRotation({ width: 800, height: 200 }, verticalMedia, 90)).toBe(0);
    expect(pickRotation({ width: 200, height: 800 }, verticalMedia, 90)).toBe(0);
  });

  it('passes through when the media has no orientation hint', () => {
    expect(pickRotation({ width: 800, height: 200 }, noHint, 90)).toBe(0);
    expect(pickRotation({ width: 200, height: 800 }, noHint, 90)).toBe(0);
  });

  it('treats square images (width == height) as not landscape', () => {
    expect(pickRotation({ width: 400, height: 400 }, horizontalDieCut, 90)).toBe(0);
  });
});
