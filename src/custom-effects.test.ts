import { describe, expect, it } from "vitest";
import { customEffectFrame, customEffects } from "./custom-effects";

describe("customEffectFrame", () => {
  it("interpolates a cycle without exceeding RGB bounds", () => {
    const effect = customEffects.find(({ id }) => id === "party")!;
    expect(customEffectFrame(effect, 0, 50)).toEqual([255, 20, 90]);
    expect(customEffectFrame(effect, 5_500, 50).every((channel) => channel >= 0 && channel <= 255)).toBe(true);
  });

  it("creates deterministic candle flicker with an injected random source", () => {
    const effect = customEffects.find(({ id }) => id === "candle")!;
    expect(customEffectFrame(effect, 0, 50, () => 0)).toEqual([184, 56, 6]);
  });

  it("moves dawn from dark red toward daylight", () => {
    const effect = customEffects.find(({ id }) => id === "dawn")!;
    const start = customEffectFrame(effect, 0, 0);
    const later = customEffectFrame(effect, 90_000, 0);
    expect(later[0]).toBeGreaterThan(start[0]);
    expect(later[1]).toBeGreaterThan(start[1]);
  });
});
