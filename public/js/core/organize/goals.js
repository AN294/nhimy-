"use strict";

/*
 * =========================================================
 * NHIMY — ORGANIZE GOALS
 *
 * API central de metas do módulo Organizar.
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

  return `goal-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}


function normalizeGoal(goal = {}) {
  return {
    id: goal.id || generateId(),

    title:
      typeof goal.title === "string"
        ? goal.title.trim()
        : "",

    description:
      typeof goal.description === "string"
        ? goal.description.trim()
        : "",

    targetDate:
      typeof goal.targetDate === "string"
        ? goal.targetDate
        : "",

    completed: Boolean(goal.completed)
  };
}


function createGoal(data = {}) {
  const title =
    typeof data.title === "string"
      ? data.title.trim()
      : "";

  if (!title) {
    return null;
  }

  const state = getState();

  const goal = normalizeGoal({
    title,
    description: data.description || "",
    targetDate: data.targetDate || "",
    completed: false
  });

  state.goals.push(goal);

  setState(state);

  return goal;
}


function getGoals() {
  const state = getState();

  return [...state.goals];
}


function getGoal(id) {
  const state = getState();

  return (
    state.goals.find(
      goal => goal.id === id
    ) || null
  );
}


function updateGoal(id, data = {}) {
  const state = getState();

  const index = state.goals.findIndex(
    goal => goal.id === id
  );

  if (index === -1) {
    return null;
  }

  const current = state.goals[index];

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

    targetDate:
      data.targetDate !== undefined
        ? String(data.targetDate)
        : current.targetDate
  };

  state.goals[index] = updated;

  setState(state);

  return updated;
}


function toggleGoal(id) {
  const state = getState();

  const index = state.goals.findIndex(
    goal => goal.id === id
  );

  if (index === -1) {
    return null;
  }

  state.goals[index] = {
    ...state.goals[index],

    completed:
      !state.goals[index].completed
  };

  setState(state);

  return state.goals[index];
}


function deleteGoal(id) {
  const state = getState();

  const index = state.goals.findIndex(
    goal => goal.id === id
  );

  if (index === -1) {
    return false;
  }

  state.goals.splice(index, 1);

  setState(state);

  return true;
}


export {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  toggleGoal,
  deleteGoal
};
