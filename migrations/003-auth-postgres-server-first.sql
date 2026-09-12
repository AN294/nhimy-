-- NHIMY 3.15 — autenticação server-first em PostgreSQL.
-- 001 e 002 já definem users, sessions e account_data.
-- Esta migração é deliberadamente idempotente e documenta o contrato esperado.
-- Não contém DROP nem migração destrutiva.

ALTER TABLE users
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE sessions
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN token_hash SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);
