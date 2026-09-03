"use strict";

/**
 * NHIMY — Work Development Intelligence
 *
 * Transforma Structure + Research em unidades prontas
 * para desenvolvimento de conteúdo.
 *
 * Não gera conteúdo fictício.
 * Preserva findings, perguntas e fontes.
 */

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


/*
 * ---------------------------------------------------------
 * CLASSIFICAÇÃO
 * ---------------------------------------------------------
 */

function classifySection(title = "") {
  const value = normalizeText(title);

  if (value === "introducao") {
    return "introduction";
  }

  if (
    value.includes("referencia") ||
    value.includes("bibliografia")
  ) {
    return "references";
  }

  if (value === "conclusao") {
    return "conclusion";
  }

  if (
    value.includes("metodologia") ||
    value.includes("metodo")
  ) {
    return "methodology";
  }

  return "development";
}


/*
 * ---------------------------------------------------------
 * LOCALIZA FINDINGS
 * ---------------------------------------------------------
 */

function findEvidenceForSection(section, findings = []) {
  const title = normalizeText(section);

  if (!Array.isArray(findings) || !findings.length) {
    return [];
  }

  const aliases = {
    "introducao": [
      "introducao",
      "contextualizacao",
      "conceitos",
      "definicao"
    ],

    "desenvolvimento": [
      "desenvolvimento",
      "fatores",
      "fatores relacionados",
      "analise"
    ],

    "analise": [
      "analise",
      "desenvolvimento",
      "fatores",
      "consequencias",
      "impactos"
    ],

    "conceitos e caracteristicas": [
      "introducao",
      "conceitos",
      "definicao",
      "desenvolvimento"
    ],

    "fatores relacionados": [
      "desenvolvimento",
      "fatores",
      "fatores relacionados",
      "analise"
    ],

    "consequencias e impactos": [
      "conclusao",
      "consequencias",
      "impactos",
      "desenvolvimento"
    ],

    "conclusao": [
      "conclusao",
      "consequencias",
      "impactos"
    ],

    "contextualizacao do tema": [
      "introducao",
      "contextualizacao",
      "desenvolvimento"
    ]
  };

  const targets = new Set([
    title,
    ...(aliases[title] || [])
  ]);

  return findings.filter((finding) => {
    const findingSection =
      normalizeText(finding?.section);

    if (targets.has(findingSection)) {
      return true;
    }

    const question =
      normalizeText(finding?.question);

    if (
      title.includes("conceitos") &&
      (
        question.includes("o que e") ||
        question.includes("defin")
      )
    ) {
      return true;
    }

    if (
      title.includes("fatores") &&
      (
        question.includes("fatores") ||
        question.includes("relacion")
      )
    ) {
      return true;
    }

    if (
      title.includes("consequencias") &&
      (
        question.includes("consequ") ||
        question.includes("impact")
      )
    ) {
      return true;
    }

    return false;
  });
}


/*
 * ---------------------------------------------------------
 * DESENVOLVIMENTO DE UMA SEÇÃO
 * ---------------------------------------------------------
 */

export function createDevelopmentSection({
  section = "",
  findings = [],
  sources = []
} = {}) {

  const title = cleanText(section);

  const evidence =
    findEvidenceForSection(title, findings);

  const sourceIds = [
    ...new Set(
      evidence.flatMap((finding) =>
        Array.isArray(finding?.sourceIds)
          ? finding.sourceIds
          : []
      )
    )
  ];

  const relatedSources =
    Array.isArray(sources)
      ? sources.filter((source) =>
          sourceIds.includes(source?.id)
        )
      : [];

  return {
    id:
      `development-${normalizeText(title)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`,

    title,

    kind: classifySection(title),

    status: "ready",

    instructions: {
      objective:
        `Desenvolver a seção "${title}" com base nas evidências pesquisadas.`,

      useResearch: evidence.length > 0,

      preserveSources: true
    },

    evidence: evidence.map((finding) => ({
      question: cleanText(finding?.question),
      text: cleanText(finding?.text),
      relevance:
        Number.isFinite(finding?.relevance)
          ? finding.relevance
          : 0,
      sourceIds:
        Array.isArray(finding?.sourceIds)
          ? finding.sourceIds
          : []
    })),

    sources: relatedSources,

    content: "",

    readyForReview: false
  };
}


/*
 * ---------------------------------------------------------
 * PLANO COMPLETO DE DESENVOLVIMENTO
 * ---------------------------------------------------------
 */

export function createDevelopmentPlan({
  topic = "",
  subject = "",
  sections = [],
  findings = [],
  sources = []
} = {}) {

  const normalizedSections =
    Array.isArray(sections)
      ? sections
          .map(cleanText)
          .filter(Boolean)
      : [];

  const developmentSections =
    normalizedSections.map((section) =>
      createDevelopmentSection({
        section,
        findings,
        sources
      })
    );

  return {
    type: "work-development-plan",

    topic: cleanText(topic),

    subject: cleanText(subject),

    sections: developmentSections,

    research: {
      findingCount:
        Array.isArray(findings)
          ? findings.length
          : 0,

      sourceCount:
        Array.isArray(sources)
          ? sources.length
          : 0
    },

    metadata: {
      generatedFromStructure: normalizedSections.length > 0,

      generatedFromResearch:
        Array.isArray(findings) &&
        findings.length > 0,

      readyForWriting:
        developmentSections.length > 0
    }
  };
}


/*
 * ---------------------------------------------------------
 * RESULTADO DE UMA SEÇÃO ESCRITA
 * ---------------------------------------------------------
 */

export function saveDevelopedSection(
  plan,
  sectionId,
  content
) {

  if (
    !plan ||
    !Array.isArray(plan.sections)
  ) {
    throw new Error(
      "Development plan inválido."
    );
  }

  const section =
    plan.sections.find(
      item => item.id === sectionId
    );

  if (!section) {
    throw new Error(
      "Seção de desenvolvimento não encontrada."
    );
  }

  section.content =
    cleanText(content);

  section.status =
    section.content
      ? "developed"
      : "ready";

  section.readyForReview =
    Boolean(section.content);

  return plan;
}
