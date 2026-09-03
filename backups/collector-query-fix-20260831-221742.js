"use strict";

/**
 * NHIMY — Work Research Collector
 *
 * Responsabilidades:
 *
 * 1. Receber um work-research-request.
 * 2. Executar pesquisas através dos providers.
 * 3. Filtrar artigos relevantes.
 * 4. Associar resultados às perguntas e seções.
 * 5. Evitar duplicações.
 * 6. Produzir findings estruturados.
 *
 * O Collector NÃO:
 * - cria perguntas;
 * - constrói queries;
 * - decide a intenção.
 *
 * Essas responsabilidades pertencem ao:
 * - sectionSelector
 * - questionRouter
 * - requestBuilder
 */

import {
  searchEuropePMC,
  normalizeEuropePMCResults
} from "./provider.js";


/**
 * Normaliza texto para comparação.
 */
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


/**
 * Cria uma requisição própria do Collector.
 */
export function createCollectorRequest(request) {
  if (
    !request ||
    typeof request !== "object"
  ) {
    throw new Error(
      "Research request inválido."
    );
  }

  if (
    request.type !== "work-research-request"
  ) {
    throw new Error(
      "Tipo de Research request inválido."
    );
  }

  const sectionTargets =
    Array.isArray(request.sectionTargets)
      ? request.sectionTargets
      : [];

  const existingUnits =
    Array.isArray(request.researchUnits)
      ? request.researchUnits
      : [];

  const questions =
    Array.isArray(request.questions)
      ? request.questions
      : [];

  const researchUnits =
    existingUnits.length
      ? existingUnits
      : questions.map(
          (question, index) => ({
            question:
              typeof question === "string"
                ? question
                : question?.question || "",

            query:
              typeof question === "string"
                ? question
                : question?.query ||
                  question?.question ||
                  "",

            intent:
              typeof question === "object"
                ? question?.intent || ""
                : "",

            researchType:
              typeof question === "object"
                ? question?.researchType || ""
                : "",

            section:
              typeof question === "object"
                ? question?.section ||
                  ""
                : sectionTargets[index] ||
                  sectionTargets[0] ||
                  ""
          })
        )
      .filter(
        unit =>
          unit.question ||
          unit.query
      );

  return {
    status: "success",

    type:
      "work-research-collect-request",

    topic:
      request.topic || "",

    subject:
      request.subject || "",

    researchUnits,

    queries:
      Array.isArray(request.queries)
        ? request.queries
        : [],

    sectionTargets,

    sourcePolicy:
      request.sourcePolicy || {
        requireSource: true,
        preserveSourceDetails: true,
        allowStudentMaterials: true,
        allowExternalSources: true
      },

    nextStep: "collect"
  };
}


/**
 * Normaliza um finding.
 */
export function normalizeFinding(
  finding = {}
) {
  return {
    section:
      finding.section || "",

    question:
      finding.question || "",

    intent:
      finding.intent || "",

    researchType:
      finding.researchType || "",

    text:
      finding.text || "",

    sourceIds:
      Array.isArray(finding.sourceIds)
        ? finding.sourceIds
        : [],

    sources:
      Array.isArray(finding.sources)
        ? finding.sources
        : [],

    relevance:
      Number(
        finding.relevance || 0
      )
  };
}


/**
 * Normaliza uma fonte.
 */
export function normalizeSource(
  source = {}
) {
  const title =
    source.title ||
    "";

  const url =
    source.url ||
    "";

  const id =
    source.id ||
    source.sourceId ||
    source.pmid ||
    source.pmcid ||
    url ||
    title;

  return {
    id: String(id || ""),

    title:
      String(title || ""),

    url:
      String(url || ""),

    publisher:
      String(
        source.publisher ||
        "Europe PMC"
      ),

    doi:
      String(
        source.doi ||
        ""
      ),

    authors:
      Array.isArray(source.authors)
        ? source.authors
        : [],

    year:
      source.year ||
      source.publicationYear ||
      (
        source.publicationDate
          ? String(source.publicationDate).slice(0, 4)
          : ""
      ),

    publicationDate:
      String(
        source.publicationDate ||
        ""
      ),

    sourceDatabase:
      String(
        source.sourceDatabase ||
        "Europe PMC"
      )
  };
}


/**
 * Extrai termos úteis de uma query.
 *
 * Não tentamos interpretar operadores booleanos.
 * O objetivo aqui é apenas obter palavras científicas
 * que possam aparecer no artigo.
 */
