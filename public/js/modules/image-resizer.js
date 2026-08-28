"use strict";

import { $ } from "../core/dom.js";
import { setMessage, show } from "../core/utils.js";

export function initImageResizer() {
  const resizeInput = $("resizeInput");
  const resizeWidth = $("resizeWidth");
  const resizeHeight = $("resizeHeight");
  const keepProportion = $("keepProportion");
  const resizeImageButton = $("resizeImageButton");
  const resizeMessage = $("resizeMessage");
  const resizeResult = $("resizeResult");
  const resizePreview = $("resizePreview");
  const resizeDownload = $("resizeDownload");

  let originalResizeWidth = 0;
  let originalResizeHeight = 0;

  if (!resizeInput || !resizeImageButton) return;

  resizeInput.addEventListener("change", () => {
    const file = resizeInput.files?.[0];

    if (!file) return;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        originalResizeWidth =
          image.naturalWidth || image.width;

        originalResizeHeight =
          image.naturalHeight || image.height;

        if (resizeWidth) {
          resizeWidth.value = originalResizeWidth;
        }

        if (resizeHeight) {
          resizeHeight.value = originalResizeHeight;
        }

        setMessage(
          resizeMessage,
          `Imagem carregada: ${originalResizeWidth} × ${originalResizeHeight}px`
        );
      };

      image.onerror = () => {
        setMessage(
          resizeMessage,
          "Não foi possível abrir esta imagem."
        );
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      setMessage(
        resizeMessage,
        "Erro ao ler o ficheiro."
      );
    };

    reader.readAsDataURL(file);
  });

  resizeWidth?.addEventListener("input", () => {
    if (
      !keepProportion?.checked ||
      !originalResizeWidth ||
      !originalResizeHeight
    ) {
      return;
    }

    const width = Number(resizeWidth.value);

    if (width > 0) {
      resizeHeight.value = Math.round(
        width *
          originalResizeHeight /
          originalResizeWidth
      );
    }
  });

  resizeHeight?.addEventListener("input", () => {
    if (
      !keepProportion?.checked ||
      !originalResizeWidth ||
      !originalResizeHeight
    ) {
      return;
    }

    const height = Number(resizeHeight.value);

    if (height > 0) {
      resizeWidth.value = Math.round(
        height *
          originalResizeWidth /
          originalResizeHeight
      );
    }
  });

  resizeImageButton.addEventListener("click", () => {
    const file = resizeInput.files?.[0];

    const width = Number(resizeWidth?.value);
    const height = Number(resizeHeight?.value);

    if (!file) {
      setMessage(
        resizeMessage,
        "Selecione uma imagem primeiro."
      );

      show(resizeResult, false);
      return;
    }

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1
    ) {
      setMessage(
        resizeMessage,
        "Informe uma largura e uma altura válidas."
      );

      show(resizeResult, false);
      return;
    }

    if (width > 10000 || height > 10000) {
      setMessage(
        resizeMessage,
        "Use dimensões de até 10.000 × 10.000 pixels."
      );

      show(resizeResult, false);
      return;
    }

    resizeImageButton.disabled = true;
    resizeImageButton.textContent = "Processando...";

    setMessage(
      resizeMessage,
      "Redimensionando imagem..."
    );

    show(resizeResult, false);

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

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
            width,
            height
          );

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resizeImageButton.disabled = false;
                resizeImageButton.textContent =
                  "Redimensionar imagem";

                setMessage(
                  resizeMessage,
                  "Não foi possível redimensionar a imagem."
                );

                return;
              }

              const url = URL.createObjectURL(blob);

              if (resizePreview) {
                resizePreview.src = url;
              }

              if (resizeDownload) {
                resizeDownload.href = url;
                resizeDownload.download =
                  "nhimy-resized.jpg";
              }

              setMessage(
                resizeMessage,
                `Imagem redimensionada para ${width} × ${height}px.`
              );

              show(resizeResult, true);

              resizeImageButton.disabled = false;
              resizeImageButton.textContent =
                "Redimensionar imagem";
            },
            "image/jpeg",
            0.9
          );
        } catch (error) {
          console.error(error);

          setMessage(
            resizeMessage,
            error.message ||
              "Não foi possível processar a imagem."
          );

          resizeImageButton.disabled = false;
          resizeImageButton.textContent =
            "Redimensionar imagem";
        }
      };

      image.onerror = () => {
        setMessage(
          resizeMessage,
          "Não foi possível abrir esta imagem."
        );

        resizeImageButton.disabled = false;
        resizeImageButton.textContent =
          "Redimensionar imagem";
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      setMessage(
        resizeMessage,
        "Erro ao ler o ficheiro."
      );

      resizeImageButton.disabled = false;
      resizeImageButton.textContent =
        "Redimensionar imagem";
    };

    reader.readAsDataURL(file);
  });
}
