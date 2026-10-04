export interface EffectOption {
  id: number;
  name: string;
}

const rainbowPalette = ["#ff3b30", "#ff9f0a", "#ffd60a", "#30d158", "#00c7be", "#0a84ff", "#bf5af2"] as const;
const namedColors = [
  ["красн", "#ff3b30"],
  ["зелён", "#30d158"],
  ["син", "#0a84ff"],
  ["жёлт", "#ffd60a"],
  ["бирюз", "#00c7be"],
  ["фиолет", "#bf5af2"],
  ["бел", "#f5f7ff"],
] as const;

export function effectPalette({ id, name }: EffectOption): readonly string[] {
  const normalized = name.toLocaleLowerCase("ru-RU");
  if (/семи|раду|авто/.test(normalized)) return rainbowPalette;
  if (/трёхцвет|rgb/.test(normalized)) return ["#ff3b30", "#30d158", "#0a84ff"];
  if (normalized.includes("мечта")) return ["#6e5cff", "#22d3c5", "#ff5bbd"];

  const found = namedColors
    .map(([token, color]) => ({ color, position: normalized.indexOf(token) }))
    .filter(({ position }) => position >= 0)
    .sort((left, right) => left.position - right.position)
    .map(({ color }) => color);
  if (found.length) return found.length === 1 ? [found[0], found[0]] : found;

  const hue = (id * 47) % 360;
  return [`hsl(${hue} 76% 52%)`, `hsl(${(hue + 55) % 360} 72% 42%)`];
}

export const analogEffects: EffectOption[] = [
  [135, "Трёхцветные скачки"],
  [136, "Семицветные скачки"],
  [137, "Трёхцветный градиент"],
  [138, "Семицветный градиент"],
  [139, "Красный градиент"],
  [140, "Зелёный градиент"],
  [141, "Синий градиент"],
  [142, "Жёлтый градиент"],
  [143, "Бирюзовый градиент"],
  [144, "Фиолетовый градиент"],
  [145, "Белый градиент"],
  [146, "Красный → зелёный"],
  [147, "Красный → синий"],
  [148, "Зелёный → синий"],
  [149, "Семицветная вспышка"],
  [150, "Красная вспышка"],
  [151, "Зелёная вспышка"],
  [152, "Синяя вспышка"],
  [153, "Жёлтая вспышка"],
  [154, "Бирюзовая вспышка"],
  [155, "Фиолетовая вспышка"],
  [156, "Белая вспышка"],
  [157, "Семицветное дыхание"],
].map(([id, name]) => ({ id: id as number, name: name as string }));

const knownDmxNames = new Map<number, string>([
  [1, "Мечта вперёд"],
  [2, "Мечта назад"],
  [3, "Радуга вперёд"],
  [4, "Радуга назад"],
  [5, "RGB вперёд"],
  [6, "RGB назад"],
  [7, "Жёлтый / бирюзовый / фиолетовый вперёд"],
  [8, "Жёлтый / бирюзовый / фиолетовый назад"],
  [23, "Радужный хвост вперёд"],
  [24, "Радужный хвост назад"],
  [39, "Радужный поток"],
  [57, "Радужный занавес — открыть"],
  [58, "Радужный занавес — закрыть"],
  [75, "Скачки семи цветов"],
  [78, "Радужный стробоскоп"],
  [81, "Плавная радуга"],
  [101, "Скачки: красный"],
  [102, "Скачки: зелёный"],
  [103, "Скачки: синий"],
  [122, "Быстрая радуга вперёд"],
  [123, "Быстрая радуга назад"],
  [199, "Радужный взмах вперёд"],
  [200, "Радужный взмах назад"],
  [205, "Занавес-взмах — открыть"],
  [206, "Занавес-взмах — закрыть"],
  [255, "Авто — все эффекты"],
]);

export const dmxEffects: EffectOption[] = [
  ...Array.from({ length: 210 }, (_, index) => {
    const id = index + 1;
    return { id, name: knownDmxNames.get(id) ?? `Эффект ${id}` };
  }),
  { id: 255, name: knownDmxNames.get(255)! },
];
