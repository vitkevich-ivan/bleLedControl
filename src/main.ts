import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { BleLampController, type ControllerSnapshot } from "./ble-controller";
import { analogEffects, dmxEffects } from "./effects";
import type { ProtocolKind, RgbOrder } from "./protocol";
import { applyChannelBalance, hexToRgb, srgbToLedRgb, type RgbColor } from "./color";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <header class="topbar">
    <div class="brand">
      <img src="./lamp.svg" alt="" width="46" height="46" />
      <div><strong>Luma BLE</strong><span>лампа без облака</span></div>
    </div>
    <button id="install-help" class="icon-button" aria-label="Как установить">?</button>
  </header>

  <main>
    <section class="hero card">
      <div class="device-state">
        <span id="status-dot" class="status-dot"></span>
        <div><strong id="device-name">Лампа не выбрана</strong><span id="device-meta" role="status" aria-live="polite">Готово к поиску</span></div>
      </div>
      <div class="connection-actions">
        <button id="connect" class="primary">Найти лампу</button>
        <button id="disconnect" class="secondary hidden">Отключить</button>
      </div>
    </section>

    <div id="browser-warning" class="notice hidden">
      <strong>Bluetooth недоступен</strong>
      <span>На iPhone откройте эту страницу в бесплатном браузере Bluefy.</span>
      <a href="https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055" target="_blank" rel="noreferrer">Открыть App Store</a>
    </div>

    <nav class="tabs" aria-label="Разделы">
      <button class="tab active" data-tab="light">Свет</button>
      <button class="tab" data-tab="effects">Эффекты</button>
      <button class="tab" data-tab="music">Музыка</button>
      <button class="tab" data-tab="timer">Таймер</button>
      <button class="tab" data-tab="settings">Ещё</button>
    </nav>

    <div class="tab-panel active" data-panel="light">
      <section class="card power-card">
        <div><span class="eyebrow">Питание</span><strong id="power-label" role="status">Состояние не определено</strong></div>
        <button id="power" class="power-button" data-connected aria-pressed="false"><span></span></button>
      </section>

      <section class="card">
        <div class="section-heading"><div><span class="eyebrow">Цвет</span><h2>Выберите оттенок</h2></div><div class="color-readout"><output id="color-value">#7C5CFF</output><small id="rgb-value">124 · 92 · 255</small></div></div>
        <label class="color-wheel-wrap" aria-label="Открыть выбор цвета">
          <input id="color" class="color-wheel" type="color" value="#7c5cff" data-connected />
          <span id="color-preview"></span>
          <em>Изменить</em>
        </label>
        <div id="presets" class="color-presets" aria-label="Готовые цвета"></div>
      </section>

      <section class="card">
        <label class="range-label" for="brightness"><span>Яркость</span><output id="brightness-value">80%</output></label>
        <input id="brightness" type="range" min="1" max="100" value="80" data-connected />
      </section>
    </div>

    <div class="tab-panel" data-panel="effects">
      <section class="card">
        <div class="section-heading"><div><span class="eyebrow">Анимация</span><h2>Встроенные эффекты</h2></div></div>
        <label class="field"><span>Режим</span><select id="effect" data-connected></select></label>
        <button id="apply-effect" class="primary wide" data-connected>Запустить эффект</button>
        <label class="range-label" for="speed"><span>Скорость</span><output id="speed-value">50%</output></label>
        <input id="speed" type="range" min="0" max="100" value="50" data-connected />
        <label id="direction-row" class="switch-row hidden"><span><strong>Обратное направление</strong><small>Для адресной RGBIC-ленты</small></span><input id="direction" type="checkbox" data-connected /></label>
      </section>
    </div>

    <div class="tab-panel" data-panel="music">
      <section class="card">
        <div class="section-heading"><div><span class="eyebrow">Светомузыка</span><h2>Микрофон iPhone</h2></div><span id="level-meter"><i></i></span></div>
        <p class="muted">Громкость с микрофона меняет яркость выбранного цвета. Страница должна оставаться открытой.</p>
        <label class="range-label" for="sensitivity"><span>Чувствительность</span><output id="sensitivity-value">1.5×</output></label>
        <input id="sensitivity" type="range" min="5" max="40" value="15" data-connected />
        <button id="music-toggle" class="primary wide" data-connected>Запустить светомузыку</button>
      </section>
      <section class="card">
        <div class="section-heading"><div><span class="eyebrow">Контроллер</span><h2>Встроенный микрофон</h2></div></div>
        <p class="muted">Если в блоке управления есть микрофон, реакция на звук продолжится без открытой страницы.</p>
        <div class="button-grid">
          <button class="secondary mic-mode" data-mode="1" data-connected>Ритм</button>
          <button class="secondary mic-mode" data-mode="2" data-connected>Импульс</button>
          <button class="secondary mic-mode" data-mode="3" data-connected>Спектр</button>
        </div>
      </section>
    </div>

    <div class="tab-panel" data-panel="timer">
      <section class="card">
        <div class="section-heading"><div><span class="eyebrow">Автовыключение</span><h2>Таймер сна</h2></div><strong id="timer-countdown">—</strong></div>
        <p class="muted">Таймер работает, пока Luma BLE открыта. Экран можно заблокировать, но iOS иногда приостанавливает фоновые страницы.</p>
        <label class="field"><span>Через сколько минут</span><input id="timer-minutes" type="number" min="1" max="1440" value="60" inputmode="numeric" /></label>
        <div class="button-grid">
          <button id="timer-start" class="primary" data-connected>Запустить</button>
          <button id="timer-cancel" class="secondary" disabled>Отменить</button>
        </div>
      </section>
    </div>

    <div class="tab-panel" data-panel="settings">
      <section class="card settings-card">
        <div class="section-heading"><div><span class="eyebrow">Совместимость</span><h2>Контроллер</h2></div></div>
        <label class="field"><span>Протокол</span><select id="protocol">
          <option value="auto">Определять автоматически</option>
          <option value="ble">LEDBLE / обычная RGB</option>
          <option value="dmx">LEDDMX / адресная RGBIC</option>
          <option value="dmx-shifted">LEDDMX 02/04 / новый формат</option>
        </select></label>
        <label class="field"><span>Порядок цветов</span><select id="rgb-order">
          <option>RGB</option><option selected>RBG</option><option>GRB</option><option>GBR</option><option>BRG</option><option>BGR</option>
        </select></label>
        <label class="switch-row correction-row"><span><strong>Коррекция смешанных цветов</strong><small>Преобразует экранный sRGB в яркость светодиодов</small></span><input id="color-correction" type="checkbox" checked /></label>
        <div class="channel-balance">
          <span class="eyebrow">Баланс каналов</span>
          <label class="compact-range red-channel"><span>Красный <output id="red-gain-value">100%</output></span><input id="red-gain" type="range" min="25" max="150" value="100" /></label>
          <label class="compact-range green-channel"><span>Зелёный <output id="green-gain-value">100%</output></span><input id="green-gain" type="range" min="25" max="150" value="100" /></label>
          <label class="compact-range blue-channel"><span>Синий <output id="blue-gain-value">55%</output></span><input id="blue-gain" type="range" min="25" max="150" value="55" /></label>
          <button id="reset-balance" class="text-button">Сбросить баланс</button>
        </div>
        <div class="calibration">
          <span class="eyebrow">Проверка каналов</span>
          <p class="muted">Каждая кнопка должна зажигать только указанный цвет. Если цвета не совпадают, смените порядок выше.</p>
          <div class="button-grid calibration-buttons">
            <button class="channel-test red" data-color="#ff0000" data-connected>Красный</button>
            <button class="channel-test green" data-color="#00ff00" data-connected>Зелёный</button>
            <button class="channel-test blue" data-color="#0000ff" data-connected>Синий</button>
          </div>
        </div>
        <div id="pixel-settings" class="hidden">
          <label class="field"><span>Количество пикселей</span><input id="pixels" type="number" min="1" max="1024" value="100" inputmode="numeric" /></label>
          <button id="apply-strip" class="secondary wide" data-connected>Передать настройки ленте</button>
        </div>
      </section>
      <details class="card diagnostics">
        <summary>Диагностика</summary>
        <div id="log" role="log" aria-live="polite"></div>
        <button id="clear-log" class="text-button">Очистить журнал</button>
      </details>
      <section class="card about">
        <strong>Luma BLE <span>v0.2.4</span></strong>
        <p>Работает локально. Команды и звук не отправляются на сервер.</p>
      </section>
    </div>
  </main>

  <dialog id="help-dialog">
    <button class="dialog-close" aria-label="Закрыть">×</button>
    <h2>Запуск на iPhone</h2>
    <ol><li>Установите бесплатный Bluefy.</li><li>Откройте адрес Luma BLE внутри Bluefy.</li><li>Разрешите Bluetooth и выберите устройство с именем LED…</li></ol>
    <p>Подписка, аккаунт и платная учётная запись разработчика не нужны.</p>
    <button class="primary dialog-ok">Понятно</button>
  </dialog>
  <div id="toast" role="status"></div>
