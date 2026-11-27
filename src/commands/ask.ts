import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getChannelState, saveChannelState } from "../db/repo.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient, getTaskTracker } from "../opencode/runtime.js";
import { taskEmbed } from "../ui/embeds.js";

export const askCommand = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Envía un prompt a la sesión activa")
    .addStringOption((option) => option.setName("prompt").setDescription("Qué querés pedirle al agente").setRequired(true).setMaxLength(4_000)),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.deferReply();
    const prompt = interaction.options.getString("prompt", true);
    const state = getChannelState(interaction.channelId);
    const client = getOpenCodeClient();
    const session = state?.sessionId
      ? undefined
      : await client.createSession();
    const sessionId = state?.sessionId ?? session?.id;
    if (!sessionId) throw new Error("No se pudo crear una sesión para el prompt.");
    if (!state?.sessionId) {
      saveChannelState({
        channelId: interaction.channelId,
        sessionId,
        model: state?.model ?? null,
        agent: state?.agent ?? null,
        variant: state?.variant ?? null
      });
      if (state?.model) {
        const [providerID, ...modelId] = state.model.split("/");
        if (providerID && modelId.length) await client.setSessionModel(sessionId, { providerID, id: modelId.join("/"), variant: state.variant ?? undefined });
      }
      if (state?.agent) await client.setSessionAgent(sessionId, state.agent);
    }
    await interaction.editReply({ embeds: [taskEmbed({ status: "cargando", sessionId, prompt, model: state?.model, agent: state?.agent, variant: state?.variant })] });
    const message = await interaction.fetchReply();
    const tracker = getTaskTracker();
    tracker.start({ message, sessionId, prompt, model: state?.model, agent: state?.agent, variant: state?.variant });
    try {
      await client.sendPrompt(sessionId, prompt);
    } catch (error) {
      await tracker.fail(sessionId, "No se pudo enviar el prompt a OpenCode.");
      throw error;
    }
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId, sessionId }, "Prompt sent");
  }
};
