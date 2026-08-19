"use strict";

/* =========================================================
   NHIMY — APP.JS
   Ferramentas digitais no navegador
   ========================================================= */


/* =========================================================
   PESQUISA DE FERRAMENTAS
   ========================================================= */

const searchInput = document.getElementById("toolSearch");
const toolCards = Array.from(document.querySelectorAll(".tool-card"));
const noResults = document.getElementById("noResults");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    let visibleTools = 0;

    toolCards.forEach((card) => {
      const title = card.querySelector("h3")?.textContent || "";
      const description = card.querySelector("p")?.textContent || "";
      const keywords = card.dataset.tool || "";

      const searchableText =
        `${keywords} ${title} ${description}`.toLowerCase();

      const matches = searchableText.includes(query);

      card.hidden = !matches;

      if (matches) {
        visibleTools++;
      }
    });

    if (noResults) {
      noResults.hidden = visibleTools !== 0;
    }
  });
}


/* =========================================================
   QR CODE
   ========================================================= */

const qrInput = document.getElementById("qrInput");
const generateQrButton = document.getElementById("generateQrButton");
const qrMessage = document.getElementById("qrMessage");
const qrResult = document.getElementById("qrResult");
const qrImage = document.getElementById("qrImage");
const qrDownload = document.getElementById("qrDownload");

if (qrInput && generateQrButton) {
  generateQrButton.addEventListener("click", async () => {
    const text = qrInput.value.trim();

    if (!text) {
      qrMessage.textContent = "Digite um texto ou link.";
      qrResult.hidden = true;
      qrInput.focus();
      return;
    }

    generateQrButton.disabled = true;
    generateQrButton.textContent = "Gerando...";
    qrMessage.textContent = "Gerando QR Code...";
    qrResult.hidden = true;

    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || "Não foi possível gerar o QR Code."
        );
      }

      qrImage.src = data.qr;
      qrDownload.href = data.qr;

      qrResult.hidden = false;
      qrMessage.textContent = "QR Code gerado com sucesso.";
    } catch (error) {
      console.error(error);

      qrMessage.textContent =
        error.message || "Erro ao gerar QR Code.";

      qrResult.hidden = true;
    } finally {
      generateQrButton.disabled = false;
      generateQrButton.textContent = "Gerar QR Code";
    }
  });

  qrInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      generateQrButton.click();
    }
  });
}


/* =========================================================
   COMPRESSOR DE IMAGEM
   ========================================================= */

const imageInput = document.getElementById("imageInput");
const imageQuality = document.getElementById("imageQuality");
const qualityValue = document.getElementById("qualityValue");
const compressImageButton =
  document.getElementById("compressImageButton");
const compressMessage =
  document.getElementById("compressMessage");
const compressResult =
  document.getElementById("compressResult");
const compressStats =
  document.getElementById("compressStats");
const compressedPreview =
  document.getElementById("compressedPreview");
const compressedDownload =
  document.getElementById("compressedDownload");

