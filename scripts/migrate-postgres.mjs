import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const connectionString = process.env.DATABASE_URL || process.env.NHIMY_DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL ou NHIMY_DATABASE_URL é obrigatório para a migração PostgreSQL.");

let pg;
try { pg = await import("pg"); }
catch (_) { throw new Error("O comando db:migrate requer o pacote pg instalado."); }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "migrations");
const files = ["001-initial-postgres.sql", "002-account-data-revision.sql", "003-auth-postgres-server-first.sql", "004-admin-role.sql"];

const pool = new pg.Pool({
  connectionString,
  ...(process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: true } } : {})
});

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nhimy_migrations (
      name VARCHAR(255) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const name of files) {
    const sql = await readFile(path.join(migrationsDir, name), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await pool.query("SELECT checksum FROM nhimy_migrations WHERE name = $1", [name]);
    if (existing.rows[0]) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Migração já aplicada mas o conteúdo mudou: ${name}`);
      console.log(`SKIP ${name}`);
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO nhimy_migrations (name, checksum) VALUES ($1, $2)", [name, checksum]);
      await client.query("COMMIT");
      console.log(`APPLY ${name}`);
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch (_) {}
      throw error;
    } finally { client.release(); }
  }
  console.log("PostgreSQL migrations concluídas.");
} finally {
  await pool.end();
}
