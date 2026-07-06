/**
 * Turns a loosely-specified color from config.json (a CSS named color, hex,
 * rgb()/rgba(), or hsl()/hsla()) into a curated "house style" version of
 * that color: same hue (so "blue" is still recognizably blue), but with
 * saturation/lightness retuned per hue so it reads well against the site's
 * dark background and looks consistent with everything else on the page —
 * no matter what exact shade gets typed into config.json.
 *
 * Pure math, no DOM access, so it produces identical output on the server
 * and the client (no hydration flash).
 */

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  brown: "#a52a2a",
  gray: "#808080",
  grey: "#808080",
  cyan: "#00ffff",
  aqua: "#00ffff",
  magenta: "#ff00ff",
  fuchsia: "#ff00ff",
  lime: "#00ff00",
  teal: "#008080",
  navy: "#000080",
  maroon: "#800000",
  olive: "#808000",
  silver: "#c0c0c0",
  gold: "#ffd700",
  indigo: "#4b0082",
  violet: "#ee82ee",
  turquoise: "#40e0d0",
  coral: "#ff7f50",
  salmon: "#fa8072",
  crimson: "#dc143c",
  chocolate: "#d2691e",
  khaki: "#f0e68c",
  plum: "#dda0dd",
  orchid: "#da70d6",
  tan: "#d2b48c",
  beige: "#f5f5dc",
  ivory: "#fffff0",
  lavender: "#e6e6fa",
  azure: "#f0ffff",
  skyblue: "#87ceeb",
  "sky blue": "#87ceeb",
  steelblue: "#4682b4",
  royalblue: "#4169e1",
  forestgreen: "#228b22",
  seagreen: "#2e8b57",
  hotpink: "#ff69b4",
  tomato: "#ff6347",
  firebrick: "#b22222",
  darkred: "#8b0000",
  darkblue: "#00008b",
  darkgreen: "#006400",
  slategray: "#708090",
  slategrey: "#708090",
  amber: "#ffbf00",
};

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return null;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

/** Parses a named/hex/rgb()/hsl() color string into [h, s, l] (0-360, 0-100, 0-100). */
function parseToHsl(input: string): [number, number, number] | null {
  const value = input.trim().toLowerCase();

  if (NAMED_COLORS[value]) {
    const rgb = hexToRgb(NAMED_COLORS[value]);
    return rgb && rgbToHsl(...rgb);
  }

  if (value.startsWith("#")) {
    const rgb = hexToRgb(value);
    return rgb && rgbToHsl(...rgb);
  }

  const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1).map(Number);
    return rgbToHsl(r, g, b);
  }

  const hslMatch = value.match(
    /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%/
  );
  if (hslMatch) {
    const [h, s, l] = hslMatch.slice(1).map(Number);
    return [h, s, l];
  }

  return null;
}

// Curated saturation/lightness targets per hue range, hand-tuned so each
// family of color reads with roughly consistent brightness/vividness on a
// near-black background (plain HSL alone makes yellows look glaring and
// blues look muddy at the same S/L, so each band gets its own tuning).
const HUE_BANDS: Array<{ max: number; s: number; l: number }> = [
  { max: 15, s: 72, l: 60 }, // red
  { max: 45, s: 80, l: 58 }, // orange
  { max: 70, s: 72, l: 54 }, // yellow / gold
  { max: 150, s: 55, l: 50 }, // green / lime
  { max: 195, s: 60, l: 55 }, // teal / cyan
  { max: 230, s: 70, l: 58 }, // sky / azure
  { max: 255, s: 75, l: 62 }, // blue
  { max: 280, s: 80, l: 65 }, // indigo / violet
  { max: 320, s: 70, l: 62 }, // purple / magenta
  { max: 345, s: 65, l: 65 }, // pink
  { max: 361, s: 72, l: 60 }, // red (wrap-around)
];

function bandFor(hue: number): { s: number; l: number } {
  const band = HUE_BANDS.find((b) => hue < b.max) ?? HUE_BANDS[HUE_BANDS.length - 1];
  return { s: band.s, l: band.l };
}

export const DEFAULT_BRAND_COLOR = "hsl(271, 80%, 65%)"; // matches the site's default purple accent

/**
 * Returns a curated, theme-consistent CSS color string for a given raw
 * config value. Same hue as the input, retuned saturation/lightness. Falls
 * back to the site's default accent if the input is missing or unparseable.
 * True grayscale input (saturation ~0) is mapped to a neutral muted gray
 * instead of an arbitrary hue, since hue has no meaning for gray/black/white.
 */
export function brandColor(input: string | undefined | null): string {
  if (!input) return DEFAULT_BRAND_COLOR;

  const hsl = parseToHsl(input);
  if (!hsl) return DEFAULT_BRAND_COLOR;

  const [h, s] = hsl;
  if (s < 8) return "hsl(240, 6%, 65%)"; // neutral gray, not tied to a hue band

  const { s: targetS, l: targetL } = bandFor(h);
  return `hsl(${Math.round(h)}, ${targetS}%, ${targetL}%)`;
}

/**
 * Adds alpha to a color produced by `brandColor()` (always `hsl(h, s%, l%)`),
 * for soft glows/borders without a full-opacity halo.
 */
export function withAlpha(hslColor: string, alpha: number): string {
  const match = hslColor.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/);
  if (!match) return hslColor;
  const [, h, s, l] = match;
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

/** Exposed for potential future use (e.g. rendering a swatch preview). */
export function toRgbString(input: string): string | null {
  const hsl = parseToHsl(input);
  if (!hsl) return null;
  const [r, g, b] = hslToRgb(...hsl);
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
