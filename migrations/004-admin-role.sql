-- NHIMY — Administração segura
-- O papel padrão é student; administração só pode ser concedida explicitamente.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'student';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'admin'));
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
