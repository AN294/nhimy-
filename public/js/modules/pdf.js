"use strict";

import { $ } from "../core/dom.js";
import { setMessage, show } from "../core/utils.js";

function imageFileToJpeg(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        try {
          const width =
            image.naturalWidth || image.width;

          const height =
            image.naturalHeight || image.height;

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

          if (!context) {
            reject(
              new Error(
                "Não foi possível processar uma das imagens."
              )
            );
            return;
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

          const dataUrl =
            canvas.toDataURL(
              "image/jpeg",
              0.90
            );

          resolve({
            dataUrl,
            width,
            height
          });
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = () => {
        reject(
          new Error(
            "Não foi possível ler uma das imagens."
          )
        );
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      reject(
        new Error(
          "Erro ao ler uma das imagens."
        )
      );
    };

    reader.readAsDataURL(file);
  });
}

function dataUrlToBytes(dataUrl) {
  const base64 =
    dataUrl.split(",")[1];

  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}

function buildPdf(images) {
  const objects = [];

  const addObject = (object) => {
    objects.push(object);
    return objects.length;
  };

  const catalogId =
    addObject(null);

  const pagesId =
    addObject(null);

  const pageData = [];

  for (const image of images) {
    const imageBytes =
      dataUrlToBytes(
        image.dataUrl
      );

    const imageId =
      addObject({
        type: "image",
        width: image.width,
        height: image.height,
        bytes: imageBytes
      });

    const pageWidth =
      image.width > image.height
        ? 842
        : 595;

    const pageHeight =
      image.width > image.height
        ? 595
        : 842;

    const imageRatio =
      image.width /
      image.height;

    const pageRatio =
      pageWidth /
      pageHeight;

    let drawWidth;
    let drawHeight;

    if (
      imageRatio >
      pageRatio
    ) {
      drawWidth =
        pageWidth - 40;

      drawHeight =
        drawWidth /
        imageRatio;
    } else {
      drawHeight =
        pageHeight - 40;

      drawWidth =
        drawHeight *
        imageRatio;
    }

    const x =
      (pageWidth -
        drawWidth) /
      2;

    const y =
      (pageHeight -
        drawHeight) /
      2;

    const content =
      `q\n` +
      `${drawWidth.toFixed(2)} 0 0 ` +
      `${drawHeight.toFixed(2)} ` +
      `${x.toFixed(2)} ` +
      `${y.toFixed(2)} cm\n` +
      `/Im1 Do\n` +
      `Q\n`;

    const contentBytes =
      new TextEncoder().encode(
        content
      );

    const contentId =
      addObject({
        type: "content",
        bytes: contentBytes
      });

    const pageId =
      addObject({
        type: "page",
        pageWidth,
        pageHeight,
        imageId,
        contentId
      });

    pageData.push({
      pageId
    });
  }

  objects[catalogId - 1] = {
    type: "catalog",
    pagesId
  };

  objects[pagesId - 1] = {
    type: "pages",
    pageIds:
      pageData.map(
        (page) => page.pageId
      )
  };

  const chunks = [];
  const encoder =
    new TextEncoder();

  const header =
    encoder.encode(
      "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n"
    );

  chunks.push(header);

  const offsets =
    new Array(
      objects.length + 1
    ).fill(0);

  let currentOffset =
    header.length;

  for (
    let id = 1;
    id <= objects.length;
    id++
  ) {
    const object =
      objects[id - 1];

    offsets[id] =
      currentOffset;

    const objectHeader =
      encoder.encode(
        `${id} 0 obj\n`
      );

    chunks.push(
      objectHeader
    );

    currentOffset +=
      objectHeader.length;

    let body;

    if (
      object.type ===
      "catalog"
    ) {
      body =
        encoder.encode(
          `<< /Type /Catalog /Pages ` +
          `${object.pagesId} 0 R >>\n`
        );

      chunks.push(body);
      currentOffset +=
        body.length;
    }

    else if (
      object.type ===
      "pages"
    ) {
      const kids =
        object.pageIds
          .map(
            (id) =>
              `${id} 0 R`
          )
          .join(" ");

      body =
        encoder.encode(
          `<< /Type /Pages ` +
          `/Kids [${kids}] ` +
          `/Count ${object.pageIds.length} >>\n`
        );

      chunks.push(body);
      currentOffset +=
        body.length;
    }

    else if (
      object.type ===
      "image"
    ) {
      const imageHeader =
        encoder.encode(
          `<< /Type /XObject ` +
          `/Subtype /Image ` +
          `/Width ${object.width} ` +
          `/Height ${object.height} ` +
          `/ColorSpace /DeviceRGB ` +
          `/BitsPerComponent 8 ` +
          `/Filter /DCTDecode ` +
          `/Length ${object.bytes.length} >>\n` +
          `stream\n`
        );

      chunks.push(
        imageHeader
      );

      currentOffset +=
        imageHeader.length;

      chunks.push(
        object.bytes
      );

      currentOffset +=
        object.bytes.length;

      const imageEnd =
        encoder.encode(
          `\nendstream\n`
        );

      chunks.push(
        imageEnd
      );

      currentOffset +=
        imageEnd.length;
    }

    else if (
      object.type ===
      "content"
    ) {
      const contentHeader =
        encoder.encode(
          `<< /Length ${object.bytes.length} >>\n` +
          `stream\n`
        );

      chunks.push(
        contentHeader
      );

      currentOffset +=
        contentHeader.length;

      chunks.push(
        object.bytes
      );

      currentOffset +=
        object.bytes.length;

      const contentEnd =
        encoder.encode(
          `endstream\n`
        );

      chunks.push(
        contentEnd
      );

      currentOffset +=
        contentEnd.length;
    }

    else if (
      object.type ===
      "page"
    ) {
      body =
        encoder.encode(
          `<< /Type /Page ` +
          `/Parent ${pagesId} 0 R ` +
          `/MediaBox [0 0 ` +
          `${object.pageWidth} ` +
          `${object.pageHeight}] ` +
          `/Resources << ` +
          `/XObject << /Im1 ` +
          `${object.imageId} 0 R >> ` +
          `>> ` +
          `/Contents ${object.contentId} 0 R >>\n`
        );

      chunks.push(body);
      currentOffset +=
        body.length;
    }

    const endObject =
      encoder.encode(
        `endobj\n`
      );

    chunks.push(
      endObject
    );

    currentOffset +=
      endObject.length;
  }

  const xrefOffset =
    currentOffset;

  let xref =
    `xref\n` +
    `0 ${objects.length + 1}\n` +
    `0000000000 65535 f \n`;

  for (
    let id = 1;
    id <= objects.length;
    id++
  ) {
    xref +=
      `${String(
        offsets[id]
      ).padStart(
        10,
        "0"
      )} 00000 n \n`;
  }

  xref +=
    `trailer\n` +
    `<< /Size ${objects.length + 1} ` +
    `/Root ${catalogId} 0 R >>\n` +
    `startxref\n` +
    `${xrefOffset}\n` +
    `%%EOF`;

  chunks.push(
    encoder.encode(xref)
  );

  return new Blob(
    chunks,
    {
      type:
        "application/pdf"
    }
  );
}

