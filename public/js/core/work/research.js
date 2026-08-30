"use strict";

/*
 * =========================================================
 * NHIMY — WORK / RESEARCH
 *
 * Camada responsável por organizar a pesquisa do trabalho.
 *
 * IMPORTANTE:
 * Esta camada não inventa fontes nem transforma
 * automaticamente informações em texto final.
 *
 * Ela prepara solicitações de pesquisa e organiza
 * posteriormente os resultados obtidos.
 * =========================================================
 */

function isValidText(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}


export function createResearchRequest(input = {}) {

  const topic =
    isValidText(input.topic)
      ? input.topic.trim()
      : "";

  const subject =
    isValidText(input.subject)
      ? input.subject.trim()
      : "";

  const questions =
    Array.isArray(input.questions)
      ? input.questions.filter(
          item => isValidText(item)
        )
      : [];

  const needs =
    Array.isArray(input.needs)
      ? input.needs.filter(
          item => isValidText(item)
        )
      : [];

  const sections =
    Array.isArray(input.sections)
      ? input.sections.filter(Boolean)
      : [];

  if (!topic) {
    return {
      status: "error",
      type: "work-research-request",
      message: "O tema da pesquisa é obrigatório."
    };
  }

  return {
    status: "success",
    type: "work-research-request",

    topic,

    subject,

    questions,

    needs,

    sections,

    queries: questions.map(question => ({
      question,
      topic,
      subject
    })),

    sectionTargets: sections.map(section => ({
      title: section.title || "",
      purpose: section.purpose || ""
    })),

    sourcePolicy: {
      requireSource: true,
      preserveSourceDetails: true,
      allowStudentMaterials: true,
      allowExternalSources: true
    },

    nextStep: "collect"
  };
}


export function createResearchResult(input = {}) {

  const topic =
    isValidText(input.topic)
      ? input.topic.trim()
      : "";

  const findings =
    Array.isArray(input.findings)
      ? input.findings.filter(Boolean)
      : [];

  const sources =
    Array.isArray(input.sources)
      ? input.sources.filter(Boolean)
      : [];

  if (!topic) {
    return {
      status: "error",
      type: "work-research-result",
      message: "O tema da pesquisa é obrigatório."
    };
  }

  return {
    status: "success",
    type: "work-research-result",

    topic,

    findings,

    sources,

    sourceCount: sources.length,

    readyForStructure:
      findings.length > 0 &&
      sources.length > 0,

    nextStep:
      findings.length > 0 &&
      sources.length > 0
        ? "structure"
        : "collect"
  };
}
