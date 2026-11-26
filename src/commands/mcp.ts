import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getEmoji } from "../emojis.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient } from "../opencode/runtime.js";
import { infoEmbed } from "../ui/embeds.js";

function statusEmoji(status: string): string {
  if (status === "connected") return getEmoji("correcto");
  if (status === "disabled") return getEmoji("pausa");
  return getEmoji("alerta");
}

export const mcpCommand = {
  data: new SlashCommandBuilder().setName("mcp").setDescription("Muestra servidores MCP"),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.deferReply();
    const servers = await getOpenCodeClient().listMcp();
    const description = servers.length ? servers.map((server) => `${statusEmoji(server.status.status)} **${server.name}** — ${server.status.status}`).join("\n").slice(0, 4096) : "No disponible";
    await interaction.editReply({ embeds: [infoEmbed("MCP", description)] });
    logger.info({ userId: interaction.user.id }, "MCP command completed");
  }
};
