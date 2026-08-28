"use strict";

import { $ } from "../core/dom.js";
import { setMessage } from "../core/utils.js";
import { copyText } from "../ui/clipboard.js";

export function initJsonTool() {
  const jsonInput = $("jsonInput");
  const formatJsonButton = $("formatJsonButton");
  const minifyJsonButton = $("minifyJsonButton");
  const clearJsonButton = $("clearJsonButton");
  const jsonOutput = $("jsonOutput");
  const copyJsonButton = $("copyJsonButton");
  const jsonMessage = $("jsonMessage");

  function parseJsonInput() {
    const value = jsonInput?.value.trim();

    if (!value) {
      throw new Error(
        "Cole ou digite um JSON primeiro."
      );
    }

    try {
      return JSON.parse(value);
    } catch {
      throw new Error(
        "JSON inválido. Verifique a estrutura dos dados."
      );
    }
  }

  formatJsonButton?.addEventListener("click", () => {
    try {
      const data = parseJsonInput();

      if (jsonOutput) {
        jsonOutput.value =
          JSON.stringify(data, null, 2);
      }

      setMessage(
        jsonMessage,
        "JSON válido e formatado com sucesso."
      );
    } catch (error) {
      if (jsonOutput) {
        jsonOutput.value = "";
      }

      setMessage(
        jsonMessage,
        error.message
      );
    }
  });

  minifyJsonButton?.addEventListener("click", () => {
    try {
      const data = parseJsonInput();

      if (jsonOutput) {
        jsonOutput.value =
          JSON.stringify(data);
      }

      setMessage(
        jsonMessage,
        "JSON compactado com sucesso."
      );
    } catch (error) {
      if (jsonOutput) {
        jsonOutput.value = "";
      }

      setMessage(
        jsonMessage,
        error.message
      );
    }
  });

  clearJsonButton?.addEventListener("click", () => {
    if (jsonInput) {
      jsonInput.value = "";
    }

    if (jsonOutput) {
      jsonOutput.value = "";
    }

    setMessage(jsonMessage, "");

    jsonInput?.focus();
  });

  copyJsonButton?.addEventListener(
    "click",
    async () => {
      const value =
        jsonOutput?.value || "";

      if (!value) {
        setMessage(
          jsonMessage,
          "Não há JSON para copiar."
        );
        return;
      }

      try {
        await copyText(value);

        setMessage(
          jsonMessage,
          "JSON copiado."
        );
      } catch {
        jsonOutput?.focus();
        jsonOutput?.select();

        setMessage(
          jsonMessage,
          "Selecione o JSON e copie manualmente."
        );
      }
    }
  );
}
