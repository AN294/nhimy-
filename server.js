import express from "express";
import QRCode from "qrcode";
import path from "path";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "url";
import {
  collectResearch
} from "./public/js/core/work/research/service.js";
import {
  registerUser,
  authenticateUser,
  createSession,
  getUserBySession,
  destroySession,
  changePassword,
  destroyAllSessions,
  deleteUser,
  configureAuthStore,
  hashPassword,
  verifyPassword,
  normalizeEmail,
  normalizeName,
  validEmail,
  hashToken,
  SESSION_BYTES
} from "./public/js/core/auth/server.js";
import { fileRepository } from "./public/js/core/persistence/file-repository.js";
import { createPostgresRepository } from "./public/js/core/persistence/postgres-repository.js";
import { createPostgresAuthStore } from "./public/js/core/auth/postgres-store.js";
import { createAdminRoutes } from "./routes/admin.js";

const app = express();
const dataRepository = fileRepository;
let postgresPool = null;

if (process.env.NHIMY_REPOSITORY === "postgres") {
  const connectionString = process.env.DATABASE_URL || process.env.NHIMY_DATABASE_URL;
  if (!connectionString) throw new Error("NHIMY_REPOSITORY=postgres exige DATABASE_URL ou NHIMY_DATABASE_URL.");
  let pg;
  try { pg = await import("pg"); }
  catch (_) { throw new Error("O adapter PostgreSQL requer o pacote pg instalado no ambiente de produção."); }
  const ssl = process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined;
  postgresPool = new pg.Pool({ connectionString, ...(ssl ? { ssl } : {}) });
  Object.assign(dataRepository, createPostgresRepository(postgresPool));
  const adminEmails = String(process.env.NHIMY_ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (adminEmails.length) {
    await postgresPool.query("UPDATE users SET role = CASE WHEN lower(email) = ANY($1::text[]) THEN 'admin' ELSE role END", [adminEmails]);
  }
  configureAuthStore(createPostgresAuthStore(postgresPool, {
    hashPassword, verifyPassword, normalizeEmail, normalizeName, validEmail,
    passwordMin: 8, passwordMax: 128, sessionBytes: SESSION_BYTES,
    sessionTtlMs: 1000 * 60 * 60 * 24 * 30, randomBytes, randomUUID, hashToken
  }));
}

if (process.env.NHIMY_TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

const PORT = process.env.PORT || 3100;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   NHIMY — SERVER
   Base preparada para produção
   ========================================================= */

app.disable("x-powered-by");

/* ---------------------------------------------------------
   PROTEÇÃO BÁSICA CONTRA ABUSO
   --------------------------------------------------------- */

const rateBuckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMITS = {
  "/api/qr": 30,
  "/api/research": 10,
  "/api/auth/login": 10,
  "/api/auth/register": 5
};
const RATE_MAX_KEYS = 5000;

function cleanupRateBuckets(now = Date.now()) {
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
  }
}

function rateLimit(req, res, next) {
  if (!req.path.startsWith("/api/")) return next();

  const limit = RATE_LIMITS[req.path] || 60;
  const now = Date.now();
  if (rateBuckets.size > RATE_MAX_KEYS) cleanupRateBuckets(now);
  if (rateBuckets.size >= RATE_MAX_KEYS && !rateBuckets.has(`${req.ip || "unknown"}:${req.path}`)) {
    return res.status(503).json({ ok: false, error: "Serviço temporariamente ocupado. Tenta novamente mais tarde." });
  }
  const key = `${req.ip || "unknown"}:${req.path}`;
  const current = rateBuckets.get(key);

  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return next();
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - current.startedAt)) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ ok: false, error: "Muitas solicitações. Tenta novamente mais tarde." });
  }

  current.count += 1;
  return next();
}

app.use(rateLimit);

/* ---------------------------------------------------------
   AUTH HELPERS
   --------------------------------------------------------- */

const AUTH_COOKIE = process.env.NODE_ENV === "production" ? "__Host-nhimy_session" : "nhimy_session";

