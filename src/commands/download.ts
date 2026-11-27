import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { handlePathDownload } from "../files/downloads.js";
import { requireAllowedUser } from "../interactions/auth.js";

export const downloadCommand = {
  data: new SlashCommandBuilder()
    .setName("download")
    .setDescription("Descarga un archivo del workspace")
    .addStringOption((option) => option.setName("path").setDescription("Ruta relativa dentro del workspace").setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    const path = interaction.options.getString("path", true);
    await handlePathDownload(interaction, path);
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId, path }, "Workspace download requested");
  }
};
