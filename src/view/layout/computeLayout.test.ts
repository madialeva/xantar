import { describe, expect, it } from 'vitest';
import { computeLayout, layoutForWidth } from './computeLayout';

const fills = (layout: { width: number; height: number }, w: number, h: number): boolean =>
  Math.abs(layout.width / layout.height - w / h) < 0.01;

describe('computeLayout', () => {
  it('fills a 16:9 window with a 1120-wide area and panels of 209', () => {
    const layout = computeLayout(1920, 1080);
    expect(layout).toMatchObject({ width: 1120, height: 630 });
    expect(layout.leftPanel.width).toBe(209);
    expect(fills(layout, 1920, 1080)).toBe(true);
  });

  it('fills a 19.5:9 phone in landscape with wider panels', () => {
    const layout = computeLayout(2340, 1080);
    expect(layout.width).toBe(1365);
    expect(fills(layout, 2340, 1080)).toBe(true);
    expect(layout.rightPanel.width).toBeGreaterThan(computeLayout(1920, 1080).rightPanel.width);
  });

  it('fills a 21:9 and a 16:10 window', () => {
    expect(computeLayout(2560, 1080).width).toBe(1493);
    expect(fills(computeLayout(2560, 1080), 2560, 1080)).toBe(true);
    expect(computeLayout(1680, 1050).width).toBe(1008);
    expect(fills(computeLayout(1680, 1050), 1680, 1050)).toBe(true);
  });

  it('keeps the minimum width on 4:3 and 5:4 windows, leaving bands above and below', () => {
    for (const [width, height] of [
      [1024, 768],
      [1280, 1024]
    ] as const) {
      const layout = computeLayout(width, height);
      expect(layout.width).toBe(894);
      expect(layout.leftPanel.width).toBe(96);
      expect(fills(layout, width, height)).toBe(false);
    }
  });

  it('caps the width at 2.4 times the height on a 32:9 window, leaving bands at the sides', () => {
    expect(computeLayout(3840, 1080).width).toBe(1512);
  });

  it('copes with tiny or empty windows', () => {
    expect(computeLayout(1, 1).width).toBe(894);
    expect(computeLayout(0, 0).width).toBe(894);
    expect(computeLayout(300, 0).width).toBe(894);
  });
});

describe('layoutForWidth', () => {
  it('centres the board, 630 tall, between two equal panels', () => {
    const layout = layoutForWidth(978);
    expect(layout.board).toEqual({ x: 0, y: 0, width: 702, height: 630 });
    expect(layout.leftPanel).toEqual({ x: -138, y: 0, width: 138, height: 630 });
    expect(layout.rightPanel).toEqual({ x: 702, y: 0, width: 138, height: 630 });
  });
});
