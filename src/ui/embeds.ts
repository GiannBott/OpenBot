import { EmbedBuilder } from "discord.js";
import { getEmoji } from "../emojis.js";

export function infoEmbed(title: string, description?: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0x5865f2).setTitle(title).setDescription(description ?? null).setTimestamp();
}

export function unavailable(value: string | null | undefined): string {
  return value && value.trim() ? value : "No disponible";
}

export function formatTokens(tokens: unknown): string {
  if (!tokens || typeof tokens !== "object") return "No disponible";
  const usage = tokens as { input?: number; output?: number; reasoning?: number; cache?: { read?: number; write?: number } };
  return `Entrada: ${usage.input ?? 0}\nSalida: ${usage.output ?? 0}\nRazonamiento: ${usage.reasoning ?? 0}\nCaché: ${(usage.cache?.read ?? 0) + (usage.cache?.write ?? 0)}`;
}

export type TaskStatus = "cargando" | "correcto" | "alerta" | "pausa";

const taskStyle: Record<TaskStatus, { emoji: "cargando" | "correcto" | "alerta" | "pausa"; label: string; color: number }> = {
  cargando: { emoji: "cargando", label: "Cargando", color: 0x5865f2 },
  correcto: { emoji: "correcto", label: "Listo", color: 0x57f287 },
  alerta: { emoji: "alerta", label: "Error", color: 0xfee75c },
  pausa: { emoji: "pausa", label: "Pausado", color: 0x99aab5 }
};

export function taskEmbed(input: {
  status: TaskStatus;
  sessionId: string;
  prompt: string;
  text?: string;
  model?: string | null;
  agent?: string | null;
  variant?: string | null;
  tokens?: unknown;
  cost?: number;
  files?: Array<{ path: string; size: number }>;
}): EmbedBuilder {
  const style = taskStyle[input.status];
  const description = input.text ? input.text.slice(0, 4_096) : "El agente está trabajando…";
  const footer = [input.model ?? "Modelo no disponible", input.agent ?? "Agente no disponible", input.variant ?? "Sin razonamiento"].join(" · ");
  const fields = [
    { name: "PROYECTO", value: "OpenBot", inline: true },
    { name: "CHAT", value: `\`${input.sessionId}\``, inline: true },
    { name: "PREGUNTA", value: input.prompt.slice(0, 1_024), inline: false },
    { name: "HORA", value: `<t:${Math.floor(Date.now() / 1_000)}:t>`, inline: true }
  ];
  if (input.status === "correcto") {
    fields.push({ name: "USAGE", value: formatTokens(input.tokens), inline: false });
    fields.push({ name: "COSTO", value: input.cost === undefined ? "No disponible" : `$${input.cost.toFixed(6)}`, inline: true });
    if (input.files?.length) fields.push({ name: "ARCHIVOS", value: input.files.map((file) => `${getEmoji("descarga")} ${file.path} (${formatBytes(file.size)})`).join("\n").slice(0, 1_024), inline: false });
  }
  return new EmbedBuilder()
    .setColor(style.color)
    .setTitle(`${getEmoji(style.emoji)} ${style.label} — OpenBot`)
    .setDescription(description)
    .addFields(fields)
    .setFooter({ text: footer.slice(0, 2_048) })
    .setTimestamp();
}

export function formatBytes(size: number): string {
  if (size < 1_024) return `${size} B`;
  if (size < 1_024 ** 2) return `${(size / 1_024).toFixed(1)} KB`;
  return `${(size / 1_024 ** 2).toFixed(1)} MB`;
}
