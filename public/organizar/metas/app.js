"use strict";

import {
  createGoal,
  getGoals,
  updateGoal,
  toggleGoal,
  deleteGoal
} from "/js/core/organize/goals.js";


const form = document.querySelector("#goal-form");
const titleInput = document.querySelector("#goal-title");
const descriptionInput = document.querySelector("#goal-description");
const targetDateInput = document.querySelector("#goal-target-date");

const goalList = document.querySelector("#goal-list");
const goalEmpty = document.querySelector("#goal-empty");
const goalCount = document.querySelector("#goal-count");

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
  if (!value) {
    return "";
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return parts.reverse().join("/");
}


function render() {
  const goals = getGoals();

  goalList.innerHTML = "";

  const completed = goals.filter(
    goal => goal.completed
  ).length;

  goalCount.textContent =
    goals.length === 1
      ? "1 meta"
      : `${goals.length} metas`;

  if (!goals.length) {
    goalEmpty.hidden = false;
    return;
  }

  goalEmpty.hidden = true;

  for (const goal of goals) {
    const article = document.createElement("article");

    article.className =
      "goal-item" +
      (goal.completed ? " is-completed" : "");

    article.dataset.id = goal.id;

    article.innerHTML = `
      <div class="goal-check">
        <button
          type="button"
          class="goal-toggle"
          data-action="toggle"
          aria-label="${
            goal.completed
              ? "Reabrir meta"
              : "Concluir meta"
          }"
          title="${
            goal.completed
              ? "Reabrir meta"
              : "Concluir meta"
          }"
        >
          ${goal.completed ? "✓" : ""}
        </button>
      </div>

      <div class="goal-main">

        <strong class="goal-title">
          ${escapeHtml(goal.title)}
        </strong>

        ${
          goal.description
            ? `
              <p class="goal-description">
                ${escapeHtml(goal.description)}
              </p>
            `
            : ""
        }

        ${
          goal.targetDate
            ? `
              <small class="goal-date">
                🎯 ${formatDate(goal.targetDate)}
              </small>
            `
            : ""
        }

      </div>

      <div class="goal-actions">

        <button
          type="button"
          class="btn btn-sm btn-secondary"
          data-action="edit"
        >
          Editar
        </button>

        <button
          type="button"
          class="btn btn-sm btn-secondary"
          data-action="delete"
        >
          Excluir
        </button>

      </div>
    `;

    goalList.appendChild(article);
  }
}


form.addEventListener("submit", event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const targetDate = targetDateInput.value;

  if (!title) {
    titleInput.focus();
    return;
  }

  if (editingId) {
    const updated = updateGoal(editingId, {
      title,
      description,
      targetDate
    });

    if (!updated) {
      return;
    }

    editingId = null;

    form.querySelector(
      "button[type=submit]"
    ).textContent = "Adicionar meta";

  } else {
    createGoal({
      title,
      description,
      targetDate
    });
  }

  form.reset();

  render();

  titleInput.focus();
});


goalList.addEventListener("click", event => {
  const button = event.target.closest(
    "button[data-action]"
  );

  if (!button) {
    return;
  }

  const item = button.closest(".goal-item");

  if (!item) {
    return;
  }

  const id = item.dataset.id;
  const action = button.dataset.action;


  if (action === "toggle") {
    toggleGoal(id);
    render();
    return;
  }


  if (action === "delete") {
    deleteGoal(id);

    if (editingId === id) {
      editingId = null;

      form.reset();

      form.querySelector(
        "button[type=submit]"
      ).textContent = "Adicionar meta";
    }

    render();
    return;
  }


  if (action === "edit") {
    const goal = getGoals().find(
      item => item.id === id
    );

    if (!goal) {
      return;
    }

    editingId = id;

    titleInput.value = goal.title;
    descriptionInput.value =
      goal.description || "";
    targetDateInput.value =
      goal.targetDate || "";

    form.querySelector(
      "button[type=submit]"
    ).textContent = "Salvar alterações";

    titleInput.focus();
  }
});


render();
