import { AttachmentBuilder, type Message } from "discord.js";
import type { Logger } from "pino";
import type { OpenCodeEvent, OpenCodeEvents } from "../opencode/events.js";
import { taskEmbed } from "../ui/embeds.js";

interface TaskInput {
  message: Message;
  sessionId: string;
  prompt: string;
  model?: string | null;
  agent?: string | null;
  variant?: string | null;
}

export class TaskTracker {
  private readonly active = new Map<string, ActiveTask>();

  constructor(private readonly events: OpenCodeEvents, private readonly logger: Logger) {}

  start(input: TaskInput): void {
    this.active.get(input.sessionId)?.stop();
    const task = new ActiveTask(input, this.events, this.logger, () => this.active.delete(input.sessionId));
    this.active.set(input.sessionId, task);
  }

  async pause(sessionId: string): Promise<void> {
    const task = this.active.get(sessionId);
    if (!task) return;
    await task.pause();
    this.active.delete(sessionId);
  }

  async fail(sessionId: string, text: string): Promise<void> {
    const task = this.active.get(sessionId);
    if (!task) return;
    await task.fail(text);
    this.active.delete(sessionId);
  }
}

class ActiveTask {
  private text = "";
  private tokens: unknown;
  private cost: number | undefined;
  private lastEdit = 0;
  private timer: NodeJS.Timeout | undefined;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly input: TaskInput,
    events: OpenCodeEvents,
    private readonly logger: Logger,
    private readonly remove: () => void
  ) {
    this.unsubscribe = events.onSession(input.sessionId, (event) => this.handle(event));
  }

  stop(): void {
    this.unsubscribe();
    if (this.timer) clearTimeout(this.timer);
  }

  private handle(event: OpenCodeEvent): void {
    if (event.type === "session.text.delta" && typeof event.data.delta === "string") {
      this.text += event.data.delta;
      this.schedule();
      return;
    }
    if (event.type === "session.text.ended" && typeof event.data.text === "string") this.text = event.data.text;
    if (event.type === "session.step.ended") {
      this.tokens = event.data.tokens;
      this.cost = typeof event.data.cost === "number" ? event.data.cost : undefined;
    }
    if (event.type === "session.execution.succeeded") void this.finish("correcto");
    if (event.type === "session.execution.failed") void this.finish("alerta");
  }

  private schedule(): void {
    if (this.timer) return;
    const wait = Math.max(0, 1_500 - (Date.now() - this.lastEdit));
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.render("cargando");
    }, wait);
  }

  private async finish(status: "correcto" | "alerta"): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    await this.render(status, true);
    this.stop();
    this.remove();
  }

  async pause(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.text = "Abortado.";
    await this.render("pausa", true);
    this.stop();
  }

  async fail(text: string): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.text = text;
    await this.render("alerta", true);
    this.stop();
  }

  private async render(status: "cargando" | "correcto" | "alerta" | "pausa", final = false): Promise<void> {
    this.lastEdit = Date.now();
    const fullText = this.text || (status === "alerta" ? "La tarea terminó con un error." : undefined);
    const attachment = final && fullText && fullText.length > 4_096
      ? [new AttachmentBuilder(Buffer.from(fullText, "utf8"), { name: "respuesta.md" })]
      : [];
    try {
      await this.input.message.edit({
        embeds: [taskEmbed({ ...this.input, status, text: fullText, tokens: this.tokens, cost: this.cost })],
        files: attachment
      });
    } catch (error) {
      this.logger.error({ error, sessionId: this.input.sessionId }, "Task status message update failed");
    }
  }
}
