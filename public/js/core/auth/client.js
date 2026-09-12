"use strict";

const AUTH_STATE_EVENT = "nhimy:auth-change";

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  let data = null;
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) {
    const error = new Error(data?.error || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function getCurrentUser() {
  const result = await request("/api/auth/me", { method: "GET", headers: {} });
  return result.user || null;
}

async function register(email, password, name = "") {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name })
  });
  window.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT, { detail: result.user || null }));
  return result.user || null;
}

async function login(email, password) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  window.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT, { detail: result.user || null }));
  return result.user || null;
}

async function logout() {
  await request("/api/auth/logout", { method: "POST", body: "{}" });
  window.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT, { detail: null }));
}

async function changePassword(currentPassword, newPassword) {
  const result = await request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return result.user || null;
}

async function logoutAllSessions() {
  await request("/api/auth/logout-all", { method: "POST", body: "{}" });
  window.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT, { detail: null }));
}

async function deleteAccount(password) {
  await request("/api/auth/account", { method: "DELETE", body: JSON.stringify({ password }) });
  window.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT, { detail: null }));
}

export { AUTH_STATE_EVENT, getCurrentUser, register, login, logout, changePassword, logoutAllSessions, deleteAccount };
