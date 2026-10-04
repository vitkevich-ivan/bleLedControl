export type ProtocolKind = "ble" | "dmx" | "dmx-shifted";
export type RgbOrder = "RGB" | "RBG" | "GRB" | "GBR" | "BRG" | "BGR";

export interface ControllerProfile {
  kind: ProtocolKind;
  label: string;
  addressable: boolean;
}

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function detectProfile(name = ""): ControllerProfile {
  const normalized = name.toUpperCase();
  if (/^(LEDDMX-(02|04)|LEDCAR-02)/.test(normalized)) {
    return { kind: "dmx-shifted", label: "LEDDMX 02/04", addressable: true };
  }
  if (/^(LEDDMX|LEDCAR-01)/.test(normalized)) {
    return { kind: "dmx", label: "LEDDMX / RGBIC", addressable: true };
  }
  return { kind: "ble", label: "LEDBLE / RGB", addressable: false };
}

function orderedRgb(red: number, green: number, blue: number, order: RgbOrder) {
  const channels = { R: clampByte(red), G: clampByte(green), B: clampByte(blue) };
  return [...order].map((channel) => channels[channel as keyof typeof channels]);
}

export class LedProtocol {
  constructor(
    public readonly kind: ProtocolKind,
    public rgbOrder: RgbOrder = "RBG",
  ) {}

  get addressable() {
    return this.kind !== "ble";
  }

  power(on: boolean): Uint8Array {
    if (this.kind === "dmx-shifted") {
      return Uint8Array.of(0x7b, 0x04, on ? 1 : 0, 0xff, 0xff, 0xff, 0xff, 0xff, 0xbf);
    }
    const edge = this.kind === "ble" ? [0x7e, 0xef] : [0x7b, 0xbf];
    return Uint8Array.of(edge[0], 0xff, 0x04, on ? 1 : 0, 0xff, 0xff, 0xff, 0xff, edge[1]);
  }

  color(red: number, green: number, blue: number): Uint8Array {
    const [c1, c2, c3] = orderedRgb(red, green, blue, this.rgbOrder);
    if (this.kind === "ble") {
      return Uint8Array.of(0x7e, 0xff, 0x05, 0x03, c1, c2, c3, 0xff, 0xef);
    }
    if (this.kind === "dmx-shifted") {
      return Uint8Array.of(0x7b, 0x07, c1, c2, c3, 0x00, 0xff, 0xff, 0xbf);
    }
    return Uint8Array.of(0x7b, 0xff, 0x07, c1, c2, c3, 0x00, 0xff, 0xbf);
  }

  brightness(percent: number): Uint8Array {
    const value = clampPercent(percent);
    if (this.kind === "ble") {
      return Uint8Array.of(0x7e, 0xff, 0x01, value, 0x00, 0xff, 0xff, 0xff, 0xef);
    }
    if (this.kind === "dmx-shifted") {
      return Uint8Array.of(0x7b, 0x01, value, 0x01, 0xff, 0xff, 0xff, 0xff, 0xbf);
    }
    return Uint8Array.of(
      0x7b,
      0xff,
      0x01,
      Math.round((value * 32) / 100),
      value,
      0x01,
      0xff,
      0xff,
      0xbf,
    );
  }

  speed(percent: number): Uint8Array {
    const value = clampPercent(percent);
    if (this.kind === "ble") {
      return Uint8Array.of(0x7e, 0xff, 0x02, value, 0x00, 0xff, 0xff, 0xff, 0xef);
    }
    if (this.kind === "dmx-shifted") {
      return Uint8Array.of(0x7b, 0x02, value, 0x00, 0xff, 0xff, 0xff, 0xff, 0xbf);
    }
    return Uint8Array.of(0x7b, 0xff, 0x02, value, 0x00, 0xff, 0xff, 0xff, 0xbf);
  }

  effect(id: number): Uint8Array {
    const value = clampByte(id);
    if (this.kind === "ble") {
      return Uint8Array.of(0x7e, 0xff, 0x03, value, 0x03, 0xff, 0xff, 0xff, 0xef);
    }
    if (this.kind === "dmx-shifted") {
      return Uint8Array.of(0x7b, 0x03, value, 0xff, 0xff, 0xff, 0xff, 0xff, 0xbf);
    }
    return Uint8Array.of(0x7b, 0xff, 0x03, value, 0xff, 0xff, 0xff, 0xff, 0xbf);
  }

  direction(reverse: boolean): Uint8Array {
    return Uint8Array.of(0x7b, 0xff, 0x0d, reverse ? 1 : 0, 0xff, 0xff, 0xff, 0xff, 0xbf);
  }

  hardwareMic(mode: number): Uint8Array {
    const value = clampByte(mode);
    if (this.kind === "ble") {
      return Uint8Array.of(0x7e, 0x00, 0x0e, value, 0xff, 0xff, 0xff, 0xff, 0xef);
    }
    if (this.kind === "dmx-shifted") {
      return Uint8Array.of(0x7b, 0x0b, value, 0x00, 0xff, 0xff, 0xff, 0xff, 0xbf);
    }
    return Uint8Array.of(0x7b, 0xff, 0x0b, value, 0x00, 0xff, 0xff, 0xff, 0xbf);
  }

  stripConfig(pixelCount: number, orderCode: number, chipType = 4): Uint8Array {
    const pixels = Math.max(1, Math.min(1024, Math.round(pixelCount)));
    const high = (pixels >> 8) & 0xff;
    const low = pixels & 0xff;
    const sort = Math.max(1, Math.min(6, Math.round(orderCode)));
    if (this.kind === "dmx-shifted") {
      return Uint8Array.of(0x7b, 0x05, sort, high, low, 0xff, 0xff, 0xff, 0xbf);
    }
    if (this.kind === "dmx") {
      return Uint8Array.of(0x7b, 0xff, 0x05, chipType, high, low, sort, 0xff, 0xbf);
    }
    return Uint8Array.of(0x7e, 0xff, 0x08, sort, 0xff, 0xff, 0xff, 0xff, 0xef);
  }
}

export function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}
