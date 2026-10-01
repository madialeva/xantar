export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const columnCenter = (col: number): number => col + 0.5;

export const platformLine = (row: number): number => row + 0.5;

export const rangesOverlap = (a0: number, a1: number, b0: number, b1: number): boolean =>
  a0 <= b1 && b0 <= a1;

export const isWithin = (value: number, low: number, high: number, tolerance = 0): boolean =>
  value >= low - tolerance && value <= high + tolerance;
