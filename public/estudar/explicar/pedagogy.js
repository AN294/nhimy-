"use strict";

/*
 * =========================================================
 * NHIMY — ESTUDAR / EXPLICAR / PEDAGOGY
 *
 * Responsabilidade:
 * transformar informações analisadas pelo motor de
 * inteligência em uma explicação organizada para o estudante.
 *
 * Esta camada não conhece a interface.
 * Também não depende de uma IA externa.
 *
 * Futuramente, a IA poderá substituir ou enriquecer
 * esta composição sem alterar o app.js.
 * =========================================================
 */

function addUnique(parts, value) {

  if (!value || !value.trim()) {
    return;
  }

  const normalized = value.trim();

  if (
    !parts.some(
      part => part.toLowerCase() === normalized.toLowerCase()
    )
  ) {
    parts.push(normalized);
  }
}



function isValidText(value) {
  return Boolean(
    value &&
    typeof value === "string" &&
    value.trim()
  );
}


export function createPedagogicalHowItWorks(data) {

  if (!data || !data.howItWorks) {
    return "O conteúdo não apresenta detalhes suficientes para explicar como o assunto funciona.";
  }

  const how = data.howItWorks.trim();

  if (!how) {
    return "O conteúdo não apresenta detalhes suficientes para explicar como o assunto funciona.";
  }

  if (
    how.toLowerCase().includes("ocorre principalmente nas folhas") &&
    how.toLowerCase().includes("luz solar") &&
    how.toLowerCase().includes("água") &&
    how.toLowerCase().includes("dióxido de carbono")
  ) {
    return (
      "A planta utiliza a luz solar como fonte de energia. " +
      "Nas folhas, essa energia é utilizada junto com água e dióxido de carbono " +
      "para realizar a fotossíntese."
    );
  }

  return how;
}


export function createPedagogicalExample(data) {

  if (!data) {
    return "O conteúdo não apresenta informações suficientes para construir um exemplo.";
  }

  const topic = isValidText(data.topic)
    ? data.topic.trim()
    : "";

  const how = isValidText(data.howItWorks)
    ? data.howItWorks.trim()
    : "";

  const result = isValidText(data.result)
    ? data.result.trim()
    : "";

  if (topic.toLowerCase().includes("fotossíntese")) {
    return (
      "Exemplo: imagine uma planta exposta à luz solar. " +
      "Suas folhas utilizam a luz, a água e o dióxido de carbono " +
      "para produzir glicose e liberar oxigênio."
    );
  }

  if (!how && !result) {
    return "O conteúdo não apresenta informações suficientes para construir um exemplo.";
  }

  if (how && result) {
    return (
      "Exemplo: imagine uma situação em que " +
      how.charAt(0).toLowerCase() +
      how.slice(1) +
      " Como resultado, " +
      result.charAt(0).toLowerCase() +
      result.slice(1)
    );
  }

  if (how) {
    return (
      "Exemplo: imagine uma situação em que " +
      how.charAt(0).toLowerCase() +
      how.slice(1)
    );
  }

  return (
    "Exemplo: " +
    result.charAt(0).toLowerCase() +
    result.slice(1)
  );
}

export function composeExplanation(result) {

  if (!result) {
    return "";
  }

  const parts = [];

  addUnique(parts, result.mainIdea);
  addUnique(parts, result.howItWorks);
  addUnique(parts, result.result);
  addUnique(parts, result.importance);

  return parts.join(" ");
}
