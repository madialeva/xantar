import { describe, expect, it } from 'vitest';
import { GRAPHICS, type GraphicId } from '../art/graphics';
import { FEET_Y, type RigDefinition, rigPlacement } from './RigDefinition';
import { chefRig, enemyRigs } from './rigs';

const RENDER_SCALE = 4;
const OPAQUE = 20;

const pngData = import.meta.glob<string>('../art/sources/*.png', {
  query: '?inline',
  import: 'default',
  eager: true
});

const bytesOf = (dataUrl: string): Uint8Array =>
  Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), (char) => char.charCodeAt(0));

const inflate = async (data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> => {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const paeth = (a: number, b: number, c: number): number => {
  const p = a + b - c;
  const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/** First and last rows with an opaque pixel of an 8-bit RGBA, non-interlaced PNG. */
async function opaqueRows(dataUrl: string): Promise<{ first: number; last: number }> {
  const bytes = bytesOf(dataUrl);
  const view = new DataView(bytes.buffer);
  const [width, height] = [view.getUint32(16), view.getUint32(20)];
  const chunks: Uint8Array[] = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const raw = await inflate(new Uint8Array(chunks.flatMap((chunk) => [...chunk])));
  const stride = width * 4;
  let previous = new Uint8Array(stride);
  const opaque: number[] = [];
  for (let row = 0; row < height; row++) {
    const filter = raw[row * (stride + 1)];
    const line = raw.slice(row * (stride + 1) + 1, (row + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const left = i >= 4 ? line[i - 4] : 0;
      const up = previous[i];
      const upLeft = i >= 4 ? previous[i - 4] : 0;
      const predictor = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][filter];
      line[i] = (line[i] + predictor) & 0xff;
    }
    for (let i = 3; i < stride; i += 4) {
      if (line[i] > OPAQUE) {
        opaque.push(row);
        break;
      }
    }
    previous = line;
  }
  return { first: Math.min(...opaque), last: Math.max(...opaque) };
}

/** Top of the head and soles of a rig in its base pose, below its anchor, as the game draws it. */
async function extent(rig: RigDefinition): Promise<{ top: number; feet: number }> {
  const placement = rigPlacement(rig);
  const tops: number[] = [];
  const soles: number[] = [];
  for (const part of rig.parts) {
    const graphic: GraphicId = part.graphic;
    const rows = await opaqueRows(pngData[`../art/sources/${graphic}.png`]);
    const boxTop = part.y - (part.originY ?? 0.5) * GRAPHICS[graphic].height;
    tops.push(boxTop + rows.first / RENDER_SCALE);
    soles.push(boxTop + (rows.last + 1) / RENDER_SCALE);
  }
  const toGame = (y: number): number => placement.y + y * placement.scale;
  return { top: toGame(Math.min(...tops)), feet: toGame(Math.max(...soles)) };
}

describe('rig heights', () => {
  it('draws the chef two cells (32 units) tall with the feet on the floor', async () => {
    const { top, feet } = await extent(chefRig);
    expect(feet).toBeCloseTo(FEET_Y, 5);
    expect(Math.abs(feet - top - 32)).toBeLessThanOrEqual(1);
  });

  for (const [kind, rig] of Object.entries(enemyRigs)) {
    it(`draws the ${kind} about as tall as the chef, standing on the floor`, async () => {
      const { top, feet } = await extent(rig);
      expect(feet).toBeCloseTo(FEET_Y, 5);
      expect(feet - top).toBeGreaterThanOrEqual(30);
      expect(feet - top).toBeLessThanOrEqual(33);
    });
  }
});
