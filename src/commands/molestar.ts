import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getEmoji } from "../emojis.js";
import { requireAllowedUser } from "../interactions/auth.js";

export const molestarCommand = {
  data: new SlashCommandBuilder()
    .setName("molestar")
    .setDescription("Menciona a alguien con un mensaje")
    .addUserOption((option) => option.setName("usuario").setDescription("A quién mencionar").setRequired(true))
    .addStringOption((option) => option.setName("mensaje").setDescription("El mensaje para enviar").setRequired(true).setMaxLength(1_500)),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    const user = interaction.options.getUser("usuario", true);
    const message = interaction.options.getString("mensaje", true);
    await interaction.reply(`${getEmoji("alerta")} <@${user.id}> ${message}`);
    logger.info({ userId: interaction.user.id, targetUserId: user.id }, "Molestar command completed");
  }
};
