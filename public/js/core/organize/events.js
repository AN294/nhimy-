"use strict";

/*
 * =========================================================
 * NHIMY — ORGANIZE EVENTS
 *
 * API central de eventos do módulo Organizar.
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

  return `event-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}


function normalizeEvent(event = {}) {
  return {
    id: event.id || generateId(),

    title:
      typeof event.title === "string"
        ? event.title.trim()
        : "",

    description:
      typeof event.description === "string"
        ? event.description.trim()
        : "",

    date:
      typeof event.date === "string"
        ? event.date
        : "",

    time:
      typeof event.time === "string"
        ? event.time
        : "",

    completed: Boolean(event.completed)
  };
}


function createEvent(data = {}) {
  const title =
    typeof data.title === "string"
      ? data.title.trim()
      : "";

  if (!title) {
    return null;
  }

  const state = getState();

  const event = normalizeEvent({
    title,
    description: data.description || "",
    date: data.date || "",
    time: data.time || "",
    completed: false
  });

  state.events.push(event);

  setState(state);

  return event;
}


function getEvents() {
  const state = getState();

  return [...state.events];
}


function getEvent(id) {
  const state = getState();

  return (
    state.events.find(
      event => event.id === id
    ) || null
  );
}


function updateEvent(id, data = {}) {
  const state = getState();

  const index = state.events.findIndex(
    event => event.id === id
  );

  if (index === -1) {
    return null;
  }

  const current = state.events[index];

  const title =
    data.title !== undefined
      ? String(data.title).trim()
      : current.title;

  if (!title) {
    return null;
  }

  const updated = {
    ...current,

    title,

    description:
      data.description !== undefined
        ? String(data.description).trim()
        : current.description,

    date:
      data.date !== undefined
        ? String(data.date)
        : current.date,

    time:
      data.time !== undefined
        ? String(data.time)
        : current.time
  };

  state.events[index] =
    normalizeEvent(updated);

  setState(state);

  return state.events[index];
}


function toggleEvent(id) {
  const state = getState();

  const index = state.events.findIndex(
    event => event.id === id
  );

  if (index === -1) {
    return null;
  }

  state.events[index] = {
    ...state.events[index],

    completed:
      !state.events[index].completed
  };

  setState(state);

  return state.events[index];
}


function deleteEvent(id) {
  const state = getState();

  const index = state.events.findIndex(
    event => event.id === id
  );

  if (index === -1) {
    return false;
  }

  state.events.splice(index, 1);

  setState(state);

  return true;
}


export {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  toggleEvent,
  deleteEvent
};
