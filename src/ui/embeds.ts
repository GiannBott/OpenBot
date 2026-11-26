import { EmbedBuilder } from "discord.js";

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
