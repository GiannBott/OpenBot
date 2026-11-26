import type { BaseInteraction } from "discord.js";
import { config } from "../config.js";

export async function requireAllowedUser(interaction: BaseInteraction): Promise<boolean> {
  if (config.allowedUserIds.has(interaction.user.id)) return true;
  if (interaction.isRepliable()) await interaction.reply({ content: "⚠️ No tenés permiso para usar OpenBot.", ephemeral: true });
  return false;
}
