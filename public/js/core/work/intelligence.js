"use strict";

/*
 * =========================================================
 * NHIMY — TRABALHOS / INTELLIGENCE
 *
 * O estudante pode começar apenas com um tema.
 *
 * Esta camada:
 * 1. interpreta o contexto;
 * 2. identifica o que já existe;
 * 3. identifica o que falta;
 * 4. cria um briefing;
 * 5. cria um plano;
 * 6. determina a próxima etapa.
 *
 * Não gera o trabalho completo.
 * =========================================================
 */

const STAGES = {
  CREATE: "create",
  ORIENT: "orient",
  PLAN: "plan",
  RESEARCH: "research",
  STRUCTURE: "structure",
  DEVELOP: "develop",
  REVIEW: "review",
  FINALIZE: "finalize"
};


function isValidText(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}


function normalizeText(value) {
  return isValidText(value)
    ? value.trim()
    : "";
}


function collectRequiredMissing(context) {
  const missing = [];

  if (!isValidText(context.title)) {
    missing.push("title");
  }

  if (!isValidText(context.subject)) {
    missing.push("subject");
  }

  return missing;
}


function collectOptional(context) {
  const optional = [];

  if (!isValidText(context.type)) {
    optional.push("type");
  }

  if (!isValidText(context.orientationContext)) {
    optional.push("orientation");
  }

  if (!context.materials.length) {
    optional.push("materials");
  }

  return optional;
}


function determineNextStage(context, requiredMissing) {

  if (requiredMissing.includes("title")) {
    return STAGES.CREATE;
  }

  if (requiredMissing.includes("subject")) {
    return STAGES.ORIENT;
  }

  if (!context.briefingReady) {
    return STAGES.PLAN;
  }

  if (!context.researchReady) {
    return STAGES.RESEARCH;
  }

  if (!context.structureReady) {
    return STAGES.STRUCTURE;
  }

  if (!context.contentReady) {
    return STAGES.DEVELOP;
  }

  if (!context.reviewed) {
    return STAGES.REVIEW;
  }

  if (!context.finalized) {
    return STAGES.FINALIZE;
  }

  return STAGES.FINALIZE;
}


function createBriefing(context) {

  return {
    title: context.title,
    subject: context.subject,
    type: context.type || null,
    orientation: context.orientationContext || null,

    objective:
      "Construir o trabalho de forma faseada, respeitando o tema, a disciplina e as orientações disponíveis.",

    sourceAvailability: {
      hasTopic: isValidText(context.title),
      hasSubject: isValidText(context.subject),
      hasOrientation:
        isValidText(context.orientationContext),
      hasMaterials:
        context.materials.length > 0
    },

    needsPlanning: {
      type:
        !isValidText(context.type),

      orientation:
        !isValidText(context.orientationContext),

      research:
        !context.researchReady
    }
  };
}


/*
 * =========================================================
 * PLANNER
 * =========================================================
 */


function parseOrientation(orientation) {

  const text = normalizeText(orientation).toLowerCase();

  if (!text) {
    return {
      provided: false,
      requirements: [],
      requestedSections: [],
      additionalSuggestions: [],
      source: null
    };
  }

  const rules = [
    ["introducao", ["introdução", "introducao"]],
    ["objetivos", ["objetivo", "objetivos"]],
    ["justificativa", ["justificativa"]],
    ["metodologia", ["metodologia", "método", "metodo", "métodos", "metodos"]],
    ["problema", ["problema de pesquisa"]],
    ["hipotese", ["hipótese", "hipotese"]],
    ["fundamentacao", [
      "fundamentação teórica",
      "fundamentacao teorica",
      "referencial teórico",
      "referencial teorico"
    ]],
    ["desenvolvimento", ["desenvolvimento"]],
    ["conclusao", ["conclusão", "conclusao"]],
    ["referencias", [
      "referências",
      "referencias",
      "fontes bibliográficas",
      "fontes bibliograficas"
    ]]
  ];

  const matched = [];

  for (const [key, terms] of rules) {

    if (terms.some(term => text.includes(term))) {
      matched.push(key);
    }
  }

  const requirements =
    matched.map(key => ({
      key,
      source: "orientation"
    }));

  return {
    provided: true,
    requirements,
    requestedSections: [...matched],
    additionalSuggestions: [],
    source: "teacher-orientation"
  };
}

