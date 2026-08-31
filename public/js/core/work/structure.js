/*
 * =========================================================
 * NHIMY — WORK STRUCTURE
 *
 * Motor inicial de sugestão de estrutura para Trabalhos.
 *
 * Não acessa sessionStorage.
 * Recebe dados do projeto e devolve uma estrutura inicial.
 *
 * A estrutura sugerida é sempre editável pelo estudante.
 * =========================================================
 */


function suggestStructure({
  type = "",
  orientation = "",
  orientationContext = ""
} = {}) {

  const normalizedType =
    typeof type === "string"
      ? type.trim().toLowerCase()
      : "";

  const normalizedOrientation =
    typeof orientation === "string"
      ? orientation.trim().toLowerCase()
      : "";

  const context =
    typeof orientationContext === "string"
      ? orientationContext.trim()
      : "";


  /*
   * ---------------------------------------------------------
   * APRESENTAÇÃO
   * ---------------------------------------------------------
   */

  if (normalizedType === "apresentacao") {
    return [
      "Introdução",
      "Tema principal",
      "Desenvolvimento",
      "Conclusão"
    ];
  }


  /*
   * ---------------------------------------------------------
   * RELATÓRIO
   * ---------------------------------------------------------
   */

  if (normalizedType === "relatorio") {
    return [
      "Introdução",
      "Objetivos",
      "Desenvolvimento",
      "Resultados",
      "Conclusão"
    ];
  }


  /*
   * ---------------------------------------------------------
   * PESQUISA
   * ---------------------------------------------------------
   */

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


  /*
   * ---------------------------------------------------------
   * TRABALHO ESCOLAR
   * ---------------------------------------------------------
   */

  if (normalizedType === "trabalho-escolar") {

    if (
      normalizedOrientation === "inicio" &&
      context
    ) {
      return [
        "Introdução",
        "Desenvolvimento",
        "Conclusão"
      ];
    }

    if (
      normalizedOrientation === "ideias" &&
      context
    ) {
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
   * OUTRO / SEM TIPO DEFINIDO
   * ---------------------------------------------------------
   */

  return [
    "Introdução",
    "Desenvolvimento",
    "Conclusão"
  ];
}


/**
 * Cria uma estrutura de trabalho a partir
 * dos resultados da pesquisa.
 *
 * O Research fornece evidências/conteúdo.
 * Esta função transforma esses dados em
 * organização estrutural, sem colocar os
 * findings diretamente como capítulos.
 */
function suggestResearchStructure(research = {}) {

  const findings =
    Array.isArray(research?.findings)
      ? research.findings
      : [];

  if (!findings.length) {
    return [];
  }

  const sections = [];

  const hasIntent = intent =>
    findings.some(
      finding =>
        finding?.intent === intent
    );

  const add = section => {
    if (!sections.includes(section)) {
      sections.push(section);
    }
  };

  /*
   * A estrutura-base acompanha as seções
   * já definidas pelo Research.
   */
  add("Introdução");

  if (
    hasIntent("definition")
  ) {
    add("Conceito de ansiedade e depressão na gravidez");
  }

  if (
    hasIntent("factors")
  ) {
    add("Fatores relacionados");
  }

  if (
    hasIntent("symptoms")
  ) {
    add("Sintomas e manifestações");
  }

  if (
    hasIntent("diagnosis")
  ) {
    add("Diagnóstico e avaliação");
  }

  if (
    hasIntent("consequences")
  ) {
    add("Consequências e impactos");
  }

  if (
    hasIntent("prevention")
  ) {
    add("Prevenção e intervenção");
  }

  add("Conclusão");
  add("Referências");

  return sections;
}


export {
  suggestStructure,
  suggestResearchStructure
};
