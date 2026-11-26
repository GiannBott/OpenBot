import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";

mkdirSync(dirname(config.DB_PATH), { recursive: true });
export const db = new Database(config.DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

const migrationsPath = fileURLToPath(new URL("./migrations", import.meta.url));
const current = Number(db.pragma("user_version", { simple: true }));
const migrations = readdirSync(migrationsPath)
  .filter((file) => /^\d{3}_.+\.sql$/.test(file))
  .sort();

for (const file of migrations) {
  const version = Number(file.slice(0, 3));
  if (version <= current) continue;
  db.transaction(() => {
    db.exec(readFileSync(join(migrationsPath, file), "utf8"));
    db.pragma(`user_version = ${version}`);
  })();
}

export function pruneDatabase(now = Date.now()): void {
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  db.prepare("UPDATE pending_interactions SET status = 'expired' WHERE status = 'open' AND expires_at < ?").run(now);
  db.prepare("DELETE FROM files WHERE created_at < ?").run(sevenDaysAgo);
  db.prepare("DELETE FROM pending_interactions WHERE status <> 'open' AND created_at < ?").run(sevenDaysAgo);
}

pruneDatabase();
