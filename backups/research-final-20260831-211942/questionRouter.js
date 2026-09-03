"use strict";

/**
 * NHIMY — Research Question Router
 *
 * Responsabilidade:
 * Transformar uma pergunta de pesquisa em uma
 * instrução estruturada para o sistema Research.
 *
 * Fluxo:
 *
 * pergunta
 *    ↓
 * Section Selector
 *    ↓
 * intenção
 *    ↓
 * tipo de pesquisa
 *    ↓
 * query científica
 *
 * Este módulo NÃO consulta fontes.
 * Este módulo NÃO executa pesquisas.
 */

import {
  selectResearchSection
} from "./sectionSelector.js";


function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


/**
 * Termos científicos relacionados ao contexto
 * de saúde mental durante a gravidez.
 */
const mentalHealthCore = [
  "(anxiety OR depression OR depressive)",
  "\"mental health\"",
  "\"mental disorders\""
];


/**
 * Termos científicos de contexto gestacional.
 */
const pregnancyCore = [
  "pregnancy",
  "pregnant",
  "prenatal",
  "antenatal",
  "perinatal",
  "maternal"
];


/**
 * Constrói uma query científica de acordo
 * com a intenção identificada.
 */
function buildScientificQuery(
  question,
  topic,
  intent
) {
  /*
   * A pergunta original serve para identificar
   * a intenção, mas não deve restringir diretamente
   * a pesquisa científica.
   *
   * A query é construída em três blocos:
   *
   * 1. contexto gestacional
   * 2. condição de saúde mental
   * 3. intenção da pesquisa
   */

  const pregnancyContext =
    "(pregnancy OR pregnant OR prenatal OR antenatal OR perinatal OR maternal)";

  const mentalHealthContext =
    "(anxiety OR depression OR depressive)";

  const intentTerms = {

    definition: [
      "\"mental health\"",
      "\"mental disorder\"",
      "symptoms",
      "diagnosis"
    ],

    factors: [
      "\"risk factors\"",
      "\"associated factors\"",
      "predictors",
      "determinants",
      "causes"
    ],

    symptoms: [
      "symptoms",
      "manifestations",
      "\"clinical symptoms\"",
      "\"anxiety symptoms\"",
      "\"depressive symptoms\""
    ],

    diagnosis: [
      "diagnosis",
      "screening",
      "assessment",
      "\"diagnostic criteria\""
    ],

    consequences: [
      "outcomes",
      "effects",
      "impact",
      "neonatal",
      "preterm",
      "prematurity",
      "\"low birth weight\"",
      "\"maternal outcomes\"",
      "\"infant outcomes\""
    ],

    prevention: [
      "prevention",
      "preventive",
      "intervention",
      "\"risk reduction\""
    ],

    treatment: [
      "treatment",
      "therapy",
      "intervention",
      "management",
      "care"
    ],

    importance: [
      "\"clinical relevance\"",
      "\"maternal health\"",
      "\"prenatal care\""
    ],

    conclusion: [
      "review",
      "evidence",
      "outcomes",
      "synthesis"
    ],

    general: [
      "\"mental health\"",
      "symptoms",
      "diagnosis"
    ]

  };

  const terms =
    intentTerms[intent] ||
    intentTerms.general;

  const intentBlock =
    `(${terms.join(" OR ")})`;

  return [
    pregnancyContext,
    "AND",
    mentalHealthContext,
    "AND",
    intentBlock
  ].join(" ");
}

/**
 * Classifica o tipo de pesquisa.
 *
 * Isso será útil posteriormente para o Collector
 * escolher como tratar as fontes.
 */
function getResearchType(intent) {
  switch (intent) {
    case "definition":
      return "concept";

    case "factors":
      return "etiology";

    case "symptoms":
      return "clinical";

    case "diagnosis":
      return "diagnostic";

    case "consequences":
      return "outcomes";

    case "prevention":
      return "prevention";

    case "treatment":
      return "intervention";

    case "importance":
      return "clinical-relevance";

    case "conclusion":
      return "synthesis";

    default:
      return "general";
  }
}


/**
 * Cria uma rota completa para uma pergunta.
 */
export function routeResearchQuestion(
  question,
  {
    topic = "",
    sections = []
  } = {}
) {
  if (
    typeof question !== "string" ||
    !question.trim()
  ) {
    throw new Error(
      "Pergunta de pesquisa inválida."
    );
  }


  const sectionResult =
    selectResearchSection(
      question,
      { sections }
    );


  const researchType =
    getResearchType(
      sectionResult.intent
    );


  const query =
    buildScientificQuery(
      question,
      topic,
      sectionResult.intent
    );


  return {
    question: question.trim(),

    topic: String(topic || "").trim(),

    section: sectionResult.section,

    intent: sectionResult.intent,

    confidence: sectionResult.confidence,

    reason: sectionResult.reason,

    researchType,

    query,

    status: "ready"
  };
}
