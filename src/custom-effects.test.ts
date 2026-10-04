import { describe, expect, it } from "vitest";
import { customEffectFrame, customEffects } from "./custom-effects";

describe("customEffectFrame", () => {
  it("interpolates a cycle without exceeding RGB bounds", () => {
    const effect = customEffects.find(({ id }) => id === "party")!;
    expect(customEffectFrame(effect, 0, 50)).toEqual([255, 20, 90]);
    expect(customEffectFrame(effect, 5_500, 50).every((channel) => channel >= 0 && channel <= 255)).toBe(true);
  });

  it("keeps a cycle smooth where its last color wraps to the first", () => {
    const effect = customEffects.find(({ id }) => id === "party")!;
    const beforeWrap = customEffectFrame(effect, 10_910, 50);
    const afterWrap = customEffectFrame(effect, 11_000, 50);
    expect(Math.max(...beforeWrap.map((channel, index) => Math.abs(channel - afterWrap[index])))).toBeLessThan(4);
  });

  it("creates candle flicker without random frame jumps", () => {
    const effect = customEffects.find(({ id }) => id === "candle")!;
    const first = customEffectFrame(effect, 1_000, 50);
    const next = customEffectFrame(effect, 1_090, 50);
    expect(Math.max(...first.map((channel, index) => Math.abs(channel - next[index])))).toBeLessThan(18);
  });

  it("moves dawn from dark red toward daylight", () => {
    const effect = customEffects.find(({ id }) => id === "dawn")!;
    const start = customEffectFrame(effect, 0, 0);
    const later = customEffectFrame(effect, 90_000, 0);
    expect(later[0]).toBeGreaterThan(start[0]);
    expect(later[1]).toBeGreaterThan(start[1]);
  });
});
