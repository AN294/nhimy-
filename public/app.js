const searchInput = document.getElementById("toolSearch");
const toolCards = Array.from(document.querySelectorAll(".tool-card"));
const noResults = document.getElementById("noResults");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  let visibleTools = 0;

  toolCards.forEach((card) => {
    const searchableText = (
      card.dataset.tool +
      " " +
      card.querySelector("h3").textContent +
      " " +
      card.querySelector("p").textContent
    ).toLowerCase();

    const matches = searchableText.includes(query);

    card.hidden = !matches;

    if (matches) {
      visibleTools++;
    }
  });

  noResults.hidden = visibleTools !== 0;
});


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
      return;
    }

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
        throw new Error(data.error || "Erro ao gerar QR Code.");
      }

      qrImage.src = data.qr;
      qrDownload.href = data.qr;
      qrResult.hidden = false;
      qrMessage.textContent = "QR Code gerado com sucesso.";
    } catch (error) {
      qrMessage.textContent = error.message;
      qrResult.hidden = true;
    }
  });
}


const imageInput = document.getElementById("imageInput");
const imageQuality = document.getElementById("imageQuality");
const qualityValue = document.getElementById("qualityValue");
const compressImageButton = document.getElementById("compressImageButton");
const compressMessage = document.getElementById("compressMessage");
const compressResult = document.getElementById("compressResult");
const compressStats = document.getElementById("compressStats");
const compressedPreview = document.getElementById("compressedPreview");
const compressedDownload = document.getElementById("compressedDownload");

if (imageInput && compressImageButton) {
  imageQuality.addEventListener("input", () => {
    qualityValue.textContent = imageQuality.value + "%";
  });

  compressImageButton.addEventListener("click", () => {
    const file = imageInput.files[0];

    if (!file) {
      compressMessage.textContent = "Selecione uma imagem primeiro.";
      compressResult.hidden = true;
      return;
    }

    compressMessage.textContent = "Comprimindo imagem...";
    compressResult.hidden = true;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);

        const quality = Number(imageQuality.value) / 100;

        canvas.toBlob((blob) => {
          if (!blob) {
            compressMessage.textContent = "Não foi possível comprimir a imagem.";
            return;
          }

          const originalKB = (file.size / 1024).toFixed(1);
          const compressedKB = (blob.size / 1024).toFixed(1);
          const reduction = Math.max(
            0,
            (1 - blob.size / file.size) * 100
          ).toFixed(1);

          const url = URL.createObjectURL(blob);

          compressedPreview.src = url;
          compressedDownload.href = url;
          compressStats.textContent =
            "Original: " + originalKB + " KB • Comprimida: " +
            compressedKB + " KB • Redução: " + reduction + "%";

          compressMessage.textContent = "Imagem comprimida com sucesso.";
          compressResult.hidden = false;
        }, "image/jpeg", quality);
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}


const resizeInput = document.getElementById("resizeInput");
const resizeWidth = document.getElementById("resizeWidth");
const resizeHeight = document.getElementById("resizeHeight");
const keepProportion = document.getElementById("keepProportion");
const resizeImageButton = document.getElementById("resizeImageButton");
const resizeMessage = document.getElementById("resizeMessage");
const resizeResult = document.getElementById("resizeResult");
const resizePreview = document.getElementById("resizePreview");
const resizeDownload = document.getElementById("resizeDownload");

let originalResizeWidth = 0;
let originalResizeHeight = 0;

if (resizeInput && resizeImageButton) {
  resizeInput.addEventListener("change", () => {
    const file = resizeInput.files[0];

    if (!file) return;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        originalResizeWidth = image.width;
        originalResizeHeight = image.height;

        resizeWidth.value = image.width;
        resizeHeight.value = image.height;
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });

  resizeWidth.addEventListener("input", () => {
    if (!keepProportion.checked || !originalResizeWidth) return;

    const width = Number(resizeWidth.value);

    if (width > 0) {
      resizeHeight.value = Math.round(
        width * originalResizeHeight / originalResizeWidth
      );
    }
  });

  resizeHeight.addEventListener("input", () => {
    if (!keepProportion.checked || !originalResizeHeight) return;

    const height = Number(resizeHeight.value);

    if (height > 0) {
      resizeWidth.value = Math.round(
        height * originalResizeWidth / originalResizeHeight
      );
    }
  });

  resizeImageButton.addEventListener("click", () => {
    const file = resizeInput.files[0];
    const width = Number(resizeWidth.value);
    const height = Number(resizeHeight.value);

    if (!file) {
      resizeMessage.textContent = "Selecione uma imagem primeiro.";
      resizeResult.hidden = true;
      return;
    }

    if (!width || !height || width < 1 || height < 1) {
      resizeMessage.textContent = "Informe uma largura e uma altura válidas.";
      resizeResult.hidden = true;
      return;
    }

    resizeMessage.textContent = "Redimensionando imagem...";
    resizeResult.hidden = true;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            resizeMessage.textContent =
              "Não foi possível redimensionar a imagem.";
            return;
          }

          const url = URL.createObjectURL(blob);

          resizePreview.src = url;
          resizeDownload.href = url;

          resizeMessage.textContent =
            "Imagem redimensionada com sucesso.";

          resizeResult.hidden = false;
        }, "image/jpeg", 0.90);
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}


