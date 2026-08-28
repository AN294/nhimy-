"use strict";
import { getSummary } from "/js/core/study/storage.js";

/*
 * =========================================================
 * NHIMY — ESTUDAR / FLASHCARDS
 *
 * Motor inicial de Flashcards
 * Fonte: conteúdo preparado pelo módulo Resumir.
 * =========================================================
 */

const flashcardProgress =
  document.getElementById("flashcardProgress");

const flashcardQuestion =
  document.getElementById("flashcardQuestion");

const flashcardAnswer =
  document.getElementById("flashcardAnswer");

const flashcardBack =
  document.getElementById("flashcardBack");

const flashcardStart =
  document.getElementById("flashcardStart");

const flashcardQuiz =
  document.getElementById("flashcardQuiz");


let cards = [];
let currentCard = 0;
let showingAnswer = false;


function loadStudyContent() {
  return getSummary();
}


function extractBlocks(text) {

  return text
    .split(/\n+/)
    .map(block => block.trim())
    .filter(Boolean)
    .filter(block => !/^Modo:/i.test(block))
    .filter(block => !/^Palavras:/i.test(block))
    .filter(block => !/^Caracteres:/i.test(block))
    .filter(block => !/^Identifique e organize/i.test(block))
    .map(block =>
      block
        .replace(/^•\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim()
    )
    .filter(block => block.length >= 35);
}


function createFlashcards(text) {

  const blocks = extractBlocks(text);

  return blocks
    .slice(0, 10)
    .map((block, index) => ({
      id: index + 1,
      question:
        `O que você precisa lembrar sobre: "${createTitle(block)}"?`,
      answer: block
    }));
}


function createTitle(block) {

  const words = block.split(/\s+/);

  if (words.length <= 8) {
    return block;
  }

  return words
    .slice(0, 8)
    .join(" ")
    .replace(/[.,;:]$/, "") + "…";
}


function renderCard() {

  if (!flashcardQuestion || !flashcardAnswer) {
    return;
  }

  if (!cards.length) {

    if (flashcardProgress) {
      flashcardProgress.textContent = "Sem cards";
    }

    flashcardQuestion.textContent =
      "Não foi possível criar flashcards a partir deste conteúdo.";

    flashcardAnswer.textContent = "";

    return;
  }

  const card = cards[currentCard];

  showingAnswer = false;

  if (flashcardProgress) {
    flashcardProgress.textContent =
      `Card ${currentCard + 1} de ${cards.length}`;
  }

  flashcardQuestion.textContent =
    card.question;

  flashcardAnswer.textContent =
    'Clique em "Mostrar resposta" para revelar.';

    flashcardAnswer.hidden = true;

  if (flashcardStart) {
    flashcardStart.textContent =
      "Mostrar resposta →";
  }
}


function showAnswer() {

  if (!cards.length) {
    return;
  }

  const card = cards[currentCard];

  showingAnswer = true;

  if (flashcardProgress) {
    flashcardProgress.textContent =
      `Card ${currentCard + 1} de ${cards.length}`;
  }

  flashcardQuestion.textContent =
    card.question;

  flashcardAnswer.textContent =
    card.answer;

    flashcardAnswer.hidden = false;

  if (flashcardStart) {
    flashcardStart.textContent =
      currentCard + 1 < cards.length
        ? "Próximo card →"
        : "Concluir →";
  }
}


function nextCard() {

  if (!cards.length) {
    return;
  }

  if (!showingAnswer) {
    showAnswer();
    return;
  }

  currentCard++;

  if (currentCard >= cards.length) {

    if (flashcardProgress) {
      flashcardProgress.textContent =
        "Flashcards concluídos";
    }

    flashcardQuestion.textContent =
      `Você revisou ${cards.length} cards.`;

    flashcardAnswer.textContent =
      "O conteúdo está pronto para a próxima etapa de estudo.";

    if (flashcardStart) {
      flashcardStart.textContent =
        "Concluído";

      flashcardStart.disabled = true;
    }

    if (flashcardQuiz) {
      flashcardQuiz.hidden = false;
    }

    return;
  }

  renderCard();
}


function initFlashcards() {

  const studyText = loadStudyContent();

  if (!studyText) {

    if (flashcardProgress) {
      flashcardProgress.textContent = "Sem conteúdo";
    }

    flashcardQuestion.textContent =
      "Nenhum conteúdo de estudo foi encontrado.";

    flashcardAnswer.textContent = "";

    if (flashcardStart) {
      flashcardStart.disabled = true;
    }

    return;
  }

  cards = createFlashcards(studyText);

  currentCard = 0;

  renderCard();
}


if (flashcardBack) {

  flashcardBack.addEventListener(
    "click",
    () => {
      history.back();
    }
  );
}


if (flashcardStart) {

  flashcardStart.addEventListener(
    "click",
    nextCard
  );
}


initFlashcards();
