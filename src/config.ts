import "dotenv/config";
import { z } from "zod";

const environment = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  ALLOWED_USER_IDS: z.string().min(1),
  NOTIFY_CHANNEL_ID: z.string().optional(),
  OPENCODE_URL: z.string().url().default("http://localhost:4096"),
  OPENCODE_SERVER_USERNAME: z.string().min(1).default("opencode"),
  OPENCODE_SERVER_PASSWORD: z.string().min(1),
  UPLOAD_DIR: z.string().default("./uploads"),
  DB_PATH: z.string().default("./data/openbot.db"),
  MAX_FILE_MB: z.coerce.number().int().positive().default(10),
  QUESTION_TIMEOUT_MIN: z.coerce.number().int().positive().default(30),
  EMOJI_CORRECTO: z.string().optional(),
  EMOJI_ALERTA: z.string().optional(),
  EMOJI_CARGANDO: z.string().optional(),
  EMOJI_PAUSA: z.string().optional(),
  EMOJI_DESCARGA: z.string().optional(),
  EMOJI_CARGA: z.string().optional()
});

const parsed = environment.safeParse(process.env);
if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Configuración inválida: faltan o son inválidas ${fields}. Revisá .env.`);
}

export const config = {
  ...parsed.data,
  allowedUserIds: new Set(parsed.data.ALLOWED_USER_IDS.split(",").map((id) => id.trim()).filter(Boolean))
};
