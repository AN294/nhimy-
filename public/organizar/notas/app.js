"use strict";

import {
  createNote,
  getNotes,
  updateNote,
  deleteNote
} from "/js/core/organize/notes.js";


const form = document.querySelector("#note-form");

const titleInput =
  document.querySelector("#note-title");

const contentInput =
  document.querySelector("#note-content");

const noteList =
  document.querySelector("#note-list");

const noteEmpty =
  document.querySelector("#note-empty");

const noteCount =
  document.querySelector("#note-count");


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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("pt-PT", {
    dateStyle: "short",
    timeStyle: "short"
  });
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
    "Adicionar nota";
}


function render() {
  const notes = getNotes();

  noteList.innerHTML = "";

  noteCount.textContent =
    notes.length === 1
      ? "1 nota"
      : `${notes.length} notas`;


  if (!notes.length) {
    noteEmpty.hidden = false;
    return;
  }


  noteEmpty.hidden = true;


  for (const note of notes) {

    const article =
      document.createElement("article");

    article.className = "note-item";

    article.dataset.id = note.id;


    article.innerHTML = `
      <div class="note-main">

        <strong class="note-title">
          ${escapeHtml(note.title || "Sem título")}
        </strong>

        ${
          note.content
            ? `
              <p class="note-content">
                ${escapeHtml(note.content)}
              </p>
            `
            : ""
        }

        ${
          note.updatedAt
            ? `
              <small class="note-date">
                Atualizada em ${escapeHtml(
                  formatDate(note.updatedAt)
                )}
              </small>
            `
            : ""
        }

      </div>


      <div class="note-actions">

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


    noteList.appendChild(article);
  }
}


form.addEventListener("submit", event => {
  event.preventDefault();


  const title =
    titleInput.value.trim();

  const content =
    contentInput.value.trim();


  if (!title && !content) {
    titleInput.focus();
    return;
  }


  if (editingId) {

    const updated =
      updateNote(editingId, {
        title,
        content
      });


    if (!updated) {
      return;
    }


  } else {

    const created =
      createNote({
        title,
        content
      });


    if (!created) {
      return;
    }
  }


  resetForm();

  render();

  titleInput.focus();
});


noteList.addEventListener("click", event => {

  const button =
    event.target.closest(
      "button[data-action]"
    );


  if (!button) {
    return;
  }


  const item =
    button.closest(".note-item");


  if (!item) {
    return;
  }


  const id =
    item.dataset.id;

  const action =
    button.dataset.action;


  if (action === "delete") {

    deleteNote(id);


    if (editingId === id) {
      resetForm();
    }


    render();

    return;
  }


  if (action === "edit") {

    const note =
      getNotes().find(
        item => item.id === id
      );


    if (!note) {
      return;
    }


    editingId = id;

    titleInput.value =
      note.title || "";

    contentInput.value =
      note.content || "";


    getButton().textContent =
      "Salvar alterações";


    titleInput.focus();
  }

});


render();