const pdfImages = document.getElementById("pdfImages");
const createPdfButton = document.getElementById("createPdfButton");
const pdfMessage = document.getElementById("pdfMessage");
const pdfResult = document.getElementById("pdfResult");
const pdfStats = document.getElementById("pdfStats");
const pdfDownload = document.getElementById("pdfDownload");

function escapePdfText(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

async function imageFileToJpeg(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.90);

        resolve({
          dataUrl,
          width: image.width,
          height: image.height
        });
      };

      image.onerror = () => reject(new Error("Não foi possível ler uma das imagens."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Erro ao ler a imagem."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function buildPdf(images) {
  const objects = [];

  function addObject(object) {
    objects.push(object);
    return objects.length;
  }

  const catalogId = addObject(null);
  const pagesId = addObject(null);

  const imageIds = [];
  const contentIds = [];
  const pageIds = [];

  for (const image of images) {
    const bytes = dataUrlToBytes(image.dataUrl);
    imageIds.push(addObject({
      type: "image",
      width: image.width,
      height: image.height,
      bytes
    }));
  }

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    const pageWidth = image.width > image.height ? 842 : 595;
    const pageHeight = image.width > image.height ? 595 : 842;

    const imageRatio = image.width / image.height;
    const pageRatio = pageWidth / pageHeight;

    let drawWidth;
    let drawHeight;

    if (imageRatio > pageRatio) {
      drawWidth = pageWidth - 40;
      drawHeight = drawWidth / imageRatio;
    } else {
      drawHeight = pageHeight - 40;
      drawWidth = drawHeight * imageRatio;
    }

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    const content =
      "q\\n" +
      drawWidth.toFixed(2) + " 0 0 " +
      drawHeight.toFixed(2) + " " +
      x.toFixed(2) + " " +
      y.toFixed(2) +
      " cm\\n" +
      "/Im1 Do\\n" +
      "Q";

    const contentId = addObject({
      type: "content",
      text: content
    });

    const pageId = addObject({
      type: "page",
      pageWidth,
      pageHeight,
      imageId: imageIds[i],
      contentId
    });

    contentIds.push(contentId);
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = {
    type: "catalog",
    pagesId
  };

  objects[pagesId - 1] = {
    type: "pages",
    pageIds
  };

  let pdf = "%PDF-1.4\\n";
  pdf += "%\\xFF\\xFF\\xFF\\xFF\\n";

  const offsets = [0];

  function writeObject(id, object) {
    offsets[id] = pdf.length;
    pdf += id + " 0 obj\\n";

    if (object.type === "catalog") {
      pdf +=
        "<< /Type /Catalog /Pages " +
        object.pagesId +
        " 0 R >>\\n";
    } else if (object.type === "pages") {
      pdf +=
        "<< /Type /Pages /Kids [" +
        object.pageIds.map(id => id + " 0 R").join(" ") +
        "] /Count " +
        object.pageIds.length +
        " >>\\n";
    } else if (object.type === "image") {
      pdf +=
        "<< /Type /XObject /Subtype /Image " +
        "/Width " +
        object.width +
        " /Height " +
        object.height +
        " /ColorSpace /DeviceRGB " +
        "/BitsPerComponent 8 " +
        "/Filter /DCTDecode " +
        "/Length " +
        object.bytes.length +
        " >>\\nstream\\n";

      for (const byte of object.bytes) {
        pdf += String.fromCharCode(byte);
      }

      pdf += "\\nendstream\\n";
    } else if (object.type === "content") {
      const length = new TextEncoder().encode(object.text).length;

      pdf +=
        "<< /Length " +
        length +
        " >>\\nstream\\n" +
        object.text +
        "\\nendstream\\n";
    } else if (object.type === "page") {
      pdf +=
        "<< /Type /Page " +
        "/Parent 2 0 R " +
        "/MediaBox [0 0 " +
        object.pageWidth +
        " " +
        object.pageHeight +
        "] " +
        "/Resources << /XObject << /Im1 " +
        object.imageId +
        " 0 R >> >> " +
        "/Contents " +
        object.contentId +
        " 0 R >>\\n";
    }

    pdf += "endobj\\n";
  }

  for (let id = 1; id <= objects.length; id++) {
    writeObject(id, objects[id - 1]);
  }

  const xrefOffset = pdf.length;

  pdf +=
    "xref\\n" +
    "0 " +
    (objects.length + 1) +
    "\\n" +
    "0000000000 65535 f \\n";

  for (let id = 1; id <= objects.length; id++) {
    pdf +=
      String(offsets[id]).padStart(10, "0") +
      " 00000 n \\n";
  }

  pdf +=
    "trailer\\n" +
    "<< /Size " +
    (objects.length + 1) +
    " /Root " +
    catalogId +
    " 0 R >>\\n" +
    "startxref\\n" +
    xrefOffset +
    "\\n" +
    "%%EOF";

  const bytes = new Uint8Array(pdf.length);

  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 255;
  }

  return new Blob([bytes], {
    type: "application/pdf"
  });
}

