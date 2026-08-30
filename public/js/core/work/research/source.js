"use strict";

/**
 * NHIMY — Work Research Source
 *
 * Responsabilidade:
 * Validar e normalizar fontes de pesquisa.
 *
 * Este módulo não realiza pesquisa.
 * Ele garante que uma fonte recebida
 * esteja em um formato consistente.
 */


export function isValidSource(source) {
  if (!source || typeof source !== "object") {
    return false;
  }

  if (
    typeof source.title !== "string" ||
    !source.title.trim()
  ) {
    return false;
  }

  if (
    typeof source.url !== "string" ||
    !source.url.trim()
  ) {
    return false;
  }

  return true;
}


export function normalizeSource(source = {}) {
  return {
    title:
      typeof source.title === "string"
        ? source.title.trim()
        : "",

    url:
      typeof source.url === "string"
        ? source.url.trim()
        : "",

    publisher:
      typeof source.publisher === "string"
        ? source.publisher.trim()
        : ""
  };
}


export function createSource(source = {}) {
  if (!isValidSource(source)) {
    return null;
  }

  return normalizeSource(source);
}


export function normalizeSources(sources = []) {
  if (!Array.isArray(sources)) {
    return [];
  }

  return sources
    .map(createSource)
    .filter(Boolean);
}
