import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getEmoji } from "../emojis.js";
import { requireAllowedUser } from "../interactions/auth.js";

const luchitoUserId = "715312796773908560";

export const luchitoCommand = {
  data: new SlashCommandBuilder().setName("luchito").setDescription("Menciona a Luchito"),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.reply(`${getEmoji("alerta")} <@${luchitoUserId}> Integrame esta Ing. Torraca`);
    logger.info({ userId: interaction.user.id }, "Luchito command completed");
  }
};
