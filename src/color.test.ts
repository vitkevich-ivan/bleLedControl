import { describe, expect, it } from "vitest";
import { hexToRgb } from "./color";

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
});
