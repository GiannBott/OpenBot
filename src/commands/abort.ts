import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getChannelState } from "../db/repo.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient, getTaskTracker } from "../opencode/runtime.js";

export const abortCommand = {
  data: new SlashCommandBuilder().setName("abort").setDescription("Interrumpe la tarea activa"),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.deferReply({ ephemeral: true });
    const sessionId = getChannelState(interaction.channelId)?.sessionId;
    if (!sessionId) {
      await interaction.editReply({ content: "No hay una sesión activa en este canal." });
      return;
    }
    const interrupted = await getOpenCodeClient().interruptSession(sessionId);
    if (interrupted) {
      await getTaskTracker().pause(sessionId);
      await interaction.editReply({ content: "⏸️ Tarea abortada." });
    } else {
      await interaction.editReply({ content: "No hay una tarea activa para abortar." });
    }
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId, sessionId, interrupted }, "Abort requested");
  }
};
