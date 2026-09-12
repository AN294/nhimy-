"use strict";

import { validateRepository } from "./repository.js";

const MAX_BYTES = 450_000;
const VERSION = 1;
const COLLECTIONS = Object.freeze(["profile", "study", "work", "organize", "library"]);

function emptyData() {
  return { version: VERSION, profile: null, study: null, work: null, organize: null, library: null, updatedAt: null, revision: 0 };
}

function normalizeData(input = {}) {
  const data = emptyData();
  for (const key of COLLECTIONS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      data[key] = input[key] && typeof input[key] === "object" && !Array.isArray(input[key]) ? input[key] : null;
    }
  }
  data.updatedAt = typeof input.updatedAt === "string" ? input.updatedAt : null;
  data.revision = Number.isInteger(input.revision) && input.revision >= 0 ? input.revision : 0;
  return data;
}

function serializedSize(data) {
  return Buffer.byteLength(JSON.stringify(data), "utf8");
}

function rowToResult(row) {
  if (!row) return { hasData: false, data: emptyData() };
  const data = normalizeData({
    version: row.version,
    profile: row.profile,
    study: row.study,
    work: row.work,
    organize: row.organize,
    library: row.library,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    revision: Number(row.revision) || 0
  });
  return { hasData: COLLECTIONS.some(key => data[key] !== null), data };
}

function createPostgresRepository(pool) {
  if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") {
    throw new TypeError("Pool PostgreSQL inválido.");
  }

  const repository = {
    async getUserData(userId) {
      if (!userId) throw new Error("Utilizador inválido.");
      const result = await pool.query(
        `SELECT version, profile, study, work, organize, library, updated_at, revision
           FROM account_data
          WHERE user_id = $1`,
        [userId]
      );
      return rowToResult(result.rows[0]);
    },

    async replaceUserData(userId, input, { expectedRevision = null } = {}) {
      if (!userId) throw new Error("Utilizador inválido.");
      const data = normalizeData(input);
      if (serializedSize(data) > MAX_BYTES) throw new Error("Os dados da conta excedem o limite permitido.");

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const currentResult = await client.query(
          `SELECT revision
             FROM account_data
            WHERE user_id = $1
            FOR UPDATE`,
          [userId]
        );
        const currentRevision = currentResult.rows[0] ? Number(currentResult.rows[0].revision) || 0 : 0;
        if (expectedRevision !== null && Number(expectedRevision) !== currentRevision) {
          const error = new Error("Os dados da conta foram alterados noutro dispositivo. Recarrega os dados antes de guardar.");
          error.code = "DATA_CONFLICT";
          error.currentRevision = currentRevision;
          throw error;
        }

        const nextRevision = currentRevision + 1;
        const updatedAt = new Date().toISOString();
        const result = await client.query(
          `INSERT INTO account_data
             (user_id, version, profile, study, work, organize, library, updated_at, revision)
           VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::timestamptz, $9)
           ON CONFLICT (user_id) DO UPDATE SET
             version = EXCLUDED.version,
             profile = EXCLUDED.profile,
             study = EXCLUDED.study,
             work = EXCLUDED.work,
             organize = EXCLUDED.organize,
             library = EXCLUDED.library,
             updated_at = EXCLUDED.updated_at,
             revision = EXCLUDED.revision
           RETURNING version, profile, study, work, organize, library, updated_at, revision`,
          [
            userId,
            VERSION,
            JSON.stringify(data.profile),
            JSON.stringify(data.study),
            JSON.stringify(data.work),
            JSON.stringify(data.organize),
            JSON.stringify(data.library),
            updatedAt,
            nextRevision
          ]
        );
        await client.query("COMMIT");
        return normalizeData({ ...result.rows[0], updated_at: result.rows[0].updated_at, revision: nextRevision });
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch (_) {}
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteUserData(userId) {
      if (!userId) throw new Error("Utilizador inválido.");
      await pool.query("DELETE FROM account_data WHERE user_id = $1", [userId]);
      return true;
    }
  };

  return validateRepository(repository);
}

export { MAX_BYTES, VERSION, COLLECTIONS, createPostgresRepository };
