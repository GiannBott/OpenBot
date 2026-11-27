import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getChannelState, saveChannelState } from "../db/repo.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient } from "../opencode/runtime.js";
import { infoEmbed } from "../ui/embeds.js";
import { listAgents, respondAutocomplete } from "./control.js";

export const agentCommand = {
  data: new SlashCommandBuilder()
    .setName("agent")
    .setDescription("Muestra o cambia el agente")
    .addStringOption((option) => option.setName("agente").setDescription("Agente a usar").setAutocomplete(true)),
  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const agents = await listAgents();
    await respondAutocomplete(interaction, agents.map((agent) => ({ name: `${agent.name} (${agent.id})`.slice(0, 100), value: agent.id })));
  },
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.deferReply();
    const selected = interaction.options.getString("agente");
    const state = getChannelState(interaction.channelId);
    if (!selected) {
      await interaction.editReply({ embeds: [infoEmbed("Agente", state?.agent ?? "No disponible")] });
      return;
    }
    const agent = (await listAgents()).find((item) => item.id === selected);
    if (!agent) {
      await interaction.editReply({ content: "Ese agente ya no está disponible." });
      return;
    }
    if (state?.sessionId) await getOpenCodeClient().setSessionAgent(state.sessionId, agent.id);
    saveChannelState({ channelId: interaction.channelId, sessionId: state?.sessionId ?? null, model: state?.model ?? null, agent: agent.id, variant: state?.variant ?? null });
    await interaction.editReply({ embeds: [infoEmbed("Agente actualizado", `${agent.name}\n\`${agent.id}\``)] });
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId, sessionId: state?.sessionId, agent: agent.id }, "Agent selected");
  }
};
