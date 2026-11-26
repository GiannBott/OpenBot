import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { requireAllowedUser } from "../interactions/auth.js";

export const pingCommand = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Verifica que OpenBot está activo"),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.reply("✅ OpenBot está activo.");
    logger.info({ userId: interaction.user.id }, "Ping completed");
  }
};
