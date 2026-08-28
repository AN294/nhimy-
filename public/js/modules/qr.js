"use strict";

import { $ } from "../core/dom.js";
import { show } from "../core/utils.js";

export function initQrTool() {
  const input = $("qrInput");
  const button = $("generateQrButton");
  const message = $("qrMessage");
  const result = $("qrResult");
  const image = $("qrImage");
  const download = $("qrDownload");

  if (!input || !button) return;

  button.addEventListener("click", async () => {
    const text = input.value.trim();

    if (!text) {
      if (message) message.textContent = "Digite um texto ou endereço.";
      show(result, false);
      return;
    }

    button.disabled = true;

    if (message) message.textContent = "Gerando QR Code...";

    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error("Não foi possível gerar o QR Code.");
      }

      const data = await response.json();

      if (!data || !data.qr) {
        throw new Error("Resposta inválida do servidor.");
      }

      if (image) {
        image.src = data.qr;
      }

      if (download) {
        download.href = data.qr;
        download.download = "nhimy-qrcode.png";
      }

      show(result, true);

      if (message) message.textContent = "QR Code criado com sucesso.";
    } catch (error) {
      show(result, false);

      if (message) {
        message.textContent =
          error.message || "Ocorreu um erro ao gerar o QR Code.";
      }
    } finally {
      button.disabled = false;
    }
  });
}
