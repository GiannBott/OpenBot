import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Logger } from "pino";
import { getChannelState, saveChannelState } from "../db/repo.js";
import { requireAllowedUser } from "../interactions/auth.js";
import { getOpenCodeClient } from "../opencode/runtime.js";
import { infoEmbed } from "../ui/embeds.js";

export const sessionCommand = {
  data: new SlashCommandBuilder()
    .setName("session")
    .setDescription("Gestiona sesiones")
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("Lista sesiones recientes"))
    .addSubcommand((subcommand) => subcommand.setName("new").setDescription("Crea y activa una sesion"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("use")
        .setDescription("Activa una sesion existente")
        .addStringOption((option) => option.setName("id").setDescription("ID de la sesion").setRequired(true))
    ),
  async execute(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    if (!(await requireAllowedUser(interaction))) return;
    await interaction.deferReply();

    const client = getOpenCodeClient();
    const action = interaction.options.getSubcommand();
    if (action === "list") {
      const sessions = (await client.listSessions()).slice(0, 15);
      const description = sessions.length
        ? sessions.map((session) => `- \`${session.id}\` - ${session.title ?? "Sin titulo"}`).join("\n").slice(0, 4096)
        : "No hay sesiones.";
      await interaction.editReply({ embeds: [infoEmbed("Sesiones recientes", description)] });
      return;
    }

    let session;
    if (action === "new") {
      session = await client.createSession();
    } else if (action === "use") {
      const sessionId = interaction.options.getString("id", true);
      session = (await client.listSessions()).find((item) => item.id === sessionId);
    } else {
      await interaction.editReply({ content: "Subcomando de sesión no reconocido." });
      return;
    }
    if (!session) {
      await interaction.editReply({ content: "No encontre esa sesion en OpenCode." });
      return;
    }

    const previous = getChannelState(interaction.channelId);
    const model = session.model && typeof session.model === "object" && "id" in session.model
      ? String(session.model.id)
      : previous?.model ?? null;
    const variant = session.model && typeof session.model === "object" && "variant" in session.model
      ? String(session.model.variant ?? "") || null
      : previous?.variant ?? null;
    saveChannelState({
      channelId: interaction.channelId,
      sessionId: session.id,
      model,
      agent: session.agent ?? previous?.agent ?? null,
      variant
    });
    await interaction.editReply({ embeds: [infoEmbed("Sesion activa", `\`${session.id}\`\n${session.title ?? "Sin titulo"}`)] });
    logger.info({ userId: interaction.user.id, channelId: interaction.channelId, sessionId: session.id, action }, "Session selected");
  }
};
