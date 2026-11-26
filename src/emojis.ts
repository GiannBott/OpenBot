import type { Logger } from "pino";
import { config } from "./config.js";

export type EmojiName = "correcto" | "alerta" | "cargando" | "pausa" | "descarga" | "carga";

const fallbacks: Record<EmojiName, string> = {
  correcto: "✅", alerta: "⚠️", cargando: "⏳", pausa: "⏸️", descarga: "📥", carga: "📤"
};

const configured: Record<EmojiName, string | undefined> = {
  correcto: config.EMOJI_CORRECTO, alerta: config.EMOJI_ALERTA, cargando: config.EMOJI_CARGANDO,
  pausa: config.EMOJI_PAUSA, descarga: config.EMOJI_DESCARGA, carga: config.EMOJI_CARGA
};

export function loadEmojis(logger: Logger): Record<EmojiName, string> {
  return Object.fromEntries((Object.keys(fallbacks) as EmojiName[]).map((name) => {
    const value = configured[name];
    if (!value) logger.warn({ emoji: name }, "Custom emoji is not configured; using Unicode fallback");
    return [name, value ?? fallbacks[name]];
  })) as Record<EmojiName, string>;
}

export function getEmoji(name: EmojiName): string {
  return configured[name] ?? fallbacks[name];
}