`;

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const all = <T extends Element>(selector: string) => [...document.querySelectorAll<T>(selector)];
const logElement = $("#log");
const connectedControls = all<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>("[data-connected]");
let latestSnapshot: ControllerSnapshot | undefined;
let powerOn: boolean | null = null;
let hasControlledLamp = false;
let activeMode: "color" | "effect" | "hardware-mic" = "color";
let activeEffect = 135;
let activeMicMode = 1;
let reverseDirection = false;
let musicRunning = false;
let musicStream: MediaStream | undefined;
let audioContext: AudioContext | undefined;
let musicFrame = 0;
let timerInterval = 0;
let timerDeadline = 0;

interface SavedSettings {
  version?: number;
  color: string;
  brightness: string;
  speed: string;
  sensitivity: string;
  protocol: ProtocolKind | "auto";
  rgbOrder: RgbOrder;
  pixels: string;
  colorCorrection?: boolean;
  redGain?: string;
  greenGain?: string;
  blueGain?: string;
}

function addLog(message: string) {
  const line = document.createElement("div");
  line.textContent = `${new Date().toLocaleTimeString("ru-RU")}  ${message}`;
  logElement.prepend(line);
  while (logElement.childElementCount > 80) logElement.lastElementChild?.remove();
}

function updateConnection(snapshot: ControllerSnapshot) {
  latestSnapshot = snapshot;
  const connected = snapshot.state === "connected";
  const busy = snapshot.state === "connecting" || snapshot.state === "syncing";
  $("#device-name").textContent = snapshot.deviceName;
  $("#device-meta").textContent = connected ? `${snapshot.profileLabel} · синхронизировано` : stateText(snapshot.state);
  $("#status-dot").className = `status-dot ${connected ? "online" : busy ? "busy" : ""}`;
  $("#connect").textContent = busy ? "Подключение…" : snapshot.state === "disconnected" || snapshot.state === "paused" ? "Подключить снова" : "Найти лампу";
  ($("#connect") as HTMLButtonElement).disabled = busy;
  $("#disconnect").classList.toggle("hidden", snapshot.state === "idle" || snapshot.state === "unsupported" || snapshot.state === "paused");
  connectedControls.forEach((control) => { control.disabled = !connected; });
  const addressable = snapshot.protocolKind !== "ble";
  $("#direction-row").classList.toggle("hidden", !addressable);
  $("#pixel-settings").classList.toggle("hidden", !addressable);
  populateEffects(addressable);
}

function stateText(state: ControllerSnapshot["state"]) {
  return ({ unsupported: "Web Bluetooth недоступен", idle: "Готово к поиску", connecting: "Подключение…", syncing: "Синхронизируем состояние…", connected: "Подключено", disconnected: "Соединение потеряно · повторяем автоматически", paused: "Отключено пользователем" })[state];
}

async function restoreLampState() {
  if (!hasControlledLamp || powerOn === null) return;
  if (!powerOn) {
    await controller.power(false);
    return;
  }
  await controller.power(true);
  await controller.brightness(Number($<HTMLInputElement>("#brightness").value));
  if (activeMode === "effect") {
    await controller.effect(activeEffect);
    await controller.speed(Number($<HTMLInputElement>("#speed").value));
    if (controller.addressable) await controller.direction(reverseDirection);
  } else if (activeMode === "hardware-mic") {
    await controller.hardwareMic(activeMicMode);
  } else {
    await controller.color(...currentOutputColor());
  }
  addLog("Состояние лампы восстановлено");
}

const controller = new BleLampController(updateConnection, addLog, restoreLampState);

function readSettings(): SavedSettings | undefined {
  try {
    return JSON.parse(localStorage.getItem("luma-settings") ?? "null") as SavedSettings | undefined;
  } catch {
    return undefined;
  }
}

function saveSettings() {
  const settings: SavedSettings = {
    version: 6,
    color: $<HTMLInputElement>("#color").value,
    brightness: $<HTMLInputElement>("#brightness").value,
    speed: $<HTMLInputElement>("#speed").value,
    sensitivity: $<HTMLInputElement>("#sensitivity").value,
    protocol: $<HTMLSelectElement>("#protocol").value as SavedSettings["protocol"],
    rgbOrder: $<HTMLSelectElement>("#rgb-order").value as RgbOrder,
    pixels: $<HTMLInputElement>("#pixels").value,
    colorCorrection: $<HTMLInputElement>("#color-correction").checked,
    redGain: $<HTMLInputElement>("#red-gain").value,
    greenGain: $<HTMLInputElement>("#green-gain").value,
    blueGain: $<HTMLInputElement>("#blue-gain").value,
  };
  try {
    localStorage.setItem("luma-settings", JSON.stringify(settings));
  } catch {
    // Private browsing may make storage unavailable; controls still work.
  }
}

function restoreSettings() {
  const saved = readSettings();
  if (!saved) {
    controller.setRgbOrder("RBG");
    return;
  }
  $<HTMLInputElement>("#color").value = saved.color || "#7c5cff";
  $<HTMLInputElement>("#brightness").value = saved.brightness || "80";
  $<HTMLInputElement>("#speed").value = saved.speed || "50";
  $<HTMLInputElement>("#sensitivity").value = saved.sensitivity || "15";
  $<HTMLSelectElement>("#protocol").value = saved.protocol || "auto";
  const rgbOrder = saved.version === 6 ? (saved.rgbOrder || "RBG") : "RBG";
  $<HTMLSelectElement>("#rgb-order").value = rgbOrder;
  $<HTMLInputElement>("#pixels").value = saved.pixels || "100";
  $<HTMLInputElement>("#color-correction").checked = saved.version === 6 ? saved.colorCorrection !== false : true;
  $<HTMLInputElement>("#red-gain").value = saved.version === 6 ? (saved.redGain || "100") : "100";
  $<HTMLInputElement>("#green-gain").value = saved.version === 6 ? (saved.greenGain || "100") : "100";
  $<HTMLInputElement>("#blue-gain").value = saved.version === 6 ? (saved.blueGain || "55") : "55";
  updateBalanceReadouts();
  $("#color-value").textContent = $<HTMLInputElement>("#color").value.toUpperCase();
  updateRgbReadout();
  $("#brightness-value").textContent = `${$<HTMLInputElement>("#brightness").value}%`;
  $("#speed-value").textContent = `${$<HTMLInputElement>("#speed").value}%`;
  $("#sensitivity-value").textContent = `${(Number($<HTMLInputElement>("#sensitivity").value) / 10).toFixed(1)}×`;
  controller.setForcedProtocol(saved.protocol || "auto");
  controller.setRgbOrder(rgbOrder);
  saveSettings();
}

function showToast(message: string, error = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `show${error ? " error" : ""}`;
  window.setTimeout(() => { toast.className = ""; }, 2600);
}

async function run(action: () => Promise<unknown>, success?: string) {
  try {
    await action();
    if (success) showToast(success);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    const message = error instanceof DOMException && error.name === "NotFoundError"
      ? "Выбор устройства отменён"
      : error instanceof Error ? error.message : String(error);
    showToast(message, true);
  }
}

function currentColor() { return hexToRgb(($<HTMLInputElement>("#color")).value); }

function outputColor(color: RgbColor): RgbColor {
  const corrected = $<HTMLInputElement>("#color-correction").checked ? srgbToLedRgb(color) : color;
  return applyChannelBalance(corrected, {
    red: Number($<HTMLInputElement>("#red-gain").value),
    green: Number($<HTMLInputElement>("#green-gain").value),
    blue: Number($<HTMLInputElement>("#blue-gain").value),
  });
}

function currentOutputColor() { return outputColor(currentColor()); }

function updateBalanceReadouts() {
  for (const channel of ["red", "green", "blue"] as const) {
    $(`#${channel}-gain-value`).textContent = `${$<HTMLInputElement>(`#${channel}-gain`).value}%`;
  }
}

