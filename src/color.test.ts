import { describe, expect, it } from "vitest";
import { applyChannelBalance, hexToRgb, srgbToLedRgb } from "./color";

describe("hexToRgb", () => {
  it.each([
    ["#ff0000", [255, 0, 0]],
    ["#00ff00", [0, 255, 0]],
    ["#0000ff", [0, 0, 255]],
    ["#ff9500", [255, 149, 0]],
    ["7C5CFF", [124, 92, 255]],
  ])("converts %s without shifting channels", (hex, expected) => {
    expect(hexToRgb(hex as string)).toEqual(expected);
  });

  it("rejects malformed colors", () => {
    expect(() => hexToRgb("#xyz")).toThrow("Некорректный HEX-цвет");
  });

  it.each([
    ["#ff3b30", [255, 11, 8]],
    ["#ff9500", [255, 77, 0]],
    ["#ffd60a", [255, 171, 1]],
    ["#34c759", [9, 146, 25]],
    ["#00c7be", [0, 146, 131]],
  ])("linearizes preset %s for LED PWM", (hex, expected) => {
    expect(srgbToLedRgb(hexToRgb(hex as string))).toEqual(expected);
  });

  it("keeps pure channel calibration colors unchanged", () => {
    expect(srgbToLedRgb([255, 0, 0])).toEqual([255, 0, 0]);
    expect(srgbToLedRgb([0, 255, 0])).toEqual([0, 255, 0]);
    expect(srgbToLedRgb([0, 0, 255])).toEqual([0, 0, 255]);
  });

  it("keeps purple channels unchanged at 100% balance", () => {
    const linearPurple = srgbToLedRgb(hexToRgb("#af52de"));
    expect(linearPurple).toEqual([109, 22, 186]);
    expect(applyChannelBalance(linearPurple, { red: 100, green: 100, blue: 100 }))
      .toEqual(linearPurple);
  });

  it("clamps boosted channel values", () => {
    expect(applyChannelBalance([240, 100, 50], { red: 150, green: 100, blue: 100 }))
      .toEqual([255, 100, 50]);
  });
});
