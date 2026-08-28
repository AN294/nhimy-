"use strict";

import { $ } from "../core/dom.js";
import { setMessage } from "../core/utils.js";
import { copyText } from "../ui/clipboard.js";

export function initUrlTool() {
  const urlInput = $("urlInput");
  const encodeUrlButton = $("encodeUrlButton");
  const decodeUrlButton = $("decodeUrlButton");
  const urlOutput = $("urlOutput");
  const copyUrlButton = $("copyUrlButton");
  const urlMessage = $("urlMessage");

  encodeUrlButton?.addEventListener("click", () => {
    const value = urlInput?.value || "";

    if (!value) {
      setMessage(
        urlMessage,
        "Digite um texto ou URL."
      );
      return;
    }

    try {
      if (urlOutput) {
        urlOutput.value =
          encodeURIComponent(value);
      }

      setMessage(
        urlMessage,
        "Texto codificado com sucesso."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        urlMessage,
        "Não foi possível codificar o texto."
      );
    }
  });

  decodeUrlButton?.addEventListener("click", () => {
    const value = urlInput?.value || "";

    if (!value) {
      setMessage(
        urlMessage,
        "Digite um texto ou URL codificado."
      );
      return;
    }

    try {
      if (urlOutput) {
        urlOutput.value =
          decodeURIComponent(value);
      }

      setMessage(
        urlMessage,
        "Texto decodificado com sucesso."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        urlMessage,
        "O conteúdo não é uma URL codificada válida."
      );
    }
  });

  copyUrlButton?.addEventListener("click", async () => {
    const value = urlOutput?.value || "";

    if (!value) {
      setMessage(
        urlMessage,
        "Não há resultado para copiar."
      );
      return;
    }

    try {
      await copyText(value);

      setMessage(
        urlMessage,
        "Resultado copiado."
      );
    } catch {
      urlOutput?.focus();
      urlOutput?.select();

      setMessage(
        urlMessage,
        "Selecione o resultado e copie manualmente."
      );
    }
  });
}
