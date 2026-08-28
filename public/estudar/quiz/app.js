"use strict";

import {
  getSummary,
  setQuizResult
} from "/js/core/study/storage.js";

/*
 * =========================================================
 * NHIMY — ESTUDAR / QUIZ
 *
 * Motor inicial do Quiz.
 * Fonte: conteúdo preparado pelo módulo Resumir.
 * =========================================================
 */

const quizProgress =
  document.getElementById("quizProgress");

const quizQuestion =
  document.getElementById("quizQuestion");

const quizOptions =
  document.getElementById("quizOptions");

const quizFeedback =
  document.getElementById("quizFeedback");

const quizBack =
  document.getElementById("quizBack");

const quizStart =
  document.getElementById("quizStart");


let questions = [];
let currentQuestion = 0;
let answered = false;
let score = 0;


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


function createQuestions(text) {

  const blocks = extractBlocks(text);

  return blocks
    .slice(0, 5)
    .map((block, index) => ({

      id: index + 1,

      question:
        `Qual é a ideia principal deste conteúdo?\n\n"${createTitle(block)}"`,

      options: [
        {
          value: "A",
          label: block,
          correct: true
        },
        {
          value: "B",
          label:
            "É um processo sem relação com os seres vivos.",
          correct: false
        },
        {
          value: "C",
          label:
            "É um conceito limitado apenas à atmosfera.",
          correct: false
        },
        {
          value: "D",
          label:
            "É um fenômeno que ocorre somente no solo.",
          correct: false
        }
      ]

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


function renderQuestion() {

  if (!quizQuestion || !quizOptions) {
    return;
  }

  if (!questions.length) {

    if (quizProgress) {
      quizProgress.textContent = "Sem questões";
    }

    quizQuestion.textContent =
      "Não foi possível criar questões a partir deste conteúdo.";

    quizOptions.innerHTML = "";

    return;
  }

  const question =
    questions[currentQuestion];

  answered = false;

  if (quizProgress) {
    quizProgress.textContent =
      `Questão ${currentQuestion + 1} de ${questions.length}`;
  }

  quizQuestion.textContent =
    question.question;

  quizOptions.innerHTML = "";

  question.options.forEach(option => {

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "quiz-option";
    button.textContent =
      `${option.value}) ${option.label}`;

    button.addEventListener(
      "click",
      () => answerQuestion(option)
    );

    quizOptions.appendChild(button);

  });

  if (quizFeedback) {
    quizFeedback.hidden = true;
    quizFeedback.textContent = "";
  }

  if (quizStart) {
    quizStart.textContent =
      "Escolha uma resposta";
    quizStart.disabled = true;
  }
}


function answerQuestion(option) {

  if (answered) {
    return;
  }

  answered = true;

  if (option.correct) {

    score++;

    if (quizFeedback) {
      quizFeedback.hidden = false;
      quizFeedback.textContent =
        "✓ Resposta correta. Muito bem!";
    }

  } else {

    if (quizFeedback) {
      quizFeedback.hidden = false;
      quizFeedback.textContent =
        "Resposta incorreta. Reveja o conteúdo e tente novamente.";
    }
  }

  const buttons =
    quizOptions.querySelectorAll(
      ".quiz-option"
    );

  buttons.forEach(button => {
    button.disabled = true;
  });

  if (quizStart) {
    quizStart.disabled = false;

    quizStart.textContent =
      currentQuestion + 1 < questions.length
        ? "Próxima questão →"
        : "Concluir Quiz →";
  }
}


function nextQuestion() {

  if (!answered) {
    return;
  }

  currentQuestion++;

  if (currentQuestion >= questions.length) {

    finishQuiz();

    return;
  }

  renderQuestion();
}


function finishQuiz() {

  if (quizProgress) {
    quizProgress.textContent =
      "Quiz concluído";
  }

  quizQuestion.textContent =
    `Você acertou ${score} de ${questions.length}.`;

  quizOptions.innerHTML = "";

  if (quizFeedback) {
    quizFeedback.hidden = false;
    quizFeedback.textContent =
      "O conteúdo está pronto para a próxima etapa de estudo.";
  }

  if (quizStart) {
    quizStart.textContent =
      "Concluído";

    quizStart.disabled = true;
  }

  setQuizResult(
    score,
    questions.length
  );
}


function initQuiz() {

  const content =
    loadStudyContent();

  if (!content) {

    quizQuestion.textContent =
      "Nenhum conteúdo de estudo foi encontrado.";

    if (quizOptions) {
      quizOptions.innerHTML = "";
    }

    if (quizStart) {
      quizStart.disabled = true;
    }

    return;
  }

  questions =
    createQuestions(content);

  currentQuestion = 0;
  score = 0;

  renderQuestion();
}


if (quizBack) {

  quizBack.addEventListener(
    "click",
    () => {
      history.back();
    }
  );
}


if (quizStart) {

  quizStart.addEventListener(
    "click",
    nextQuestion
  );
}


initQuiz();
