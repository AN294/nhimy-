"use strict";

import { $ } from "../core/dom.js";
import { setMessage } from "../core/utils.js";
import { copyText } from "../ui/clipboard.js";

function updateTextCounter() {
  const input = $("textCounterInput");

  if (!input) return;

  const text = input.value;

  const words =
    text.trim() === ""
      ? 0
      : text.trim().split(/\s+/).length;

  const characters = text.length;

  const lines =
    text === ""
      ? 0
      : text.split(/\r?\n/).length;

  const wordCount = $("wordCount");
  const characterCount = $("characterCount");
  const lineCount = $("lineCount");

  if (wordCount) {
    wordCount.textContent = words;
  }

  if (characterCount) {
    characterCount.textContent = characters;
  }

  if (lineCount) {
    lineCount.textContent = lines;
  }
}

function toTitleCase(text) {
  return text
    .toLowerCase()
    .replace(
      /(^|\s)([a-záàâãéêíóôõúç])/gi,
      (_, space, letter) =>
        `${space}${letter.toUpperCase()}`
    );
}

export function initTextTools() {
  const textCounterInput =
    $("textCounterInput");

  textCounterInput?.addEventListener(
    "input",
    updateTextCounter
  );

  updateTextCounter();

  const textTransformInput =
    $("textTransformInput");

  const uppercaseButton =
    $("uppercaseButton");

  const lowercaseButton =
    $("lowercaseButton");

  const titlecaseButton =
    $("titlecaseButton");

  const clearTextButton =
    $("clearTextButton");

  const copyTransformedTextButton =
    $("copyTransformedTextButton");

  const textTransformMessage =
    $("textTransformMessage");

  if (!textTransformInput) {
    return;
  }

  uppercaseButton?.addEventListener(
    "click",
    () => {
      textTransformInput.value =
        textTransformInput.value.toUpperCase();

      setMessage(
        textTransformMessage,
        "Texto convertido para maiúsculas."
      );
    }
  );

  lowercaseButton?.addEventListener(
    "click",
    () => {
      textTransformInput.value =
        textTransformInput.value.toLowerCase();

      setMessage(
        textTransformMessage,
        "Texto convertido para minúsculas."
      );
    }
  );

  titlecaseButton?.addEventListener(
    "click",
    () => {
      textTransformInput.value =
        toTitleCase(
          textTransformInput.value
        );

      setMessage(
        textTransformMessage,
        "Texto convertido para Title Case."
      );
    }
  );

  clearTextButton?.addEventListener(
    "click",
    () => {
      textTransformInput.value = "";

      setMessage(
        textTransformMessage,
        "Texto limpo."
      );

      textTransformInput.focus();
    }
  );

  copyTransformedTextButton?.addEventListener(
    "click",
    async () => {
      try {
        await copyText(
          textTransformInput.value
        );

        setMessage(
          textTransformMessage,
          "Texto copiado."
        );
      } catch (error) {
        setMessage(
          textTransformMessage,
          error.message ||
            "Não foi possível copiar o texto."
        );
      }
    }
  );
}