function suggestWorkType(context) {

  if (isValidText(context.type)) {
    return context.type;
  }

  return "trabalho escolar";
}


function createResearchNeeds(context) {

  const needs = [

    "Definir os principais conceitos relacionados ao tema.",

    "Identificar os aspectos mais importantes que devem ser abordados.",

    "Pesquisar informações confiáveis relacionadas ao tema.",

    "Selecionar informações relevantes para cada seção do trabalho."
  ];

  if (!context.orientationContext) {

    needs.push(
      "Verificar se existem requisitos específicos do professor antes da versão final."
    );
  }

  return needs;
}


function createSuggestedQuestions(context) {

  const topic = context.title;

  return [
    `O que é ${topic} e qual é o seu contexto?`,

    `Quais são os principais fatores, causas, consequências e evidências científicas relacionadas a ${topic}?`
  ];
}


function createSuggestedSections(requirements = []) {

  const sectionMap = {
    introducao: {
      title: "Introdução",
      purpose:
        "Apresentar o tema, contextualizar o assunto e indicar o objetivo do trabalho."
    },

    objetivos: {
      title: "Objetivos",
      purpose:
        "Definir o objetivo geral e, quando necessário, os objetivos específicos do trabalho."
    },

    justificativa: {
      title: "Justificativa",
      purpose:
        "Explicar a relevância do tema e os motivos para a realização do trabalho."
    },

    problema: {
      title: "Problema de pesquisa",
      purpose:
        "Apresentar a questão central que orienta a pesquisa."
    },

    hipotese: {
      title: "Hipótese",
      purpose:
        "Apresentar uma possível resposta ou explicação para o problema de pesquisa."
    },

    metodologia: {
      title: "Metodologia",
      purpose:
        "Explicar como a pesquisa ou o trabalho será desenvolvido."
    },

    fundamentacao: {
      title: "Fundamentação teórica",
      purpose:
        "Apresentar os conceitos e conhecimentos que sustentam o trabalho."
    },

    desenvolvimento: {
      title: "Desenvolvimento",
      purpose:
        "Apresentar e explicar os principais conteúdos relacionados ao tema."
    },

    conclusao: {
      title: "Conclusão",
      purpose:
        "Retomar as ideias principais e apresentar uma síntese do trabalho."
    },

    referencias: {
      title: "Referências",
      purpose:
        "Registrar as fontes utilizadas na construção do trabalho."
    }
  };

  if (!requirements.length) {
    return [
      sectionMap.introducao,
      sectionMap.desenvolvimento,
      sectionMap.conclusao,
      sectionMap.referencias
    ];
  }

  return requirements
    .map(requirement => sectionMap[requirement.key])
    .filter(Boolean);
}

function buildWorkPlan(context, briefing) {

  const suggestedType =
    suggestWorkType(context);

  const researchNeeds =
    createResearchNeeds(context);

  const questions =
    createSuggestedQuestions(context);

  const orientation =
    parseOrientation(context.orientationContext);

  const requestedSections =
    createSuggestedSections(
      orientation.requirements
    );

  const suggestedSections =
    orientation.provided
      ? []
      : createSuggestedSections();

  return {

    status: "success",

    type: "work-plan",

    title:
      context.title,

    subject:
      context.subject,

    suggestedType,

    objective:
      briefing.objective,

    questions,

    researchNeeds,

    requestedSections,

    suggestedSections,

    orientationAnalysis: {
      provided: orientation.provided,
      source: orientation.source,
      requirements: orientation.requirements,
      requestedSections: orientation.requestedSections,
      additionalSuggestions:
        orientation.additionalSuggestions
    },

    stages: [
      STAGES.PLAN,
      STAGES.RESEARCH,
      STAGES.STRUCTURE,
      STAGES.DEVELOP,
      STAGES.REVIEW,
      STAGES.FINALIZE
    ],

    nextStep:
      STAGES.RESEARCH
  };
}


/*
 * =========================================================
 * ANÁLISE DO CONTEXTO
 * =========================================================
 */

