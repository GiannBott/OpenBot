import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getChannelState } from "../db/repo.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient } from "../opencode/runtime.js";
import { formatTokens, infoEmbed, unavailable } from "../ui/embeds.js";

export const statusCommand = {
  data: new SlashCommandBuilder().setName("status").setDescription("Muestra el estado de la sesión activa"),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.deferReply();
    const state = getChannelState(interaction.channelId);
    const client = getOpenCodeClient();
    const [sessions, mcp] = await Promise.all([client.listSessions(), client.listMcp()]);
    const session = state?.sessionId ? sessions.find((item) => item.id === state.sessionId) : undefined;
    const model = session?.model && typeof session.model === "object" ? JSON.stringify(session.model) : undefined;
    const embed = infoEmbed("Estado de OpenBot")
      .addFields(
        { name: "SESIÓN", value: unavailable(session?.title ?? state?.sessionId), inline: true },
        { name: "MODELO", value: unavailable(model ?? state?.model), inline: true },
        { name: "AGENTE", value: unavailable(session?.agent ?? state?.agent), inline: true },
        { name: "RAZONAMIENTO", value: unavailable(state?.variant), inline: true },
        { name: "USAGE", value: formatTokens(session?.tokens), inline: false },
        { name: "MCP", value: `${mcp.length} servidor(es)`, inline: true }
      );
    await interaction.editReply({ embeds: [embed] });
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId }, "Status command completed");
  }
};