function updateRgbReadout() {
  const [red, green, blue] = currentColor();
  $("#rgb-value").textContent = `${red} · ${green} · ${blue}`;
  document.documentElement.style.setProperty("--lamp-color", $<HTMLInputElement>("#color").value);
}

function updatePowerUi() {
  const isOn = powerOn === true;
  $("#power").classList.toggle("on", isOn);
  $("#power").setAttribute("aria-pressed", String(isOn));
  $("#power-label").textContent = powerOn === null ? "Состояние не определено" : isOn ? "Включено" : "Выключено";
}

function populateEffects(addressable: boolean) {
  const select = $<HTMLSelectElement>("#effect");
  const marker = addressable ? "dmx" : "ble";
  if (select.dataset.kind === marker) return;
  select.dataset.kind = marker;
  select.replaceChildren(...(addressable ? dmxEffects : analogEffects).map(({ id, name }) => {
    const option = document.createElement("option");
    option.value = String(id);
    option.textContent = `${name} · ${id}`;
    return option;
  }));
}

function throttledInput(callback: () => Promise<unknown>, delay = 75) {
  let timeout = 0;
  return () => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => void run(callback), delay);
  };
}

const presetColors = ["#ff3b30", "#ff9500", "#ffd60a", "#34c759", "#00c7be", "#0a84ff", "#5856d6", "#af52de", "#ff2d55", "#ffffff"];
const presetContainer = $("#presets");
presetColors.forEach((color) => {
  const button = document.createElement("button");
  button.style.setProperty("--preset", color);
  button.ariaLabel = `Цвет ${color}`;
  button.addEventListener("click", () => {
    const input = $<HTMLInputElement>("#color");
    input.value = color;
    input.dispatchEvent(new Event("input"));
  });
  presetContainer.append(button);
});

