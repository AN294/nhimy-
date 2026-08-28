"use strict";

import { $ } from "../core/dom.js";
import { setMessage } from "../core/utils.js";
import { copyText } from "../ui/clipboard.js";

const textGeneratorWords = [
  "tecnologia",
  "educação",
  "conhecimento",
  "aprendizagem",
  "internet",
  "projeto",
  "ferramenta",
  "estudante",
  "trabalho",
  "informação",
  "desenvolvimento",
  "criatividade",
  "organização",
  "resultado",
  "experiência",
  "solução",
  "processo",
  "ideia",
  "objetivo",
  "qualidade",
  "digital",
  "conteúdo",
  "pesquisa",
  "comunidade",
  "inovação",
  "prática",
  "sistema",
  "serviço",
  "atividade",
  "progresso"
];

function randomArrayItem(array) {
  return array[
    Math.floor(Math.random() * array.length)
  ];
}

function generateLoremText(count) {
  const words = [];

  for (let i = 0; i < count; i++) {
    words.push(
      randomArrayItem(textGeneratorWords)
    );
  }

  if (!words.length) {
    return "";
  }

  let text = words.join(" ");

  text =
    text.charAt(0).toUpperCase() +
    text.slice(1);

  if (!/[.!?]$/.test(text)) {
    text += ".";
  }

  return text;
}

export function initGeneratorTool() {
  const textGeneratorLength =
    $("textGeneratorLength");

  const generateTextButton =
    $("generateTextButton");

  const generatedText =
    $("generatedText");

  const copyGeneratedTextButton =
    $("copyGeneratedTextButton");

  const textGeneratorMessage =
    $("textGeneratorMessage");

  if (!generateTextButton) {
    return;
  }

  generateTextButton.addEventListener(
    "click",
    () => {
      let count =
        Number.parseInt(
          textGeneratorLength?.value,
          10
        );

      if (!Number.isInteger(count)) {
        count = 50;
      }

      count = Math.min(
        1000,
        Math.max(5, count)
      );

      if (textGeneratorLength) {
        textGeneratorLength.value = count;
      }

      const text =
        generateLoremText(count);

      if (generatedText) {
        generatedText.value = text;
      }

      setMessage(
        textGeneratorMessage,
        `Texto gerado com aproximadamente ${count} palavras.`
      );
    }
  );

  copyGeneratedTextButton?.addEventListener(
    "click",
    async () => {
      const text =
        generatedText?.value || "";

      if (!text) {
        setMessage(
          textGeneratorMessage,
          "Gere um texto primeiro."
        );
        return;
      }

      try {
        await copyText(text);

        setMessage(
          textGeneratorMessage,
          "Texto copiado."
        );
      } catch {
        generatedText?.focus();
        generatedText?.select();

        setMessage(
          textGeneratorMessage,
          "Selecione o texto e copie manualmente."
        );
      }
    }
  );
}
