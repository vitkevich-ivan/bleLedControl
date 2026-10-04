import { describe, expect, it } from "vitest";
import { hexToRgb, srgbToLedRgb } from "./color";
import { detectProfile, LedProtocol } from "./protocol";

const bytes = (value: Uint8Array) => [...value];

describe("detectProfile", () => {
  it("detects common controller families", () => {
    expect(detectProfile("LEDBLE-01-9201").kind).toBe("ble");
    expect(detectProfile("LEDDMX-03-555B").kind).toBe("dmx");
    expect(detectProfile("LEDDMX-04-ABCD").kind).toBe("dmx-shifted");
    expect(detectProfile("LEDCAR-02-1234").kind).toBe("dmx-shifted");
  });
});

describe("LedProtocol", () => {
  it("builds LEDBLE power and color frames", () => {
    const protocol = new LedProtocol("ble", "RGB");
    expect(bytes(protocol.power(true))).toEqual([0x7e, 0xff, 0x04, 1, 0xff, 0xff, 0xff, 0xff, 0xef]);
    expect(bytes(protocol.color(255, 16, 0))).toEqual([0x7e, 0xff, 0x05, 0x03, 255, 16, 0, 0xff, 0xef]);
  });

  it("applies RGB channel order", () => {
    const protocol = new LedProtocol("ble", "GRB");
    expect(bytes(protocol.color(1, 2, 3)).slice(4, 7)).toEqual([2, 1, 3]);
  });

  it("uses the calibrated RBG wiring order by default", () => {
    const protocol = new LedProtocol("ble");
    expect(bytes(protocol.color(10, 20, 30)).slice(4, 7)).toEqual([10, 30, 20]);
  });

  it("maps an orange picker value to the calibrated RBG payload", () => {
    const protocol = new LedProtocol("ble");
    expect(bytes(protocol.color(255, 149, 0)).slice(4, 7)).toEqual([255, 0, 149]);
  });

  it.each([
    ["#ff3b30", [255, 8, 11]],
    ["#ff9500", [255, 0, 77]],
    ["#ffd60a", [255, 1, 171]],
    ["#34c759", [9, 25, 146]],
    ["#00c7be", [0, 131, 146]],
  ])("sends corrected preset %s in RBG wire order", (hex, expected) => {
    const protocol = new LedProtocol("ble");
    const frame = protocol.color(...srgbToLedRgb(hexToRgb(hex as string)));
    expect(bytes(frame).slice(4, 7)).toEqual(expected);
  });

  it("builds regular DMX frames", () => {
    const protocol = new LedProtocol("dmx", "RGB");
    expect(bytes(protocol.color(1, 2, 3))).toEqual([0x7b, 0xff, 0x07, 1, 2, 3, 0, 0xff, 0xbf]);
    expect(bytes(protocol.brightness(50))).toEqual([0x7b, 0xff, 0x01, 16, 50, 1, 0xff, 0xff, 0xbf]);
    expect(bytes(protocol.effect(255))).toEqual([0x7b, 0xff, 0x03, 255, 0xff, 0xff, 0xff, 0xff, 0xbf]);
  });

  it("builds shifted DMX frames", () => {
    const protocol = new LedProtocol("dmx-shifted");
    expect(bytes(protocol.power(false))).toEqual([0x7b, 0x04, 0, 0xff, 0xff, 0xff, 0xff, 0xff, 0xbf]);
    expect(bytes(protocol.speed(60))).toEqual([0x7b, 0x02, 60, 0, 0xff, 0xff, 0xff, 0xff, 0xbf]);
  });

  it("clamps unsafe values", () => {
    const protocol = new LedProtocol("ble", "RGB");
    expect(bytes(protocol.brightness(500))[3]).toBe(100);
    expect(bytes(protocol.color(-5, 270, 12.4)).slice(4, 7)).toEqual([0, 255, 12]);
  });
});
