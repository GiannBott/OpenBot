import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getChannelState, saveChannelState } from "../db/repo.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient } from "../opencode/runtime.js";
import { infoEmbed } from "../ui/embeds.js";
import { listModels, modelChoice, respondAutocomplete } from "./control.js";

export const modelCommand = {
  data: new SlashCommandBuilder()
    .setName("model")
    .setDescription("Muestra o cambia el modelo")
    .addStringOption((option) => option.setName("modelo").setDescription("Modelo a usar").setAutocomplete(true)),
  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const models = await listModels();
    await respondAutocomplete(interaction, models.map((model) => ({ name: `${model.name} (${modelChoice(model)})`.slice(0, 100), value: modelChoice(model) })));
  },
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.deferReply();
    const selected = interaction.options.getString("modelo");
    const state = getChannelState(interaction.channelId);
    if (!selected) {
      await interaction.editReply({ embeds: [infoEmbed("Modelo", state?.model ?? "No disponible")] });
      return;
    }
    const model = (await listModels()).find((item) => modelChoice(item) === selected);
    if (!model) {
      await interaction.editReply({ content: "Ese modelo ya no está disponible." });
      return;
    }
    const client = getOpenCodeClient();
    if (state?.sessionId) await client.setSessionModel(state.sessionId, { providerID: model.providerID, id: model.id });
    saveChannelState({ channelId: interaction.channelId, sessionId: state?.sessionId ?? null, model: modelChoice(model), agent: state?.agent ?? null, variant: null });
    await interaction.editReply({ embeds: [infoEmbed("Modelo actualizado", `${model.name}\n\`${modelChoice(model)}\``)] });
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId, sessionId: state?.sessionId, model: modelChoice(model) }, "Model selected");
  }
};
