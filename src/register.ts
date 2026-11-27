import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { pingCommand } from "./commands/ping.js";
import { luchitoCommand } from "./commands/luchito.js";
import { molestarCommand } from "./commands/molestar.js";
import { statusCommand } from "./commands/status.js";
import { usageCommand } from "./commands/usage.js";
import { mcpCommand } from "./commands/mcp.js";
import { sessionCommand } from "./commands/session.js";
import { modelCommand } from "./commands/model.js";
import { reasoningCommand } from "./commands/reasoning.js";
import { agentCommand } from "./commands/agent.js";

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID), { body: [pingCommand.data.toJSON(), luchitoCommand.data.toJSON(), molestarCommand.data.toJSON(), statusCommand.data.toJSON(), usageCommand.data.toJSON(), mcpCommand.data.toJSON(), sessionCommand.data.toJSON(), modelCommand.data.toJSON(), reasoningCommand.data.toJSON(), agentCommand.data.toJSON()] });
console.log("Comandos registrados.");