if (pdfImages && createPdfButton) {
  createPdfButton.addEventListener("click", async () => {
    const files = Array.from(pdfImages.files || []);

    if (!files.length) {
      pdfMessage.textContent = "Selecione pelo menos uma imagem.";
      pdfResult.hidden = true;
      return;
    }

    pdfMessage.textContent = "Criando PDF...";
    pdfResult.hidden = true;

    try {
      const images = [];

      for (const file of files) {
        images.push(await imageFileToJpeg(file));
      }

      const pdfBlob = buildPdf(images);
      const url = URL.createObjectURL(pdfBlob);

      pdfDownload.href = url;
      pdfStats.textContent =
        images.length === 1
          ? "PDF criado com 1 página."
          : "PDF criado com " + images.length + " páginas.";

      pdfMessage.textContent = "PDF criado com sucesso.";
      pdfResult.hidden = false;
    } catch (error) {
      console.error(error);
      pdfMessage.textContent =
        error.message || "Não foi possível criar o PDF.";
      pdfResult.hidden = true;
    }
  });
}


const passwordLength = document.getElementById("passwordLength");
const passwordUpper = document.getElementById("passwordUpper");
const passwordLower = document.getElementById("passwordLower");
const passwordNumbers = document.getElementById("passwordNumbers");
const passwordSymbols = document.getElementById("passwordSymbols");
const generatePasswordButton = document.getElementById("generatePasswordButton");
const passwordMessage = document.getElementById("passwordMessage");
const passwordResult = document.getElementById("passwordResult");
const generatedPassword = document.getElementById("generatedPassword");
const copyPasswordButton = document.getElementById("copyPasswordButton");

function secureRandomIndex(max) {
  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;

  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);

  return array[0] % max;
}

function generateSecurePassword(length, characters) {
  let password = "";

  for (let i = 0; i < length; i++) {
    password += characters[secureRandomIndex(characters.length)];
  }

  return password;
}

if (passwordLength && generatePasswordButton) {
  generatePasswordButton.addEventListener("click", () => {
    let length = Number.parseInt(passwordLength.value, 10);

    if (!Number.isInteger(length)) {
      length = 16;
    }

    length = Math.min(128, Math.max(4, length));
    passwordLength.value = length;

    const groups = [];

    if (passwordUpper.checked) {
      groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }

    if (passwordLower.checked) {
      groups.push("abcdefghijklmnopqrstuvwxyz");
    }

    if (passwordNumbers.checked) {
      groups.push("0123456789");
    }

    if (passwordSymbols.checked) {
      groups.push("!@#$%^&*()-_=+[]{};:,.?/<>");
    }

    if (!groups.length) {
      passwordMessage.textContent =
        "Selecione pelo menos um tipo de caractere.";
      passwordResult.hidden = true;
      return;
    }

    const characters = groups.join("");
    const password = generateSecurePassword(length, characters);

    generatedPassword.value = password;
    passwordResult.hidden = false;
    passwordMessage.textContent = "Senha gerada com segurança.";
  });

  copyPasswordButton.addEventListener("click", async () => {
    if (!generatedPassword.value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassword.value);
      passwordMessage.textContent = "Senha copiada.";
    } catch {
      generatedPassword.select();
      document.execCommand("copy");
      passwordMessage.textContent = "Senha copiada.";
    }
  });
}
