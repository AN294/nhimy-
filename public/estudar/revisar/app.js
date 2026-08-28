"use strict";

import {
  getSummary,
  setReviewed
} from "/js/core/study/storage.js";

/*
 * =========================================================
 * NHIMY — ESTUDAR / REVISAR
 *
 * Responsabilidade:
 * receber o conteúdo preparado pelo módulo Resumir
 * e apresentá-lo para revisão.
 * =========================================================
 */

const reviewContent = document.getElementById("reviewContent");
const reviewBack = document.getElementById("reviewBack");
const reviewNext = document.getElementById("reviewNext");

function loadStudyContent() {
  const studyContent = getSummary();

  if (!studyContent) {
    return false;
  }

  reviewContent.value = studyContent;

  return true;
}

function initReview() {
  const loaded = loadStudyContent();

  if (!loaded) {
    reviewContent.value =
      "Nenhum conteúdo de estudo foi encontrado.";

    if (reviewNext) {
      reviewNext.disabled = true;
    }

    return false;
  }

  return true;
}

if (reviewBack) {
  reviewBack.addEventListener("click", () => {
    history.back();
  });
}

if (reviewNext) {
  reviewNext.addEventListener("click", () => {
    if (reviewNext.disabled) {
      return;
    }

    setReviewed();

    reviewNext.blur();

    window.location.href = "/estudar/flashcards/";
  });
}

initReview();
