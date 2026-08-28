"use strict";

/*
 * =========================================================
 * NHIMY — ORGANIZAR APP
 *
 * Comportamento da página principal de Organizar.
 *
 * A página consulta as APIs centrais de Organizar.
 * Nenhum acesso direto ao sessionStorage.
 * =========================================================
 */

import { getTasks } from "/js/core/organize/tasks.js";
import { getGoals } from "/js/core/organize/goals.js";
import { getNotes } from "/js/core/organize/notes.js";
import { getEvents } from "/js/core/organize/events.js";


const taskCount =
  document.querySelector("#organize-task-count");

const goalCount =
  document.querySelector("#organize-goal-count");

const noteCount =
  document.querySelector("#organize-note-count");

const eventCount =
  document.querySelector("#organize-event-count");


function countPendingTasks(tasks) {
  return tasks.filter(
    task => !task.completed
  ).length;
}


function countActiveGoals(goals) {
  return goals.filter(
    goal => !goal.completed
  ).length;
}


function countUpcomingEvents(events) {
  const now = new Date();

  return events.filter(event => {
    if (!event.date) {
      return false;
    }

    const dateTime = event.time
      ? new Date(`${event.date}T${event.time}`)
      : new Date(`${event.date}T23:59:59`);

    if (Number.isNaN(dateTime.getTime())) {
      return false;
    }

    return dateTime >= now && !event.completed;
  }).length;
}


function renderOverview() {
  const tasks = getTasks();
  const goals = getGoals();
  const notes = getNotes();
  const events = getEvents();


  if (taskCount) {
    taskCount.textContent =
      countPendingTasks(tasks);
  }


  if (goalCount) {
    goalCount.textContent =
      countActiveGoals(goals);
  }


  if (noteCount) {
    noteCount.textContent =
      notes.length;
  }


  if (eventCount) {
    eventCount.textContent =
      countUpcomingEvents(events);
  }
}


renderOverview();
