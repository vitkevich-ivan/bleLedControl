export type CommandKey = "color" | "brightness" | "speed";

interface PendingCommand<T> {
  payload: T;
  key?: CommandKey;
  resolve: () => void;
  reject: (error: unknown) => void;
}

export class CommandScheduler<T> {
  private queue: PendingCommand<T>[] = [];
  private draining = false;

  constructor(private readonly execute: (payload: T) => Promise<void>) {}

  enqueue(payload: T, key?: CommandKey): Promise<void> {
    return new Promise((resolve, reject) => {
      if (key) {
        const retained: PendingCommand<T>[] = [];
        for (const command of this.queue) {
          if (command.key === key) {
            command.reject(new DOMException("Команда заменена более новой", "AbortError"));
          } else {
            retained.push(command);
          }
        }
        this.queue = retained;
      }
      this.queue.push({ payload, key, resolve, reject });
      void this.drain();
    });
  }

  reset(reason = new DOMException("Очередь команд сброшена", "AbortError")) {
    const pending = this.queue.splice(0);
    pending.forEach(({ reject }) => reject(reason));
  }

  get pendingCount() {
    return this.queue.length + (this.draining ? 1 : 0);
  }

  private async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length) {
        const command = this.queue.shift()!;
        try {
          await this.execute(command.payload);
          command.resolve();
        } catch (error) {
          command.reject(error);
        }
      }
    } finally {
      this.draining = false;
      if (this.queue.length) void this.drain();
    }
  }
}
