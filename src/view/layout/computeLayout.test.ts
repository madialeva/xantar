import { describe, expect, it } from 'vitest';
import { computeLayout, layoutForWidth } from './computeLayout';

const fills = (layout: { width: number; height: number }, w: number, h: number): boolean =>
  Math.abs(layout.width / layout.height - w / h) < 0.01;

describe('computeLayout', () => {
  it('fills a 16:9 window with a 853-wide area and panels of about 106', () => {
    const layout = computeLayout(1920, 1080);
    expect(layout).toMatchObject({ width: 853, height: 480 });
    expect(layout.leftPanel.width).toBeCloseTo(106.5);
    expect(fills(layout, 1920, 1080)).toBe(true);
  });

  it('fills a 19.5:9 phone in landscape with wider panels', () => {
    const layout = computeLayout(2340, 1080);
    expect(layout.width).toBe(1040);
    expect(fills(layout, 2340, 1080)).toBe(true);
    expect(layout.rightPanel.width).toBeGreaterThan(computeLayout(1920, 1080).rightPanel.width);
  });

  it('fills a 21:9 window', () => {
    const layout = computeLayout(2560, 1080);
    expect(layout.width).toBe(1138);
    expect(fills(layout, 2560, 1080)).toBe(true);
  });

  it('keeps the minimum width on a 4:3 window, leaving bands above and below', () => {
    const layout = computeLayout(1024, 768);
    expect(layout.width).toBe(832);
    expect(layout.leftPanel.width).toBe(96);
    expect(fills(layout, 1024, 768)).toBe(false);
  });

  it('caps the width on a 32:9 window, leaving bands at the sides', () => {
    expect(computeLayout(3840, 1080).width).toBe(1152);
  });

  it('copes with tiny or empty windows', () => {
    expect(computeLayout(1, 1).width).toBe(832);
    expect(computeLayout(0, 0).width).toBe(832);
    expect(computeLayout(300, 0).width).toBe(832);
  });
});

describe('layoutForWidth', () => {
  it('centres the board between two equal panels', () => {
    const layout = layoutForWidth(900);
    expect(layout.board).toEqual({ x: 0, y: 0, width: 640, height: 480 });
    expect(layout.leftPanel).toEqual({ x: -130, y: 0, width: 130, height: 480 });
    expect(layout.rightPanel).toEqual({ x: 640, y: 0, width: 130, height: 480 });
  });
});
