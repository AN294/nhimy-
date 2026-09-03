"use strict";

/*
 * =========================================================
 * NHIMY — ORGANIZE STORAGE
 *
 * Fonte central do estado de Organizar.
 *
 * Nenhum módulo de Organizar deve acessar
 * diretamente o sessionStorage.
 * =========================================================
 */

const KEY = "nhimy.organize.state";


function read() {
  const stored = sessionStorage.getItem(KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(
      "Erro ao ler estado de organização.",
      error
    );

    return null;
  }
}


function write(state) {
  sessionStorage.setItem(
    KEY,
    JSON.stringify(state)
  );
}


function createState(data = {}) {
  return {
    tasks:
      Array.isArray(data.tasks)
        ? [...data.tasks]
        : [],

    goals:
      Array.isArray(data.goals)
        ? [...data.goals]
        : [],

    notes:
      Array.isArray(data.notes)
        ? [...data.notes]
        : [],

    events:
      Array.isArray(data.events)
        ? [...data.events]
        : [],

    files:
      Array.isArray(data.files)
        ? [...data.files]
        : []
  };
}


function getState() {
  const state = read();

  if (!state) {
    return createState();
  }

  return createState(state);
}


function setState(state) {
  if (
    !state ||
    typeof state !== "object" ||
    Array.isArray(state)
  ) {
    return false;
  }

  write(createState(state));

  return true;
}


function clearState() {
  sessionStorage.removeItem(KEY);
}


export {
  KEY,
  createState,
  getState,
  setState,
  clearState
};