if (imageInput && compressImageButton) {
  imageQuality?.addEventListener("input", () => {
    qualityValue.textContent = `${imageQuality.value}%`;
  });

  compressImageButton.addEventListener("click", () => {
    const file = imageInput.files?.[0];

    if (!file) {
      compressMessage.textContent =
        "Selecione uma imagem primeiro.";
      compressResult.hidden = true;
      return;
    }

    if (!file.type.startsWith("image/")) {
      compressMessage.textContent =
        "Selecione um ficheiro de imagem válido.";
      compressResult.hidden = true;
      return;
    }

    compressImageButton.disabled = true;
    compressImageButton.textContent = "Comprimindo...";
    compressMessage.textContent = "Comprimindo imagem...";
    compressResult.hidden = true;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");

          canvas.width = image.naturalWidth || image.width;
          canvas.height = image.naturalHeight || image.height;

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
            Number(imageQuality.value || 80) / 100;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                compressMessage.textContent =
                  "Não foi possível comprimir a imagem.";
                compressImageButton.disabled = false;
                compressImageButton.textContent =
                  "Comprimir imagem";
                return;
              }

              const originalKB =
                file.size / 1024;

              const compressedKB =
                blob.size / 1024;

              const reduction =
                file.size > 0
                  ? ((1 - blob.size / file.size) * 100)
                  : 0;

              const url =
                URL.createObjectURL(blob);

              compressedPreview.src = url;
              compressedDownload.href = url;

              compressStats.textContent =
                `Original: ${originalKB.toFixed(1)} KB • ` +
                `Comprimida: ${compressedKB.toFixed(1)} KB • ` +
                `Redução: ${Math.max(0, reduction).toFixed(1)}%`;

              compressMessage.textContent =
                "Imagem comprimida com sucesso.";

              compressResult.hidden = false;

              compressImageButton.disabled = false;
              compressImageButton.textContent =
                "Comprimir imagem";
            },
            "image/jpeg",
            quality
          );
        } catch (error) {
          console.error(error);

          compressMessage.textContent =
            error.message ||
            "Não foi possível processar a imagem.";

          compressImageButton.disabled = false;
          compressImageButton.textContent =
            "Comprimir imagem";
        }
      };

      image.onerror = () => {
        compressMessage.textContent =
          "Não foi possível abrir esta imagem.";

        compressImageButton.disabled = false;
        compressImageButton.textContent =
          "Comprimir imagem";
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      compressMessage.textContent =
        "Erro ao ler o ficheiro.";

      compressImageButton.disabled = false;
      compressImageButton.textContent =
        "Comprimir imagem";
    };

    reader.readAsDataURL(file);
  });
}


/* =========================================================
   REDIMENSIONAR IMAGEM
   ========================================================= */

const resizeInput =
  document.getElementById("resizeInput");

const resizeWidth =
  document.getElementById("resizeWidth");

const resizeHeight =
  document.getElementById("resizeHeight");

const keepProportion =
  document.getElementById("keepProportion");

const resizeImageButton =
  document.getElementById("resizeImageButton");

const resizeMessage =
  document.getElementById("resizeMessage");

const resizeResult =
  document.getElementById("resizeResult");

const resizePreview =
  document.getElementById("resizePreview");

const resizeDownload =
  document.getElementById("resizeDownload");

let originalResizeWidth = 0;
let originalResizeHeight = 0;

if (resizeInput && resizeImageButton) {
  resizeInput.addEventListener("change", () => {
    const file = resizeInput.files?.[0];

    if (!file) {
      return;
    }

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        originalResizeWidth =
          image.naturalWidth || image.width;

        originalResizeHeight =
          image.naturalHeight || image.height;

        resizeWidth.value =
          originalResizeWidth;

        resizeHeight.value =
          originalResizeHeight;

        resizeMessage.textContent =
          `Imagem carregada: ${originalResizeWidth} × ${originalResizeHeight}px`;
      };

      image.onerror = () => {
        resizeMessage.textContent =
          "Não foi possível abrir esta imagem.";
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });

  resizeWidth.addEventListener("input", () => {
    if (
      !keepProportion.checked ||
      !originalResizeWidth ||
      !originalResizeHeight
    ) {
      return;
    }

    const width =
      Number(resizeWidth.value);

    if (width > 0) {
      resizeHeight.value = Math.round(
        width *
        originalResizeHeight /
        originalResizeWidth
      );
    }
  });

  resizeHeight.addEventListener("input", () => {
    if (
      !keepProportion.checked ||
      !originalResizeWidth ||
      !originalResizeHeight
    ) {
      return;
    }

    const height =
      Number(resizeHeight.value);

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

    const width =
      Number(resizeWidth.value);

    const height =
      Number(resizeHeight.value);

    if (!file) {
      resizeMessage.textContent =
        "Selecione uma imagem primeiro.";

      resizeResult.hidden = true;
      return;
    }

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1
    ) {
      resizeMessage.textContent =
        "Informe uma largura e uma altura válidas.";

      resizeResult.hidden = true;
      return;
    }

    if (width > 10000 || height > 10000) {
      resizeMessage.textContent =
        "Use dimensões de até 10.000 × 10.000 pixels.";

      resizeResult.hidden = true;
      return;
    }

    resizeImageButton.disabled = true;
    resizeImageButton.textContent = "Processando...";
    resizeMessage.textContent =
      "Redimensionando imagem...";
    resizeResult.hidden = true;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        try {
          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

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
                resizeMessage.textContent =
                  "Não foi possível redimensionar a imagem.";

                resizeImageButton.disabled = false;
                resizeImageButton.textContent =
                  "Redimensionar imagem";

                return;
              }

              const url =
                URL.createObjectURL(blob);

              resizePreview.src = url;
              resizeDownload.href = url;

              resizeMessage.textContent =
                `Imagem redimensionada para ${width} × ${height}px.`;

              resizeResult.hidden = false;

              resizeImageButton.disabled = false;
              resizeImageButton.textContent =
                "Redimensionar imagem";
            },
            "image/jpeg",
            0.92
          );
        } catch (error) {
          console.error(error);

          resizeMessage.textContent =
            error.message ||
            "Não foi possível processar a imagem.";

          resizeImageButton.disabled = false;
          resizeImageButton.textContent =
            "Redimensionar imagem";
        }
      };

      image.onerror = () => {
        resizeMessage.textContent =
          "Não foi possível abrir esta imagem.";

        resizeImageButton.disabled = false;
        resizeImageButton.textContent =
          "Redimensionar imagem";
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      resizeMessage.textContent =
        "Erro ao ler o ficheiro.";

      resizeImageButton.disabled = false;
      resizeImageButton.textContent =
        "Redimensionar imagem";
    };

    reader.readAsDataURL(file);
  });
}