all<HTMLButtonElement>(".tab").forEach((tab) => tab.addEventListener("click", () => {
  all(".tab").forEach((item) => item.classList.toggle("active", item === tab));
  all<HTMLElement>(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab.dataset.tab));
}));

$("#connect").addEventListener("click", () => void run(() => latestSnapshot?.state === "disconnected" || latestSnapshot?.state === "paused" ? controller.reconnect() : controller.connect(), "Лампа подключена"));
$("#disconnect").addEventListener("click", () => controller.disconnect());

$("#power").addEventListener("click", () => void run(async () => {
  const nextPower = powerOn !== true;
  await controller.power(nextPower);
  powerOn = nextPower;
  hasControlledLamp = true;
  updatePowerUi();
}));

const colorInput = $<HTMLInputElement>("#color");
colorInput.addEventListener("input", throttledInput(async () => {
  const hex = colorInput.value.toUpperCase();
  $("#color-value").textContent = hex;
  $("#color-preview").setAttribute("style", `--selected-color:${hex}`);
  updateRgbReadout();
  activeMode = "color";
  hasControlledLamp = true;
  await controller.color(...outputColor(hexToRgb(hex)));
  powerOn = true;
  updatePowerUi();
  saveSettings();
}));

function bindRange(selector: string, output: string, suffix: string, callback: (value: number) => Promise<unknown>) {
  const input = $<HTMLInputElement>(selector);
  const send = throttledInput(() => callback(Number(input.value)));
  input.addEventListener("input", () => {
    $(output).textContent = `${input.value}${suffix}`;
    saveSettings();
    send();
  });
}

