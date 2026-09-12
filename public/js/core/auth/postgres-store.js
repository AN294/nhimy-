"use strict";

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role || "student", createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at };
}

function createPostgresAuthStore(pool, { hashPassword, verifyPassword, normalizeEmail, normalizeName, validEmail, passwordMin, passwordMax, sessionBytes, sessionTtlMs, randomBytes, randomUUID, hashToken }) {
  if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") throw new TypeError("Pool PostgreSQL inválido.");
  const store = {
    async registerUser({ email: rawEmail, password, name = "" }) {
      const email = normalizeEmail(rawEmail); const cleanPassword = String(password || "");
      if (!validEmail(email)) throw new Error("Indica um e-mail válido.");
      if (cleanPassword.length < passwordMin || cleanPassword.length > passwordMax) throw new Error(`A palavra-passe deve ter entre ${passwordMin} e ${passwordMax} caracteres.`);
      const passwordHash = await hashPassword(cleanPassword);
      try {
        const result = await pool.query(
          `INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)
           RETURNING id, email, name, role, created_at`,
          [randomUUID(), email, normalizeName(name), passwordHash]
        );
        return publicUser(result.rows[0]);
      } catch (error) {
        if (error?.code === "23505") throw new Error("Já existe uma conta com este e-mail.");
        throw error;
      }
    },

    async authenticateUser({ email: rawEmail, password }) {
      const email = normalizeEmail(rawEmail); const cleanPassword = String(password || "");
      if (!validEmail(email) || cleanPassword.length < passwordMin || cleanPassword.length > passwordMax) return null;
      const result = await pool.query(`SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = $1`, [email]);
      const user = result.rows[0];
      if (!user || !(await verifyPassword(cleanPassword, user.password_hash))) return null;
      return publicUser(user);
    },

    async createSession(userId) {
      if (!userId) throw new Error("Utilizador inválido.");
      const token = randomBytes(sessionBytes).toString("base64url");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM sessions WHERE user_id = $1 OR expires_at <= NOW()`, [userId]);
        await client.query(
          `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
           VALUES ($1, $2, $3, NOW(), NOW() + ($4 * INTERVAL '1 millisecond'))`,
          [randomUUID(), userId, hashToken(token), sessionTtlMs]
        );
        await client.query("COMMIT");
        return token;
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch (_) {}
        throw error;
      } finally { client.release(); }
    },

    async getUserBySession(token) {
      if (!token) return null;
      const result = await pool.query(
        `SELECT u.id, u.email, u.name, u.role, u.created_at
           FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
        [hashToken(token)]
      );
      return result.rows[0] ? publicUser(result.rows[0]) : null;
    },

    async destroySession(token) {
      if (!token) return;
      await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)]);
    },

    async changePassword(userId, currentPassword, newPassword) {
      if (!userId) throw new Error("Utilizador inválido.");
      const current = String(currentPassword || ""); const next = String(newPassword || "");
      if (next.length < passwordMin || next.length > passwordMax) throw new Error(`A palavra-passe deve ter entre ${passwordMin} e ${passwordMax} caracteres.`);
      const result = await pool.query(`SELECT id, email, name, role, password_hash, created_at FROM users WHERE id = $1`, [userId]);
      const user = result.rows[0];
      if (!user || !(await verifyPassword(current, user.password_hash))) throw new Error("A palavra-passe atual está incorreta.");
      const passwordHash = await hashPassword(next);
      await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
      return publicUser({ ...user, password_hash: passwordHash });
    },

    async destroyAllSessions(userId) {
      if (!userId) throw new Error("Utilizador inválido.");
      const result = await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
      return result.rowCount || 0;
    },

    async deleteUser(userId, password) {
      if (!userId) throw new Error("Utilizador inválido.");
      const result = await pool.query(`SELECT id, password_hash FROM users WHERE id = $1`, [userId]);
      const user = result.rows[0];
      if (!user) throw new Error("Conta não encontrada.");
      if (!(await verifyPassword(String(password || ""), user.password_hash))) throw new Error("A palavra-passe está incorreta.");
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
      return true;
    }
  };
  return store;
}

export { createPostgresAuthStore };
