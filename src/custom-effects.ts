import type { RgbColor } from "./color";

export type CustomEffectKind = "cycle" | "breathe" | "flicker" | "dawn" | "sunset" | "circadian";

export interface CustomEffect {
  id: string;
  name: string;
  description: string;
  kind: CustomEffectKind;
  colors: readonly RgbColor[];
  icon: string;
}

export const customEffects: readonly CustomEffect[] = [
  { id: "party", name: "Вечеринка", description: "Яркие цветные переходы", kind: "cycle", colors: [[255, 20, 90], [115, 40, 255], [0, 190, 255], [35, 255, 135], [255, 185, 0]], icon: "✦" },
  { id: "game", name: "Игра", description: "Контрастный неоновый ритм", kind: "cycle", colors: [[15, 70, 255], [170, 20, 255], [0, 245, 210], [255, 45, 115]], icon: "◆" },
  { id: "breathing", name: "Дыхание", description: "Спокойная холодная пульсация", kind: "breathe", colors: [[45, 105, 255], [175, 235, 255], [105, 55, 255]], icon: "◉" },
  { id: "evening", name: "Вечер", description: "Тихий тёплый свет", kind: "breathe", colors: [[255, 105, 30], [255, 175, 80], [115, 35, 75]], icon: "☾" },
  { id: "romance", name: "Романтика", description: "Розово-фиолетовое дыхание", kind: "breathe", colors: [[255, 35, 110], [180, 35, 255], [255, 90, 120]], icon: "♥" },
  { id: "candle", name: "Свеча", description: "Живое мерцание пламени", kind: "flicker", colors: [[255, 78, 8], [255, 145, 35], [255, 205, 95]], icon: "◒" },
  { id: "fire", name: "Огонь", description: "Красно-оранжевые языки пламени", kind: "flicker", colors: [[255, 35, 0], [255, 90, 0], [255, 190, 45]], icon: "♨" },
  { id: "night-light", name: "Ночник", description: "Очень мягкое тёплое свечение", kind: "breathe", colors: [[255, 105, 25], [255, 195, 110]], icon: "●" },
  { id: "reading", name: "Чтение", description: "Ровный комфортный белый", kind: "breathe", colors: [[255, 205, 135], [255, 235, 200]], icon: "▤" },
  { id: "dawn", name: "Рассвет", description: "От тёмно-красного к дневному", kind: "dawn", colors: [[35, 0, 3], [170, 25, 8], [255, 110, 25], [255, 220, 160], [255, 250, 235]], icon: "☀" },
  { id: "sunset", name: "Закат", description: "Плавное угасание тёплого света", kind: "sunset", colors: [[255, 245, 225], [255, 145, 55], [190, 35, 15], [45, 0, 8]], icon: "◐" },
  { id: "circadian", name: "Циркадный", description: "Теплота по времени суток", kind: "circadian", colors: [[255, 145, 65], [255, 250, 235], [255, 185, 105]], icon: "◷" },
  { id: "lava-lamp", name: "Лава-лампа", description: "Тягучие огненно-фиолетовые волны", kind: "breathe", colors: [[255, 55, 5], [255, 25, 105], [100, 15, 180]], icon: "◍" },
  { id: "summer", name: "Лето", description: "Солнце, небо и свежая зелень", kind: "cycle", colors: [[255, 195, 45], [45, 210, 255], [55, 205, 90], [255, 115, 35]], icon: "❋" },
  { id: "pendulum", name: "Маятник", description: "Размеренное движение двух оттенков", kind: "breathe", colors: [[30, 210, 240], [95, 45, 255]], icon: "↔" },
  { id: "pulse", name: "Пульс", description: "Мягкий розово-красный ритм", kind: "breathe", colors: [[120, 0, 45], [255, 20, 65]], icon: "⌁" },
  { id: "rainbow", name: "Радуга", description: "Непрерывный спектр цветов", kind: "cycle", colors: [[255, 35, 45], [255, 155, 15], [255, 225, 20], [35, 220, 90], [0, 200, 220], [25, 95, 255], [180, 45, 255]], icon: "◒" },
  { id: "light-music", name: "Светомузыка", description: "Плавный неоновый цветовой ритм", kind: "cycle", colors: [[255, 25, 120], [70, 45, 255], [0, 220, 235], [80, 255, 95]], icon: "♫" },
  { id: "equalizer", name: "Эквалайзер", description: "Переходы от зелёного к красному", kind: "cycle", colors: [[25, 220, 85], [235, 225, 20], [255, 40, 35]], icon: "▥" },
  { id: "aurora", name: "Северное сияние", description: "Зелёные и фиолетовые волны", kind: "breathe", colors: [[0, 205, 130], [20, 95, 255], [145, 30, 255], [0, 235, 185]], icon: "≈" },
  { id: "christmas-tree", name: "Ёлка", description: "Зелёные, красные и золотые огни", kind: "flicker", colors: [[15, 150, 55], [235, 25, 35], [255, 190, 35]], icon: "♠" },
  { id: "christmas", name: "Рождество", description: "Красный, зелёный и золотой", kind: "cycle", colors: [[235, 20, 25], [15, 180, 60], [255, 185, 35]], icon: "✶" },
  { id: "fairy-lights", name: "Сказочные огни", description: "Мягкие разноцветные огоньки", kind: "flicker", colors: [[255, 75, 130], [85, 80, 255], [30, 225, 185], [255, 195, 75]], icon: "✧" },
  { id: "wonder", name: "Чудо", description: "Медленная волшебная палитра", kind: "breathe", colors: [[95, 35, 255], [255, 55, 185], [35, 210, 255], [255, 185, 55]], icon: "✺" },
] as const;

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function limitRgbStep(previous: RgbColor, target: RgbColor, maxStep: number): RgbColor {
  const approach = (from: number, to: number) => clamp(from + Math.max(-maxStep, Math.min(maxStep, to - from)));
  return [
    approach(previous[0], target[0]),
    approach(previous[1], target[1]),
    approach(previous[2], target[2]),
  ];
}

