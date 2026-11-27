import type { AutocompleteInteraction } from "discord.js";
import { getOpenCodeClient, type OpenCodeAgent, type OpenCodeModel } from "../opencode/runtime.js";

const CACHE_TTL_MS = 60_000;
let modelsCache: { value: OpenCodeModel[]; expiresAt: number } | undefined;
let agentsCache: { value: OpenCodeAgent[]; expiresAt: number } | undefined;

export function modelChoice(model: OpenCodeModel): string {
  return `${model.providerID}/${model.id}`;
}

export async function listModels(): Promise<OpenCodeModel[]> {
  if (modelsCache && modelsCache.expiresAt > Date.now()) return modelsCache.value;
  const value = (await getOpenCodeClient().listModels()).filter((model) => model.enabled);
  modelsCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export async function listAgents(): Promise<OpenCodeAgent[]> {
  if (agentsCache && agentsCache.expiresAt > Date.now()) return agentsCache.value;
  const value = (await getOpenCodeClient().listAgents()).filter((agent) => !agent.hidden && agent.mode !== "subagent");
  agentsCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export async function respondAutocomplete(
  interaction: AutocompleteInteraction,
  choices: Array<{ name: string; value: string }>
): Promise<void> {
  const query = interaction.options.getFocused().toLocaleLowerCase();
  await interaction.respond(choices.filter((choice) => choice.name.toLocaleLowerCase().includes(query) || choice.value.toLocaleLowerCase().includes(query)).slice(0, 25));
}
