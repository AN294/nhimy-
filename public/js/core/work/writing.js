/**
 * NHIMY — Work Writing Engine
 *
 * Responsabilidade:
 * transformar o contexto já produzido pelo fluxo de Trabalhos
 * em texto organizado por seção.
 *
 * Não faz:
 * - pesquisa
 * - chamada de API
 * - criação de Research
 * - criação de Development Plan
 * - revisão
 * - finalização
 *
 * Contrato:
 * createWritingPlan(project) -> plano de escrita por seção
 * generateSectionText(section, context) -> texto da seção
 * generateWorkContent(project) -> project.content
 */

function normalize(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function getSectionTitle(section) {
  if (typeof section === "string") return section;

  return normalize(
    section?.title ||
    section?.name ||
    section?.section ||
    section?.heading
  );
}

function getSectionQuestion(section) {
  if (!section || typeof section === "string") return "";

  return normalize(
    section.question ||
    section.prompt ||
    section.description ||
    section.objective
  );
}

function getFindingsForSection(section, research) {
  const sectionTitle = getSectionTitle(section).toLowerCase();

  const findings = asArray(
    research?.findings ||
    research?.results ||
    []
  );

  if (!sectionTitle || !findings.length) {
    return findings;
  }

  const matched = findings.filter((finding) => {
    const target = normalize(
      finding?.section ||
      finding?.sectionTitle ||
      finding?.targetSection
    ).toLowerCase();

    return target === sectionTitle ||
      target.includes(sectionTitle) ||
      sectionTitle.includes(target);
  });

  return matched.length ? matched : findings;
}

function extractFindingText(finding) {
  if (typeof finding === "string") {
    return normalize(finding);
  }

  return normalize(
    finding?.text ||
    finding?.content ||
    finding?.finding ||
    finding?.summary ||
    finding?.claim ||
    finding?.title
  );
}

function extractSourceLabel(finding) {
  if (typeof finding === "string") return "";

  return normalize(
    finding?.sourceTitle ||
    finding?.source ||
    finding?.title
  );
}

function createOpening(sectionTitle, project) {
  const topic = normalize(
    project?.title ||
    project?.topic ||
    project?.subject
  );

  if (!sectionTitle) return "";

  if (sectionTitle.toLowerCase().includes("introdu")) {
    return topic
      ? `O tema ${topic} apresenta relevância no contexto acadêmico e científico, sendo necessário compreender seus principais aspectos, características e implicações.`
      : `Este trabalho aborda um tema de relevância acadêmica e científica, procurando apresentar seus principais aspectos e implicações.`;
  }

  return `Nesta seção, são apresentados os principais aspectos relacionados a ${topic || "ao tema em estudo"}, considerando as informações e evidências reunidas durante a pesquisa.`;
}

function createDevelopmentParagraph(findings) {
  const texts = findings
    .map(extractFindingText)
    .filter(Boolean);

  if (!texts.length) return "";

  return texts.join(" ");
}

function createEvidenceParagraph(findings) {
  const sources = findings
    .map(extractSourceLabel)
    .filter(Boolean);

  if (!sources.length) return "";

  const unique = [...new Set(sources)];

  return `As informações apresentadas foram fundamentadas nas fontes identificadas durante a etapa de pesquisa, incluindo ${unique.slice(0, 5).join(", ")}.`;
}

function createClosing(sectionTitle) {
  const title = sectionTitle.toLowerCase();

  if (title.includes("conclus")) {
    return `Dessa forma, a análise realizada permite compreender os principais pontos relacionados ao tema, destacando a importância das evidências reunidas e da interpretação adequada das informações apresentadas.`;
  }

  return "";
}

/**
 * Cria o plano de escrita usando a estrutura já existente.
 */
export function createWritingPlan(project = {}) {
  const structure =
    project.structure ||
    project.development?.structure ||
    [];

  const sections = asArray(
    structure?.sections ||
    structure
  );

  return sections
    .map((section) => {
      const title = getSectionTitle(section);

      return {
        title,
        question: getSectionQuestion(section),
        findings: getFindingsForSection(
          section,
          project.research || project
        )
      };
    })
    .filter((section) => section.title);
}

/**
 * Gera o texto de uma única seção.
 */
export function generateSectionText(section, context = {}) {
  const title = getSectionTitle(section);
  const findings = asArray(section?.findings);

  const paragraphs = [];

  const opening = createOpening(title, context.project || context);

  if (opening) {
    paragraphs.push(opening);
  }

  const evidenceText = createDevelopmentParagraph(findings);

  if (evidenceText) {
    paragraphs.push(evidenceText);
  }

  const evidence = createEvidenceParagraph(findings);

  if (evidence) {
    paragraphs.push(evidence);
  }

  const closing = createClosing(title);

  if (closing) {
    paragraphs.push(closing);
  }

  if (!paragraphs.length) {
    const question = getSectionQuestion(section);

    if (question) {
      paragraphs.push(
        `Esta seção aborda a questão: ${question}.`
      );
    } else {
      paragraphs.push(
        `Esta seção apresenta informações relacionadas ao tema do trabalho.`
      );
    }
  }

  return paragraphs.join("\n\n").trim();
}

/**
 * Gera o conteúdo completo no mesmo formato esperado por Development,
 * sem alterar a estrutura do project.
 */
export function generateWorkContent(project = {}) {
  const plan = createWritingPlan(project);

  const content = {};

  for (let index = 0; index < plan.length; index++) {
    const section = plan[index];

    content[index] = generateSectionText(
      section,
      { project }
    );
  }

  return content;
}

export default {
  createWritingPlan,
  generateSectionText,
  generateWorkContent
};