/* =========================================================
   FERRAMENTA PDF
   Imagens → PDF
   ========================================================= */

const pdfImages =
  document.getElementById("pdfImages");

const createPdfButton =
  document.getElementById("createPdfButton");

const pdfMessage =
  document.getElementById("pdfMessage");

const pdfResult =
  document.getElementById("pdfResult");

const pdfStats =
  document.getElementById("pdfStats");

const pdfDownload =
  document.getElementById("pdfDownload");


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
        new Error("Erro ao ler uma das imagens.")
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
    new Uint8Array(binary.length);

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


function createPdfObjectBytes(parts) {
  const encoder =
    new TextEncoder();

  const arrays = [];

  for (const part of parts) {
    if (typeof part === "string") {
      arrays.push(
        encoder.encode(part)
      );
    } else {
      arrays.push(part);
    }
  }

  let totalLength = 0;

  for (const array of arrays) {
    totalLength += array.length;
  }

  const result =
    new Uint8Array(totalLength);

  let offset = 0;

  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
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
      dataUrlToBytes(image.dataUrl);

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
      image.width / image.height;

    const pageRatio =
      pageWidth / pageHeight;

    let drawWidth;
    let drawHeight;

    if (imageRatio > pageRatio) {
      drawWidth =
        pageWidth - 40;

      drawHeight =
        drawWidth / imageRatio;
    } else {
      drawHeight =
        pageHeight - 40;

      drawWidth =
        drawHeight * imageRatio;
    }

    const x =
      (pageWidth - drawWidth) / 2;

    const y =
      (pageHeight - drawHeight) / 2;

    const content =
      `q\n` +
      `${drawWidth.toFixed(2)} 0 0 ` +
      `${drawHeight.toFixed(2)} ` +
      `${x.toFixed(2)} ` +
      `${y.toFixed(2)} cm\n` +
      `/Im1 Do\n` +
      `Q\n`;

    const contentBytes =
      new TextEncoder().encode(content);

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
      pageId,
      imageId,
      contentId
    });
  }

  objects[catalogId - 1] = {
    type: "catalog",
    pagesId
  };

  objects[pagesId - 1] = {
    type: "pages",
    pageIds: pageData.map(
      (page) => page.pageId
    )
  };

  const chunks = [];

  const header =
    new TextEncoder().encode(
      "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n"
    );

  chunks.push(header);

  const offsets =
    new Array(objects.length + 1).fill(0);

  let currentOffset =
    header.length;

  const encoder =
    new TextEncoder();

  for (
    let id = 1;
    id <= objects.length;
    id++
  ) {
    const object =
      objects[id - 1];

    offsets[id] =
      currentOffset;

    let objectHeader =
      encoder.encode(
        `${id} 0 obj\n`
      );

    chunks.push(objectHeader);
    currentOffset += objectHeader.length;

    let body;

    if (object.type === "catalog") {
      body =
        encoder.encode(
          `<< /Type /Catalog /Pages ` +
          `${object.pagesId} 0 R >>\n`
        );

      chunks.push(body);
      currentOffset += body.length;
    }

    else if (object.type === "pages") {
      const kids =
        object.pageIds
          .map((id) => `${id} 0 R`)
          .join(" ");

      body =
        encoder.encode(
          `<< /Type /Pages ` +
          `/Kids [${kids}] ` +
          `/Count ${object.pageIds.length} >>\n`
        );

      chunks.push(body);
      currentOffset += body.length;
    }

    else if (object.type === "image") {
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

      chunks.push(imageHeader);
      currentOffset += imageHeader.length;

      chunks.push(object.bytes);
      currentOffset += object.bytes.length;

      const imageEnd =
        encoder.encode(
          `\nendstream\n`
        );

      chunks.push(imageEnd);
      currentOffset += imageEnd.length;
    }

    else if (object.type === "content") {
      const contentHeader =
        encoder.encode(
          `<< /Length ${object.bytes.length} >>\n` +
          `stream\n`
        );

      chunks.push(contentHeader);
      currentOffset += contentHeader.length;

      chunks.push(object.bytes);
      currentOffset += object.bytes.length;

      const contentEnd =
        encoder.encode(
          `endstream\n`
        );

      chunks.push(contentEnd);
      currentOffset += contentEnd.length;
    }

    else if (object.type === "page") {
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
      currentOffset += body.length;
    }

    const endObject =
      encoder.encode(
        `endobj\n`
      );

    chunks.push(endObject);
    currentOffset += endObject.length;
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
      `${String(offsets[id]).padStart(10, "0")} ` +
      `00000 n \n`;
  }

  xref +=
    `trailer\n` +
    `<< /Size ${objects.length + 1} ` +
    `/Root ${catalogId} 0 R >>\n` +
    `startxref\n` +
    `${xrefOffset}\n` +
    `%%EOF`;

  const xrefBytes =
    encoder.encode(xref);

  chunks.push(xrefBytes);

  return new Blob(
    chunks,
    {
      type: "application/pdf"
    }
  );
}


