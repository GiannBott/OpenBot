import type { Logger } from "pino";
import type { OpenCodeClient } from "./client.js";

export interface OpenCodeEvent {
  id?: string;
  type: string;
  data: Record<string, unknown>;
}

type SessionHandler = (event: OpenCodeEvent) => void | Promise<void>;

const knownTypes = new Set([
  "server.connected", "session.created", "session.inbox.enqueued", "session.inbox.delivered",
  "session.execution.started", "session.execution.succeeded", "session.execution.failed", "session.execution.interrupted",
  "session.step.started", "session.step.ended", "session.text.started", "session.text.delta", "session.text.ended",
  "session.reasoning.started", "session.reasoning.delta", "session.reasoning.ended", "session.usage.updated"
]);

export class OpenCodeEvents {
  private readonly handlers = new Map<string, Set<SessionHandler>>();
  private readonly unknownTypes = new Set<string>();
  private controller: AbortController | undefined;
  private stopped = true;

  constructor(private readonly client: OpenCodeClient, private readonly logger: Logger) {}

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    void this.run();
  }

  stop(): void {
    this.stopped = true;
    this.controller?.abort();
  }

  onSession(sessionId: string, handler: SessionHandler): () => void {
    const handlers = this.handlers.get(sessionId) ?? new Set<SessionHandler>();
    handlers.add(handler);
    this.handlers.set(sessionId, handlers);
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) this.handlers.delete(sessionId);
    };
  }

  private async run(): Promise<void> {
    const delays = [1_000, 2_000, 5_000, 10_000];
    let attempt = 0;
    while (!this.stopped) {
      this.controller = new AbortController();
      try {
        await this.consume(await this.client.openEventStream(this.controller.signal));
        attempt = 0;
      } catch (error) {
        if (this.stopped) break;
        const delay = delays[Math.min(attempt, delays.length - 1)];
        attempt += 1;
        this.logger.warn({ error, delay }, "OpenCode event stream disconnected; reconnecting");
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async consume(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (!this.stopped) {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";
        for (const message of messages) {
          const line = message.split("\n").find((item) => item.startsWith("data: "));
          if (!line) continue;
          this.dispatch(JSON.parse(line.slice(6)) as OpenCodeEvent);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private dispatch(event: OpenCodeEvent): void {
    if (!knownTypes.has(event.type) && !this.unknownTypes.has(event.type)) {
      this.unknownTypes.add(event.type);
      this.logger.debug({ type: event.type }, "Unknown OpenCode event type");
    }
    const sessionId = typeof event.data.sessionID === "string" ? event.data.sessionID : undefined;
    const targets = sessionId ? this.handlers.get(sessionId) : event.type === "file.edited" || event.type === "filesystem.changed"
      ? [...this.handlers.values()].flatMap((handlers) => [...handlers])
      : undefined;
    if (!targets) return;
    for (const handler of targets) {
      void Promise.resolve(handler(event)).catch((error) => this.logger.error({ error, sessionId, type: event.type }, "OpenCode event handler failed"));
    }
  }
}
