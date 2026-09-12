"use strict";

import { getCurrentUser } from "../auth/client.js";
import { onStateChange } from "../student/events.js";
import { collectLocalData, hasLocalData, getAccountData, saveAccountData } from "./data.js";

const SYNC_KEY = "nhimy.account.sync";
const CONFLICT_PREFIX = "nhimy.account.conflict.";
const SYNC_VERSION = 2;
let initialized = false;
let syncing = false;
let timer = null;

function storage() { try { return localStorage; } catch (_) { return null; } }
function sessionStorageSafe() { try { return sessionStorage; } catch (_) { return null; } }

function readMarker() {
  try {
    const raw = storage()?.getItem(SYNC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function writeMarker(userId, data, localFingerprint) {
  try {
    storage()?.setItem(SYNC_KEY, JSON.stringify({
      version: SYNC_VERSION,
      userId,
      syncedAt: new Date().toISOString(),
      remoteUpdatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
      remoteRevision: Number.isInteger(data?.revision) ? data.revision : null,
      localFingerprint,
      hasData: hasLocalData(data)
    }));
  } catch (_) {}
}

function stableJson(value) {
  try { return JSON.stringify(value ?? null); } catch (_) { return "null"; }
}

async function fingerprint(data) {
  const text = stableJson(data);
  if (globalThis.crypto?.subtle && typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(text);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }
  return text;
}

function setJson(target, key, value) {
  if (!target) return;
  try {
    if (value === null || value === undefined) target.removeItem(key);
    else target.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

function hydrateRemote(data) {
  const local = storage();
  const session = sessionStorageSafe();
  setJson(local, "nhimy.student.profile", data?.profile ?? null);
  setJson(local, "nhimy.organize.state", data?.organize ?? null);
  setJson(local, "nhimy.library.state", data?.library ?? null);
  setJson(session, "nhimy.study.session", data?.study ?? null);
  setJson(session, "nhimy.work.project", data?.work ?? null);
}


async function saveLocalData(local, remote) {
  const revision = Number.isInteger(remote?.data?.revision) ? remote.data.revision : null;
  return revision === null
    ? saveAccountData(local)
    : saveAccountData(local, { expectedRevision: revision });
}

function preserveConflict(userId, local, remote) {
  try {
    storage()?.setItem(`${CONFLICT_PREFIX}${userId}`, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      local,
      remoteUpdatedAt: remote?.updatedAt || null
    }));
  } catch (_) {}
}

async function syncNow() {
  if (syncing) return { ok: false, busy: true };
  syncing = true;
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: true, authenticated: false, action: "none" };

    const local = collectLocalData();
    const remote = await getAccountData();
    const marker = readMarker();
    const localFingerprint = await fingerprint(local);

    if (!remote?.hasData) {
      if (!hasLocalData(local)) {
        writeMarker(user.id, remote?.data || null, localFingerprint);
        return { ok: true, authenticated: true, action: "empty" };
      }
      if (marker?.userId && marker.userId !== user.id) {
        return { ok: true, authenticated: true, action: "preserved" };
      }
      const saved = await saveLocalData(local, remote);
      const savedFingerprint = await fingerprint(saved);
      writeMarker(user.id, saved, savedFingerprint);
      return { ok: true, authenticated: true, action: "imported" };
    }

    const sameUser = marker?.userId === user.id;
    if (!sameUser) {
      hydrateRemote(remote.data);
      const hydrated = collectLocalData();
      writeMarker(user.id, remote.data, await fingerprint(hydrated));
      return { ok: true, authenticated: true, action: "hydrated" };
    }

    const localChanged = marker?.localFingerprint !== localFingerprint;
    const remoteChanged = marker?.remoteUpdatedAt !== (remote.data?.updatedAt || null);

    if (!localChanged) {
      hydrateRemote(remote.data);
      const hydrated = collectLocalData();
      writeMarker(user.id, remote.data, await fingerprint(hydrated));
      return { ok: true, authenticated: true, action: "server-authoritative" };
    }

    if (!remoteChanged) {
      const saved = await saveLocalData(local, remote);
      const savedFingerprint = await fingerprint(saved);
      writeMarker(user.id, saved, savedFingerprint);
      return { ok: true, authenticated: true, action: "uploaded-local" };
    }

    preserveConflict(user.id, local, remote.data);
    hydrateRemote(remote.data);
    const hydrated = collectLocalData();
    writeMarker(user.id, remote.data, await fingerprint(hydrated));
    return { ok: true, authenticated: true, action: "conflict-server-wins" };
  } finally {
    syncing = false;
  }
}

function scheduleSync() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; syncNow().catch(() => {}); }, 700);
}

export function initAccountSync() {
  if (initialized || typeof window === "undefined") return () => {};
  initialized = true;
  const offState = onStateChange(() => scheduleSync());
  const onAuth = () => { syncNow().catch(() => {}); };
  window.addEventListener("nhimy:auth-change", onAuth);
  syncNow().catch(() => {});
  return () => {
    offState();
    window.removeEventListener("nhimy:auth-change", onAuth);
    if (timer) clearTimeout(timer);
    timer = null;
    initialized = false;
  };
}

export { SYNC_KEY, CONFLICT_PREFIX, SYNC_VERSION, readMarker, fingerprint, hydrateRemote, syncNow };
