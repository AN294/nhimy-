"use strict";

/*
 * =========================================================
 * NHIMY — RESUMIR / INTELLIGENCE
 *
 * Motor local de transformação.
 *
 * Responsabilidade:
 * transformar o conteúdo preparado em uma estrutura
 * útil para estudo.
 *
 * A inteligência externa poderá ser conectada futuramente
 * sem alterar a interface do estudante.
 * =========================================================
 */


function splitBlocks(content) {

  return content
    .split(/\n+/)
    .map(block => block.trim())
    .filter(Boolean);
}


function isHeading(block) {

  return (
    /^\*\*.+\*\*$/.test(block) ||
    /^#+\s+/.test(block)
  );
}


function cleanHeading(block) {

  return block
    .replace(/^#+\s*/, "")
    .replace(/^\*\*/, "")
    .replace(/\*\*$/, "")
    .trim();
}


function isNumberedItem(block) {

  return /^\d+[.)]\s+/.test(block);
}


function isListItem(block) {

  return /^[•*-]\s+/.test(block);
}


function scoreBlock(block) {

  let score = 0;

  const text = block.toLowerCase();

  if (isNumberedItem(block)) {
    score += 5;
  }

  if (isListItem(block)) {
    score += 4;
  }

  if (
    text.includes("importante") ||
    text.includes("fundamental") ||
    text.includes("principal") ||
    text.includes("essencial")
  ) {
    score += 3;
  }

  if (
    text.includes("é o processo") ||
    text.includes("consiste") ||
    text.includes("ocorre") ||
    text.includes("permite") ||
    text.includes("contribui")
  ) {
    score += 2;
  }

  if (block.length >= 50 && block.length <= 350) {
    score += 1;
  }

  return score;
}


function rankBlocks(blocks) {

  return blocks
    .filter(block => !isHeading(block))
    .filter(block => block.length > 25)
    .map((block, index) => ({
      block,
      score: scoreBlock(block),
      index
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.index - b.index;
    })
    .map(item => item.block);
}


function createPoints(blocks) {

  const numberedItems = blocks
    .filter(block => isNumberedItem(block))
    .map(block => block
      .replace(/^\d+[.)]\s+/, "")
      .trim()
    )
    .filter(Boolean);

  if (numberedItems.length) {
    return numberedItems
      .slice(0, 7)
      .map(block => `• ${block}`);
  }

  const cleaned = blocks
    .filter(block => !isHeading(block))
    .map(block => block
      .replace(/^[•*-]\s+/, "")
      .trim()
    )
    .filter(Boolean);

  return rankBlocks(cleaned)
    .slice(0, 7)
    .map(block => `• ${block}`);
}


function createQuickSummary(blocks) {

  const usefulBlocks = blocks
    .filter(block => !isHeading(block))
    .filter(block => block.length > 30);

  return usefulBlocks
    .slice(0, 3)
    .join("\n\n");
}


function createDetailedSummary(blocks) {

  const usefulBlocks = blocks
    .filter(block => !isHeading(block))
    .filter(block => block.length > 20);

  return usefulBlocks
    .slice(0, 5)
    .join("\n\n");
}


function createReview(blocks) {

  const points = createPoints(blocks);

  return [
    "Ideias para revisão:",
    "",
    points.join("\n")
  ].join("\n");
}



function resolveStudyIntent(request) {

  const definitions = {
    quick: {
      label: "Resumo rápido",
      instruction:
        "Apresente uma visão geral objetiva do conteúdo."
    },

    detailed: {
      label: "Resumo detalhado",
      instruction:
        "Organize as ideias principais com maior profundidade."
    },

    points: {
      label: "Pontos principais",
      instruction:
        "Identifique e organize os pontos mais importantes."
    },

    review: {
      label: "Resumo para revisão",
      instruction:
        "Organize o conteúdo para facilitar a revisão posterior."
    }
  };

  const requestedMode =
    request &&
    typeof request === "object" &&
    typeof request.mode === "string"
      ? request.mode
      : "quick";

  const mode =
    definitions[requestedMode]
      ? requestedMode
      : "quick";

  const definition = definitions[mode];

  return {
    mode,
    label: definition.label,
    instruction: definition.instruction
  };
}


function createStudyResult(prepared) {

  const blocks = splitBlocks(prepared.content);

  if (!blocks.length) {
    return prepared.content;
  }

  const heading = blocks.find(isHeading);
  const title = heading
    ? cleanHeading(heading)
    : "";

  let output = "";

  switch (prepared.mode) {

    case "detailed":
      output = createDetailedSummary(blocks);
      break;

    case "points":
      output = createPoints(blocks).join("\n");
      break;

    case "review":
      output = createReview(blocks);
      break;

    case "quick":
    default:
      output = createQuickSummary(blocks);
      break;
  }

  if (title && prepared.mode !== "review") {
    output = `${title}\n\n${output}`;
  }

  return output || prepared.content;
}


export function processSummary(prepared) {

  if (!prepared || !prepared.content) {
    throw new Error("Conteúdo preparado inválido.");
  }

  const intent = resolveStudyIntent({
    mode: prepared.mode,
    label: prepared.label,
    instruction: prepared.instruction
  });

  const studyRequest = {
    ...prepared,
    ...intent
  };

  const studyResult = createStudyResult(studyRequest);

  return {
    status: "success",
    type: "summary",
    mode: intent.mode,
    label: intent.label,
    content: prepared.content,
    instruction: intent.instruction,
    words: prepared.words,
    characters: prepared.characters,
    result: studyResult
  };
}