export function smoothnessToMaxStep(value: number) {
  return 11 - Math.max(1, Math.min(10, Math.round(value)));
}

function mix(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  return [
    clamp(from[0] + (to[0] - from[0]) * amount),
    clamp(from[1] + (to[1] - from[1]) * amount),
    clamp(from[2] + (to[2] - from[2]) * amount),
  ];
}

function smoothstep(value: number) {
  const normalized = Math.max(0, Math.min(1, value));
  return normalized * normalized * (3 - 2 * normalized);
}

function colorAt(colors: readonly RgbColor[], progress: number): RgbColor {
  const position = Math.max(0, Math.min(0.999999, progress)) * (colors.length - 1);
  const index = Math.floor(position);
  return mix(colors[index], colors[Math.min(colors.length - 1, index + 1)], smoothstep(position - index));
}

function cyclicColorAt(colors: readonly RgbColor[], progress: number): RgbColor {
  const position = ((progress % 1) + 1) % 1 * colors.length;
  const index = Math.floor(position);
  return mix(colors[index], colors[(index + 1) % colors.length], smoothstep(position - index));
}

export function customEffectFrame(effect: CustomEffect, elapsedMs: number, speed: number): RgbColor {
  if (effect.kind === "circadian") {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    const progress = hour < 7 ? 0 : hour < 13 ? (hour - 7) / 12 : hour < 19 ? 0.5 + (hour - 13) / 12 : 1;
    return colorAt(effect.colors, progress);
  }

  const normalizedSpeed = Math.max(0, Math.min(100, speed));
  const duration = 54_000 - normalizedSpeed * 360;
  const rawProgress = (elapsedMs % duration) / duration;

  if (effect.kind === "dawn" || effect.kind === "sunset") {
    const transitionDuration = 180_000 - normalizedSpeed * 1_200;
    return colorAt(effect.colors, Math.min(0.999999, elapsedMs / transitionDuration));
  }
  if (effect.kind === "flicker") {
    const drift = (1 - Math.cos(elapsedMs / 4_800 * Math.PI * 2)) / 2;
    const base = colorAt(effect.colors, drift);
    const intensity = 0.91
      + Math.sin(elapsedMs / 1_400 * Math.PI * 2) * 0.035
      + Math.sin(elapsedMs / 530 * Math.PI * 2) * 0.015;
    return [clamp(base[0] * intensity), clamp(base[1] * intensity), clamp(base[2] * intensity)];
  }

  const wave = effect.kind === "breathe" ? (1 - Math.cos(rawProgress * Math.PI * 2)) / 2 : rawProgress;
  return effect.kind === "breathe" ? colorAt(effect.colors, wave) : cyclicColorAt(effect.colors, rawProgress);
}
