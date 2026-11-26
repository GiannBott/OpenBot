import { Client, Events, GatewayIntentBits } from "discord.js";
import pino from "pino";
import { config } from "./config.js";
import { db, pruneDatabase } from "./db/index.js";
import { loadEmojis } from "./emojis.js";
import { pingCommand } from "./commands/ping.js";
import { luchitoCommand } from "./commands/luchito.js";
import { molestarCommand } from "./commands/molestar.js";
import { OpenCodeClient } from "./opencode/client.js";
import { setOpenCodeClient } from "./opencode/runtime.js";
import { statusCommand } from "./commands/status.js";
import { usageCommand } from "./commands/usage.js";
import { mcpCommand } from "./commands/mcp.js";
import { sessionCommand } from "./commands/session.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
loadEmojis(logger);

let openCode: OpenCodeClient;
try {
  openCode = await OpenCodeClient.connect();
  setOpenCodeClient(openCode);
  const info = await openCode.getInfo();
  logger.info({ version: info.version }, "OpenCode v2 connection verified");
} catch (error) {
  logger.fatal({ error }, "OpenCode is unavailable; OpenBot will exit");
  db.close();
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, (readyClient) => logger.info({ user: readyClient.user.tag }, "OpenBot connected"));
client.on(Events.InteractionCreate, async (interaction) => {
  void openCode;
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === pingCommand.data.name) await pingCommand.execute(interaction, logger);
    if (interaction.commandName === luchitoCommand.data.name) await luchitoCommand.execute(interaction, logger);
    if (interaction.commandName === molestarCommand.data.name) await molestarCommand.execute(interaction, logger);
    if (interaction.commandName === statusCommand.data.name) await statusCommand.execute(interaction, logger);
    if (interaction.commandName === usageCommand.data.name) await usageCommand.execute(interaction, logger);
    if (interaction.commandName === mcpCommand.data.name) await mcpCommand.execute(interaction, logger);
    if (interaction.commandName === sessionCommand.data.name) await sessionCommand.execute(interaction, logger);
  } catch (error) {
    logger.error({ error, command: interaction.commandName }, "Interaction failed");
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "⚠️ Ocurrió un error. Probá de nuevo.", ephemeral: true });
    }
  }
});

const interval = setInterval(() => pruneDatabase(), 24 * 60 * 60 * 1000);
async function shutdown(): Promise<void> {
  clearInterval(interval);
  client.destroy();
  db.close();
}
process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));

await client.login(config.DISCORD_TOKEN);