export function analyzeWorkContext(input = {}) {

  const context = {

    title:
      normalizeText(input.title),

    subject:
      normalizeText(input.subject),

    type:
      normalizeText(input.type),

    orientationContext:
      normalizeText(input.orientationContext),

    materials:
      Array.isArray(input.materials)
        ? input.materials
        : [],

    briefingReady:
      input.briefingReady === true,

    researchReady:
      input.researchReady === true,

    structureReady:
      input.structureReady === true,

    contentReady:
      input.contentReady === true,

    reviewed:
      input.reviewed === true,

    finalized:
      input.finalized === true
  };


  const requiredMissing =
    collectRequiredMissing(context);

  const optional =
    collectOptional(context);

  const nextStage =
    determineNextStage(
      context,
      requiredMissing
    );


  return {

    status: "success",

    type: "work-analysis",

    context,

    requiredMissing,

    optional,

    nextStage,

    briefing:
      requiredMissing.length === 0
        ? createBriefing(context)
        : null
  };
}


/*
 * =========================================================
 * BRIEFING
 * =========================================================
 */

export function createWorkBriefing(input = {}) {

  const analysis =
    analyzeWorkContext(input);


  if (analysis.requiredMissing.length > 0) {

    return {

      status: "incomplete",

      type: "work-briefing",

      requiredMissing:
        analysis.requiredMissing,

      optional:
        analysis.optional,

      nextStage:
        analysis.nextStage
    };
  }


  return {

    status: "success",

    type: "work-briefing",

    nextStage:
      analysis.nextStage,

    result:
      analysis.briefing
  };
}


/*
 * =========================================================
 * PLANO
 * =========================================================
 */

export function createWorkPlan(input = {}) {

  const analysis =
    analyzeWorkContext(input);


  if (analysis.requiredMissing.length > 0) {

    return {

      status: "incomplete",

      type: "work-plan",

      requiredMissing:
        analysis.requiredMissing,

      optional:
        analysis.optional,

      nextStage:
        analysis.nextStage
    };
  }


  return buildWorkPlan(
    analysis.context,
    analysis.briefing
  );
}


export { STAGES, parseOrientation };


/*
 * =========================================================
 * NHIMY — WORK / RESEARCH PLAN
 *
 * Define o que precisa ser pesquisado antes da construção
 * do trabalho.
 *
 * A pesquisa pode usar:
 * - materiais fornecidos pelo estudante;
 * - fontes externas;
 * - combinação dos dois.
 *
 * Esta função NÃO escreve o trabalho.
 * =========================================================
 */

export function createResearchPlan(input = {}) {

  const title =
    isValidText(input.title)
      ? input.title.trim()
      : "";

  const subject =
    isValidText(input.subject)
      ? input.subject.trim()
      : "";

  const orientation =
    isValidText(input.orientationContext)
      ? input.orientationContext.trim()
      : "";

  const questions =
    Array.isArray(input.questions)
      ? input.questions.filter(
          item => isValidText(item)
        )
      : [];

  const researchNeeds =
    Array.isArray(input.researchNeeds)
      ? input.researchNeeds.filter(
          item => isValidText(item)
        )
      : [];

  const requestedSections =
    Array.isArray(input.requestedSections)
      ? input.requestedSections.filter(Boolean)
      : [];

  const materials =
    Array.isArray(input.materials)
      ? input.materials.filter(Boolean)
      : [];

  if (!title) {
    return {
      status: "error",
      type: "work-research-plan",
      message: "O tema do trabalho é obrigatório."
    };
  }

  const sourceMode =
    materials.length
      ? orientation
        ? "external-and-student-materials"
        : "student-materials-and-external"
      : "external";

  const targets =
    requestedSections.length
      ? requestedSections.map(section => ({
          title:
            section.title || "Seção",
          purpose:
            section.purpose || ""
        }))
      : [];

  return {
    status: "success",
    type: "work-research-plan",

    topic: title,

    subject,

    orientation,

    questions,

    needs: researchNeeds,

    sections: targets,

    materials: {
      provided: materials.length > 0,
      count: materials.length
    },

    sourceMode,

    rules: [
      "Priorizar informações relevantes para o tema.",
      "Relacionar a pesquisa com a disciplina.",
      "Respeitar as exigências identificadas na orientação.",
      "Selecionar informações adequadas para cada seção.",
      "Não transformar pesquisa em texto final sem passar pela estrutura.",
      "Registrar as fontes utilizadas."
    ],

    nextStep: "research"
  };
}
