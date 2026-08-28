"use strict";

import { getSummary } from "/js/core/study/storage.js";
import { prepareExplanation } from "./processor.js";
import { processExplanation } from "./intelligence.js";

/*
 * =========================================================
 * NHIMY — ESTUDAR / EXPLICAR
 *
 * Motor inicial de explicação.
 *
 * Entrada:
 * - conteúdo preparado pelo Resumir
 * - conteúdo digitado manualmente
 *
 * Preparado para futura integração com IA.
 * =========================================================
 */

const explainText =
  document.getElementById("explainText");

const explainStart =
  document.getElementById("explainStart");

const explainResult =
  document.getElementById("explainResult");

const explainOutput =
  document.getElementById("explainOutput");


function loadStudyContent() {
  return getSummary();
}

function createExplanation(text) {

  const prepared = prepareExplanation(text);

  return processExplanation(prepared);
}


function renderExplanation(result) {

  if (!explainOutput) {
    return;
  }

  explainOutput.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = result.title;

  const summary = document.createElement("p");
  summary.textContent = result.summary;

  const mainIdeaTitle = document.createElement("h4");
  mainIdeaTitle.textContent = "Ideia principal";

  const mainIdea = document.createElement("p");
  mainIdea.textContent = result.mainIdea;

  const explanationTitle = document.createElement("h4");
  explanationTitle.textContent = "Explicação";

  const explanation = document.createElement("p");
  explanation.textContent = result.explanation;

  const howTitle = document.createElement("h4");
  howTitle.textContent = "Como funciona";

  const how = document.createElement("p");
  how.textContent = result.howItWorks;

  const resultTitle = document.createElement("h4");
  resultTitle.textContent = "O que acontece";

  const resultContent = document.createElement("p");
  resultContent.textContent = result.result;

  const importanceTitle = document.createElement("h4");
  importanceTitle.textContent = "Por que é importante";

  const importance = document.createElement("p");
  importance.textContent = result.importance;

  const exampleTitle = document.createElement("h4");
  exampleTitle.textContent = "Exemplo";

  const example = document.createElement("p");
  example.textContent = result.example;

  explainOutput.append(
    title,
    summary,
    mainIdeaTitle,
    mainIdea,
    explanationTitle,
    explanation,
    howTitle,
    how,
    resultTitle,
    resultContent,
    importanceTitle,
    importance,
    exampleTitle,
    example
  );

  if (
    Array.isArray(result.keyPoints) &&
    result.keyPoints.length
  ) {

    const pointsTitle = document.createElement("h4");
    pointsTitle.textContent = "Pontos importantes";

    const pointsList = document.createElement("div");

    result.keyPoints.forEach(point => {

      const item = document.createElement("p");
      item.textContent = point;

      pointsList.append(item);

    });

    explainOutput.append(
      pointsTitle,
      pointsList
    );
  }

  if (explainResult) {

    explainResult.hidden = false;

    explainResult.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}

function explain() {

  const manualContent =
    explainText
      ? explainText.value.trim()
      : "";

  const storedContent =
    loadStudyContent();

  const content =
    manualContent || storedContent;

  if (!content) {

    if (explainText) {
      explainText.focus();
    }

    return;
  }

  explainStart.disabled = true;

  explainStart.textContent =
    "Explicando...";

  setTimeout(() => {

    try {

      const result =
        createExplanation(content);

      renderExplanation(result);

    } finally {

      explainStart.disabled = false;

      explainStart.textContent =
        "Explicar →";

    }

  }, 400);
}


function prepareStoredContent() {

  const content =
    loadStudyContent();

  if (
    content &&
    explainText &&
    !explainText.value.trim()
  ) {

    explainText.value =
      content;

  }

}


if (explainStart) {

  explainStart.addEventListener(
    "click",
    explain
  );

}


if (explainText) {

  explainText.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        event.ctrlKey
      ) {

        event.preventDefault();

        explain();

      }

    }
  );

}


prepareStoredContent();
