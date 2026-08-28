"use strict";
import { prepareSummary } from "./processor.js";
import { setSummary } from "/js/core/study/storage.js";
import { processSummary } from "./intelligence.js";

/*
 * =========================================================
 * NHIMY — ESTUDAR / RESUMIR
 * Experiência de resumo
 * =========================================================
 */

const summaryText = document.getElementById("summaryText");
const summaryMode = document.getElementById("summaryMode");
const summaryStart = document.getElementById("summaryStart");

const summaryResult = document.getElementById("summaryResult");
const summaryOutput = document.getElementById("summaryOutput");
const summaryEdit = document.getElementById("summaryEdit");
const summaryContinue = document.getElementById("summaryContinue");

let currentStudyContent = null;


function removeMessage() {
  const message = document.getElementById("summaryMessage");

  if (message) {
    message.remove();
  }
}


function showMessage(type, title, text) {

  removeMessage();

  const message = document.createElement("div");

  message.id = "summaryMessage";
  message.className = `message message-${type}`;

  message.innerHTML = `
    <span class="message-icon" aria-hidden="true">ℹ</span>

    <div class="message-content">
      <strong class="message-title">${title}</strong>
      <span class="message-text">${text}</span>
    </div>
  `;

  summaryStart.parentElement.insertAdjacentElement(
    "beforebegin",
    message
  );
}


function validateInput() {

  const content = summaryText.value.trim();

  if (!content) {

    showMessage(
      "warning",
      "Adicione um conteúdo",
      "Cole ou escreva o conteúdo que você quer trabalhar antes de continuar."
    );

    summaryText.focus();

    return false;
  }

  if (content.length < 50) {

    showMessage(
      "warning",
      "Conteúdo muito curto",
      "Adicione um pouco mais de conteúdo para que possamos trabalhar melhor com ele."
    );

    summaryText.focus();

    return false;
  }

  return true;
}




function startSummary() {

  if (!validateInput()) {
    return;
  }

  const content = summaryText.value.trim();
  const mode = summaryMode.value;

  removeMessage();

  summaryStart.disabled = true;
  summaryStart.textContent = "Preparando...";

  setTimeout(() => {

    const prepared = prepareSummary(
      content,
      mode
    );

    const result = processSummary(prepared);

    currentStudyContent = result;

    summaryOutput.value = [
      `Modo: ${result.label}`,
      "",
      result.result,
      "",
      `Palavras: ${result.words}`,
      `Caracteres: ${result.characters}`,
      "",
      result.instruction
    ].join("\n");

    summaryResult.hidden = false;

    summaryStart.disabled = false;
    summaryStart.textContent = "Resumir →";

    summaryResult.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }, 500);
}


function editSummary() {

  summaryText.focus();

  summaryText.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


function continueSummary() {

  if (!currentStudyContent) {
    showMessage(
      "warning",
      "Nenhum resultado disponível",
      "Primeiro prepare o conteúdo para continuar."
    );

    return;
  }
    setSummary({
      result: currentStudyContent.result,
      request: {
        mode: currentStudyContent.mode,
        label: currentStudyContent.label,
        instruction: currentStudyContent.instruction
      }
    });

  summaryContinue.blur();

  window.location.href = "/estudar/revisar/";
}


if (summaryStart) {
  summaryStart.addEventListener("click", startSummary);
}

if (summaryEdit) {
  summaryEdit.addEventListener("click", editSummary);
}

if (summaryContinue) {
  summaryContinue.addEventListener("click", continueSummary);
}
