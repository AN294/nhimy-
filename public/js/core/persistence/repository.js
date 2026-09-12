"use strict";

/**
 * NHIMY — contrato de persistência do servidor.
 *
 * O domínio não conhece ficheiros, SQL ou o fornecedor da base de dados.
 * O adapter de ficheiros continua a ser o padrão; o adapter PostgreSQL pode
 * ser ativado explicitamente no servidor, preservando uma transição controlada.
 */

const REQUIRED_METHODS = Object.freeze([
  "getUserData",
  "replaceUserData",
  "deleteUserData"
]);

function validateRepository(repository) {
  if (!repository || typeof repository !== "object") {
    throw new TypeError("Repositório de persistência inválido.");
  }
  for (const method of REQUIRED_METHODS) {
    if (typeof repository[method] !== "function") {
      throw new TypeError(`Repositório sem método obrigatório: ${method}.`);
    }
  }
  return repository;
}

export { REQUIRED_METHODS, validateRepository };
