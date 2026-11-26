import { OpenCodeClient } from "./client.js";

const client = await OpenCodeClient.connect();
const [info, sessions, agents, models, mcp] = await Promise.all([
  client.getInfo(), client.listSessions(), client.listAgents(), client.listModels(), client.listMcp()
]);

console.log(JSON.stringify({ version: info.version, sessions: sessions.length, agents: agents.length, models: models.length, mcp: mcp.length }));
