"use strict";

/**
 * NHIMY — Research Section Selector
 *
 * Responsabilidade:
 * Identificar a seção mais adequada de um trabalho
 * para uma determinada pergunta de pesquisa.
 *
 * Este módulo NÃO pesquisa fontes.
 * Este módulo NÃO consulta providers.
 * Este módulo apenas interpreta a intenção da pergunta.
 */


/**
 * Normaliza texto para facilitar a análise.
 */
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


/**
 * Verifica se o texto contém pelo menos um
 * dos termos fornecidos.
 */
function containsAny(text, terms) {
  return terms.some(term =>
    text.includes(term)
  );
}


/**
 * Escolhe a seção mais adequada para uma pergunta.
 *
 * Retorna:
 *
 * {
 *   section,
 *   intent,
 *   confidence,
 *   reason
 * }
 */
export function selectResearchSection(
  question,
  {
    sections = []
  } = {}
) {
  const q = normalizeText(question);

  if (!q) {
    return {
      section: "",
      intent: "unknown",
      confidence: 0,
      reason: "Pergunta vazia."
    };
  }


  /*
   * INTRODUÇÃO
   *
   * Perguntas que apresentam o assunto,
   * definem conceitos ou contextualizam o tema.
   */
  const introductionTerms = [
    "o que e",
    "que e",
    "definicao",
    "defina",
    "conceito",
    "significa",
    "significado",
    "introducao",
    "contexto",
    "sobre o que",
    "como surgiu",
    "origem"
  ];

  if (containsAny(q, introductionTerms)) {
    return {
      section: findSection(
        sections,
        [
          "introducao",
          "introdução",
          "apresentacao",
          "apresentação",
          "contextualizacao",
          "contextualização"
        ],
        "Introdução"
      ),
      intent: "definition",
      confidence: 0.95,
      reason: "A pergunta busca definição ou contextualização do tema."
    };
  }


  /*
   * CAUSAS / FATORES
   */
  const factorTerms = [
    "causa",
    "causas",
    "fator",
    "fatores",
    "risco",
    "riscos",
    "por que",
    "porque",
    "origina",
    "originam",
    "associado",
    "associados",
    "relacionado",
    "relacionados",
    "determinante",
    "determinantes",
    "vulnerabilidade"
  ];

  if (containsAny(q, factorTerms)) {
    return {
      section: findSection(
        sections,
        [
          "desenvolvimento",
          "causas",
          "fatores",
          "fatores de risco"
        ],
        "Desenvolvimento"
      ),
      intent: "factors",
      confidence: 0.92,
      reason: "A pergunta procura causas, fatores ou condições associadas."
    };
  }


  /*
   * SINTOMAS / MANIFESTAÇÕES
   */
  const symptomTerms = [
    "sintoma",
    "sintomas",
    "sinais",
    "manifestacao",
    "manifestacoes",
    "manifestação",
    "manifestações",
    "como identificar",
    "como reconhecer"
  ];

  if (containsAny(q, symptomTerms)) {
    return {
      section: findSection(
        sections,
        [
          "desenvolvimento",
          "sintomas",
          "sinais e sintomas"
        ],
        "Desenvolvimento"
      ),
      intent: "symptoms",
      confidence: 0.94,
      reason: "A pergunta procura sinais, sintomas ou manifestações."
    };
  }


  /*
   * DIAGNÓSTICO
   */
  const diagnosisTerms = [
    "diagnostico",
    "diagnóstico",
    "diagnosticar",
    "avaliacao",
    "avaliação",
    "identificacao",
    "identificação",
    "exame",
    "exames",
    "como saber se"
  ];

  if (containsAny(q, diagnosisTerms)) {
    return {
      section: findSection(
        sections,
        [
          "desenvolvimento",
          "diagnostico",
          "diagnóstico",
          "avaliacao",
          "avaliação"
        ],
        "Desenvolvimento"
      ),
      intent: "diagnosis",
      confidence: 0.93,
      reason: "A pergunta procura formas de identificação ou diagnóstico."
    };
  }


  /*
   * CONSEQUÊNCIAS / EFEITOS / DESFECHOS
   */
  const consequenceTerms = [
    "consequencia",
    "consequencias",
    "consequência",
    "consequências",
    "efeito",
    "efeitos",
    "impacto",
    "impactos",
    "desfecho",
    "desfechos",
    "complicacao",
    "complicacoes",
    "complicação",
    "complicações",
    "afeta",
    "afetam"
  ];

  if (containsAny(q, consequenceTerms)) {
    return {
      section: findSection(
        sections,
        [
          "desenvolvimento",
          "consequencias",
          "consequências",
          "efeitos",
          "impactos",
          "desfechos"
        ],
        "Desenvolvimento"
      ),
      intent: "consequences",
      confidence: 0.94,
      reason: "A pergunta procura efeitos, impactos ou consequências."
    };
  }


  /*
   * PREVENÇÃO
   */
  const preventionTerms = [
    "prevenir",
    "prevencao",
    "prevenção",
    "evitar",
    "reduzir o risco",
    "como evitar",
    "medidas preventivas"
  ];

  if (containsAny(q, preventionTerms)) {
    return {
      section: findSection(
        sections,
        [
          "desenvolvimento",
          "prevencao",
          "prevenção",
          "medidas preventivas"
        ],
        "Desenvolvimento"
      ),
      intent: "prevention",
      confidence: 0.94,
      reason: "A pergunta procura medidas de prevenção ou redução de risco."
    };
  }


  /*
   * TRATAMENTO / INTERVENÇÃO
   */
  const treatmentTerms = [
    "tratamento",
    "tratar",
    "terapia",
    "intervencao",
    "intervenção",
    "manejo",
    "cuidados",
    "como tratar"
  ];

  if (containsAny(q, treatmentTerms)) {
    return {
      section: findSection(
        sections,
        [
          "desenvolvimento",
          "tratamento",
          "intervencao",
          "intervenção",
          "cuidados"
        ],
        "Desenvolvimento"
      ),
      intent: "treatment",
      confidence: 0.94,
      reason: "A pergunta procura tratamento, intervenção ou cuidados."
    };
  }


  /*
   * IMPORTÂNCIA / RELEVÂNCIA
   */
  const importanceTerms = [
    "importancia",
    "importância",
    "por que e importante",
    "por que é importante",
    "relevancia",
    "relevância",
    "qual a importancia",
    "qual é a importância"
  ];

  if (containsAny(q, importanceTerms)) {
    return {
      section: findSection(
        sections,
        [
          "desenvolvimento",
          "importancia",
          "importância",
          "relevancia",
          "relevância"
        ],
        "Desenvolvimento"
      ),
      intent: "importance",
      confidence: 0.90,
      reason: "A pergunta procura explicar a importância ou relevância do tema."
    };
  }


  /*
   * CONCLUSÃO
   *
   * Perguntas que pedem síntese, resumo final
   * ou principais conclusões.
   */
  const conclusionTerms = [
    "conclusao",
    "conclusão",
    "concluir",
    "principais conclusoes",
    "principais conclusões",
    "em resumo",
    "resumindo",
    "sintese",
    "síntese",
    "qual a principal conclusao",
    "qual é a principal conclusão"
  ];

  if (containsAny(q, conclusionTerms)) {
    return {
      section: findSection(
        sections,
        [
          "conclusao",
          "conclusão",
          "sintese",
          "síntese"
        ],
        "Conclusão"
      ),
      intent: "conclusion",
      confidence: 0.96,
      reason: "A pergunta procura síntese ou conclusão."
    };
  }


  /*
   * FALLBACK
   *
   * Se a pergunta não revelar claramente
   * uma intenção específica, usamos Desenvolvimento.
   */
  return {
    section: findSection(
      sections,
      ["desenvolvimento"],
      "Desenvolvimento"
    ),
    intent: "general",
    confidence: 0.60,
    reason: "Não foi identificada uma intenção específica; Desenvolvimento é a seção padrão."
  };
}


/**
 * Procura uma seção real entre as seções fornecidas.
 *
 * Se nenhuma corresponder, usa o fallback.
 */
function findSection(
  sections,
  aliases,
  fallback
) {
  if (!Array.isArray(sections)) {
    return fallback;
  }

  for (const section of sections) {
    const title =
      normalizeText(
        typeof section === "string"
          ? section
          : section?.title
      );

    if (!title) {
      continue;
    }

    if (
      aliases.some(alias =>
        title.includes(
          normalizeText(alias)
        )
      )
    ) {
      return typeof section === "string"
        ? section
        : section.title;
    }
  }

  return fallback;
}