if (pdfImages && createPdfButton) {
  createPdfButton.addEventListener(
    "click",
    async () => {
      const files =
        Array.from(pdfImages.files || []);

      if (!files.length) {
        pdfMessage.textContent =
          "Selecione pelo menos uma imagem.";

        pdfResult.hidden = true;
        return;
      }

      if (files.length > 20) {
        pdfMessage.textContent =
          "Selecione no máximo 20 imagens.";

        pdfResult.hidden = true;
        return;
      }

      createPdfButton.disabled = true;
      createPdfButton.textContent =
        "Criando...";

      pdfMessage.textContent =
        "Preparando imagens...";

      pdfResult.hidden = true;

      try {
        const images = [];

        for (let i = 0; i < files.length; i++) {
          pdfMessage.textContent =
            `Processando imagem ${i + 1} de ${files.length}...`;

          images.push(
            await imageFileToJpeg(files[i])
          );
        }

        pdfMessage.textContent =
          "Criando PDF...";

        const pdfBlob =
          buildPdf(images);

        const url =
          URL.createObjectURL(pdfBlob);

        pdfDownload.href = url;

        pdfStats.textContent =
          images.length === 1
            ? "PDF criado com 1 página."
            : `PDF criado com ${images.length} páginas.`;

        pdfMessage.textContent =
          "PDF criado com sucesso.";

        pdfResult.hidden = false;
      } catch (error) {
        console.error(error);

        pdfMessage.textContent =
          error.message ||
          "Não foi possível criar o PDF.";

        pdfResult.hidden = true;
      } finally {
        createPdfButton.disabled = false;
        createPdfButton.textContent =
          "Criar PDF";
      }
    }
  );
}


