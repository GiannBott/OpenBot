import type { OpenCodeClient } from "./client.js";

let client: OpenCodeClient | undefined;

export function setOpenCodeClient(next: OpenCodeClient): void {
  client = next;
}

export function getOpenCodeClient(): OpenCodeClient {
  if (!client) throw new Error("OpenCode aún no está listo.");
  return client;
}
