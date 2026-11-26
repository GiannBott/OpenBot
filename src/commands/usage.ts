import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getChannelState } from "../db/repo.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient } from "../opencode/runtime.js";
import { formatTokens, infoEmbed } from "../ui/embeds.js";

export const usageCommand = {
  data: new SlashCommandBuilder().setName("usage").setDescription("Muestra tokens y costo"),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;

    await interaction.deferReply();
    const client = getOpenCodeClient();
    const sessions = await client.listSessions();
    const state = getChannelState(interaction.channelId);
    const session = state?.sessionId ? sessions.find((item) => item.id === state.sessionId) : undefined;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const today = await client.getSessionStats(
      startOfToday.getTime(),
      startOfTomorrow.getTime(),
      "America/Argentina/Buenos_Aires"
    );

    const embed = infoEmbed("Usage").addFields(
      {
        name: "SESION",
        value: session ? `${formatTokens(session.tokens)}\nCosto: $${session.cost.toFixed(4)}` : "No disponible",
        inline: false
      },
      {
        name: "HOY",
        value: `${formatTokens(today.tokens)}\nCosto: $${today.cost.toFixed(4)} | Sesiones: ${today.sessions}`,
        inline: false
      }
    );
    await interaction.editReply({ embeds: [embed] });
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId }, "Usage command completed");
  }
};
