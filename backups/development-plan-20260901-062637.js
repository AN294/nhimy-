/*
 * ---------------------------------------------------------
 * NHIMY — DEVELOPMENT PLAN
 * ---------------------------------------------------------
 * Ponte:
 * Structure → Research → Development
 *
 * Responsabilidade:
 * - associar findings às seções da estrutura;
 * - preservar sourceIds;
 * - preservar sources;
 * - preservar evidências;
 * - não alterar Research nem Structure.
 * ---------------------------------------------------------
 */

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveSection(section, findings) {
  const target = normalizeText(section);

  return findings.filter((finding) => {
    return normalizeText(finding?.section) === target;
  });
}

function createDevelopmentSection(section, findings) {
  const sectionFindings = resolveSection(section, findings);

  const sourceIds = [
    ...new Set(
      sectionFindings.flatMap((finding) =>
        Array.isArray(finding?.sourceIds)
          ? finding.sourceIds
          : []
      )
    )
  ];

  const sources = sectionFindings.flatMap((finding) =>
    Array.isArray(finding?.sources)
      ? finding.sources
      : []
  );

  const evidence = sectionFindings.map((finding) => ({
    text: finding?.text || "",
    sourceIds: Array.isArray(finding?.sourceIds)
      ? [...finding.sourceIds]
      : [],
    sources: Array.isArray(finding?.sources)
      ? [...finding.sources]
      : [],
    relevance: finding?.relevance ?? null
  }));

  return {
    section,
    findings: sectionFindings,
    sourceIds,
    sources,
    evidence
  };
}

export function createDevelopmentPlan(input = {}) {
  const structure = Array.isArray(input.structure)
    ? input.structure
    : [];

  const research = input.research || {};

  const findings = Array.isArray(research.findings)
    ? research.findings
    : [];

  const sources = Array.isArray(research.sources)
    ? research.sources
    : [];

  const sections = structure.map((section) =>
    createDevelopmentSection(section, findings)
  );

  return {
    type: "work-development-plan",
    topic: research.topic || "",
    sections,
    findings,
    sources,
    sourceCount: sources.length
  };
}
