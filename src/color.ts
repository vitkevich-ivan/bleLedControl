export type RgbColor = readonly [red: number, green: number, blue: number];

export function hexToRgb(hex: string): RgbColor {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new Error(`Некорректный HEX-цвет: ${hex}`);
  }
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function srgbChannelToLinear(value: number): number {
  const channel = Math.max(0, Math.min(255, value)) / 255;
  const linear = channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
  return Math.round(linear * 255);
}

export function srgbToLedRgb([red, green, blue]: RgbColor): RgbColor {
  return [
    srgbChannelToLinear(red),
    srgbChannelToLinear(green),
    srgbChannelToLinear(blue),
  ];
}
