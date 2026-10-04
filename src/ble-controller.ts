import { bytesToHex, detectProfile, LedProtocol, type ProtocolKind, type RgbOrder } from "./protocol";

const SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
const WRITE_INTERVAL_MS = 45;

export type ConnectionState = "unsupported" | "idle" | "connecting" | "syncing" | "connected" | "disconnected" | "paused";

export interface ControllerSnapshot {
  state: ConnectionState;
  deviceName: string;
  profileLabel: string;
  protocolKind: ProtocolKind;
}

type StateListener = (snapshot: ControllerSnapshot) => void;
type LogListener = (message: string) => void;

export class BleLampController {
  private device?: BluetoothDevice;
  private characteristic?: BluetoothRemoteGATTCharacteristic;
  private protocol = new LedProtocol("ble");
  private state: ConnectionState = navigator.bluetooth ? "idle" : "unsupported";
  private writeTail = Promise.resolve();
  private lastWriteAt = 0;
  private forcedKind: ProtocolKind | "auto" = "auto";
  private manualDisconnect = false;
  private reconnectTimer = 0;
  private reconnectAttempt = 0;
  private session = 0;

  constructor(
    private readonly onState: StateListener,
    private readonly onLog: LogListener,
    private readonly onRestore: () => Promise<void> = async () => undefined,
  ) {
    this.emitState();
  }

  get connected() {
    return (this.state === "connected" || this.state === "syncing")
      && Boolean(this.characteristic)
      && Boolean(this.device?.gatt?.connected);
  }

  get kind() {
    return this.protocol.kind;
  }

  get addressable() {
    return this.protocol.addressable;
  }

  setRgbOrder(order: RgbOrder) {
    this.protocol.rgbOrder = order;
  }

  setForcedProtocol(kind: ProtocolKind | "auto") {
    this.forcedKind = kind;
    if (this.device || kind === "auto") {
      this.selectProtocol(this.device?.name ?? "");
    } else {
      const currentOrder = this.protocol.rgbOrder;
      this.protocol = new LedProtocol(kind, currentOrder);
      this.emitState();
    }
  }

  async connect() {
    if (!navigator.bluetooth) throw new Error("Web Bluetooth недоступен в этом браузере");
    this.manualDisconnect = false;
    window.clearTimeout(this.reconnectTimer);
    this.setState("connecting");
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "LED" }],
        optionalServices: [SERVICE_UUID],
      });
      this.device.addEventListener("gattserverdisconnected", this.handleDisconnect);
      this.selectProtocol(this.device.name ?? "LED");
      await this.openGatt();
    } catch (error) {
      this.setState(this.device ? "disconnected" : "idle");
      if (this.device && !this.manualDisconnect) this.scheduleReconnect();
      throw error;
    }
  }

  async reconnect() {
    if (!this.device) return this.connect();
    this.manualDisconnect = false;
    window.clearTimeout(this.reconnectTimer);
    this.setState("connecting");
    try {
      await this.openGatt();
    } catch (error) {
      this.setState("disconnected");
      if (!this.manualDisconnect) this.scheduleReconnect();
      throw error;
    }
  }

  disconnect() {
    this.manualDisconnect = true;
    window.clearTimeout(this.reconnectTimer);
    this.session += 1;
    this.writeTail = Promise.resolve();
    this.device?.gatt?.disconnect();
    this.characteristic = undefined;
    this.setState("paused");
  }

  power(on: boolean) { return this.write(this.protocol.power(on)); }
  color(red: number, green: number, blue: number) { return this.write(this.protocol.color(red, green, blue)); }
  brightness(value: number) { return this.write(this.protocol.brightness(value)); }
  speed(value: number) { return this.write(this.protocol.speed(value)); }
  effect(value: number) { return this.write(this.protocol.effect(value)); }
  direction(reverse: boolean) { return this.write(this.protocol.direction(reverse)); }
  hardwareMic(mode: number) { return this.write(this.protocol.hardwareMic(mode)); }
  stripConfig(pixels: number, orderCode: number) { return this.write(this.protocol.stripConfig(pixels, orderCode)); }

  private async openGatt() {
    const server = await this.device?.gatt?.connect();
    if (!server) throw new Error("Не удалось открыть Bluetooth-соединение");
    const service = await server.getPrimaryService(SERVICE_UUID);
    this.characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
    this.session += 1;
    this.writeTail = Promise.resolve();
    this.reconnectAttempt = 0;
    this.setState("syncing");
    await this.onRestore();
    this.setState("connected");
    this.onLog(`Подключено: ${this.device?.name ?? "без имени"}`);
  }

  private selectProtocol(deviceName: string) {
    const detected = detectProfile(deviceName);
    const kind = this.forcedKind === "auto" ? detected.kind : this.forcedKind;
    const currentOrder = this.protocol.rgbOrder;
    this.protocol = new LedProtocol(kind, currentOrder);
    this.onLog(`Протокол: ${kind}${this.forcedKind === "auto" ? " (авто)" : " (вручную)"}`);
    this.emitState();
  }

  private write(frame: Uint8Array) {
    const queuedSession = this.session;
    this.writeTail = this.writeTail.catch(() => undefined).then(async () => {
      if (queuedSession !== this.session) throw new DOMException("Устаревшая команда отменена", "AbortError");
      if (!this.characteristic || !this.connected) throw new Error("Лампа не подключена");
      const wait = Math.max(0, WRITE_INTERVAL_MS - (Date.now() - this.lastWriteAt));
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
      const payload = new Uint8Array(frame);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(payload);
      } else {
        await this.characteristic.writeValue(payload);
      }
      this.lastWriteAt = Date.now();
      this.onLog(`TX ${bytesToHex(frame)}`);
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        this.onLog(`Ошибка записи: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    });
    return this.writeTail;
  }

  private handleDisconnect = () => {
    this.session += 1;
    this.writeTail = Promise.resolve();
    this.characteristic = undefined;
    if (this.manualDisconnect) {
      this.setState("paused");
      this.onLog("Лампа отключена пользователем");
    } else {
      this.setState("disconnected");
      this.onLog("Bluetooth-соединение разорвано");
      this.scheduleReconnect();
    }
  };

  private scheduleReconnect() {
    window.clearTimeout(this.reconnectTimer);
    const delay = Math.min(10_000, 800 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.onLog(`Повторное подключение через ${(delay / 1000).toFixed(1)} с`);
    this.reconnectTimer = window.setTimeout(async () => {
      if (this.manualDisconnect || !this.device) return;
      this.setState("connecting");
      try {
        await this.openGatt();
      } catch (error) {
        this.characteristic = undefined;
        this.setState("disconnected");
        this.onLog(`Переподключение не удалось: ${error instanceof Error ? error.message : String(error)}`);
        this.scheduleReconnect();
      }
    }, delay);
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.emitState();
  }

  private emitState() {
    const profile = detectProfile(this.device?.name ?? "");
    this.onState({
      state: this.state,
      deviceName: this.device?.name ?? "Лампа не выбрана",
      profileLabel: this.forcedKind === "auto" ? profile.label : this.protocol.kind,
      protocolKind: this.protocol.kind,
    });
  }
}