function parseCookies(header = "") {
  return Object.fromEntries(String(header).split(";").map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf("=");
    let value = part.slice(index + 1);
    try { value = decodeURIComponent(value); } catch (_) { value = ""; }
    return index < 0 ? [part, ""] : [part.slice(0, index), value];
  }));
}

function getSessionToken(req) {
  return parseCookies(req.headers.cookie || "")[AUTH_COOKIE] || "";
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function sameOriginGuard(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = String(req.headers.origin || "").trim();
  const configuredOrigin = String(process.env.NHIMY_APP_ORIGIN || "").trim().replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    if (!configuredOrigin) return res.status(503).json({ ok: false, error: "NHIMY_APP_ORIGIN não configurado." });
    if (!origin || origin !== configuredOrigin) return res.status(403).json({ ok: false, error: "Origem não autorizada." });
    return next();
  }

  if (!origin) return next();
  const host = req.headers.host;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto ? String(forwardedProto).split(",")[0].trim() : "http";
  const expected = `${protocol}://${host}`;
  if (origin !== expected) return res.status(403).json({ ok: false, error: "Origem não autorizada." });
  return next();
}

app.use(sameOriginGuard);

/* ---------------------------------------------------------
   JSON
   --------------------------------------------------------- */

app.use("/api/me/data", express.json({ limit: "450kb" }));
app.use(express.json({ limit: "100kb" }));

/* ---------------------------------------------------------
   HEADERS DE SEGURANÇA
   --------------------------------------------------------- */

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'"
  );
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }

  next();
});

/* ---------------------------------------------------------
   ARQUIVOS PÚBLICOS
   --------------------------------------------------------- */

app.use(
  express.static(path.join(__dirname, "public"), {
    extensions: ["html"],
    maxAge: process.env.NODE_ENV === "production"
      ? "1h"
      : 0
  })
);

/* =========================================================
   DADOS DA CONTA — IDENTIDADE E PROPRIEDADE
   ========================================================= */

async function requireUser(req, res) {
  const user = await getUserBySession(getSessionToken(req));
  if (!user) {
    res.status(401).json({ ok: false, error: "É necessário iniciar sessão." });
    return null;
  }
  return user;
}

app.get("/api/me/data", async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const result = await dataRepository.getUserData(user.id);
    return res.json({ ok: true, hasData: result.hasData, data: result.data });
  } catch (_) {
    return res.status(500).json({ ok: false, error: "Não foi possível carregar os dados da conta." });
  }
});

app.put("/api/me/data", async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const expectedRevision = req.headers["if-match"] ? Number(String(req.headers["if-match"]).replace(/^W\//, "").replaceAll('"', "")) : null;
    const data = await dataRepository.replaceUserData(user.id, req.body || {}, { expectedRevision: Number.isInteger(expectedRevision) ? expectedRevision : null });
    return res.json({ ok: true, data });
  } catch (error) {
    const message = String(error?.message || "");
    const status = /limite permitido|Utilizador inválido|alterados noutro dispositivo/i.test(message) ? 400 : 500;
    return res.status(status).json({ ok: false, error: status === 400 ? message : "Não foi possível guardar os dados da conta." });
  }
});

