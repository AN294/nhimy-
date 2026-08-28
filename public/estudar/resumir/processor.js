"use strict";

/*
 * =========================================================
 * NHIMY — RESUMIR / PROCESSOR
 *
 * Responsabilidade:
 * preparar o conteúdo para o mecanismo de inteligência.
 *
 * A inteligência real ficará atrás desta camada.
 * =========================================================
 */


const MODES = {
  quick: {
    label: "Resumo rápido",
    instruction: "Apresente uma visão geral objetiva do conteúdo."
  },

  detailed: {
    label: "Resumo detalhado",
    instruction: "Organize as ideias principais com maior profundidade."
  },

  points: {
    label: "Pontos principais",
    instruction: "Identifique e organize os pontos mais importantes."
  },

  review: {
    label: "Resumo para revisão",
    instruction: "Organize o conteúdo para facilitar a revisão posterior."
  }
};


export function prepareSummary(content, mode) {

  const cleanContent = content
    .trim()
    .replace(/\\r/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "• ")
    .replace(/^\s*\d+[.)]\s+/gm, match => match.trim() + " ")
    .split(/\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n");

  const selectedMode = MODES[mode] || MODES.quick;

  return {
    content: cleanContent,
    mode,
    label: selectedMode.label,
    instruction: selectedMode.instruction,
    characters: cleanContent.length,
    words: cleanContent
      ? cleanContent.split(/\s+/).length
      : 0
  };
}


export function getSummaryMode(mode) {
  return MODES[mode] || MODES.quick;
}
