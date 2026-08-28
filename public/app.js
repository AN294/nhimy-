"use strict";

/* =========================================================
   NHIMY — APP.JS
   Ferramentas digitais no navegador
   Nhimy Estudante 2.0
   ========================================================= */

(() => {
  /* =======================================================
     UTILIDADES GERAIS
     ======================================================= */

  const $ = (id) => document.getElementById(id);

  function formatNumber(value) {
    return new Intl.NumberFormat("pt-PT", {
      maximumFractionDigits: 8
    }).format(value);
  }

  function setMessage(element, message) {
    if (element) {
      element.textContent = message;
    }
  }

  function show(element, visible = true) {
    if (element) {
      element.hidden = !visible;
    }
  }

  async function copyText(text) {
    if (!text) {
      throw new Error("Não há conteúdo para copiar.");
    }

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea =
      document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copied = false;

    try {
      copied =
        document.execCommand("copy");
    } finally {
      textarea.remove();
    }

    if (!copied) {
      throw new Error(
        "Não foi possível copiar automaticamente."
      );
    }

    return true;
  }


  /* =======================================================
     PESQUISA DE FERRAMENTAS
     ======================================================= */

  const searchInput = $("toolSearch");

  const toolCards = Array.from(
    document.querySelectorAll(".tool-card")
  );

  const noResults = $("noResults");

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      () => {
        const query =
          searchInput.value
            .trim()
            .toLowerCase();

        let visibleTools = 0;

        toolCards.forEach((card) => {
          const title =
            card.querySelector("h3")
              ?.textContent || "";

          const description =
            card.querySelector("p")
              ?.textContent || "";

          const keywords =
            card.dataset.tool || "";

          const searchableText =
            `${keywords} ${title} ${description}`
              .toLowerCase();

          const matches =
            searchableText.includes(query);

          card.hidden = !matches;

          if (matches) {
            visibleTools++;
          }
        });

        if (noResults) {
          noResults.hidden =
            visibleTools !== 0;
        }
      }
    );
  }


  /* =======================================================
     QR CODE
     ======================================================= */

  const qrInput = $("qrInput");
  const generateQrButton =
    $("generateQrButton");
  const qrMessage = $("qrMessage");
  const qrResult = $("qrResult");
  const qrImage = $("qrImage");
  const qrDownload = $("qrDownload");

  if (qrInput && generateQrButton) {
    generateQrButton.addEventListener(
      "click",
      async () => {
        const text =
          qrInput.value.trim();

        if (!text) {
          setMessage(
            qrMessage,
            "Digite um texto ou link."
          );

          show(qrResult, false);
          qrInput.focus();
          return;
        }

        generateQrButton.disabled = true;
        generateQrButton.textContent =
          "Gerando...";

        setMessage(
          qrMessage,
          "Gerando QR Code..."
        );

        show(qrResult, false);

        try {
          const response =
            await fetch("/api/qr", {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                text
              })
            });

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.ok
          ) {
            throw new Error(
              data.error ||
                "Não foi possível gerar o QR Code."
            );
          }

          if (qrImage) {
            qrImage.src = data.qr;
          }

          if (qrDownload) {
            qrDownload.href = data.qr;
          }

          show(qrResult, true);

          setMessage(
            qrMessage,
            "QR Code gerado com sucesso."
          );
        } catch (error) {
          console.error(error);

          setMessage(
            qrMessage,
            error.message ||
              "Erro ao gerar QR Code."
          );

          show(qrResult, false);
        } finally {
          generateQrButton.disabled =
            false;

          generateQrButton.textContent =
            "Gerar QR Code";
        }
      }
    );

    qrInput.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          generateQrButton.click();
        }
      }
    );
  }


  /* =======================================================
     COMPRESSOR DE IMAGEM
     ======================================================= */

  const imageInput = $("imageInput");
  const imageQuality = $("imageQuality");
  const qualityValue = $("qualityValue");
  const compressImageButton =
    $("compressImageButton");
  const compressMessage =
    $("compressMessage");
  const compressResult =
    $("compressResult");
  const compressStats =
    $("compressStats");
  const compressedPreview =
    $("compressedPreview");
  const compressedDownload =
    $("compressedDownload");

  if (
    imageInput &&
    compressImageButton
  ) {
    imageQuality?.addEventListener(
      "input",
      () => {
        if (qualityValue) {
          qualityValue.textContent =
            `${imageQuality.value}%`;
        }
      }
    );

    compressImageButton.addEventListener(
      "click",
      () => {
        const file =
          imageInput.files?.[0];

        if (!file) {
          setMessage(
            compressMessage,
            "Selecione uma imagem primeiro."
          );

          show(compressResult, false);
          return;
        }

        if (
          !file.type.startsWith("image/")
        ) {
          setMessage(
            compressMessage,
            "Selecione um ficheiro de imagem válido."
          );

          show(compressResult, false);
          return;
        }

        compressImageButton.disabled =
          true;

        compressImageButton.textContent =
          "Comprimindo...";

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
              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                image.naturalWidth ||
                image.width;

              canvas.height =
                image.naturalHeight ||
                image.height;

              const context =
                canvas.getContext("2d");

              if (!context) {
                throw new Error(
                  "O navegador não conseguiu processar a imagem."
                );
              }

              context.fillStyle =
                "#ffffff";

              context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
              );

              context.drawImage(
                image,
                0,
                0
              );

              const quality =
                Number(
                  imageQuality?.value || 80
                ) / 100;

              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    throw new Error(
                      "Não foi possível comprimir a imagem."
                    );
                  }

                  const originalKB =
                    file.size / 1024;

                  const compressedKB =
                    blob.size / 1024;

                  const reduction =
                    file.size > 0
                      ? (
                          1 -
                          blob.size /
                            file.size
                        ) *
                        100
                      : 0;

                  const url =
                    URL.createObjectURL(
                      blob
                    );

                  if (compressedPreview) {
                    compressedPreview.src =
                      url;
                  }

                  if (compressedDownload) {
                    compressedDownload.href =
                      url;
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

                  show(
                    compressResult,
                    true
                  );

                  compressImageButton.disabled =
                    false;

                  compressImageButton.textContent =
                    "Comprimir imagem";
                },
                "image/jpeg",
                Math.min(
                  1,
                  Math.max(
                    0.1,
                    quality
                  )
                )
              );
            } catch (error) {
              console.error(error);

              setMessage(
                compressMessage,
                error.message ||
                  "Não foi possível processar a imagem."
              );

              compressImageButton.disabled =
                false;

              compressImageButton.textContent =
                "Comprimir imagem";
            }
          };

          image.onerror = () => {
            setMessage(
              compressMessage,
              "Não foi possível abrir esta imagem."
            );

            compressImageButton.disabled =
              false;

            compressImageButton.textContent =
              "Comprimir imagem";
          };

          image.src = reader.result;
        };

        reader.onerror = () => {
          setMessage(
            compressMessage,
            "Erro ao ler o ficheiro."
          );

          compressImageButton.disabled =
            false;

          compressImageButton.textContent =
            "Comprimir imagem";
        };

        reader.readAsDataURL(file);
      }
    );
  }


  /* =======================================================
     REDIMENSIONAR IMAGEM
     ======================================================= */

  const resizeInput = $("resizeInput");
  const resizeWidth = $("resizeWidth");
  const resizeHeight = $("resizeHeight");
  const keepProportion =
    $("keepProportion");
  const resizeImageButton =
    $("resizeImageButton");
  const resizeMessage =
    $("resizeMessage");
  const resizeResult =
    $("resizeResult");
  const resizePreview =
    $("resizePreview");
  const resizeDownload =
    $("resizeDownload");

  let originalResizeWidth = 0;
  let originalResizeHeight = 0;

  if (
    resizeInput &&
    resizeImageButton
  ) {
    resizeInput.addEventListener(
      "change",
      () => {
        const file =
          resizeInput.files?.[0];

        if (!file) {
          return;
        }

        const image = new Image();
        const reader = new FileReader();

        reader.onload = () => {
          image.onload = () => {
            originalResizeWidth =
              image.naturalWidth ||
              image.width;

            originalResizeHeight =
              image.naturalHeight ||
              image.height;

            if (resizeWidth) {
              resizeWidth.value =
                originalResizeWidth;
            }

            if (resizeHeight) {
              resizeHeight.value =
                originalResizeHeight;
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

        reader.readAsDataURL(file);
      }
    );

    resizeWidth?.addEventListener(
      "input",
      () => {
        if (
          !keepProportion?.checked ||
          !originalResizeWidth ||
          !originalResizeHeight
        ) {
          return;
        }

        const width =
          Number(resizeWidth.value);

        if (width > 0) {
          resizeHeight.value =
            Math.round(
              width *
                originalResizeHeight /
                originalResizeWidth
            );
        }
      }
    );

    resizeHeight?.addEventListener(
      "input",
      () => {
        if (
          !keepProportion?.checked ||
          !originalResizeWidth ||
          !originalResizeHeight
        ) {
          return;
        }

        const height =
          Number(resizeHeight.value);

        if (height > 0) {
          resizeWidth.value =
            Math.round(
              height *
                originalResizeWidth /
                originalResizeHeight
            );
        }
      }
    );

    resizeImageButton.addEventListener(
      "click",
      () => {
        const file =
          resizeInput.files?.[0];

        const width =
          Number(resizeWidth?.value);

        const height =
          Number(resizeHeight?.value);

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

        if (
          width > 10000 ||
          height > 10000
        ) {
          setMessage(
            resizeMessage,
            "Use dimensões de até 10.000 × 10.000 pixels."
          );

          show(resizeResult, false);
          return;
        }

        resizeImageButton.disabled =
          true;

        resizeImageButton.textContent =
          "Processando...";

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
              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width = width;
              canvas.height = height;

              const context =
                canvas.getContext("2d");

              if (!context) {
                throw new Error(
                  "O navegador não conseguiu processar a imagem."
                );
              }

              context.fillStyle =
                "#ffffff";

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
                    throw new Error(
                      "Não foi possível redimensionar a imagem."
                    );
                  }

                  const url =
                    URL.createObjectURL(
                      blob
                    );

                  if (resizePreview) {
                    resizePreview.src =
                      url;
                  }

                  if (resizeDownload) {
                    resizeDownload.href =
                      url;
                  }

                  setMessage(
                    resizeMessage,
                    `Imagem redimensionada para ${width} × ${height}px.`
                  );

                  show(
                    resizeResult,
                    true
                  );

                  resizeImageButton.disabled =
                    false;

                  resizeImageButton.textContent =
                    "Redimensionar imagem";
                },
                "image/jpeg",
                0.92
              );
            } catch (error) {
              console.error(error);

              setMessage(
                resizeMessage,
                error.message ||
                  "Não foi possível processar a imagem."
              );

              resizeImageButton.disabled =
                false;

              resizeImageButton.textContent =
                "Redimensionar imagem";
            }
          };

          image.onerror = () => {
            setMessage(
              resizeMessage,
              "Não foi possível abrir esta imagem."
            );

            resizeImageButton.disabled =
              false;

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

          resizeImageButton.disabled =
            false;

          resizeImageButton.textContent =
            "Redimensionar imagem";
        };

        reader.readAsDataURL(file);
      }
    );
  }


  /* =======================================================
     IMAGENS → PDF
     ======================================================= */

  const pdfImages = $("pdfImages");
  const createPdfButton =
    $("createPdfButton");
  const pdfMessage = $("pdfMessage");
  const pdfResult = $("pdfResult");
  const pdfStats = $("pdfStats");
  const pdfDownload = $("pdfDownload");


  function imageFileToJpeg(file) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const image = new Image();

          image.onload = () => {
            try {
              const width =
                image.naturalWidth ||
                image.width;

              const height =
                image.naturalHeight ||
                image.height;

              const canvas =
                document.createElement(
                  "canvas"
                );

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

              context.fillStyle =
                "#ffffff";

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
      }
    );
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


  if (
    pdfImages &&
    createPdfButton
  ) {
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
            pdfDownload.href =
              url;
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


  /* =======================================================
     GERADOR DE SENHAS
     ======================================================= */

  const passwordLength =
    $("passwordLength");

  const passwordUpper =
    $("passwordUpper");

  const passwordLower =
    $("passwordLower");

  const passwordNumbers =
    $("passwordNumbers");

  const passwordSymbols =
    $("passwordSymbols");

  const generatePasswordButton =
    $("generatePasswordButton");

  const passwordMessage =
    $("passwordMessage");

  const passwordResult =
    $("passwordResult");

  const generatedPassword =
    $("generatedPassword");

  const copyPasswordButton =
    $("copyPasswordButton");


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
      Math.floor(
        maxUint / max
      ) * max;

    do {
      crypto.getRandomValues(
        array
      );
    } while (
      array[0] >= limit
    );

    return (
      array[0] % max
    );
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

    for (const group of groups) {
      password.push(
        group[
          secureRandomIndex(
            group.length
          )
        ]
      );
    }

    while (
      password.length <
      length
    ) {
      password.push(
        characters[
          secureRandomIndex(
            characters.length
          )
        ]
      );
    }

    for (
      let i =
        password.length - 1;
      i > 0;
      i--
    ) {
      const j =
        secureRandomIndex(
          i + 1
        );

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

        if (
          !Number.isInteger(length)
        ) {
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

        if (
          passwordUpper?.checked
        ) {
          groups.push(
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          );
        }

        if (
          passwordLower?.checked
        ) {
          groups.push(
            "abcdefghijklmnopqrstuvwxyz"
          );
        }

        if (
          passwordNumbers?.checked
        ) {
          groups.push(
            "0123456789"
          );
        }

        if (
          passwordSymbols?.checked
        ) {
          groups.push(
            "!@#$%^&*()-_=+[]{};:,.?/<>"
          );
        }

        if (!groups.length) {
          setMessage(
            passwordMessage,
            "Selecione pelo menos um tipo de caractere."
          );

          show(passwordResult, false);
          return;
        }

        if (
          groups.length >
          length
        ) {
          setMessage(
            passwordMessage,
            `Para usar todos os tipos selecionados, o tamanho deve ser pelo menos ${groups.length}.`
          );

          show(passwordResult, false);
          return;
        }

        try {
          const password =
            generateSecurePassword(
              length,
              groups
            );

          if (generatedPassword) {
            generatedPassword.value =
              password;
          }

          show(
            passwordResult,
            true
          );

          setMessage(
            passwordMessage,
            "Senha forte gerada no seu dispositivo."
          );
        } catch (error) {
          console.error(error);

          setMessage(
            passwordMessage,
            "Não foi possível gerar a senha."
          );

          show(passwordResult, false);
        }
      }
    );
  }


  copyPasswordButton?.addEventListener(
    "click",
    async () => {
      const value =
        generatedPassword?.value || "";

      if (!value) {
        return;
      }

      try {
        await copyText(value);

        setMessage(
          passwordMessage,
          "Senha copiada."
        );
      } catch {
        generatedPassword?.focus();
        generatedPassword?.select();

        setMessage(
          passwordMessage,
          "Selecione a senha e copie manualmente."
        );
      }
    }
  );


  /* =======================================================
     CONTADOR DE TEXTO
     ======================================================= */

  const textCounterInput =
    $("textCounterInput");

  const wordCount =
    $("wordCount");

  const characterCount =
    $("characterCount");

  const lineCount =
    $("lineCount");


  function updateTextCounter() {
    if (!textCounterInput) {
      return;
    }

    const text =
      textCounterInput.value;

    const words =
      text.trim()
        ? text.trim().split(/\s+/).length
        : 0;

    const characters =
      text.length;

    const lines =
      text.length
        ? text.split(/\r\n|\r|\n/).length
        : 0;

    if (wordCount) {
      wordCount.textContent =
        words;
    }

    if (characterCount) {
      characterCount.textContent =
        characters;
    }

    if (lineCount) {
      lineCount.textContent =
        lines;
    }
  }


  textCounterInput?.addEventListener(
    "input",
    updateTextCounter
  );

  updateTextCounter();


  /* =======================================================
     CONVERSOR DE TEXTO
     ======================================================= */

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


  function showTransformMessage(
    message
  ) {
    setMessage(
      textTransformMessage,
      message
    );
  }


  uppercaseButton?.addEventListener(
    "click",
    () => {
      if (!textTransformInput) {
        return;
      }

      textTransformInput.value =
        textTransformInput.value.toLocaleUpperCase(
          "pt"
        );

      showTransformMessage(
        "Texto convertido para maiúsculas."
      );
    }
  );


  lowercaseButton?.addEventListener(
    "click",
    () => {
      if (!textTransformInput) {
        return;
      }

      textTransformInput.value =
        textTransformInput.value.toLocaleLowerCase(
          "pt"
        );

      showTransformMessage(
        "Texto convertido para minúsculas."
      );
    }
  );


  titlecaseButton?.addEventListener(
    "click",
    () => {
      if (!textTransformInput) {
        return;
      }

      textTransformInput.value =
        textTransformInput.value
          .toLocaleLowerCase("pt")
          .replace(
            /(^|[\s\-])([a-záàâãéêíóôõúç])/giu,
            (match, prefix, letter) =>
              prefix +
              letter.toLocaleUpperCase(
                "pt"
              )
          );

      showTransformMessage(
        "Texto convertido para formato de título."
      );
    }
  );


  clearTextButton?.addEventListener(
    "click",
    () => {
      if (!textTransformInput) {
        return;
      }

      textTransformInput.value =
        "";

      showTransformMessage(
        "Texto limpo."
      );

      textTransformInput.focus();
    }
  );


  copyTransformedTextButton?.addEventListener(
    "click",
    async () => {
      const text =
        textTransformInput?.value || "";

      if (!text) {
        showTransformMessage(
          "Não há texto para copiar."
        );

        return;
      }

      try {
        await copyText(text);

        showTransformMessage(
          "Texto copiado."
        );
      } catch {
        textTransformInput?.focus();
        textTransformInput?.select();

        showTransformMessage(
          "Não foi possível copiar automaticamente."
        );
      }
    }
  );


  /* =======================================================
     CALCULADORA DE PORCENTAGEM
     ======================================================= */

  const percentageValue =
    $("percentageValue");

  const percentageRate =
    $("percentageRate");

  const calculatePercentageButton =
    $("calculatePercentageButton");

  const percentageResult =
    $("percentageResult");


  calculatePercentageButton?.addEventListener(
    "click",
    () => {
      const value =
        Number(
          percentageValue?.value
        );

      const rate =
        Number(
          percentageRate?.value
        );

      if (
        !Number.isFinite(value) ||
        !Number.isFinite(rate)
      ) {
        setMessage(
          percentageResult,
          "Digite valores válidos."
        );

        show(
          percentageResult,
          true
        );

        return;
      }

      const percentage =
        value * rate / 100;

      const afterIncrease =
        value + percentage;

      const afterDiscount =
        value - percentage;

      if (percentageResult) {
        percentageResult.innerHTML =
          `<strong>${formatNumber(
            rate
          )}% de ${formatNumber(
            value
          )} = ${formatNumber(
            percentage
          )}</strong><br>` +
          `Aumento: ${formatNumber(
            afterIncrease
          )}<br>` +
          `Desconto: ${formatNumber(
            afterDiscount
          )}`;

        percentageResult.hidden =
          false;
      }
    }
  );


  /* =======================================================
     CONVERSOR DE UNIDADES
     ======================================================= */

  const unitCategory =
    $("unitCategory");

  const unitValue =
    $("unitValue");

  const unitFrom =
    $("unitFrom");

  const unitTo =
    $("unitTo");

  const convertUnitButton =
    $("convertUnitButton");

  const unitResult =
    $("unitResult");


  const unitDefinitions = {
    length: {
      meter: {
        name: "Metro (m)",
        factor: 1
      },
      kilometer: {
        name: "Quilómetro (km)",
        factor: 1000
      },
      centimeter: {
        name: "Centímetro (cm)",
        factor: 0.01
      },
      millimeter: {
        name: "Milímetro (mm)",
        factor: 0.001
      },
      mile: {
        name: "Milha (mi)",
        factor: 1609.344
      },
      foot: {
        name: "Pé (ft)",
        factor: 0.3048
      }
    },

    weight: {
      kilogram: {
        name: "Quilograma (kg)",
        factor: 1
      },
      gram: {
        name: "Grama (g)",
        factor: 0.001
      },
      milligram: {
        name: "Miligrama (mg)",
        factor: 0.000001
      },
      pound: {
        name: "Libra (lb)",
        factor: 0.45359237
      },
      ounce: {
        name: "Onça (oz)",
        factor: 0.028349523125
      }
    },

    temperature: {
      celsius: {
        name: "Celsius (°C)"
      },
      fahrenheit: {
        name: "Fahrenheit (°F)"
      },
      kelvin: {
        name: "Kelvin (K)"
      }
    }
  };


  function populateUnitSelects() {
    if (
      !unitCategory ||
      !unitFrom ||
      !unitTo
    ) {
      return;
    }

    const definitions =
      unitDefinitions[
        unitCategory.value
      ];

    if (!definitions) {
      return;
    }

    unitFrom.innerHTML = "";
    unitTo.innerHTML = "";

    Object.entries(
      definitions
    ).forEach(
      ([key, definition]) => {
        const optionFrom =
          document.createElement(
            "option"
          );

        optionFrom.value =
          key;

        optionFrom.textContent =
          definition.name;

        const optionTo =
          optionFrom.cloneNode(
            true
          );

        unitFrom.appendChild(
          optionFrom
        );

        unitTo.appendChild(
          optionTo
        );
      }
    );

    if (unitTo.options.length > 1) {
      unitTo.selectedIndex = 1;
    }
  }


  function convertTemperature(
    value,
    from,
    to
  ) {
    let celsius;

    if (from === "celsius") {
      celsius = value;
    } else if (
      from === "fahrenheit"
    ) {
      celsius =
        (value - 32) *
        5 /
        9;
    } else {
      celsius =
        value - 273.15;
    }

    if (to === "celsius") {
      return celsius;
    }

    if (to === "fahrenheit") {
      return (
        celsius *
          9 /
          5 +
        32
      );
    }

    return celsius + 273.15;
  }


  function convertUnits(
    value,
    category,
    from,
    to
  ) {
    if (
      category ===
      "temperature"
    ) {
      return convertTemperature(
        value,
        from,
        to
      );
    }

    const definitions =
      unitDefinitions[
        category
      ];

    if (
      !definitions?.[from] ||
      !definitions?.[to]
    ) {
      throw new Error(
        "Unidades inválidas."
      );
    }

    const baseValue =
      value *
      definitions[from].factor;

    return (
      baseValue /
      definitions[to].factor
    );
  }


  unitCategory?.addEventListener(
    "change",
    populateUnitSelects
  );


  convertUnitButton?.addEventListener(
    "click",
    () => {
      const value =
        Number(
          unitValue?.value
        );

      if (
        !Number.isFinite(value)
      ) {
        setMessage(
          unitResult,
          "Digite um valor válido."
        );

        show(unitResult, true);
        return;
      }

      try {
        const category =
          unitCategory.value;

        const from =
          unitFrom.value;

        const to =
          unitTo.value;

        const result =
          convertUnits(
            value,
            category,
            from,
            to
          );

        const fromName =
          unitFrom.options[
            unitFrom.selectedIndex
          ]?.textContent ||
          from;

        const toName =
          unitTo.options[
            unitTo.selectedIndex
          ]?.textContent ||
          to;

        if (unitResult) {
          unitResult.innerHTML =
            `<strong>${formatNumber(
              value
            )} ${fromName}</strong> = ` +
            `<strong>${formatNumber(
              result
            )} ${toName}</strong>`;

          unitResult.hidden =
            false;
        }
      } catch (error) {
        setMessage(
          unitResult,
          error.message
        );

        show(unitResult, true);
      }
    }
  );


  populateUnitSelects();


  /* =======================================================
     CODIFICADOR / DECODIFICADOR URL
     ======================================================= */

  const urlInput = $("urlInput");
  const encodeUrlButton =
    $("encodeUrlButton");
  const decodeUrlButton =
    $("decodeUrlButton");
  const urlOutput = $("urlOutput");
  const copyUrlButton =
    $("copyUrlButton");
  const urlMessage =
    $("urlMessage");


  encodeUrlButton?.addEventListener(
    "click",
    () => {
      const value =
        urlInput?.value || "";

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
            encodeURIComponent(
              value
            );
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
    }
  );


  decodeUrlButton?.addEventListener(
    "click",
    () => {
      const value =
        urlInput?.value || "";

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
            decodeURIComponent(
              value
            );
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
    }
  );


  copyUrlButton?.addEventListener(
    "click",
    async () => {
      const value =
        urlOutput?.value || "";

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
    }
  );


  /* =======================================================
     FORMATADOR JSON
     ======================================================= */

  const jsonInput = $("jsonInput");
  const formatJsonButton =
    $("formatJsonButton");
  const minifyJsonButton =
    $("minifyJsonButton");
  const clearJsonButton =
    $("clearJsonButton");
  const jsonOutput = $("jsonOutput");
  const copyJsonButton =
    $("copyJsonButton");
  const jsonMessage =
    $("jsonMessage");


  function parseJsonInput() {
    const value =
      jsonInput?.value.trim();

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


  formatJsonButton?.addEventListener(
    "click",
    () => {
      try {
        const data =
          parseJsonInput();

        if (jsonOutput) {
          jsonOutput.value =
            JSON.stringify(
              data,
              null,
              2
            );
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
    }
  );


  minifyJsonButton?.addEventListener(
    "click",
    () => {
      try {
        const data =
          parseJsonInput();

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
    }
  );


  clearJsonButton?.addEventListener(
    "click",
    () => {
      if (jsonInput) {
        jsonInput.value = "";
      }

      if (jsonOutput) {
        jsonOutput.value = "";
      }

      setMessage(
        jsonMessage,
        ""
      );

      jsonInput?.focus();
    }
  );


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


  /* =======================================================
     GERADOR DE TEXTO
     ======================================================= */

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
      Math.floor(
        Math.random() *
          array.length
      )
    ];
  }


  function generateLoremText(
    count
  ) {
    const words = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {
      words.push(
        randomArrayItem(
          textGeneratorWords
        )
      );
    }

    if (!words.length) {
      return "";
    }

    let text =
      words.join(" ");

    text =
      text.charAt(0).toUpperCase() +
      text.slice(1);

    if (!/[.!?]$/.test(text)) {
      text += ".";
    }

    return text;
  }


  if (
    textGeneratorLength &&
    generateTextButton
  ) {
    generateTextButton.addEventListener(
      "click",
      () => {
        let count =
          Number.parseInt(
            textGeneratorLength.value,
            10
          );

        if (
          !Number.isInteger(count)
        ) {
          count = 50;
        }

        count =
          Math.min(
            1000,
            Math.max(5, count)
          );

        textGeneratorLength.value =
          count;

        const text =
          generateLoremText(
            count
          );

        if (generatedText) {
          generatedText.value =
            text;
        }

        setMessage(
          textGeneratorMessage,
          `Texto gerado com aproximadamente ${count} palavras.`
        );
      }
    );
  }


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


  /* =======================================================
     NHIMY ESTUDANTE 2.0
     ======================================================= */

  const student = {
    summaryInput:
      $("studentSummaryInput"),

    summaryOutput:
      $("studentSummaryOutput"),

    summaryButton:
      $("studentSummaryButton"),

    questionsInput:
      $("studentQuestionsInput"),

    questionsOutput:
      $("studentQuestionsOutput"),

    questionsButton:
      $("studentQuestionsButton"),

    flashcardsInput:
      $("studentFlashcardsInput"),

    flashcardsOutput:
      $("studentFlashcardsOutput"),

    flashcardsButton:
      $("studentFlashcardsButton"),

    quizInput:
      $("studentQuizInput"),

    quizOutput:
      $("studentQuizOutput"),

    quizButton:
      $("studentQuizButton"),

    objectiveInput:
      $("studentObjectiveInput"),

    objectiveOutput:
      $("studentObjectiveOutput"),

    objectiveButton:
      $("studentObjectiveButton"),

    planInput:
      $("studentPlanInput"),

    planOutput:
      $("studentPlanOutput"),

    planButton:
      $("studentPlanButton"),

    structureInput:
      $("studentStructureInput"),

    structureOutput:
      $("studentStructureOutput"),

    structureButton:
      $("studentStructureButton"),

    copyButton:
      $("studentCopyButton"),

    message:
      $("studentMessage")
  };


  function getStudentText(element) {
    return element?.value?.trim() || "";
  }


  function studentMessage(text) {
    setMessage(
      student.message,
      text
    );
  }


  function outputText(
    element,
    text
  ) {
    if (!element) {
      return;
    }

    element.value = text;
    element.hidden = false;
  }


  function cleanStudentText(text) {
    return text
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }


  function splitSentences(text) {
    return cleanStudentText(text)
      .split(/(?<=[.!?])\s+/)
      .map((sentence) =>
        sentence.trim()
      )
      .filter(Boolean);
  }


  function makeSummary(text) {
    const sentences =
      splitSentences(text);

    if (!sentences.length) {
      return "";
    }

    if (sentences.length <= 3) {
      return sentences.join(" ");
    }

    const target =
      Math.max(
        3,
        Math.ceil(
          sentences.length * 0.35
        )
      );

    const selected = [];

    const step =
      sentences.length /
      target;

    for (
      let i = 0;
      i < target;
      i++
    ) {
      const index =
        Math.min(
          sentences.length - 1,
          Math.floor(i * step)
        );

      if (
        !selected.includes(
          sentences[index]
        )
      ) {
        selected.push(
          sentences[index]
        );
      }
    }

    return selected.join(" ");
  }


  function makeQuestions(text) {
    const sentences =
      splitSentences(text);

    if (!sentences.length) {
      return "";
    }

    const questions = [];

    const patterns = [
      "Qual é a ideia principal apresentada?",
      "Que informação importante aparece neste conteúdo?",
      "Como este assunto pode ser explicado?",
      "Por que este tema é importante?",
      "Quais são os principais pontos que devem ser lembrados?",
      "Que exemplo pode ajudar a compreender este assunto?",
      "Qual é a conclusão mais importante?"
    ];

    sentences
      .slice(0, 7)
      .forEach(
        (sentence, index) => {
          questions.push(
            `${index + 1}. ${patterns[index % patterns.length]}`
          );

          questions.push(
            `   Resposta sugerida: ${sentence}`
          );
        }
      );

    return questions.join("\n");
  }


  function makeFlashcards(text) {
    const sentences =
      splitSentences(text);

    if (!sentences.length) {
      return "";
    }

    const cards = [];

    sentences
      .slice(0, 12)
      .forEach(
        (sentence, index) => {
          cards.push(
            `CARTÃO ${index + 1}`
          );

          cards.push(
            `Frente: Qual é a informação principal desta parte?`
          );

          cards.push(
            `Verso: ${sentence}`
          );

          cards.push("");
        }
      );

    return cards.join("\n").trim();
  }


  function makeQuiz(text) {
    const sentences =
      splitSentences(text);

    if (!sentences.length) {
      return "";
    }

    const quiz = [];

    sentences
      .slice(0, 5)
      .forEach(
        (sentence, index) => {
          quiz.push(
            `${index + 1}. Qual afirmação corresponde ao conteúdo estudado?`
          );

          quiz.push(
            `A) ${sentence}`
          );

          quiz.push(
            `B) Informação não relacionada ao tema.`
          );

          quiz.push(
            `C) Uma afirmação contrária ao conteúdo.`
          );

          quiz.push(
            `Resposta: A`
          );

          quiz.push("");
        }
      );

    return quiz.join("\n").trim();
  }


  function makeObjective(text) {
    const clean =
      cleanStudentText(text);

    if (!clean) {
      return "";
    }

    return [
      "OBJETIVO DE ESTUDO",
      "",
      `Tema: ${clean.split(/[.!?]/)[0]}.`,
      "",
      "Objetivo:",
      "Compreender os conceitos principais, identificar as informações mais importantes e conseguir explicar o assunto com as próprias palavras.",
      "",
      "Critério de conclusão:",
      "O estudante deverá conseguir resumir o conteúdo, responder perguntas sobre o tema e explicar os pontos principais sem consultar o material."
    ].join("\n");
  }


  function makeStudyPlan(text) {
    const clean =
      cleanStudentText(text);

    if (!clean) {
      return "";
    }

    return [
      "PLANO DE ESTUDO",
      "",
      `Tema: ${clean.split(/[.!?]/)[0]}.`,
      "",
      "1. Preparação",
      "Ler o conteúdo uma vez para compreender o assunto geral.",
      "",
      "2. Compreensão",
      "Identificar conceitos, definições, exemplos e ideias principais.",
      "",
      "3. Resumo",
      "Escrever um resumo curto usando as próprias palavras.",
      "",
      "4. Revisão",
      "Responder perguntas e revisar os pontos em que houver dificuldade.",
      "",
      "5. Teste",
      "Tentar explicar o assunto sem consultar o material.",
      "",
      "6. Revisão final",
      "Voltar apenas aos pontos que ainda não foram dominados."
    ].join("\n");
  }


  function makeStructure(text) {
    const sentences =
      splitSentences(text);

    if (!sentences.length) {
      return "";
    }

    const lines = [
      "ESTRUTURA DO CONTEÚDO",
      ""
    ];

    sentences
      .slice(0, 10)
      .forEach(
        (sentence, index) => {
          lines.push(
            `${index + 1}. ${sentence}`
          );
        }
      );

    return lines.join("\n");
  }


  student.summaryButton?.addEventListener(
    "click",
    () => {
      const text =
        getStudentText(
          student.summaryInput
        );

      if (!text) {
        studentMessage(
          "Cole um texto para criar o resumo."
        );
        return;
      }

      outputText(
        student.summaryOutput,
        makeSummary(text)
      );

      studentMessage(
        "Resumo criado."
      );
    }
  );


  student.questionsButton?.addEventListener(
    "click",
    () => {
      const text =
        getStudentText(
          student.questionsInput
        );

      if (!text) {
        studentMessage(
          "Cole um conteúdo para criar as perguntas."
        );
        return;
      }

      outputText(
        student.questionsOutput,
        makeQuestions(text)
      );

      studentMessage(
        "Perguntas de revisão criadas."
      );
    }
  );


  student.flashcardsButton?.addEventListener(
    "click",
    () => {
      const text =
        getStudentText(
          student.flashcardsInput
        );

      if (!text) {
        studentMessage(
          "Cole um conteúdo para criar os flashcards."
        );
        return;
      }

      outputText(
        student.flashcardsOutput,
        makeFlashcards(text)
      );

      studentMessage(
        "Flashcards criados."
      );
    }
  );


  student.quizButton?.addEventListener(
    "click",
    () => {
      const text =
        getStudentText(
          student.quizInput
        );

      if (!text) {
        studentMessage(
          "Cole um conteúdo para criar o quiz."
        );
        return;
      }

      outputText(
        student.quizOutput,
        makeQuiz(text)
      );

      studentMessage(
        "Quiz criado."
      );
    }
  );


  student.objectiveButton?.addEventListener(
    "click",
    () => {
      const text =
        getStudentText(
          student.objectiveInput
        );

      if (!text) {
        studentMessage(
          "Digite o tema ou conteúdo do estudo."
        );
        return;
      }

      outputText(
        student.objectiveOutput,
        makeObjective(text)
      );

      studentMessage(
        "Objetivo de estudo criado."
      );
    }
  );


  student.planButton?.addEventListener(
    "click",
    () => {
      const text =
        getStudentText(
          student.planInput
        );

      if (!text) {
        studentMessage(
          "Digite o tema para criar o plano."
        );
        return;
      }

      outputText(
        student.planOutput,
        makeStudyPlan(text)
      );

      studentMessage(
        "Plano de estudo criado."
      );
    }
  );


  student.structureButton?.addEventListener(
    "click",
    () => {
      const text =
        getStudentText(
          student.structureInput
        );

      if (!text) {
        studentMessage(
          "Cole um conteúdo para criar a estrutura."
        );
        return;
      }

      outputText(
        student.structureOutput,
        makeStructure(text)
      );

      studentMessage(
        "Estrutura criada."
      );
    }
  );


  student.copyButton?.addEventListener(
    "click",
    async () => {
      const outputs = [
        student.summaryOutput,
        student.questionsOutput,
        student.flashcardsOutput,
        student.quizOutput,
        student.objectiveOutput,
        student.planOutput,
        student.structureOutput
      ];

      const output =
        outputs.find(
          (element) =>
            element &&
            element.value.trim()
        );

      if (!output) {
        studentMessage(
          "Não há conteúdo para copiar."
        );
        return;
      }

      try {
        await copyText(
          output.value
        );

        studentMessage(
          "Conteúdo copiado."
        );
      } catch {
        output.focus();
        output.select();

        studentMessage(
          "Selecione o conteúdo e copie manualmente."
        );
      }
    }
  );


  /* =======================================================
     NHIMY ESTUDANTE — IDs ALTERNATIVOS
     Compatibilidade com versões anteriores
     ======================================================= */

  const oldStudentSummary =
    $("studentSummary");

  const oldStudentQuestions =
    $("studentQuestions");

  const oldStudentSummaryButton =
    $("generateSummaryButton");

  const oldStudentQuestionsButton =
    $("generateQuestionsButton");


  oldStudentSummaryButton?.addEventListener(
    "click",
    () => {
      const input =
        $("summaryInput") ||
        oldStudentSummary;

      const output =
        $("summaryOutput") ||
        oldStudentSummary;

      const text =
        input?.value?.trim() || "";

      if (!text) {
        studentMessage(
          "Cole um texto para criar o resumo."
        );
        return;
      }

      if (output) {
        output.value =
          makeSummary(text);
      }

      studentMessage(
        "Resumo criado."
      );
    }
  );


  oldStudentQuestionsButton?.addEventListener(
    "click",
    () => {
      const input =
        $("questionsInput") ||
        oldStudentQuestions;

      const output =
        $("questionsOutput") ||
        oldStudentQuestions;

      const text =
        input?.value?.trim() || "";

      if (!text) {
        studentMessage(
          "Cole um conteúdo para criar perguntas."
        );
        return;
      }

      if (output) {
        output.value =
          makeQuestions(text);
      }

      studentMessage(
        "Perguntas criadas."
      );
    }
  );


  /* =======================================================
     SEGURANÇA E FINALIZAÇÃO
     ======================================================= */

  window.NhimyApp = {
    version: "3.0",
    tools: {
      formatNumber,
      copyText,
      generateLoremText,
      generateSecurePassword
    },
    student: {
      makeSummary,
      makeQuestions,
      makeFlashcards,
      makeQuiz,
      makeObjective,
      makeStudyPlan,
      makeStructure
    }
  };

  console.log(
    "NHIMY APP.JS carregado com sucesso."
  );

})();