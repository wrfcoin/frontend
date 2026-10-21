/**
 * WCAG 2.x relative luminance and contrast ratio for hex colours, plus alpha compositing, so the
 * theme tests check the light-mode colour choices instead of trusting them.
 */
export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex colour: ${hex}`);
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

/** `rgba(r, g, b, a)` or `rgb(r, g, b)` to channels and alpha. */
export function parseRgba(value: string): { rgb: Rgb; alpha: number } {
  const m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (!m) throw new Error(`not an rgb(a) colour: ${value}`);
  return { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], alpha: m[4] === undefined ? 1 : Number(m[4]) };
}

export function compositeOver(top: Rgb, alpha: number, base: Rgb): Rgb {
  return top.map((c, i) => Math.round(c * alpha + base[i] * (1 - alpha))) as Rgb;
}

export function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
