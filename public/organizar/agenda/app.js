"use strict";

import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  toggleEvent
} from "/js/core/organize/events.js";


const form =
  document.querySelector("#event-form");

const titleInput =
  document.querySelector("#event-title");

const dateInput =
  document.querySelector("#event-date");

const timeInput =
  document.querySelector("#event-time");

const descriptionInput =
  document.querySelector("#event-description");

const eventList =
  document.querySelector("#event-list");

const eventEmpty =
  document.querySelector("#event-empty");

const eventCount =
  document.querySelector("#event-count");


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

  const parts =
    String(value).split("-");

  if (parts.length !== 3) {
    return "";
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


function formatTime(value) {
  if (!value) {
    return "";
  }

  return String(value);
}


function eventTimestamp(event) {
  if (!event.date) {
    return Number.POSITIVE_INFINITY;
  }

  const time =
    event.time || "23:59";

  const timestamp =
    new Date(
      `${event.date}T${time}`
    ).getTime();

  return Number.isNaN(timestamp)
    ? Number.POSITIVE_INFINITY
    : timestamp;
}


function sortEvents(events) {
  return [...events].sort(
    (a, b) => {
      const timeA =
        eventTimestamp(a);

      const timeB =
        eventTimestamp(b);

      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return String(a.title || "")
        .localeCompare(
          String(b.title || ""),
          "pt"
        );
    }
  );
}


function getButton() {
  return form.querySelector(
    "button[type=submit]"
  );
}


function resetForm() {
  editingId = null;

  form.reset();

  getButton().textContent =
    "Adicionar compromisso";
}


function render() {
  const events =
    sortEvents(getEvents());

  eventList.innerHTML = "";

  eventCount.textContent =
    events.length === 1
      ? "1 compromisso"
      : `${events.length} compromissos`;


  if (!events.length) {
    eventEmpty.hidden = false;
    return;
  }


  eventEmpty.hidden = true;


  for (const event of events) {
    const article =
      document.createElement("article");

    article.className = "event-item";

    if (event.completed) {
      article.classList.add(
        "event-item-completed"
      );
    }

    article.dataset.id =
      event.id;


    const dateText =
      formatDate(event.date);

    const timeText =
      formatTime(event.time);


    article.innerHTML = `
      <div class="event-check">
        <button
          type="button"
          class="event-toggle"
          data-action="toggle"
          aria-label="${
            event.completed
              ? "Marcar como pendente"
              : "Marcar como concluído"
          }"
          title="${
            event.completed
              ? "Marcar como pendente"
              : "Marcar como concluído"
          }"
        >
          ${event.completed ? "✓" : ""}
        </button>
      </div>

      <div class="event-main">

        <strong class="event-title">
          ${escapeHtml(
            event.title || "Sem título"
          )}
        </strong>

        ${
          dateText || timeText
            ? `
              <small class="event-date">
                ${
                  dateText
                    ? escapeHtml(dateText)
                    : ""
                }${
                  dateText && timeText
                    ? " • "
                    : ""
                }${
                  timeText
                    ? escapeHtml(timeText)
                    : ""
                }
              </small>
            `
            : ""
        }

        ${
          event.description
            ? `
              <p class="event-description">
                ${escapeHtml(
                  event.description
                )}
              </p>
            `
            : ""
        }

      </div>


      <div class="event-actions">

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


    eventList.appendChild(article);
  }
}


form.addEventListener(
  "submit",
  event => {
    event.preventDefault();


    const title =
      titleInput.value.trim();

    const date =
      dateInput.value;

    const time =
      timeInput.value;

    const description =
      descriptionInput.value.trim();


    if (!title) {
      titleInput.focus();
      return;
    }


    if (editingId) {
      const updated =
        updateEvent(editingId, {
          title,
          date,
          time,
          description
        });


      if (!updated) {
        return;
      }

    } else {
      const created =
        createEvent({
          title,
          date,
          time,
          description
        });


      if (!created) {
        return;
      }
    }


    resetForm();

    render();

    titleInput.focus();
  }
);


eventList.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {
      return;
    }


    const item =
      button.closest(
        ".event-item"
      );


    if (!item) {
      return;
    }


    const id =
      item.dataset.id;

    const action =
      button.dataset.action;


    if (action === "toggle") {
      toggleEvent(id);

      render();

      return;
    }


    if (action === "delete") {
      deleteEvent(id);


      if (editingId === id) {
        resetForm();
      }


      render();

      return;
    }


    if (action === "edit") {
      const current =
        getEvents().find(
          item => item.id === id
        );


      if (!current) {
        return;
      }


      editingId = id;


      titleInput.value =
        current.title || "";

      dateInput.value =
        current.date || "";

      timeInput.value =
        current.time || "";

      descriptionInput.value =
        current.description || "";


      getButton().textContent =
        "Salvar alterações";


      titleInput.focus();
    }
  }
);


render();
