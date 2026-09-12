import { createHash } from "node:crypto";

const connectionString = process.env.DATABASE_URL || process.env.NHIMY_DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL ou NHIMY_DATABASE_URL é obrigatório.");

let pg;
try { pg = await import("pg"); }
catch (_) { throw new Error("O preflight requer o pacote pg instalado."); }

const pool = new pg.Pool({
  connectionString,
  ...(process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: true } } : {})
});

const requiredTables = ["users", "sessions", "account_data"];
const requiredColumns = {
  users: ["id", "email", "name", "role", "password_hash", "created_at"],
  sessions: ["id", "user_id", "token_hash", "created_at", "expires_at"],
  account_data: ["user_id", "version", "profile", "study", "work", "organize", "library", "updated_at", "revision"]
};

try {
  const ping = await pool.query("SELECT current_database() AS database, current_user AS user, NOW() AS now");
  for (const table of requiredTables) {
    const result = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1", [table]);
    if (!result.rowCount) throw new Error(`Tabela PostgreSQL ausente: ${table}`);
  }
  for (const [table, columns] of Object.entries(requiredColumns)) {
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
      [table]
    );
    const actual = new Set(result.rows.map(row => row.column_name));
    for (const column of columns) if (!actual.has(column)) throw new Error(`Coluna PostgreSQL ausente: ${table}.${column}`);
  }
  const schemaFingerprint = createHash("sha256").update(requiredTables.flatMap(table => requiredColumns[table].map(column => `${table}.${column}`)).join("\n")).digest("hex");
  console.log(`PostgreSQL OK — database=${ping.rows[0].database} user=${ping.rows[0].user}`);
  console.log(`Schema NHIMY OK — fingerprint=${schemaFingerprint}`);
} finally {
  await pool.end();
}
