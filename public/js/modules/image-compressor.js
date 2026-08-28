"use strict";

import { $ } from "../core/dom.js";
import { setMessage, show } from "../core/utils.js";

export function initImageCompressor() {
  const imageInput = $("imageInput");
  const imageQuality = $("imageQuality");
  const qualityValue = $("qualityValue");
  const compressImageButton = $("compressImageButton");
  const compressMessage = $("compressMessage");
  const compressResult = $("compressResult");
  const compressStats = $("compressStats");
  const compressedPreview = $("compressedPreview");
  const compressedDownload = $("compressedDownload");

  if (!imageInput || !compressImageButton) return;

  imageQuality?.addEventListener("input", () => {
    if (qualityValue) {
      qualityValue.textContent = `${imageQuality.value}%`;
    }
  });

  compressImageButton.addEventListener("click", () => {
    const file = imageInput.files?.[0];

    if (!file) {
      setMessage(
        compressMessage,
        "Selecione uma imagem primeiro."
      );

      show(compressResult, false);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(
        compressMessage,
        "Selecione um ficheiro de imagem válido."
      );

      show(compressResult, false);
      return;
    }

    compressImageButton.disabled = true;
    compressImageButton.textContent = "Comprimindo...";

    setMessage(
      compressMessage,
      "Comprimindo imagem..."
    );

    show(compressResult, false);

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");

          canvas.width =
            image.naturalWidth || image.width;

          canvas.height =
            image.naturalHeight || image.height;

          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error(
              "O navegador não conseguiu processar a imagem."
            );
          }

          context.fillStyle = "#ffffff";

          context.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          context.drawImage(image, 0, 0);

          const quality =
            Number(imageQuality?.value || 80) / 100;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                compressImageButton.disabled = false;
                compressImageButton.textContent =
                  "Comprimir imagem";

                setMessage(
                  compressMessage,
                  "Não foi possível comprimir a imagem."
                );

                return;
              }

              const originalKB =
                file.size / 1024;

              const compressedKB =
                blob.size / 1024;

              const reduction =
                file.size > 0
                  ? (1 - blob.size / file.size) * 100
                  : 0;

              const url =
                URL.createObjectURL(blob);

              if (compressedPreview) {
                compressedPreview.src = url;
              }

              if (compressedDownload) {
                compressedDownload.href = url;
                compressedDownload.download =
                  "nhimy-compressed.jpg";
              }

              setMessage(
                compressStats,
                `Original: ${originalKB.toFixed(
                  1
                )} KB • Comprimida: ${compressedKB.toFixed(
                  1
                )} KB • Redução: ${Math.max(
                  0,
                  reduction
                ).toFixed(1)}%`
              );

              setMessage(
                compressMessage,
                "Imagem comprimida com sucesso."
              );

              show(compressResult, true);

              compressImageButton.disabled = false;
              compressImageButton.textContent =
                "Comprimir imagem";
            },
            "image/jpeg",
            Math.min(1, Math.max(0.1, quality))
          );
        } catch (error) {
          console.error(error);

          setMessage(
            compressMessage,
            error.message ||
              "Não foi possível processar a imagem."
          );

          compressImageButton.disabled = false;
          compressImageButton.textContent =
            "Comprimir imagem";
        }
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      setMessage(
        compressMessage,
        "Erro ao ler o ficheiro."
      );

      compressImageButton.disabled = false;
      compressImageButton.textContent =
        "Comprimir imagem";
    };

    reader.readAsDataURL(file);
  });
}
