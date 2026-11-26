import { z } from "zod";
import { config } from "../config.js";

const serverInfoSchema = z.object({ version: z.string(), pid: z.number(), hostname: z.string().nullable().optional() }).passthrough();
const sessionSchema = z.object({
  id: z.string(), title: z.string().optional(), agent: z.string().optional(), model: z.unknown().optional(),
  cost: z.number(), tokens: z.unknown(), outcome: z.string().optional(), time: z.object({ created: z.number(), updated: z.number() }).passthrough()
}).passthrough();
const agentSchema = z.object({ id: z.string(), name: z.string(), mode: z.string(), hidden: z.boolean() }).passthrough();
const modelSchema = z.object({
  id: z.string(), modelID: z.string(), providerID: z.string(), name: z.string(), capabilities: z.unknown(), variants: z.unknown(), enabled: z.boolean(), status: z.unknown()
}).passthrough();
const mcpSchema = z.object({
  name: z.string(),
  status: z.object({ status: z.string() }).passthrough(),
  title: z.string().optional(),
  integrationID: z.string().optional()
}).passthrough();
const usageSchema = z.object({
  input: z.number(),
  output: z.number(),
  reasoning: z.number(),
  cache: z.object({ read: z.number(), write: z.number() })
}).passthrough();
const sessionStatsSchema = z.object({
  tokens: usageSchema,
  cost: z.number(),
  sessions: z.number(),
  prompts: z.number()
}).passthrough();

const sessionsResponseSchema = z.object({ data: z.array(sessionSchema) }).passthrough();
const sessionResponseSchema = z.object({ data: sessionSchema }).passthrough();
const listResponse = <T extends z.ZodTypeAny>(item: T) => z.object({ data: z.array(item) }).passthrough();
const sessionStatsResponseSchema = z.object({ data: sessionStatsSchema }).passthrough();

export type ServerInfo = z.infer<typeof serverInfoSchema>;
export type OpenCodeSession = z.infer<typeof sessionSchema>;
export type OpenCodeAgent = z.infer<typeof agentSchema>;
export type OpenCodeModel = z.infer<typeof modelSchema>;
export type OpenCodeMcp = z.infer<typeof mcpSchema>;
export type OpenCodeSessionStats = z.infer<typeof sessionStatsSchema>;

export class OpenCodeClient {
  readonly version = "v2" as const;

  private constructor(private readonly baseUrl: URL, private readonly authorization: string) {}

  static async connect(): Promise<OpenCodeClient> {
    const authorization = `Basic ${Buffer.from(`${config.OPENCODE_SERVER_USERNAME}:${config.OPENCODE_SERVER_PASSWORD}`).toString("base64")}`;
    const client = new OpenCodeClient(new URL(config.OPENCODE_URL), authorization);
    try {
      await client.getInfo();
    } catch (error) {
      if (error instanceof OpenCodeHttpError && error.status === 404) {
        throw new Error("El servidor no expone la API v2 verificada. OpenBot requiere /api/info.");
      }
      throw error;
    }
    return client;
  }

  async getInfo(): Promise<ServerInfo> {
    return serverInfoSchema.parse(await this.request("/api/info"));
  }

  async listSessions(): Promise<OpenCodeSession[]> {
    return sessionsResponseSchema.parse(await this.request("/api/session")).data;
  }

  async createSession(): Promise<OpenCodeSession> {
    return sessionResponseSchema.parse(await this.request("/api/session", { method: "POST", body: {} })).data;
  }

  async setSessionModel(sessionId: string, model: { providerID: string; id: string; variant?: string }): Promise<void> {
    await this.request(`/api/session/${encodeURIComponent(sessionId)}/model`, { method: "POST", body: { model } });
  }

  async setSessionAgent(sessionId: string, agent: string): Promise<void> {
    await this.request(`/api/session/${encodeURIComponent(sessionId)}/agent`, { method: "POST", body: { agent } });
  }

  async listAgents(): Promise<OpenCodeAgent[]> {
    return listResponse(agentSchema).parse(await this.request("/api/agent")).data;
  }

  async listModels(): Promise<OpenCodeModel[]> {
    return listResponse(modelSchema).parse(await this.request("/api/model")).data;
  }

  async listMcp(): Promise<OpenCodeMcp[]> {
    return listResponse(mcpSchema).parse(await this.request("/api/mcp")).data;
  }

  async getSessionStats(from: number, to: number, timezone: string): Promise<OpenCodeSessionStats> {
    const query = new URLSearchParams({ from: String(from), to: String(to), timezone });
    return sessionStatsResponseSchema.parse(await this.request(`/api/experimental/session/stats?${query}`)).data;
  }

  private async request(path: string, init: { method?: "POST"; body?: unknown } = {}): Promise<unknown> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const response = await fetch(new URL(path, this.baseUrl), {
          method: init.method,
          headers: { Authorization: this.authorization, ...(init.body === undefined ? {} : { "Content-Type": "application/json" }) },
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
          signal: controller.signal
        });
        if (!response.ok) throw new OpenCodeHttpError(response.status);
        return await response.json();
      } catch (error) {
        if (error instanceof OpenCodeHttpError || attempt === 1) throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error("OpenCode request failed after retry");
  }
}

export class OpenCodeHttpError extends Error {
  constructor(readonly status: number) {
    super(`OpenCode respondió HTTP ${status}`);
  }
}
