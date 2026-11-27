import { basename, posix } from "node:path";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type ButtonInteraction, type Message, type MessageActionRowComponentBuilder } from "discord.js";
import { config } from "../config.js";
import { createPendingInteraction, findOpenUpload, getChannelState, registerFile, setPendingStatus, type StoredFile } from "../db/repo.js";
import { getEmoji, getEmojiComponent } from "../emojis.js";
import { formatBytes } from "../ui/embeds.js";
import { downloadComponents } from "./downloads.js";
import { writeWorkspaceFile } from "./workspace.js";

export function uploadButton(): ButtonBuilder {
  return new ButtonBuilder().setCustomId("up:ask").setLabel("Adjuntar").setStyle(ButtonStyle.Secondary).setEmoji(getEmojiComponent("carga"));
}

export function taskFileComponents(files: StoredFile[] = []): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  return [...downloadComponents(files), new ActionRowBuilder<ButtonBuilder>().addComponents(uploadButton())];
}

export async function handleUploadRequest(interaction: ButtonInteraction): Promise<void> {
  const sessionId = getChannelState(interaction.channelId)?.sessionId;
  if (!sessionId) {
    await interaction.reply({ content: "⚠️ No hay una sesión activa en este canal.", ephemeral: true });
    return;
  }
  createPendingInteraction({
    kind: "upload",
    sessionId,
    eventId: null,
    channelId: interaction.channelId,
    messageId: interaction.message.id,
    payload: JSON.stringify({ userId: interaction.user.id }),
    expiresAt: Date.now() + 5 * 60 * 1_000
  });
  await interaction.reply({ content: `${getEmoji("carga")} Mandá el archivo en este canal. Tenés 5 minutos.`, ephemeral: true });
}

export async function handleUploadMessage(message: Message): Promise<boolean> {
  if (!message.attachments.size) return false;
  const pending = findOpenUpload(message.channelId, message.author.id);
  if (!pending) return false;
  const saved: string[] = [];
  for (const attachment of message.attachments.values()) {
    if (attachment.size > config.MAX_FILE_MB * 1_024 * 1_024) {
      await message.reply({ content: `⚠️ ${attachment.name} supera el límite de ${config.MAX_FILE_MB} MB.` });
      continue;
    }
    const dest = posix.join(config.UPLOAD_DIR.replaceAll("\\", "/"), `${Date.now()}-${sanitizeName(attachment.name)}`);
    const file = await saveAttachment(attachment.url, dest);
    registerFile({ sessionId: pending.sessionId, path: file.path, mime: attachment.contentType ?? file.mime, size: file.size, direction: "in" });
    saved.push(`${getEmoji("carga")} ${file.path} (${formatBytes(file.size)})`);
  }
  if (!saved.length) return true;
  setPendingStatus(pending.id, "answered");
  await message.reply({ content: saved.join("\n") });
  return true;
}

function sanitizeName(name: string): string {
  const base = basename(name).replace(/[^\w.\-]+/g, "_");
  return base || "archivo";
}

async function saveAttachment(url: string, dest: string): Promise<Awaited<ReturnType<typeof writeWorkspaceFile>>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo descargar el adjunto.");
  return writeWorkspaceFile(dest, Buffer.from(await response.arrayBuffer()));
}
