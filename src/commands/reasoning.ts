import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getChannelState, saveChannelState } from "../db/repo.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient } from "../opencode/runtime.js";
import { infoEmbed } from "../ui/embeds.js";
import { listModels, modelChoice, respondAutocomplete } from "./control.js";

function variantsOf(model: Awaited<ReturnType<typeof listModels>>[number]): string[] {
  return Array.isArray(model.variants)
    ? model.variants.flatMap((variant) => typeof variant === "object" && variant !== null && "id" in variant && typeof variant.id === "string" ? [variant.id] : [])
    : [];
}

async function currentModel(channelId: string) {
  const state = getChannelState(channelId);
  const models = await listModels();
  if (state?.model) return models.find((model) => modelChoice(model) === state.model);
  if (!state?.sessionId) return undefined;
  const session = (await getOpenCodeClient().listSessions()).find((item) => item.id === state.sessionId);
  const modelRef = session?.model;
  if (!modelRef || typeof modelRef !== "object" || !("providerID" in modelRef) || !("id" in modelRef) || typeof modelRef.providerID !== "string" || typeof modelRef.id !== "string") return undefined;
  return models.find((model) => model.providerID === modelRef.providerID && model.id === modelRef.id);
}

export const reasoningCommand = {
  data: new SlashCommandBuilder()
    .setName("reasoning")
    .setDescription("Muestra o cambia el razonamiento")
    .addStringOption((option) => option.setName("nivel").setDescription("Variante de razonamiento").setAutocomplete(true)),
  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const model = await currentModel(interaction.channelId);
    await respondAutocomplete(interaction, model ? variantsOf(model).map((variant) => ({ name: variant, value: variant })) : []);
  },
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.deferReply();
    const selected = interaction.options.getString("nivel");
    const state = getChannelState(interaction.channelId);
    if (!selected) {
      await interaction.editReply({ embeds: [infoEmbed("Razonamiento", state?.variant ?? "No disponible")] });
      return;
    }
    const model = await currentModel(interaction.channelId);
    if (!model || !variantsOf(model).includes(selected)) {
      await interaction.editReply({ content: "Razonamiento no soportado por el modelo actual." });
      return;
    }
    const client = getOpenCodeClient();
    if (state?.sessionId) await client.setSessionModel(state.sessionId, { providerID: model.providerID, id: model.id, variant: selected });
    saveChannelState({ channelId: interaction.channelId, sessionId: state?.sessionId ?? null, model: modelChoice(model), agent: state?.agent ?? null, variant: selected });
    await interaction.editReply({ embeds: [infoEmbed("Razonamiento actualizado", selected)] });
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId, sessionId: state?.sessionId, variant: selected }, "Reasoning selected");
  }
};
