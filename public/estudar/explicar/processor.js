"use strict";

/*
 * =========================================================
 * NHIMY — ESTUDAR / EXPLICAR / PROCESSOR
 *
 * Responsabilidade:
 * preparar o conteúdo antes do mecanismo de explicação.
 *
 * A inteligência real ficará atrás desta camada.
 * =========================================================
 */

export function prepareExplanation(content) {

  const cleanContent = content
    .trim()
    .replace(/\r/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .split(/\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n");

  return {
    content: cleanContent,

    characters: cleanContent.length,

    words: cleanContent
      ? cleanContent.split(/\s+/).length
      : 0
  };
}
