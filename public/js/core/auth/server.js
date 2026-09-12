"use strict";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const DATA_DIR = process.env.NHIMY_AUTH_DIR || path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "auth.json");
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const SESSION_BYTES = 32;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const EMAIL_MAX = 254;
const NAME_MAX = 80;
let writeChain = Promise.resolve();

function normalizeEmail(value) { return String(value || "").trim().toLowerCase(); }
function normalizeName(value) { return String(value || "").trim().slice(0, NAME_MAX); }
function validEmail(email) { return email.length >= 3 && email.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function hashToken(token) { return createHash("sha256").update(token).digest("hex"); }
function publicUser(user) { return { id: user.id, email: user.email, name: user.name, role: user.role || "student", createdAt: user.createdAt }; }

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  try { await fs.access(DB_FILE); }
  catch (_) { await fs.writeFile(DB_FILE, JSON.stringify({ version: 1, users: [], sessions: [] }, null, 2), { mode: 0o600 }); }
}
async function readStore() {
  await ensureStore();
  try {
    const parsed = JSON.parse(await fs.readFile(DB_FILE, "utf8"));
    return { version: 1, users: Array.isArray(parsed.users) ? parsed.users : [], sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] };
  } catch (_) { throw new Error("Não foi possível ler o armazenamento de autenticação."); }
}
async function writeStore(data) {
  const payload = JSON.stringify(data, null, 2);
  writeChain = writeChain.then(async () => {
    await ensureStore();
    const temp = `${DB_FILE}.${process.pid}.tmp`;
    await fs.writeFile(temp, payload, { mode: 0o600 });
    await fs.rename(temp, DB_FILE);
  });
  return writeChain;
}
async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await scrypt(password, Buffer.from(salt, "base64url"), 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${Buffer.from(derived).toString("base64url")}`;
}
async function verifyPassword(password, encoded) {
  const [scheme, salt, expected] = String(encoded || "").split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = Buffer.from(await scrypt(password, Buffer.from(salt, "base64url"), 64, { N: 16384, r: 8, p: 1 }));
  const target = Buffer.from(expected, "base64url");
  return actual.length === target.length && timingSafeEqual(actual, target);
}
function validateCredentials(email, password) {
  if (!validEmail(email)) throw new Error("Indica um e-mail válido.");
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) throw new Error(`A palavra-passe deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.`);
}

const fileStore = {
  async registerUser({ email: rawEmail, password, name = "" }) {
    const email = normalizeEmail(rawEmail); const cleanPassword = String(password || ""); validateCredentials(email, cleanPassword);
    const data = await readStore();
    if (data.users.some((user) => user.email === email)) throw new Error("Já existe uma conta com este e-mail.");
    const user = { id: randomUUID(), email, name: normalizeName(name), role: "student", passwordHash: await hashPassword(cleanPassword), createdAt: new Date().toISOString() };
    data.users.push(user); await writeStore(data); return publicUser(user);
  },
  async authenticateUser({ email: rawEmail, password }) {
    const email = normalizeEmail(rawEmail); const cleanPassword = String(password || "");
    if (!validEmail(email) || cleanPassword.length < PASSWORD_MIN || cleanPassword.length > PASSWORD_MAX) return null;
    const data = await readStore(); const user = data.users.find((candidate) => candidate.email === email);
    if (!user || !(await verifyPassword(cleanPassword, user.passwordHash))) return null; return publicUser(user);
  },
  async createSession(userId) {
    if (!userId) throw new Error("Utilizador inválido.");
    const token = randomBytes(SESSION_BYTES).toString("base64url"); const now = Date.now(); const data = await readStore();
    data.sessions = data.sessions.filter((session) => session.expiresAt > now && session.userId !== userId);
    data.sessions.push({ id: randomUUID(), userId, tokenHash: hashToken(token), createdAt: new Date(now).toISOString(), expiresAt: now + SESSION_TTL_MS });
    await writeStore(data); return token;
  },
  async getUserBySession(token) {
    if (!token) return null; const data = await readStore(); const now = Date.now(); let changed = false;
    data.sessions = data.sessions.filter((session) => { const keep = session.expiresAt > now; if (!keep) changed = true; return keep; });
    const session = data.sessions.find((candidate) => candidate.tokenHash === hashToken(token)); if (changed) await writeStore(data);
    if (!session) return null; const user = data.users.find((candidate) => candidate.id === session.userId); return user ? publicUser(user) : null;
  },
  async destroySession(token) { if (!token) return; const data = await readStore(); const hash = hashToken(token); const before = data.sessions.length; data.sessions = data.sessions.filter((session) => session.tokenHash !== hash); if (before !== data.sessions.length) await writeStore(data); },
  async changePassword(userId, currentPassword, newPassword) {
    if (!userId) throw new Error("Utilizador inválido."); const current = String(currentPassword || ""); const next = String(newPassword || "");
    if (next.length < PASSWORD_MIN || next.length > PASSWORD_MAX) throw new Error(`A palavra-passe deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.`);
    const data = await readStore(); const user = data.users.find((candidate) => candidate.id === userId);
    if (!user || !(await verifyPassword(current, user.passwordHash))) throw new Error("A palavra-passe atual está incorreta.");
    user.passwordHash = await hashPassword(next); await writeStore(data); return publicUser(user);
  },
  async destroyAllSessions(userId) { if (!userId) throw new Error("Utilizador inválido."); const data = await readStore(); const before = data.sessions.length; data.sessions = data.sessions.filter((session) => session.userId !== userId); if (before !== data.sessions.length) await writeStore(data); return before - data.sessions.length; },
  async deleteUser(userId, password) {
    if (!userId) throw new Error("Utilizador inválido."); const cleanPassword = String(password || ""); const data = await readStore(); const index = data.users.findIndex((candidate) => candidate.id === userId);
    if (index < 0) throw new Error("Conta não encontrada."); if (!(await verifyPassword(cleanPassword, data.users[index].passwordHash))) throw new Error("A palavra-passe está incorreta.");
    data.users.splice(index, 1); data.sessions = data.sessions.filter((session) => session.userId !== userId); await writeStore(data); return true;
  }
};

let authStore = fileStore;

async function registerUser(...args) { return authStore.registerUser(...args); }
async function authenticateUser(...args) { return authStore.authenticateUser(...args); }
async function createSession(...args) { return authStore.createSession(...args); }
async function getUserBySession(...args) { return authStore.getUserBySession(...args); }
async function destroySession(...args) { return authStore.destroySession(...args); }
async function changePassword(...args) { return authStore.changePassword(...args); }
async function destroyAllSessions(...args) { return authStore.destroyAllSessions(...args); }
async function deleteUser(...args) { return authStore.deleteUser(...args); }

function configureAuthStore(store) {
  if (!store || typeof store.registerUser !== "function" || typeof store.authenticateUser !== "function") throw new TypeError("Armazenamento de autenticação inválido.");
  authStore = store;
}
function getAuthStore() { return authStore; }
export { DATA_DIR, DB_FILE, PASSWORD_MIN, PASSWORD_MAX, SESSION_TTL_MS, registerUser, authenticateUser, createSession, getUserBySession, destroySession, changePassword, destroyAllSessions, deleteUser, configureAuthStore, getAuthStore, hashPassword, verifyPassword, normalizeEmail, normalizeName, validEmail, hashToken, SESSION_BYTES };
