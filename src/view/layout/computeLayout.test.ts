import { describe, expect, it } from 'vitest';
import { computeLayout, layoutForWidth } from './computeLayout';

const fills = (layout: { width: number; height: number }, w: number, h: number): boolean =>
  Math.abs(layout.width / layout.height - w / h) < 0.01;

describe('computeLayout', () => {
  it('fills a 16:9 window with a 1120-wide area and panels of 248', () => {
    const layout = computeLayout(1920, 1080);
    expect(layout).toMatchObject({ width: 1120, height: 630 });
    expect(layout.leftPanel.width).toBe(248);
    expect(fills(layout, 1920, 1080)).toBe(true);
  });

  it('fills a 19.5:9 phone in landscape with wider panels', () => {
    const layout = computeLayout(2340, 1080);
    expect(layout.width).toBe(1365);
    expect(fills(layout, 2340, 1080)).toBe(true);
    expect(layout.rightPanel.width).toBeGreaterThan(computeLayout(1920, 1080).rightPanel.width);
  });

  it('fills a 21:9 and a 4:3 window', () => {
    expect(computeLayout(2560, 1080).width).toBe(1493);
    expect(fills(computeLayout(2560, 1080), 2560, 1080)).toBe(true);
    expect(computeLayout(1024, 768).width).toBe(840);
    expect(fills(computeLayout(1024, 768), 1024, 768)).toBe(true);
  });

  it('keeps the minimum width on a 5:4 window, leaving bands above and below', () => {
    const layout = computeLayout(1280, 1024);
    expect(layout.width).toBe(816);
    expect(layout.leftPanel.width).toBe(96);
    expect(fills(layout, 1280, 1024)).toBe(false);
  });

  it('caps the width at 2.4 times the height on a 32:9 window, leaving bands at the sides', () => {
    expect(computeLayout(3840, 1080).width).toBe(1512);
  });

  it('copes with tiny or empty windows', () => {
    expect(computeLayout(1, 1).width).toBe(816);
    expect(computeLayout(0, 0).width).toBe(816);
    expect(computeLayout(300, 0).width).toBe(816);
  });
});

describe('layoutForWidth', () => {
  it('centres the board, 630 tall, between two equal panels', () => {
    const layout = layoutForWidth(900);
    expect(layout.board).toEqual({ x: 0, y: 0, width: 624, height: 630 });
    expect(layout.leftPanel).toEqual({ x: -138, y: 0, width: 138, height: 630 });
    expect(layout.rightPanel).toEqual({ x: 624, y: 0, width: 138, height: 630 });
  });
});