bindRange("#brightness", "#brightness-value", "%", async (value) => {
  hasControlledLamp = true;
  await controller.brightness(value);
});
bindRange("#speed", "#speed-value", "%", async (value) => {
  hasControlledLamp = true;
  await controller.speed(value);
});

$("#apply-effect").addEventListener("click", () => void run(async () => {
  activeEffect = Number($<HTMLSelectElement>("#effect").value);
  activeMode = "effect";
  hasControlledLamp = true;
  await controller.effect(activeEffect);
  powerOn = true;
  updatePowerUi();
}, "Эффект запущен"));
$("#direction").addEventListener("change", () => void run(async () => {
  reverseDirection = $<HTMLInputElement>("#direction").checked;
  hasControlledLamp = true;
  await controller.direction(reverseDirection);
}));

const sensitivity = $<HTMLInputElement>("#sensitivity");
sensitivity.addEventListener("input", () => {
  $("#sensitivity-value").textContent = `${(Number(sensitivity.value) / 10).toFixed(1)}×`;
  saveSettings();
});
$("#music-toggle").addEventListener("click", () => void (musicRunning ? stopMusic() : startMusic()));

async function startMusic() {
  try {
    musicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(musicStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let lastSent = 0;
    musicRunning = true;
    activeMode = "color";
    hasControlledLamp = true;
    powerOn = true;
    updatePowerUi();
    $("#music-toggle").textContent = "Остановить светомузыку";
    const tick = (time: number) => {
      if (!musicRunning) return;
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, item) => sum + item, 0) / data.length;
      const level = Math.min(1, (average / 110) * (Number(sensitivity.value) / 10));
      $("#level-meter i").setAttribute("style", `transform:scaleX(${Math.max(0.02, level)})`);
      if (time - lastSent > 110) {
        const [red, green, blue] = currentColor();
        void run(() => controller.color(...outputColor([red * level, green * level, blue * level])));
        lastSent = time;
      }
      musicFrame = requestAnimationFrame(tick);
    };
    musicFrame = requestAnimationFrame(tick);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Нет доступа к микрофону", true);
  }
}

