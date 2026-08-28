"use strict";
import { composeExplanation, createPedagogicalExample, createPedagogicalHowItWorks } from "./pedagogy.js";

/*
 * =========================================================
 * NHIMY — ESTUDAR / EXPLICAR / INTELLIGENCE
 *
 * Motor local de explicação.
 *
 * O conteúdo é analisado por frases e não apenas por
 * parágrafos, permitindo construir uma explicação mais útil.
 *
 * A inteligência externa poderá substituir este motor
 * futuramente sem alterar a interface do estudante.
 * =========================================================
 */

function splitBlocks(content) {

  return content
    .split(/\n+/)
    .map(block => block.trim())
    .filter(Boolean);
}


function splitSentences(text) {

  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 15);
}


function cleanText(text) {

  return text
    .replace(/^#+\s*/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .replace(/^[•*-]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}


function collectSentences(content) {

  const blocks = splitBlocks(content);

  return blocks
    .flatMap(block => splitSentences(cleanText(block)))
    .filter(Boolean);
}


function scoreSentence(sentence) {

  let score = 0;

  const text = sentence.toLowerCase().trim();

  /*
   * DEFINIÇÃO / IDEIA CENTRAL
   *
   * Definições devem ter prioridade máxima.
   */
  if (
    /\bé o\b/.test(text) ||
    /\bé um\b/.test(text) ||
    /\bé uma\b/.test(text) ||
    /\bsão\b/.test(text) ||
    /\bconsiste em\b/.test(text) ||
    /\bsignifica\b/.test(text) ||
    /\bprocesso pelo qual\b/.test(text)
  ) {
    score += 10;
  }

  /*
   * FRASES QUE EXPLICAM O FUNCIONAMENTO
   */
  if (
    /\bocorre\b/.test(text) ||
    /\bdurante\b/.test(text) ||
    /\butiliza\b/.test(text) ||
    /\bpermite\b/.test(text) ||
    /\bproduz\b/.test(text) ||
    /\btransforma\b/.test(text)
  ) {
    score += 4;
  }

  /*
   * IMPORTÂNCIA
   *
   * Continua relevante, mas não deve superar
   * uma definição quando procuramos a ideia principal.
   */
  if (
    /\bimportante\b/.test(text) ||
    /\bfundamental\b/.test(text) ||
    /\bessencial\b/.test(text) ||
    /\bcontribui\b/.test(text)
  ) {
    score += 2;
  }

  /*
   * Frases com tamanho razoável tendem a carregar
   * mais informação útil.
   */
  if (
    sentence.length >= 40 &&
    sentence.length <= 280
  ) {
    score += 1;
  }

  return score;
}

function rankSentences(sentences) {

  return sentences
    .map((sentence, index) => ({
      sentence,
      score: scoreSentence(sentence),
      index
    }))
    .sort((a, b) => {

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.index - b.index;
    });
}


function findByPatterns(sentences, patterns) {

  return sentences.find(sentence =>
    patterns.some(pattern => pattern.test(sentence))
  ) || null;
}


function createMainIdea(sentences) {

  const ranked = rankSentences(sentences);

  if (!ranked.length) {
    return "Não foi possível identificar a ideia principal.";
  }

  return ranked[0].sentence;
}


function createExplanation(sentences) {

  if (!sentences.length) {
    return "O conteúdo fornecido é muito curto para gerar uma explicação adequada.";
  }

  const result = {
    mainIdea: createMainIdea(sentences),
    howItWorks: createHowItWorks(sentences),
    result: createResult(sentences),
    importance: createImportance(sentences)
  };

  return composeExplanation(result);
}


function createHowItWorks(sentences) {

  const strongProcess = findByPatterns(sentences, [
    /\bocorre\b/i,
    /\bdurante\b/i,
    /\butiliza\b/i,
    /\butilizam\b/i,
    /\bdepende de\b/i,
    /\bdepende da\b/i,
    /\bpermite\b/i,
    /\bacontece quando\b/i,
    /\bé realizado por\b/i
  ]);

  if (strongProcess) {
    return strongProcess;
  }

  const process = findByPatterns(sentences, [
    /\bprocesso pelo qual\b/i,
    /\bprocesso em que\b/i,
    /\bprocesso no qual\b/i
  ]);

  return process ||
    "O conteúdo não apresenta detalhes suficientes para identificar claramente como o assunto funciona.";
}


function createResult(sentences) {

  const mainIdea = createMainIdea(sentences);

  const candidates = sentences
    .filter(sentence => sentence !== mainIdea);

  const strongResult = findByPatterns(candidates, [
    /\bresulta em\b/i,
    /\bresultando em\b/i,
    /\bgera\b/i,
    /\bgeram\b/i,
    /\blibera\b/i,
    /\bliberam\b/i,
    /\bforma\b/i,
    /\bformam\b/i,
    /\btransforma\b/i,
    /\btransformam\b/i
  ]);

  if (strongResult) {
    return strongResult;
  }

  const production = findByPatterns(candidates, [
    /\bproduz\b/i,
    /\bproduzem\b/i
  ]);

  return production ||
    "O conteúdo não apresenta claramente o resultado do processo.";
}


function createImportance(sentences) {

  return findByPatterns(sentences, [
    /\bimportante\b/i,
    /\bfundamental\b/i,
    /\bessencial\b/i,
    /\bcontribui\b/i,
    /\bporque\b/i
  ]) ||
    "A importância do assunto pode ser compreendida a partir das informações apresentadas no conteúdo.";
}


function createExample(sentences) {

  const explicitExample = findByPatterns(sentences, [
    /\bpor exemplo\b/i,
    /\bexemplo\b/i,
    /\btal como\b/i
  ]);

  if (explicitExample) {
    return explicitExample;
  }

  return createPedagogicalExample({
    topic: createMainIdea(sentences),
    howItWorks: createHowItWorks(sentences),
    result: createResult(sentences)
  });
}


function createKeyPoints(sentences) {

  const ranked = rankSentences(sentences);

  const selected = [];
  const seen = new Set();

  for (const item of ranked) {

    const normalized = item.sentence.toLowerCase();

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    selected.push(item.sentence);

    if (selected.length === 5) {
      break;
    }
  }

  return selected.map(sentence => `• ${sentence}`);
}


function createExplanationResult(prepared) {

  const sentences =
    collectSentences(prepared.content);

  return {

    title: "Explicação do conteúdo",

    summary:
      "O Nhimy separou as ideias do conteúdo para facilitar a compreensão.",

    mainIdea:
      createMainIdea(sentences),

    explanation:
      createExplanation(sentences),

    howItWorks:
      createPedagogicalHowItWorks({
        howItWorks: createHowItWorks(sentences)
      }),

    result:
      createResult(sentences),

    importance:
      createImportance(sentences),

    example:
      createExample(sentences),

    keyPoints:
      createKeyPoints(sentences),

    words:
      prepared.words,

    characters:
      prepared.characters

  };
}

export function processExplanation(prepared) {

  return createExplanationResult(prepared);

}
