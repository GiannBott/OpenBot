import { ZipArchive } from "archiver";
import { createWriteStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, type ButtonInteraction, type ChatInputCommandInteraction, type MessageActionRowComponentBuilder, type StringSelectMenuInteraction } from "discord.js";
import { config } from "../config.js";
import { getStoredFile, type StoredFile } from "../db/repo.js";
import { getEmoji, getEmojiComponent } from "../emojis.js";
import { isDiagramSource, renderDiagram } from "./diagrams.js";
import { workspaceFile } from "./workspace.js";

export function downloadComponents(files: StoredFile[]): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  if (!files.length) return [];
  if (files.length <= 5) {
    return [new ActionRowBuilder<ButtonBuilder>().addComponents(files.map((file) => new ButtonBuilder().setCustomId(`dl:${file.id}`).setLabel(file.path.split("/").at(-1)?.slice(0, 80) ?? "Descargar").setStyle(ButtonStyle.Secondary).setEmoji(getEmojiComponent("descarga"))))];
  }
  return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder().setCustomId("dl:select").setPlaceholder("Elegí un archivo para descargar").addOptions(files.slice(0, 25).map((file) => ({ label: file.path.split("/").at(-1)?.slice(0, 100) ?? file.path, value: file.id, emoji: getEmojiComponent("descarga") }))))];
}

export async function handleDownload(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
  const id = interaction.isStringSelectMenu() ? interaction.values[0] : interaction.customId.slice(3);
  const stored = id ? getStoredFile(id) : undefined;
  if (!stored || stored.direction !== "out") {
    await interaction.reply({ content: "⚠️ Ese archivo ya no está disponible.", ephemeral: true });
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  const file = await workspaceFile(stored.path).catch(() => undefined);
  if (!file) {
    await interaction.editReply({ content: "⚠️ El archivo ya no existe." });
    return;
  }
  await deliverDownload(interaction, file);
}

export async function handlePathDownload(interaction: ChatInputCommandInteraction, path: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  const file = await workspaceFile(path).catch(() => undefined);
  if (!file) {
    await interaction.editReply({ content: "⚠️ No encontré ese archivo dentro del workspace." });
    return;
  }
  await deliverDownload(interaction, file);
}

async function deliverDownload(interaction: ButtonInteraction | StringSelectMenuInteraction | ChatInputCommandInteraction, file: Awaited<ReturnType<typeof workspaceFile>>): Promise<void> {
  const limit = config.MAX_FILE_MB * 1_024 * 1_024;
  const sourceName = file.path.split("/").at(-1) ?? "archivo";
  const cleanup: string[] = [];
  const rendered = isDiagramSource(file.path) ? await renderDiagram(file.absolutePath) : undefined;
  if (rendered) cleanup.push(dirname(rendered.pngPath));
  const entries = [
    ...(rendered ? [{ path: rendered.pngPath, name: rendered.pngName, size: (await stat(rendered.pngPath)).size, image: true }] : []),
    { path: file.absolutePath, name: sourceName, size: file.size, image: Boolean(file.mime?.startsWith("image/")) }
  ];
  const total = entries.reduce((sum, entry) => sum + entry.size, 0);
  const needsZip = total > limit || entries.some((entry) => entry.size > limit);
  try {
    if (needsZip) {
      const zipped = await zipFiles(entries.map((entry) => ({ source: entry.path, name: entry.name })));
      cleanup.push(zipped.path);
      if (zipped.size > limit) {
        await interaction.editReply({ content: `⚠️ ${file.path} supera el límite de Discord incluso comprimido.` });
        return;
      }
      await interaction.editReply({
        content: `${getEmoji("descarga")} ${file.path}`,
        files: [new AttachmentBuilder(zipped.path, { name: `${sourceName}.zip` })]
      });
      return;
    }
    const imageName = entries.find((entry) => entry.image)?.name;
    const note = isDiagramSource(file.path) && !rendered ? "\nNo hay renderer de diagramas disponible; adjunto la fuente." : "";
    await interaction.editReply({
      content: `${getEmoji("descarga")} ${file.path}${note}`,
      files: entries.map((entry) => new AttachmentBuilder(entry.path, { name: entry.name })),
      embeds: imageName ? [new EmbedBuilder().setImage(`attachment://${imageName}`)] : []
    });
  } finally {
    await Promise.all(cleanup.map((path) => rm(path, { recursive: true, force: true })));
  }
}

async function zipFiles(entries: Array<{ source: string; name: string }>): Promise<{ path: string; size: number }> {
  const path = join(tmpdir(), `openbot-${randomUUID()}.zip`);
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(path);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    output.once("close", resolve);
    output.once("error", reject);
    archive.once("error", reject);
    archive.pipe(output);
    for (const entry of entries) archive.file(entry.source, { name: entry.name });
    void archive.finalize();
  });
  return { path, size: (await stat(path)).size };
}
