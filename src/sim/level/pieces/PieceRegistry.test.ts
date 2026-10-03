import { describe, expect, it } from 'vitest';
import type { PieceDefinition } from './PieceDefinition';
import { PieceRegistry } from './PieceRegistry';

const custom = (overrides: Partial<PieceDefinition> = {}): PieceDefinition => ({
  id: 'custom',
  symbol: 'X',
  layer: 'actors',
  width: 1,
  contribute: () => undefined,
  ...overrides
});

describe('PieceRegistry', () => {
  it('resolves each symbol of the default pieces by layer', () => {
    const registry = PieceRegistry.createDefault();
    expect(registry.resolve('structure', '=')?.id).toBe('platform');
    expect(registry.resolve('structure', '+')?.id).toBe('crossing');
    expect(registry.resolve('ingredients', 'T')?.id).toBe('bunTop');
    expect(registry.resolve('actors', 'h')?.id).toBe('hotdog');
    expect(registry.resolve('actors', 'C')?.id).toBe('chef');
  });

  it('defines the version 1 symbols of every layer', () => {
    const registry = PieceRegistry.createDefault();
    const symbols = (layer: Parameters<PieceRegistry['pieces']>[0]): string =>
      registry
        .pieces(layer)
        .map((piece) => piece.symbol)
        .join('');
    expect(symbols('structure')).toBe('.=H+_');
    expect(symbols('ingredients')).toBe('.TLPB');
    expect(symbols('actors')).toBe('.Chpe');
  });

  it('gives the plate and the ingredients the width of the level unit', () => {
    const registry = PieceRegistry.createDefault();
    expect(registry.resolve('structure', '_')?.width).toBe('unit');
    expect(registry.resolve('ingredients', 'P')?.width).toBe('unit');
    expect(registry.resolve('structure', '=')?.width).toBe(1);
  });

  it('returns undefined for a symbol that is not registered in that layer', () => {
    const registry = PieceRegistry.createDefault();
    expect(registry.resolve('structure', 'T')).toBeUndefined();
    expect(registry.resolve('actors', 'Z')).toBeUndefined();
  });

  it('rejects a repeated symbol in the same layer', () => {
    const registry = PieceRegistry.createDefault();
    expect(() => registry.register(custom({ symbol: 'h' }))).toThrow(/already used.*hotdog/);
  });

  it('accepts the same symbol in different layers', () => {
    const registry = PieceRegistry.createDefault();
    expect(() => registry.register(custom({ layer: 'structure', symbol: 'h' }))).not.toThrow();
    expect(registry.resolve('structure', 'h')?.id).toBe('custom');
    expect(registry.resolve('actors', 'h')?.id).toBe('hotdog');
  });

  it('rejects symbols that are not a single character and invalid widths', () => {
    const registry = PieceRegistry.createDefault();
    expect(() => registry.register(custom({ symbol: 'XY' }))).toThrow(/single character/);
    expect(() => registry.register(custom({ width: 0 }))).toThrow(/width/);
  });

  it('makes a new piece available without touching the others', () => {
    const registry = PieceRegistry.createDefault();
    registry.register(custom());
    expect(registry.resolve('actors', 'X')?.id).toBe('custom');
  });
});
