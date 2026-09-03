"use strict";

/**
 * NHIMY — Research Request Builder
 *
 * Responsabilidade:
 * Transformar uma rota de pergunta em um
 * work-research-request padronizado.
 *
 * Este módulo NÃO pesquisa fontes.
 * Este módulo NÃO executa providers.
 * Este módulo apenas prepara o contrato
 * que será consumido pelo Collector.
 */

import {
  routeResearchQuestion
} from "./questionRouter.js";


/**
 * Cria uma unidade de pesquisa.
 */
function createResearchUnit(route) {
  return {
    question: route.question,
    section: route.section,
    intent: route.intent,
    researchType: route.researchType,
    confidence: route.confidence,
    query: route.query,

    status: "pending"
  };
}


/**
 * Constrói um work-research-request
 * a partir de uma ou várias perguntas.
 */
export function buildResearchRequest({
  topic = "",
  subject = "",
  questions = [],
  sections = [],
  sourcePolicy = {}
} = {}) {

  if (
    typeof topic !== "string" ||
    !topic.trim()
  ) {
    throw new Error(
      "Tema de pesquisa inválido."
    );
  }


  if (!Array.isArray(questions)) {
    throw new Error(
      "Perguntas de pesquisa inválidas."
    );
  }


  const normalizedQuestions =
    questions
      .filter(
        question =>
          typeof question === "string" &&
          question.trim()
      )
      .map(
        question =>
          question.trim()
      );


  const researchUnits =
    normalizedQuestions.map(
      question =>
        createResearchUnit(
          routeResearchQuestion(
            question,
            {
              topic,
              sections
            }
          )
        )
    );


  return {
    status: "success",

    type: "work-research-request",

    topic: topic.trim(),

    subject:
      typeof subject === "string"
        ? subject.trim()
        : "",

    questions:
      researchUnits.map(
        unit => unit.question
      ),

    researchUnits,

    queries:
      researchUnits.map(
        unit => unit.query
      ),

    sectionTargets:
      researchUnits.map(
        unit => ({
          section: unit.section,
          question: unit.question,
          intent: unit.intent,
          researchType: unit.researchType
        })
      ),

    sourcePolicy: {
      requireSource:
        sourcePolicy.requireSource !== false,

      preserveSourceDetails:
        sourcePolicy.preserveSourceDetails !== false,

      allowStudentMaterials:
        sourcePolicy.allowStudentMaterials !== false,

      allowExternalSources:
        sourcePolicy.allowExternalSources !== false
    },

    nextStep: "collect"
  };
}
