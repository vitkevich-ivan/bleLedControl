import { describe, expect, it } from "vitest";
import { effectPalette } from "./effects";

describe("effectPalette", () => {
  it("uses all seven colors for rainbow effects", () => {
    expect(effectPalette({ id: 138, name: "Семицветный градиент" })).toHaveLength(7);
  });

  it("keeps the color order from an effect name", () => {
    expect(effectPalette({ id: 146, name: "Красный → зелёный" })).toEqual(["#ff3b30", "#30d158"]);
    expect(effectPalette({ id: 7, name: "Жёлтый / бирюзовый / фиолетовый вперёд" }))
      .toEqual(["#ffd60a", "#00c7be", "#bf5af2"]);
  });

  it("uses the exact single-color palette", () => {
    expect(effectPalette({ id: 141, name: "Синий градиент" })).toEqual(["#0a84ff", "#0a84ff"]);
  });
});