function stopMusic() {
  musicRunning = false;
  cancelAnimationFrame(musicFrame);
  musicStream?.getTracks().forEach((track) => track.stop());
  void audioContext?.close();
  musicStream = undefined;
  audioContext = undefined;
  $("#music-toggle").textContent = "Запустить светомузыку";
  $("#level-meter i").removeAttribute("style");
}

all<HTMLButtonElement>(".mic-mode").forEach((button) => button.addEventListener("click", () => void run(async () => {
  activeMicMode = Number(button.dataset.mode);
  activeMode = "hardware-mic";
  hasControlledLamp = true;
  await controller.hardwareMic(activeMicMode);
  powerOn = true;
  updatePowerUi();
}, "Режим микрофона включён")));

$("#timer-start").addEventListener("click", () => {
  const minutes = Math.max(1, Math.min(1440, Number($<HTMLInputElement>("#timer-minutes").value) || 1));
  timerDeadline = Date.now() + minutes * 60_000;
  window.clearInterval(timerInterval);
  timerInterval = window.setInterval(updateTimer, 1000);
  ($("#timer-cancel") as HTMLButtonElement).disabled = false;
  updateTimer();
  showToast(`Выключение через ${minutes} мин.`);
});

$("#timer-cancel").addEventListener("click", cancelTimer);