export function initPdfTool() {
  const pdfImages =
    $("pdfImages");

  const createPdfButton =
    $("createPdfButton");

  const pdfMessage =
    $("pdfMessage");

  const pdfResult =
    $("pdfResult");

  const pdfStats =
    $("pdfStats");

  const pdfDownload =
    $("pdfDownload");

  if (
    !pdfImages ||
    !createPdfButton
  ) {
    return;
  }

  createPdfButton.addEventListener(
    "click",
    async () => {
      const files =
        Array.from(
          pdfImages.files || []
        );

      if (!files.length) {
        setMessage(
          pdfMessage,
          "Selecione pelo menos uma imagem."
        );

        show(pdfResult, false);
        return;
      }

      if (files.length > 20) {
        setMessage(
          pdfMessage,
          "Selecione no máximo 20 imagens."
        );

        show(pdfResult, false);
        return;
      }

      createPdfButton.disabled =
        true;

      createPdfButton.textContent =
        "Criando...";

      setMessage(
        pdfMessage,
        "Preparando imagens..."
      );

      show(pdfResult, false);

      try {
        const images = [];

        for (
          let i = 0;
          i < files.length;
          i++
        ) {
          setMessage(
            pdfMessage,
            `Processando imagem ${i + 1} de ${files.length}...`
          );

          images.push(
            await imageFileToJpeg(
              files[i]
            )
          );
        }

        setMessage(
          pdfMessage,
          "Criando PDF..."
        );

        const pdfBlob =
          buildPdf(images);

        const url =
          URL.createObjectURL(
            pdfBlob
          );

        if (pdfDownload) {
          pdfDownload.href = url;
          pdfDownload.download =
            "nhimy-documento.pdf";
        }

        setMessage(
          pdfStats,
          images.length === 1
            ? "PDF criado com 1 página."
            : `PDF criado com ${images.length} páginas.`
        );

        setMessage(
          pdfMessage,
          "PDF criado com sucesso."
        );

        show(pdfResult, true);
      } catch (error) {
        console.error(error);

        setMessage(
          pdfMessage,
          error.message ||
            "Não foi possível criar o PDF."
        );

        show(pdfResult, false);
      } finally {
        createPdfButton.disabled =
          false;

        createPdfButton.textContent =
          "Criar PDF";
      }
    }
  );
}
