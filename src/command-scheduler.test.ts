import { describe, expect, it } from "vitest";
import { CommandScheduler } from "./command-scheduler";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("CommandScheduler", () => {
  it("keeps reliable commands in order", async () => {
    const sent: number[] = [];
    const scheduler = new CommandScheduler<number>(async (value) => { sent.push(value); });
    await Promise.all([scheduler.enqueue(1), scheduler.enqueue(2), scheduler.enqueue(3)]);
    expect(sent).toEqual([1, 2, 3]);
  });

  it("keeps only the newest pending command for each streaming key", async () => {
    const gate = deferred();
    const sent: string[] = [];
    const scheduler = new CommandScheduler<string>(async (value) => {
      sent.push(value);
      if (value === "busy") await gate.promise;
    });

    const busy = scheduler.enqueue("busy");
    const stale = scheduler.enqueue("old-color", "color");
    const reliable = scheduler.enqueue("power");
    const latest = scheduler.enqueue("new-color", "color");
    const brightness = scheduler.enqueue("brightness", "brightness");
    await expect(stale).rejects.toMatchObject({ name: "AbortError" });
    gate.resolve();
    await Promise.all([busy, reliable, latest, brightness]);
    expect(sent).toEqual(["busy", "power", "new-color", "brightness"]);
  });

  it("rejects queued work when reset", async () => {
    const gate = deferred();
    const scheduler = new CommandScheduler<string>(async (value) => {
      if (value === "busy") await gate.promise;
    });
    const busy = scheduler.enqueue("busy");
    const pending = scheduler.enqueue("pending");
    scheduler.reset();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    gate.resolve();
    await busy;
  });
});
