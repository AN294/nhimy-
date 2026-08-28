"use strict";

import {
  createTask,
  getTasks,
  updateTask,
  toggleTask,
  deleteTask
} from "/js/core/organize/tasks.js";

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const dueDateInput = document.querySelector("#task-due-date");
const taskList = document.querySelector("#task-list");
const taskEmpty = document.querySelector("#task-empty");
const taskCount = document.querySelector("#task-count");

let editingId = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "";

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return parts.reverse().join("/");
}

function render() {
  const tasks = getTasks();

  taskList.innerHTML = "";

  const completed = tasks.filter(task => task.completed).length;

  taskCount.textContent =
    tasks.length === 1
      ? "1 tarefa"
      : `${tasks.length} tarefas`;

  if (!tasks.length) {
    taskEmpty.hidden = false;
    return;
  }

  taskEmpty.hidden = true;

  for (const task of tasks) {
    const article = document.createElement("article");

    article.className =
      "task-item" +
      (task.completed ? " is-completed" : "");

    article.dataset.id = task.id;

    article.innerHTML = `
      <div class="task-check">
        <button
          type="button"
          class="task-toggle"
          data-action="toggle"
          aria-label="${task.completed ? "Reabrir tarefa" : "Concluir tarefa"}"
          title="${task.completed ? "Reabrir tarefa" : "Concluir tarefa"}"
        >
          ${task.completed ? "✓" : ""}
        </button>
      </div>

      <div class="task-main">
        <strong class="task-title">
          ${escapeHtml(task.title)}
        </strong>

        ${task.dueDate
          ? `<small class="task-due">📅 ${formatDate(task.dueDate)}</small>`
          : ""}
      </div>

      <div class="task-actions">

        <button
          type="button"
          class="btn btn-sm btn-secondary"
          data-action="edit"
        >
          Editar
        </button>

        <button
          type="button"
          class="btn btn-sm btn-ghost"
          data-action="delete"
        >
          Excluir
        </button>

      </div>
    `;

    taskList.appendChild(article);
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const dueDate = dueDateInput.value;

  if (!title) {
    titleInput.focus();
    return;
  }

  if (editingId) {
    const updated = updateTask(editingId, {
      title,
      dueDate
    });

    if (!updated) {
      return;
    }

    editingId = null;
    form.querySelector("button[type=submit]").textContent =
      "Adicionar tarefa";
  } else {
    createTask({
      title,
      dueDate
    });
  }

  form.reset();
  render();
  titleInput.focus();
});

taskList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const item = button.closest(".task-item");

  if (!item) {
    return;
  }

  const id = item.dataset.id;
  const action = button.dataset.action;

  if (action === "toggle") {
    toggleTask(id);
    render();
    return;
  }

  if (action === "delete") {
    deleteTask(id);

    if (editingId === id) {
      editingId = null;
      form.reset();

      form.querySelector("button[type=submit]").textContent =
        "Adicionar tarefa";
    }

    render();
    return;
  }

  if (action === "edit") {
    const task = getTasks().find(item => item.id === id);

    if (!task) {
      return;
    }

    editingId = id;

    titleInput.value = task.title;
    dueDateInput.value = task.dueDate || "";

    form.querySelector("button[type=submit]").textContent =
      "Salvar alterações";

    titleInput.focus();
  }
});

render();