/* =========================================================
   GERADOR DE SENHAS
   ========================================================= */

const passwordLength =
  document.getElementById("passwordLength");

const passwordUpper =
  document.getElementById("passwordUpper");

const passwordLower =
  document.getElementById("passwordLower");

const passwordNumbers =
  document.getElementById("passwordNumbers");

const passwordSymbols =
  document.getElementById("passwordSymbols");

const generatePasswordButton =
  document.getElementById(
    "generatePasswordButton"
  );

const passwordMessage =
  document.getElementById(
    "passwordMessage"
  );

const passwordResult =
  document.getElementById(
    "passwordResult"
  );

const generatedPassword =
  document.getElementById(
    "generatedPassword"
  );

const copyPasswordButton =
  document.getElementById(
    "copyPasswordButton"
  );


function secureRandomIndex(max) {
  if (
    !Number.isInteger(max) ||
    max <= 0
  ) {
    throw new Error(
      "Conjunto de caracteres inválido."
    );
  }

  const array =
    new Uint32Array(1);

  const maxUint =
    0x100000000;

  const limit =
    Math.floor(maxUint / max) * max;

  do {
    crypto.getRandomValues(array);
  } while (
    array[0] >= limit
  );

  return array[0] % max;
}


function generateSecurePassword(
  length,
  groups
) {
  const characters =
    groups.join("");

  if (!characters.length) {
    throw new Error(
      "Nenhum caractere disponível."
    );
  }

  const password = [];

  /*
   * Garante pelo menos um caractere
   * de cada grupo selecionado.
   */
  for (const group of groups) {
    password.push(
      group[
        secureRandomIndex(group.length)
      ]
    );
  }

  while (password.length < length) {
    password.push(
      characters[
        secureRandomIndex(
          characters.length
        )
      ]
    );
  }

  /*
   * Embaralhamento seguro.
   */
  for (
    let i = password.length - 1;
    i > 0;
    i--
  ) {
    const j =
      secureRandomIndex(i + 1);

    [
      password[i],
      password[j]
    ] = [
      password[j],
      password[i]
    ];
  }

  return password.join("");
}


if (
  passwordLength &&
  generatePasswordButton
) {
  generatePasswordButton.addEventListener(
    "click",
    () => {
      let length =
        Number.parseInt(
          passwordLength.value,
          10
        );

      if (!Number.isInteger(length)) {
        length = 16;
      }

      length =
        Math.min(
          128,
          Math.max(4, length)
        );

      passwordLength.value =
        length;

      const groups = [];

      if (passwordUpper.checked) {
        groups.push(
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        );
      }

      if (passwordLower.checked) {
        groups.push(
          "abcdefghijklmnopqrstuvwxyz"
        );
      }

      if (passwordNumbers.checked) {
        groups.push(
          "0123456789"
        );
      }

      if (passwordSymbols.checked) {
        groups.push(
          "!@#$%^&*()-_=+[]{};:,.?/<>"
        );
      }

      if (!groups.length) {
        passwordMessage.textContent =
          "Selecione pelo menos um tipo de caractere.";

        passwordResult.hidden = true;
        return;
      }

      if (groups.length > length) {
        passwordMessage.textContent =
          `Para usar todos os tipos selecionados, ` +
          `o tamanho deve ser pelo menos ${groups.length}.`;

        passwordResult.hidden = true;
        return;
      }

      try {
        const password =
          generateSecurePassword(
            length,
            groups
          );

        generatedPassword.value =
          password;

        passwordResult.hidden =
          false;

        passwordMessage.textContent =
          "Senha forte gerada no seu dispositivo.";
      } catch (error) {
        console.error(error);

        passwordMessage.textContent =
          "Não foi possível gerar a senha.";

        passwordResult.hidden = true;
      }
    }
  );

  copyPasswordButton?.addEventListener(
    "click",
    async () => {
      const value =
        generatedPassword.value;

      if (!value) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          value
        );

        passwordMessage.textContent =
          "Senha copiada.";
      } catch {
        generatedPassword.focus();
        generatedPassword.select();

        try {
          document.execCommand("copy");

          passwordMessage.textContent =
            "Senha copiada.";
        } catch {
          passwordMessage.textContent =
            "Selecione a senha e copie manualmente.";
        }
      }
    }
  );
}


