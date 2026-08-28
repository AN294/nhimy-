"use strict";

/*
 * =========================================================
 * NHIMY — ORGANIZE TASKS
 *
 * API central de tarefas do módulo Organizar.
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

  return `task-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}


function normalizeTask(task = {}) {
  return {
    id: task.id || generateId(),
    title:
      typeof task.title === "string"
        ? task.title.trim()
        : "",
    dueDate:
      typeof task.dueDate === "string"
        ? task.dueDate
        : "",
    completed: Boolean(task.completed)
  };
}


function createTask(data = {}) {
  const title =
    typeof data.title === "string"
      ? data.title.trim()
      : "";

  if (!title) {
    return null;
  }

  const state = getState();

  const task = normalizeTask({
    title,
    dueDate: data.dueDate || "",
    completed: false
  });

  state.tasks.push(task);

  setState(state);

  return task;
}


function getTasks() {
  const state = getState();

  return [...state.tasks];
}


function getTask(id) {
  const state = getState();

  return (
    state.tasks.find(
      task => task.id === id
    ) || null
  );
}


function updateTask(id, data = {}) {
  const state = getState();

  const index = state.tasks.findIndex(
    task => task.id === id
  );

  if (index === -1) {
    return null;
  }

  const current = state.tasks[index];

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
    dueDate:
      data.dueDate !== undefined
        ? String(data.dueDate)
        : current.dueDate
  };

  state.tasks[index] = updated;

  setState(state);

  return updated;
}


function toggleTask(id) {
  const state = getState();

  const index = state.tasks.findIndex(
    task => task.id === id
  );

  if (index === -1) {
    return null;
  }

  state.tasks[index] = {
    ...state.tasks[index],
    completed:
      !state.tasks[index].completed
  };

  setState(state);

  return state.tasks[index];
}


function deleteTask(id) {
  const state = getState();

  const index = state.tasks.findIndex(
    task => task.id === id
  );

  if (index === -1) {
    return false;
  }

  state.tasks.splice(index, 1);

  setState(state);

  return true;
}


export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  toggleTask,
  deleteTask
};
