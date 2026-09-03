"use strict";

/**
 * NHIMY — Work Structure Intelligence
 *
 * Responsabilidades:
 * 1. Sugerir estruturas básicas por tipo de trabalho.
 * 2. Evoluir a estrutura com base em Research.
 * 3. Preservar compatibilidade com suggestStructure().
 * 4. Associar tópicos pesquisados às seções.
 */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}


/*
 * ---------------------------------------------------------
 * ESTRUTURA BASE
 * ---------------------------------------------------------
 */

export function suggestStructure({
  type = "",
  orientation = "",
  orientationContext = ""
} = {}) {

  const normalizedType = normalizeText(type);
  const normalizedOrientation = normalizeText(orientation);
  const context = cleanText(orientationContext);

  if (normalizedType === "apresentacao") {
    return [
      "Introdução",
      "Tema principal",
      "Desenvolvimento",
      "Conclusão"
    ];
  }

  if (normalizedType === "relatorio") {
    return [
      "Introdução",
      "Objetivos",
      "Desenvolvimento",
      "Resultados",
      "Conclusão"
    ];
  }

  if (normalizedType === "pesquisa") {
    if (
      normalizedOrientation === "instrucoes" &&
      context
    ) {
      return [
        "Introdução",
        "Contextualização do tema",
        "Desenvolvimento",
        "Análise",
        "Conclusão",
        "Referências"
      ];
    }

    if (
      normalizedOrientation === "inicio" &&
      context
    ) {
      return [
        "Introdução",
        "Desenvolvimento",
        "Análise",
        "Conclusão",
        "Referências"
      ];
    }

    if (
      normalizedOrientation === "ideias" &&
      context
    ) {
      return [
        "Introdução",
        "Organização das ideias",
        "Desenvolvimento",
        "Análise",
        "Conclusão",
        "Referências"
      ];
    }

    return [
      "Introdução",
      "Contextualização do tema",
      "Desenvolvimento",
      "Análise",
      "Conclusão",
      "Referências"
    ];
  }

  if (normalizedType === "trabalho-escolar") {
    return [
      "Introdução",
      "Desenvolvimento",
      "Conclusão"
    ];
  }

  return [
    "Introdução",
    "Desenvolvimento",
    "Conclusão"
  ];
}


/*
 * ---------------------------------------------------------
 * EXTRAÇÃO DE TÓPICOS DA RESEARCH
 * ---------------------------------------------------------
 */

function extractResearchTopics(findings = []) {
  if (!Array.isArray(findings)) {
    return [];
  }

  const topics = [];

  for (const finding of findings) {
    if (!finding || typeof finding !== "object") {
      continue;
    }

    const question = cleanText(finding.question);

    if (
      question &&
      !topics.some(
        topic => normalizeText(topic) === normalizeText(question)
      )
    ) {
      topics.push(question);
    }
  }

  return topics;
}


/*
 * ---------------------------------------------------------
 * MAPA DE SEÇÕES
 * ---------------------------------------------------------
 */

function createSectionForTopic(topic) {
  const normalized = normalizeText(topic);

  if (
    normalized.includes("fator") ||
    normalized.includes("causa") ||
    normalized.includes("relacion")
  ) {
    return "Fatores relacionados";
  }

  if (
    normalized.includes("consequ") ||
    normalized.includes("impact") ||
    normalized.includes("efeito")
  ) {
    return "Consequências e impactos";
  }

  if (
    normalized.includes("prevenc") ||
    normalized.includes("tratamento") ||
    normalized.includes("acompanh")
  ) {
    return "Prevenção e acompanhamento";
  }

  if (
    normalized.includes("o que e") ||
    normalized.includes("conceito") ||
    normalized.includes("defini")
  ) {
    return "Conceitos e características";
  }

  return cleanText(topic);
}


/*
 * ---------------------------------------------------------
 * ESTRUTURA BASEADA EM RESEARCH
 * ---------------------------------------------------------
 */

export function buildResearchStructure({
  type = "",
  orientation = "",
  orientationContext = "",
  topic = "",
  findings = [],
  sources = []
} = {}) {

  const base = suggestStructure({
    type,
    orientation,
    orientationContext
  });

  const researchTopics = extractResearchTopics(findings);

  const sections = [...base];

  const dynamicSections = [];

  for (const topicItem of researchTopics) {
    const section = createSectionForTopic(topicItem);

    if (
      section &&
      !dynamicSections.some(
        item =>
          normalizeText(item.title) ===
          normalizeText(section)
      )
    ) {
      dynamicSections.push({
        title: section,
        sourceQuestions: [topicItem]
      });
    } else {
      const existing = dynamicSections.find(
        item =>
          normalizeText(item.title) ===
          normalizeText(section)
      );

      if (existing && !existing.sourceQuestions.includes(topicItem)) {
        existing.sourceQuestions.push(topicItem);
      }
    }
  }

  /*
   * Inserimos as partes derivadas da Research
   * antes da conclusão/referências.
   */

  const insertionIndex = sections.findIndex(
    section => normalizeText(section) === "conclusao"
  );

  const index =
    insertionIndex >= 0
      ? insertionIndex
      : sections.length;

  const finalSections = [
    ...sections.slice(0, index),
    ...dynamicSections.map(item => item.title),
    ...sections.slice(index)
  ];

  return {
    type: "work-structure-result",
    topic: cleanText(topic),
    sections: finalSections,
    research: {
      findingCount: Array.isArray(findings)
        ? findings.length
        : 0,

      sourceCount: Array.isArray(sources)
        ? sources.length
        : 0,

      topics: researchTopics
    },

    metadata: {
      generatedFromResearch: researchTopics.length > 0,
      readyForDevelopment: finalSections.length >= 3
    }
  };
}


/*
 * ---------------------------------------------------------
 * CONSTRUÇÃO DE SEÇÕES COM CONTEXTO
 * ---------------------------------------------------------
 */

export function buildResearchSections({
  findings = []
} = {}) {

  if (!Array.isArray(findings)) {
    return [];
  }

  return findings.map((finding, index) => ({
    id: `research-section-${index + 1}`,

    title:
      createSectionForTopic(finding?.question) ||
      `Tópico ${index + 1}`,

    question: cleanText(finding?.question),

    section: cleanText(finding?.section),

    text: cleanText(finding?.text),

    sourceIds: Array.isArray(finding?.sourceIds)
      ? finding.sourceIds
      : [],

    relevance:
      Number.isFinite(finding?.relevance)
        ? finding.relevance
        : 0
  }));
}


/*
 * ---------------------------------------------------------
 * ESTRUTURA COMPLETA
 * ---------------------------------------------------------
 */

export function createResearchStructure(request = {}) {

  const findings =
    Array.isArray(request.findings)
      ? request.findings
      : [];

  const sources =
    Array.isArray(request.sources)
      ? request.sources
      : [];

  const result = buildResearchStructure({
    type: request.type || "",
    orientation: request.orientation || "",
    orientationContext:
      request.orientationContext || "",
    topic: request.topic || "",
    findings,
    sources
  });

  return {
    ...result,

    sectionsData: buildResearchSections({
      findings
    })
  };
}
