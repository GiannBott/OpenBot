import { Client, Events, GatewayIntentBits } from "discord.js";
import pino from "pino";
import { config } from "./config.js";
import { db, pruneDatabase } from "./db/index.js";
import { loadEmojis } from "./emojis.js";
import { pingCommand } from "./commands/ping.js";
import { luchitoCommand } from "./commands/luchito.js";
import { molestarCommand } from "./commands/molestar.js";
import { OpenCodeClient } from "./opencode/client.js";
import { OpenCodeEvents } from "./opencode/events.js";
import { setOpenCodeClient, setOpenCodeEvents, setTaskTracker } from "./opencode/runtime.js";
import { TaskTracker } from "./tasks/tracker.js";
import { statusCommand } from "./commands/status.js";
import { usageCommand } from "./commands/usage.js";
import { mcpCommand } from "./commands/mcp.js";
import { sessionCommand } from "./commands/session.js";
import { modelCommand } from "./commands/model.js";
import { reasoningCommand } from "./commands/reasoning.js";
import { agentCommand } from "./commands/agent.js";
import { askCommand } from "./commands/ask.js";
import { abortCommand } from "./commands/abort.js";
import { downloadCommand } from "./commands/download.js";
import { handleDownload } from "./files/downloads.js";
import { handleUploadMessage, handleUploadRequest } from "./files/uploads.js";
import { requireAllowedUser } from "./interactions/auth.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
loadEmojis(logger);

let openCode: OpenCodeClient;
let openCodeEvents: OpenCodeEvents;
try {
  openCode = await OpenCodeClient.connect();
  setOpenCodeClient(openCode);
  openCodeEvents = new OpenCodeEvents(openCode, logger);
  setOpenCodeEvents(openCodeEvents);
  setTaskTracker(new TaskTracker(openCodeEvents, logger));
  openCodeEvents.start();
  const info = await openCode.getInfo();
  logger.info({ version: info.version }, "OpenCode v2 connection verified");
} catch (error) {
  logger.fatal({ error }, "OpenCode is unavailable; OpenBot will exit");
  db.close();
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.once(Events.ClientReady, (readyClient) => logger.info({ user: readyClient.user.tag }, "OpenBot connected"));
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !config.allowedUserIds.has(message.author.id)) return;
  try {
    await handleUploadMessage(message);
  } catch (error) {
    logger.error({ error, channelId: message.channelId }, "Upload message handling failed");
  }
});
client.on(Events.InteractionCreate, async (interaction) => {
  void openCode;
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    if (!(await requireAllowedUser(interaction))) return;
    if (interaction.customId === "dl:select" || interaction.customId.startsWith("dl:")) await handleDownload(interaction);
    if (interaction.isButton() && interaction.customId.startsWith("up:")) await handleUploadRequest(interaction);
    return;
  }
  if (interaction.isAutocomplete()) {
    try {
      if (interaction.commandName === modelCommand.data.name) await modelCommand.autocomplete(interaction);
      if (interaction.commandName === reasoningCommand.data.name) await reasoningCommand.autocomplete(interaction);
      if (interaction.commandName === agentCommand.data.name) await agentCommand.autocomplete(interaction);
    } catch (error) {
      logger.error({ error, command: interaction.commandName }, "Autocomplete failed");
    }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === pingCommand.data.name) await pingCommand.execute(interaction, logger);
    if (interaction.commandName === luchitoCommand.data.name) await luchitoCommand.execute(interaction, logger);
    if (interaction.commandName === molestarCommand.data.name) await molestarCommand.execute(interaction, logger);
    if (interaction.commandName === statusCommand.data.name) await statusCommand.execute(interaction, logger);
    if (interaction.commandName === usageCommand.data.name) await usageCommand.execute(interaction, logger);
    if (interaction.commandName === mcpCommand.data.name) await mcpCommand.execute(interaction, logger);
    if (interaction.commandName === sessionCommand.data.name) await sessionCommand.execute(interaction, logger);
    if (interaction.commandName === modelCommand.data.name) await modelCommand.execute(interaction, logger);
    if (interaction.commandName === reasoningCommand.data.name) await reasoningCommand.execute(interaction, logger);
    if (interaction.commandName === agentCommand.data.name) await agentCommand.execute(interaction, logger);
    if (interaction.commandName === askCommand.data.name) await askCommand.execute(interaction, logger);
    if (interaction.commandName === abortCommand.data.name) await abortCommand.execute(interaction, logger);
    if (interaction.commandName === downloadCommand.data.name) await downloadCommand.execute(interaction, logger);
  } catch (error) {
    logger.error({ error, command: interaction.commandName }, "Interaction failed");
    if (interaction.isRepliable() && interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: "⚠️ Ocurrió un error. Probá de nuevo." }).catch(() => undefined);
    } else if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({ content: "⚠️ Ocurrió un error. Probá de nuevo.", ephemeral: true });
    }
  }
});

const interval = setInterval(() => pruneDatabase(), 24 * 60 * 60 * 1000);
async function shutdown(): Promise<void> {
  clearInterval(interval);
  openCodeEvents.stop();
  client.destroy();
  db.close();
}
process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));

await client.login(config.DISCORD_TOKEN);