function extractQueryTerms(query) {
  return normalizeText(query)
    .replace(/[()"]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(term =>
      term.length >= 5
    )
    .filter(term =>
      ![
        "pregnancy",
        "pregnant",
        "prenatal",
        "antenatal",
        "perinatal",
        "maternal",
        "anxiety",
        "depression",
        "depressive",
        "mental",
        "health",
        "disorder",
        "symptoms",
        "diagnosis",
        "causes",
        "factors",
        "associated",
        "predictors",
        "determinants",
        "manifestations",
        "clinical",
        "screening",
        "assessment",
        "criteria",
        "outcomes",
        "effects",
        "impact",
        "neonatal",
        "preterm",
        "prematurity",
        "intervention",
        "prevention",
        "preventive",
        "treatment",
        "therapy",
        "management",
        "importance",
        "relevance",
        "review",
        "evidence"
      ].includes(term)
    );
}


/**
 * Termos relacionados à intenção.
 */
const INTENT_TERMS = {
  definition: [
    "definition",
    "concept",
    "mental health",
    "mental disorder",
    "anxiety",
    "depression",
    "depressive",
    "pregnancy"
  ],

  factors: [
    "risk factors",
    "associated factors",
    "predictors",
    "determinants",
    "causes",
    "risk"
  ],

  symptoms: [
    "symptoms",
    "manifestations",
    "clinical symptoms",
    "anxiety symptoms",
    "depressive symptoms"
  ],

  diagnosis: [
    "diagnosis",
    "screening",
    "assessment",
    "diagnostic criteria"
  ],

  consequences: [
    "outcomes",
    "effects",
    "impact",
    "maternal outcomes",
    "infant outcomes",
    "neonatal",
    "preterm",
    "prematurity",
    "low birth weight"
  ],

  prevention: [
    "prevention",
    "preventive",
    "risk reduction"
  ],

  treatment: [
    "treatment",
    "therapy",
    "intervention",
    "management",
    "care"
  ],

  importance: [
    "importance",
    "clinical relevance",
    "maternal health",
    "prenatal care"
  ],

  conclusion: [
    "review",
    "evidence",
    "outcomes",
    "synthesis"
  ]
};


/**
 * Calcula relevância de um artigo.
 *
 * A pontuação é usada para ordenar/filtrar.
 * O resultado booleano de isRelevantArticle()
 * usa uma regra mínima de pertinência.
 */
function calculateRelevance(
  article,
  unit = {},
  topic = ""
) {
  const title =
    normalizeText(
      article?.title
    );

  const abstract =
    normalizeText(
      article?.abstract
    );

  const text =
    `${title} ${abstract}`;

  let score = 0;

  /*
   * Contexto gestacional.
   */
  const pregnancyTerms = [
    "pregnancy",
    "pregnant",
    "prenatal",
    "antenatal",
    "perinatal",
    "maternal",
    "gestation",
    "gestational"
  ];

  if (
    pregnancyTerms.some(
      term =>
        text.includes(term)
    )
  ) {
    score += 4;
  }

  /*
   * Saúde mental.
   */
  const mentalTerms = [
    "anxiety",
    "depression",
    "depressive",
    "mental health",
    "mental disorder",
    "mood disorder"
  ];

  const mentalMatches =
    mentalTerms.filter(
      term =>
        text.includes(term)
    ).length;

  score += Math.min(
    mentalMatches * 2,
    8
  );

  /*
   * Termos específicos da pergunta/query.
   */
  const queryTerms =
    extractQueryTerms(
      unit.query || ""
    );

  for (
    const term of queryTerms
  ) {
    if (
      title.includes(term)
    ) {
      score += 2;
    } else if (
      abstract.includes(term)
    ) {
      score += 1;
    }
  }

  /*
   * Tema.
   */
  const topicTerms =
    normalizeText(topic)
      .split(/\s+/)
      .filter(Boolean)
      .filter(word =>
        word.length >= 5
      );

  for (
    const term of topicTerms
  ) {
    if (
      text.includes(term)
    ) {
      score += 1;
    }
  }

  /*
   * Intenção.
   */
  const intent =
    unit.intent || "";

  const intentTerms =
    INTENT_TERMS[intent] || [];

  for (
    const term of intentTerms
  ) {
    const normalizedTerm =
      normalizeText(term);

    if (
      normalizedTerm &&
      text.includes(normalizedTerm)
    ) {
      score += 1;
    }
  }

  /*
   * Termos informativos da pergunta original.
   * A pergunta recebe peso adicional sem substituir
   * os critérios científicos existentes.
   */
  const questionTerms =
    extractQueryTerms(
      unit.question || ""
    );

  for (
    const term of questionTerms
  ) {
    if (title.includes(term)) {
      score += 2;
    } else if (abstract.includes(term)) {
      score += 1;
    }
  }

  /*
   * Abstract disponível.
   */
  if (
    article?.abstract
  ) {
    score += 1;
  }

  return score;
}


/**
 * Verifica se um artigo é suficientemente
 * relacionado à pergunta e ao tema.
 *
 * Compatibilidade:
 *
 * Forma antiga:
 * isRelevantArticle(article, query, topic)
 *
 * Forma nova:
 * isRelevantArticle(article, {
 *   query,
 *   topic,
 *   intent,
 *   researchType
 * })
 */
export function isRelevantArticle(
  article,
  queryOrContext,
  topic = ""
) {
  if (
    !article ||
    typeof article !== "object"
  ) {
    return false;
  }

  let context = {};

  if (
    queryOrContext &&
    typeof queryOrContext === "object"
  ) {
    context = {
      query:
        queryOrContext.query || "",

      topic:
        queryOrContext.topic || "",

      intent:
        queryOrContext.intent || "",

      researchType:
        queryOrContext.researchType || ""
    };
  } else {
    context = {
      query:
        String(
          queryOrContext || ""
        ),

      topic:
        String(
          topic || ""
        )
    };
  }

  const title =
    normalizeText(
      article.title
    );

  const abstract =
    normalizeText(
      article.abstract
    );

  const text =
    `${title} ${abstract}`;

  if (!text.trim()) {
    return false;
  }

  /*
   * Um artigo precisa estar claramente
   * relacionado à gravidez/período gestacional.
   */
  const pregnancyTerms = [
    "pregnancy",
    "pregnant",
    "prenatal",
    "antenatal",
    "perinatal",
    "maternal",
    "gestation",
    "gestational"
  ];

  const hasPregnancy =
    pregnancyTerms.some(
      term =>
        text.includes(term)
    );

  if (!hasPregnancy) {
    return false;
  }

  /*
   * E precisa apresentar relação
   * com ansiedade/depressão/saúde mental.
   */
  const mentalTerms = [
    "anxiety",
    "depression",
    "depressive",
    "mental health",
    "mental disorder",
    "mood disorder"
  ];

  const hasMentalHealth =
    mentalTerms.some(
      term =>
        text.includes(term)
    );

  if (!hasMentalHealth) {
    return false;
  }

  const relevance =
    calculateRelevance(
      article,
      context,
      context.topic
    );

  /*
   * A combinação gravidez + saúde mental
   * já estabelece pertinência mínima.
   *
   * O score adicional evita aceitar artigos
   * apenas por uma palavra isolada.
   */
  return relevance >= 7;
}


/**
 * Cria um finding a partir de um artigo.
 */
function createFinding(
  article,
  unit,
  topic
) {
  const source =
    normalizeSource(
      article
    );

  const relevance =
    calculateRelevance(
      article,
      unit,
      topic
    );

  return normalizeFinding({
    section:
      unit.section || "",

    question:
      unit.question || "",

    intent:
      unit.intent || "",

    researchType:
      unit.researchType || "",

    text:
      article.abstract ||
      article.title ||
      "",

    sourceIds: [
      source.id
    ].filter(Boolean),

    sources: [
      source
    ].filter(
      item =>
        item.title ||
        item.url
    ),

    relevance
  });
}


/**
 * Remove findings duplicados.
 */
function deduplicateFindings(
  findings
) {
  const seen =
    new Set();

  return findings.filter(
    finding => {

      const sourceId =
        finding.sourceIds?.[0] ||
        finding.sources?.[0]?.id ||
        finding.sources?.[0]?.url ||
        finding.text;

      if (!sourceId) {
        return true;
      }

      if (
        seen.has(sourceId)
      ) {
        return false;
      }

      seen.add(sourceId);

      return true;
    }
  );
}


/**
 * Executa uma unidade de pesquisa.
 */
async function collectResearchUnit(
  unit,
  {
    topic,
    pageSize = 10
  } = {}
) {
  if (
    !unit ||
    typeof unit !== "object"
  ) {
    return [];
  }

  if (
    !unit.query
  ) {
    return [];
  }

  const data =
    await searchEuropePMC(
      unit.query,
      {
        pageSize
      }
    );

  const articles =
    normalizeEuropePMCResults(
      data
    );

  const relevantArticles =
    articles.filter(
      article =>
        isRelevantArticle(
          article,
          {
            query:
              unit.query,

            topic,

            intent:
              unit.intent,

            researchType:
              unit.researchType
          }
        )
    );

  return relevantArticles.map(
    article =>
      createFinding(
        article,
        unit,
        topic
      )
  );
}


/**
 * Executa a coleta completa.
 */
export async function collectResearch(
  request,
  {
    pageSize = 10
  } = {}
) {
  const normalizedRequest =
    createCollectorRequest(
      request
    );

  const findings = [];

  for (
    const unit
    of normalizedRequest.researchUnits
  ) {
    const unitFindings =
      await collectResearchUnit(
        unit,
        {
          topic:
            normalizedRequest.topic,

          pageSize
        }
      );

    findings.push(
      ...unitFindings
    );
  }

  const uniqueFindings =
    deduplicateFindings(
      findings
    );

  const sourceMap =
    new Map();

  for (
    const finding
    of uniqueFindings
  ) {
    for (
      const source
      of finding.sources || []
    ) {
      const id =
        source.id ||
        source.url ||
        source.title;

      if (
        id &&
        !sourceMap.has(id)
      ) {
        sourceMap.set(
          id,
          source
        );
      }
    }
  }

  return {
    status:
      "success",

    type:
      "work-research-collect-result",

    topic:
      normalizedRequest.topic,

    subject:
      normalizedRequest.subject,

    findings:
      uniqueFindings,

    totalFindings:
      uniqueFindings.length,

    sourceCount:
      sourceMap.size,

    nextStep:
      "integrate"
  };
}