/* =========================================================
   AUTHENTICATION
   ========================================================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const user = await registerUser(req.body || {});
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    return res.status(201).json({ ok: true, user });
  } catch (error) {
    const message = String(error?.message || "");
    const status = /já existe|e-mail válido|palavra-passe/i.test(message) ? 400 : 500;
    return res.status(status).json({ ok: false, error: status === 500 ? "Não foi possível criar a conta." : message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await authenticateUser(req.body || {});
    if (!user) return res.status(401).json({ ok: false, error: "E-mail ou palavra-passe incorretos." });
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    return res.json({ ok: true, user });
  } catch (_) {
    return res.status(500).json({ ok: false, error: "Não foi possível iniciar a sessão." });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getUserBySession(getSessionToken(req));
    return res.json({ ok: true, user });
  } catch (_) {
    return res.status(500).json({ ok: false, error: "Não foi possível verificar a sessão." });
  }
});

app.post("/api/auth/change-password", async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await changePassword(user.id, req.body?.currentPassword, req.body?.newPassword);
    await destroyAllSessions(user.id);
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    return res.json({ ok: true, user });
  } catch (error) {
    const message = String(error?.message || "");
    const status = /palavra-passe|Utilizador inválido/i.test(message) ? 400 : 500;
    return res.status(status).json({ ok: false, error: status === 400 ? message : "Não foi possível alterar a palavra-passe." });
  }
});

app.post("/api/auth/logout-all", async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await destroyAllSessions(user.id);
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (_) {
    return res.status(500).json({ ok: false, error: "Não foi possível terminar as sessões." });
  }
});

app.delete("/api/auth/account", async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await deleteUser(user.id, req.body?.password);
    await dataRepository.deleteUserData(user.id);
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (error) {
    const message = String(error?.message || "");
    const status = /palavra-passe|Conta não encontrada|Utilizador inválido/i.test(message) ? 400 : 500;
    return res.status(status).json({ ok: false, error: status === 400 ? message : "Não foi possível apagar a conta." });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    await destroySession(getSessionToken(req));
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (_) {
    return res.status(500).json({ ok: false, error: "Não foi possível terminar a sessão." });
  }
});

/* =========================================================
   ADMINISTRAÇÃO
   ========================================================= */

createAdminRoutes({ app, getUserBySession, getSessionToken, pool: postgresPool, dataRepository });

/* =========================================================
   QR CODE
   ========================================================= */

app.post("/api/qr", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({
        ok: false,
        error: "Digite um texto ou link."
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        ok: false,
        error: "O texto é demasiado longo."
      });
    }

    const qr = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300
    });

    return res.json({
      ok: true,
      qr
    });

  } catch (error) {
    console.error("Erro QR:", error);

    return res.status(500).json({
      ok: false,
      error: "Não foi possível gerar o QR Code."
    });
  }
});

/* =========================================================
   RESEARCH
   ========================================================= */

app.post("/api/research", async (req, res) => {
  try {
    const request = req.body;

    const result =
      await collectResearch(request);

    return res.json({
      ok: true,
      result
    });

  } catch (error) {
    console.error("Erro Research:", error);
    const message = String(error?.message || "");
    const validationError = /inválid|obrigat|demasiado|máximo|formato|precisa/i.test(message);

    return res.status(validationError ? 400 : 502).json({
      ok: false,
      error: validationError
        ? message
        : "O serviço de pesquisa está temporariamente indisponível."
    });
  }
});


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/health", async (req, res) => {
  if (!postgresPool) {
    return res.json({ ok: true, project: "Nhimy", status: "online", persistence: "file" });
  }
  try {
    await postgresPool.query("SELECT 1");
    return res.json({ ok: true, project: "Nhimy", status: "online", persistence: "postgres" });
  } catch (_) {
    return res.status(503).json({ ok: false, project: "Nhimy", status: "degraded", persistence: "postgres" });
  }
});

/* =========================================================
   404 PARA API
   ========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "Endpoint não encontrado."
  });
});

/* =========================================================
   ERRO GLOBAL
   ========================================================= */

app.use((error, req, res, next) => {
  console.error("Erro interno:", error);

  if (res.headersSent) {
    return next(error);
  }

  const malformedJson = error instanceof SyntaxError && error.status === 400 && "body" in error;
  if (malformedJson) {
    return res.status(400).json({
      ok: false,
      error: "JSON inválido."
    });
  }

  res.status(500).json({
    ok: false,
    error: "Erro interno do servidor."
  });
});

/* =========================================================
   START
   ========================================================= */

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log(" NHIMY ONLINE");
  console.log(` PORTA: ${PORT}`);
  console.log(" AMBIENTE:", process.env.NODE_ENV || "development");
  console.log("======================================");
});

async function shutdown(signal) {
  console.log(`NHIMY encerrando (${signal})...`);
  server.close(async () => {
    if (postgresPool) {
      try { await postgresPool.end(); } catch (_) {}
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