/* =========================================================
   NHIMY — INICIALIZAÇÃO
   ========================================================= */

console.log(
  "Nhimy Tools carregado com sucesso."
);
/* =========================================================
   NHIMY 2.2 — CONTADOR DE TEXTO
   ========================================================= */

const textCounterInput = document.getElementById("textCounterInput");
const textWords = document.getElementById("textWords");
const textCharacters = document.getElementById("textCharacters");
const textLines = document.getElementById("textLines");

if (textCounterInput) {
  const updateTextCounter = () => {
    const text = textCounterInput.value;

    const words = text.trim()
      ? text.trim().split(/\s+/).length
      : 0;

    const characters = text.length;

    const lines = text
      ? text.split(/\r?\n/).length
      : 0;

    textWords.textContent = words;
    textCharacters.textContent = characters;
    textLines.textContent = lines;
  };

  textCounterInput.addEventListener("input", updateTextCounter);
  updateTextCounter();
}


/* =========================================================
   NHIMY 2.2 — CONVERSOR DE UNIDADES
   ========================================================= */

const unitValue = document.getElementById("unitValue");
const unitFrom = document.getElementById("unitFrom");
const unitTo = document.getElementById("unitTo");
const unitResult = document.getElementById("unitResult");
const unitCategory = document.getElementById("unitCategory");

const unitFactors = {
  length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    ft: 0.3048,
    in: 0.0254
  },

  weight: {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lb: 0.45359237,
    oz: 0.028349523125
  }
};

function updateUnitOptions() {
  if (!unitCategory || !unitFrom || !unitTo) return;

  const category = unitCategory.value;

  unitFrom.innerHTML = "";
  unitTo.innerHTML = "";

  if (category === "temperature") {
    [
      ["c", "Celsius"],
      ["f", "Fahrenheit"],
      ["k", "Kelvin"]
    ].forEach(([value, label]) => {
      unitFrom.add(new Option(label, value));
      unitTo.add(new Option(label, value));
    });
  } else {
    const labels = {
      m: "Metros",
      km: "Quilómetros",
      cm: "Centímetros",
      mm: "Milímetros",
      ft: "Pés",
      in: "Polegadas",

      kg: "Quilogramas",
      g: "Gramas",
      mg: "Miligramas",
      lb: "Libras",
      oz: "Onças"
    };

    Object.keys(unitFactors[category]).forEach((unit) => {
      unitFrom.add(new Option(labels[unit], unit));
      unitTo.add(new Option(labels[unit], unit));
    });
  }

  convertUnits();
}

function convertUnits() {
  if (!unitValue || !unitFrom || !unitTo || !unitResult) return;

  const value = Number(unitValue.value);

  if (!Number.isFinite(value)) {
    unitResult.textContent = "—";
    return;
  }

  const category = unitCategory.value;
  const from = unitFrom.value;
  const to = unitTo.value;

  let result;

  if (category === "temperature") {
    if (from === to) {
      result = value;
    } else if (from === "c" && to === "f") {
      result = value * 9 / 5 + 32;
    } else if (from === "f" && to === "c") {
      result = (value - 32) * 5 / 9;
    } else if (from === "c" && to === "k") {
      result = value + 273.15;
    } else if (from === "k" && to === "c") {
      result = value - 273.15;
    } else if (from === "f" && to === "k") {
      result = (value - 32) * 5 / 9 + 273.15;
    } else if (from === "k" && to === "f") {
      result = (value - 273.15) * 9 / 5 + 32;
    }
  } else {
    result =
      value *
      unitFactors[category][from] /
      unitFactors[category][to];
  }

  unitResult.textContent = Number(result.toFixed(8)).toString();
}

if (unitCategory) {
  unitCategory.addEventListener("change", updateUnitOptions);
  unitValue.addEventListener("input", convertUnits);
  unitFrom.addEventListener("change", convertUnits);
  unitTo.addEventListener("change", convertUnits);

  updateUnitOptions();
}

