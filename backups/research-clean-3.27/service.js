"use strict";

/**
 * NHIMY — Work Research Service
 *
 * Orquestra o fluxo completo de Research.
 *
 * Fluxo:
 *
 * request
 *   ↓
 * Collector
 *   ↓
 * findings + sources
 *   ↓
 * Research Result
 *
 * O Service não pesquisa diretamente.
 * O Collector é responsável pela coleta externa.
 */

import {
  collectResearch as collectResearchFromCollector
} from "./collector.js";

import {
  createResearchResult
} from "../research.js";

import {
  buildResearchRequest
} from "./requestBuilder.js";


/**
 * Valida uma solicitação de pesquisa.
 */
export function validateResearchRequest(request) {
  if (
    !request ||
    typeof request !== "object"
  ) {
    return {
      valid: false,
      error: "Research request inválido."
    };
  }

  if (
    request.type !== "work-research-request"
  ) {
    return {
      valid: false,
      error: "Tipo de Research request inválido."
    };
  }

  if (
    typeof request.topic !== "string" ||
    !request.topic.trim()
  ) {
    return {
      valid: false,
      error: "O tema da pesquisa é obrigatório."
    };
  }

  const hasQuestions =
    Array.isArray(request.questions) &&
    request.questions.length > 0;

  const hasResearchUnits =
    Array.isArray(request.researchUnits) &&
    request.researchUnits.length > 0;

  if (
    !hasQuestions &&
    !hasResearchUnits
  ) {
    return {
      valid: false,
      error: "As perguntas ou unidades de pesquisa são obrigatórias."
    };
  }

  return {
    valid: true
  };
}


/**
 * Executa a pesquisa completa.
 *
 * request
 *   ↓
 * validation
 *   ↓
 * collector
 *   ↓
 * research result
 */
export async function collectResearch(request) {
  const validation =
    validateResearchRequest(request);

  if (!validation.valid) {
    throw new Error(
      validation.error
    );
  }

  const normalizedRequest =
    Array.isArray(request.researchUnits) &&
    request.researchUnits.length > 0
      ? request
      : buildResearchRequest({
          topic:
            request.topic,

          subject:
            request.subject,

          questions:
            request.questions,

          sections:
            request.sections,

          sourcePolicy:
            request.sourcePolicy
        });

  const collected =
    await collectResearchFromCollector(
      normalizedRequest
    );

  return createResearchResult({
    topic:
      collected.topic,

    findings:
      collected.findings,

    sources:
      collected.findings
        .flatMap(
          finding =>
            Array.isArray(finding.sources)
              ? finding.sources
              : []
        )
  });
}
