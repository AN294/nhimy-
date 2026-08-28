"use strict";

/*
 * =========================================================
 * NHIMY — STUDY STORAGE
 *
 * Fonte central do estado de estudo.
 *
 * Nenhum módulo de Estudar deve precisar conhecer
 * diretamente as chaves do sessionStorage.
 * =========================================================
 */

const KEYS = Object.freeze({
  summary: "nhimy.study.summary",
  reviewed: "nhimy.study.reviewed",
  quizCompleted: "nhimy.study.quizCompleted",
  quizResult: "nhimy.study.quizResult"
});


function read(key) {
  const stored = sessionStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(
      `Erro ao ler estado de estudo: ${key}`,
      error
    );

    return null;
  }
}


function write(key, value) {
  sessionStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


function getSummary() {
  const data = read(KEYS.summary);

  if (
    !data ||
    typeof data.result !== "string"
  ) {
    return null;
  }

  return data.result;
}


function getSummaryRequest() {
  const data = read(KEYS.summary);

  if (
    !data ||
    !data.request ||
    typeof data.request !== "object"
  ) {
    return null;
  }

  return {
    mode:
      typeof data.request.mode === "string"
        ? data.request.mode
        : null,

    label:
      typeof data.request.label === "string"
        ? data.request.label
        : null,

    instruction:
      typeof data.request.instruction === "string"
        ? data.request.instruction
        : null
  };
}


function setSummary(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  if (
    typeof data.result !== "string" ||
    !data.result.trim()
  ) {
    return false;
  }

  const request =
    data.request &&
    typeof data.request === "object"
      ? {
          mode:
            typeof data.request.mode === "string"
              ? data.request.mode
              : null,

          label:
            typeof data.request.label === "string"
              ? data.request.label
              : null,

          instruction:
            typeof data.request.instruction === "string"
              ? data.request.instruction
              : null
        }
      : null;

  write(KEYS.summary, {
    result: data.result.trim(),
    request
  });

  return true;
}


function setReviewed(value = true) {
  write(KEYS.reviewed, Boolean(value));
}


function isReviewed() {
  return read(KEYS.reviewed) === true;
}


function setQuizResult(score, total) {
  write(KEYS.quizResult, {
    score,
    total
  });

  write(
    KEYS.quizCompleted,
    true
  );
}


function getQuizResult() {
  return read(KEYS.quizResult);
}


function isQuizCompleted() {
  return read(KEYS.quizCompleted) === true;
}


export {
  KEYS,
  getSummary,
  getSummaryRequest,
  setSummary,
  setReviewed,
  isReviewed,
  setQuizResult,
  getQuizResult,
  isQuizCompleted
};
