"use strict";

/*
 * =========================================================
 * NHIMY — ORGANIZE NOTES
 *
 * API central de notas do módulo Organizar.
 *
 * Nenhuma interface deve acessar sessionStorage
 * diretamente.
 * =========================================================
 */

import { getState, setState } from "./storage.js";


function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}


function normalizeNote(note = {}) {
  return {
    id: note.id || generateId(),

    title:
      typeof note.title === "string"
        ? note.title.trim()
        : "",

    content:
      typeof note.content === "string"
        ? note.content.trim()
        : "",

    updatedAt:
      typeof note.updatedAt === "string"
        ? note.updatedAt
        : ""
  };
}


function createNote(data = {}) {
  const title =
    typeof data.title === "string"
      ? data.title.trim()
      : "";

  const content =
    typeof data.content === "string"
      ? data.content.trim()
      : "";

  if (!title && !content) {
    return null;
  }

  const state = getState();

  const note = normalizeNote({
    title,
    content,
    updatedAt: new Date().toISOString()
  });

  state.notes.push(note);

  setState(state);

  return note;
}


function getNotes() {
  const state = getState();

  return [...state.notes];
}


function getNote(id) {
  const state = getState();

  return (
    state.notes.find(
      note => note.id === id
    ) || null
  );
}


function updateNote(id, data = {}) {
  const state = getState();

  const index = state.notes.findIndex(
    note => note.id === id
  );

  if (index === -1) {
    return null;
  }

  const current = state.notes[index];

  const title =
    data.title !== undefined
      ? String(data.title).trim()
      : current.title;

  const content =
    data.content !== undefined
      ? String(data.content).trim()
      : current.content;

  if (!title && !content) {
    return null;
  }

  const updated = {
    ...current,

    title,

    content,

    updatedAt:
      new Date().toISOString()
  };

  state.notes[index] = updated;

  setState(state);

  return updated;
}


function deleteNote(id) {
  const state = getState();

  const index = state.notes.findIndex(
    note => note.id === id
  );

  if (index === -1) {
    return false;
  }

  state.notes.splice(index, 1);

  setState(state);

  return true;
}


export {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote
};