function updateTimer() {
  const left = timerDeadline - Date.now();
  if (left <= 0) {
    cancelTimer();
    void run(async () => {
      await controller.power(false);
      powerOn = false;
      hasControlledLamp = true;
      updatePowerUi();
    }, "Лампа выключена по таймеру");
    return;
  }
  const totalSeconds = Math.ceil(left / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  $("#timer-countdown").textContent = [hours, minutes, seconds].map((item) => String(item).padStart(2, "0")).join(":");
}

function cancelTimer() {
  window.clearInterval(timerInterval);
  timerDeadline = 0;
  $("#timer-countdown").textContent = "—";
  ($("#timer-cancel") as HTMLButtonElement).disabled = true;
}

$<HTMLSelectElement>("#protocol").addEventListener("change", (event) => {
  controller.setForcedProtocol((event.target as HTMLSelectElement).value as ProtocolKind | "auto");
  saveSettings();
  if (controller.connected) void run(restoreLampState, "Протокол применён");
});
$<HTMLSelectElement>("#rgb-order").addEventListener("change", (event) => {
  controller.setRgbOrder((event.target as HTMLSelectElement).value as RgbOrder);
  saveSettings();
  if (controller.connected) void run(async () => {
    activeMode = "color";
    hasControlledLamp = true;
    await controller.color(...currentOutputColor());
    powerOn = true;
    updatePowerUi();
  }, "Порядок каналов применён");
});
$<HTMLInputElement>("#pixels").addEventListener("change", saveSettings);
$<HTMLInputElement>("#color-correction").addEventListener("change", () => {
  saveSettings();
  if (controller.connected) void run(async () => {
    activeMode = "color";
    hasControlledLamp = true;
    await controller.color(...currentOutputColor());
    powerOn = true;
    updatePowerUi();
  }, "Цветокоррекция применена");
});

const sendBalancedColor = throttledInput(async () => {
  activeMode = "color";
  hasControlledLamp = true;
  await controller.color(...currentOutputColor());
  powerOn = true;
  updatePowerUi();
});

for (const channel of ["red", "green", "blue"] as const) {
  $<HTMLInputElement>(`#${channel}-gain`).addEventListener("input", () => {
    updateBalanceReadouts();
    saveSettings();
    if (controller.connected) sendBalancedColor();
  });
}

$("#reset-balance").addEventListener("click", () => {
  $<HTMLInputElement>("#red-gain").value = "100";
  $<HTMLInputElement>("#green-gain").value = "100";
  $<HTMLInputElement>("#blue-gain").value = "55";
  updateBalanceReadouts();
  saveSettings();
  if (controller.connected) sendBalancedColor();
});
$("#apply-strip").addEventListener("click", () => void run(() => {
  const pixels = Number($<HTMLInputElement>("#pixels").value);
  const order = $<HTMLSelectElement>("#rgb-order").selectedIndex + 1;
  return controller.stripConfig(pixels, order);
}, "Настройки отправлены"));

all<HTMLButtonElement>(".channel-test").forEach((button) => button.addEventListener("click", () => void run(async () => {
  const color = button.dataset.color ?? "#ffffff";
  $<HTMLInputElement>("#color").value = color;
  $("#color-value").textContent = color.toUpperCase();
  $("#color-preview").setAttribute("style", `--selected-color:${color}`);
  updateRgbReadout();
  activeMode = "color";
  hasControlledLamp = true;
  await controller.color(...outputColor(hexToRgb(color)));
  powerOn = true;
  updatePowerUi();
  saveSettings();
}, `${button.textContent} канал отправлен`)));

$("#clear-log").addEventListener("click", () => logElement.replaceChildren());

const dialog = $<HTMLDialogElement>("#help-dialog");
$("#install-help").addEventListener("click", () => dialog.showModal());
all(".dialog-close, .dialog-ok").forEach((button) => button.addEventListener("click", () => dialog.close()));
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

$("#browser-warning").classList.toggle("hidden", Boolean(navigator.bluetooth));
restoreSettings();
$("#color-preview").setAttribute("style", `--selected-color:${$<HTMLInputElement>("#color").value}`);
updateRgbReadout();
updateBalanceReadouts();
updatePowerUi();

registerSW({
  onNeedRefresh() { showToast("Доступна новая версия — обновите страницу"); },
  onOfflineReady() { addLog("Приложение готово к работе офлайн"); },
});
