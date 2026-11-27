import type { OpenCodeAgent, OpenCodeClient, OpenCodeModel } from "./client.js";
import type { OpenCodeEvents } from "./events.js";
import type { TaskTracker } from "../tasks/tracker.js";

export type { OpenCodeAgent, OpenCodeModel };

let client: OpenCodeClient | undefined;
let events: OpenCodeEvents | undefined;
let taskTracker: TaskTracker | undefined;

export function setOpenCodeClient(next: OpenCodeClient): void {
  client = next;
}

export function getOpenCodeClient(): OpenCodeClient {
  if (!client) throw new Error("OpenCode aún no está listo.");
  return client;
}

export function setOpenCodeEvents(next: OpenCodeEvents): void {
  events = next;
}

export function getOpenCodeEvents(): OpenCodeEvents {
  if (!events) throw new Error("Los eventos de OpenCode aún no están listos.");
  return events;
}

export function setTaskTracker(next: TaskTracker): void {
  taskTracker = next;
}

export function getTaskTracker(): TaskTracker {
  if (!taskTracker) throw new Error("El seguimiento de tareas aún no está listo.");
  return taskTracker;
}
