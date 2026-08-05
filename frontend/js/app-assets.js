
function setTemplateStatus(message, type = "info") {
  if (!templateStatus) return;

  if (!message) {
    templateStatus.textContent = "";
    templateStatus.className = "status";
    return;
  }

  templateStatus.textContent = message;
  templateStatus.className = `status ${type}`;
}

function syncTemplateControls() {
  if (templateRemoveBtn) {
    templateRemoveBtn.disabled = !assets.template;
    templateRemoveBtn.hidden = !assets.template;
  }
  if (logoRemoveBtn) {
    logoRemoveBtn.disabled = !assets.logo;
    logoRemoveBtn.hidden = !assets.logo;
  }
  if (assinaturaRemoveBtn) {
    assinaturaRemoveBtn.disabled = !assets.assinatura;
    assinaturaRemoveBtn.hidden = !assets.assinatura;
  }
  if (assinatura2RemoveBtn) {
    assinatura2RemoveBtn.disabled = !assets.assinatura2;
    assinatura2RemoveBtn.hidden = !assets.assinatura2;
  }
  if (assinatura3RemoveBtn) {
    assinatura3RemoveBtn.disabled = !assets.assinatura3;
    assinatura3RemoveBtn.hidden = !assets.assinatura3;
  }
  SELO_SLOT_KEYS.forEach((slotKey) => {
    const ui = getSecretariaAssetUi(slotKey);
    if (!ui.removeBtn) return;
    ui.removeBtn.disabled = !assets[slotKey];
    ui.removeBtn.hidden = !assets[slotKey];
  });
  if (instituicaoRemoveBtn) {
    instituicaoRemoveBtn.disabled = !assets.instituicao;
    instituicaoRemoveBtn.hidden = !assets.instituicao;
  }
  syncAdvancedControlVisibility();
}

function trimAssetImage(image) {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceCtx) return image;

  sourceCtx.drawImage(image, 0, 0);
  const { data, width, height } = sourceCtx.getImageData(0, 0, image.width, image.height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      const isTransparent = alpha <= 12;
      const isNearWhite =
        alpha >= 220 && red >= 245 && green >= 245 && blue >= 245;

      if (isTransparent || isNearWhite) continue;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX === -1 || maxY === -1) return image;

  const trimmedWidth = maxX - minX + 1;
  const trimmedHeight = maxY - minY + 1;
  if (trimmedWidth === width && trimmedHeight === height) {
    return image;
  }

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  const trimmedCtx = trimmedCanvas.getContext("2d");
  if (!trimmedCtx) return image;

  trimmedCtx.drawImage(
    sourceCanvas,
    minX,
    minY,
    trimmedWidth,
    trimmedHeight,
    0,
    0,
    trimmedWidth,
    trimmedHeight
  );
  return trimmedCanvas;
}

function loadImage(file, { trim = true } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(trim ? trimAssetImage(image) : image);
      image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function validateVisualAssetFile(file, assetLabel = "imagem") {
  if (!file) return;
  const suffix = ((file.name || "").split(".").pop() || "").toLowerCase();
  const allowedSuffixes = new Set(["png", "jpg", "jpeg", "webp"]);
  const normalizedType = sanitizeText(file.type).toLowerCase();
  const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!allowedSuffixes.has(suffix) || (normalizedType && !allowedMimeTypes.has(normalizedType))) {
    throw new Error(`Formato inválido para ${assetLabel}. Use PNG, JPG, JPEG ou WEBP.`);
  }
}

function validateTemplateFile(file) {
  validateVisualAssetFile(file, "molde");
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível gerar o QR Code."));
    };

    image.src = objectUrl;
  });
}

function getTemplateWarning(image) {
  if (!image) return "";
  const ratio = image.width / image.height;
  const deviation = Math.abs(ratio - certificateAspectRatio) / certificateAspectRatio;
  if (deviation <= 0.06) return "";
  return "Molde ajustado automaticamente. Como a proporção dele difere do certificado, podem sobrar margens na prévia.";
}

function drawDefaultCertificateFrame() {
  if (!ctx || !canvas) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#1a4f8b";
  ctx.lineWidth = 16;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.strokeStyle = "#d9b14c";
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);
}

function drawTemplateBackground(image) {
  if (!ctx || !canvas || !image) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const fitted = fitRect(image.width, image.height, canvas.width, canvas.height);
  const drawX = (canvas.width - fitted.width) / 2;
  const drawY = (canvas.height - fitted.height) / 2;
  ctx.drawImage(image, drawX, drawY, fitted.width, fitted.height);
}

function getPreviewCertificateData() {
  const nome = sanitizeText(nomeInput ? nomeInput.value : "") || "Nome do participante";
  const curso = sanitizeText(cursoInput ? cursoInput.value : "") || "Nome do curso";
  const data = sanitizeText(dataInput ? dataInput.value : "") || toDateInputValue(new Date());
  const linha1 = sanitizeText(textoLinha1Input ? textoLinha1Input.value : "");
  const linha2 = sanitizeText(textoLinha2Input ? textoLinha2Input.value : "");
  const cargaResult = getFormCargaHorariaResult();

  return {
    nome,
    curso,
    data,
    linha1,
    linha2,
    qrText: getPreviewQrText(),
    codigo: "",
    cargaH: cargaResult.value || 0,
  };
}

async function buildQrImage(qrText) {
  const text = sanitizeText(qrText);
  if (!text) return null;

  if (qrImageCache.has(text)) {
    return qrImageCache.get(text);
  }

  const promise = (async () => {
    const response = await fetch(
      `${getApiBaseUrl()}/api/qrcode?texto=${encodeURIComponent(text)}`
    );

    if (!response.ok) {
      throw new Error(`Falha ao gerar o QR Code (HTTP ${response.status}).`);
    }

    const qrBlob = await response.blob();
    return loadImageFromBlob(qrBlob);
  })();

  qrImageCache.set(text, promise);

  try {
    return await promise;
  } catch (error) {
    qrImageCache.delete(text);
    throw error;
  }
}

async function drawCertificate(nome, curso, data, linha1, linha2, qrText = "", codigo = "", cargaH = 0) {
  if (!ctx || !canvas) {
    throw new Error("Canvas não disponível.");
  }

  const myTicket = ++renderTicket;
  const activeTemplateImage = getActiveTemplateImage();
  const activeLogoImage = getActiveLogoImage();
  const activeInstituicaoImage = getActiveInstituicaoImage();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (activeTemplateImage) {
    drawTemplateBackground(activeTemplateImage);
  } else {
    drawDefaultCertificateFrame();
  }

  if (activeLogoImage) {
    drawCenteredImage(
      activeLogoImage,
      layout.logo.x,
      layout.logo.y,
      layout.logo.maxW,
      layout.logo.maxH
    );
  }

  ctx.fillStyle = "#1a4f8b";
  ctx.textAlign = "center";
  ctx.font = "bold 64px Georgia";
  const centerX = canvas.width / 2;
  const maxTextWidth = canvas.width - 220;
  if (shouldDrawCertificateTitle()) {
    ctx.fillText("CERTIFICADO", centerX, 190);
  }

  ctx.fillStyle = "#334";
  drawAdaptiveCenteredText(linha1, centerX, 270, {
    family: "'Times New Roman'",
    startSize: 32,
    minSize: 20,
    maxWidth: maxTextWidth,
  });

  ctx.fillStyle = "#112031";
  drawAdaptiveCenteredText(nome, centerX, 370, {
    family: "'Times New Roman'",
    weight: "bold",
    startSize: 56,
    minSize: 30,
    maxWidth: maxTextWidth,
  });

  ctx.fillStyle = "#334";
  drawAdaptiveCenteredText(linha2, centerX, 440, {
    family: "'Times New Roman'",
    startSize: 30,
    minSize: 18,
    maxWidth: maxTextWidth,
  });

  ctx.fillStyle = "#112031";
  drawAdaptiveCenteredWrappedText(curso, centerX, 510, {
    family: "Georgia",
    style: "italic",
    startSize: 42,
    minSize: 24,
    maxWidth: canvas.width - 300,
    maxLines: 2,
    lineHeight: 36,
  });

  ctx.fillStyle = "#334";
  drawAdaptiveCenteredText(`Data: ${formatDate(data)}`, centerX, 580, {
    family: "'Times New Roman'",
    startSize: 28,
    minSize: 20,
    maxWidth: maxTextWidth,
  });

  const codigoLabel = sanitizeText(codigo);
  const cargaLabel = cargaH > 0 ? `Carga horária: ${cargaH}h` : "";

  let infoY = 620;
  if (codigoLabel) {
    ctx.fillStyle = "#334";
    drawAdaptiveCenteredText(`Código: ${codigoLabel}`, centerX, infoY, {
      family: "Arial",
      startSize: 18,
      minSize: 14,
      maxWidth: maxTextWidth,
    });
    infoY += 30;
  }
  if (cargaLabel) {
    ctx.fillStyle = "#334";
    drawAdaptiveCenteredText(cargaLabel, centerX, infoY, {
      family: "Arial",
      startSize: 18,
      minSize: 14,
      maxWidth: maxTextWidth,
    });
  }

  drawSignatureBlock("assinatura");
  drawSignatureBlock("assinatura2");
  drawSignatureBlock("assinatura3");
  drawInstitutionBlock(activeInstituicaoImage);
  SELO_SLOT_KEYS.forEach((slotKey) => drawSeloBlock(slotKey));

  const qrValue = sanitizeText(qrText);
  if (qrValue) {
    const qrImage = await buildQrImage(qrValue);
    if (myTicket !== renderTicket) return;

    drawCenteredImage(
      qrImage,
      layout.qr.x,
      layout.qr.y,
      layout.qr.maxW,
      layout.qr.maxH
    );
  }

}

async function renderLastCertificate() {
  const preview = lastData || getPreviewCertificateData();
  try {
    await drawCertificate(
      preview.nome,
      preview.curso,
      preview.data,
      preview.linha1,
      preview.linha2,
      preview.qrText || "",
      preview.codigo || "",
      preview.cargaH || 0
    );
  } catch (error) {
    console.error(error);
  }
  syncAdvancedControlVisibility();
}

async function handleAssetChange(input, key, options = {}) {
  if (!input) return;
  const file = input.files[0];

  if (!file) {
    assets[key] = null;
    syncTemplateControls();
    if (key === "template") {
      if (templateHideTitleInput) templateHideTitleInput.checked = false;
      const message = savedTemplate
        ? `Molde temporário removido. A prévia voltou a usar o modelo ${savedTemplate.nome}.`
        : "";
      setTemplateStatus(message, "info");
    } else if (key === "logo") {
      const message = savedLogo
        ? `Logo temporária removida. A prévia voltou a usar a logo ${savedLogo.nome}.`
        : "";
      setLogoStatus(message, "info");
    } else if (key === "assinatura") {
      const message = savedAssinatura
        ? `Assinatura temporária removida. A prévia voltou a usar a assinatura ${savedAssinatura.nome}.`
        : "";
      setAssinaturaStatus(message, "info");
    } else if (key === "assinatura2") {
      const message = savedAssinatura2
        ? `Assinatura 2 temporaria removida. A previa voltou a usar a assinatura ${savedAssinatura2.nome}.`
        : "";
      setAssinatura2Status(message, "info");
    } else if (key === "assinatura3") {
      const message = savedAssinatura3
        ? `Assinatura 3 temporaria removida. A previa voltou a usar a assinatura ${savedAssinatura3.nome}.`
        : "";
      setAssinatura3Status(message, "info");
    } else if (isSeloSlot(key)) {
      const ui = getSecretariaAssetUi(key);
      const savedAsset = getSavedSecretariaAsset(key);
      const message = savedAsset
        ? `${capitalizeLabel(ui.label)} temporario removido. A previa voltou a usar o selo ${savedAsset.nome}.`
        : "";
      ui.setManualStatus(message, "info");
    } else if (key === "instituicao") {
      const message = savedInstituicao
        ? `Instituição temporária removida. A prévia voltou a usar a instituição ${savedInstituicao.nome}.`
        : "";
      setInstituicaoStatus(message, "info");
    }
    void renderLastCertificate();
    return;
  }

  try {
    if (key === "template") {
      validateTemplateFile(file);
    } else {
      validateVisualAssetFile(file, getSecretariaAssetDisplayLabel(key));
    }
    assets[key] = await loadImage(file, options);
    syncTemplateControls();
    if (key === "template") {
      const warning = getTemplateWarning(assets.template);
      setTemplateStatus(
        warning
          ? `${warning} Molde temporário pronto para uso. Ele sobrescreve o modelo selecionado somente nesta emissão.`
          : "Molde temporário pronto para uso. Ele sobrescreve o modelo selecionado somente nesta emissão.",
        warning ? "info" : "success"
      );
    } else if (key === "logo") {
      setLogoStatus(
        "Logo temporária pronta para uso. Ela sobrescreve a logo cadastrada selecionada somente nesta emissão.",
        "success"
      );
    } else if (key === "assinatura") {
      setAssinaturaStatus(
        "Assinatura temporária pronta para uso. Ela sobrescreve a assinatura cadastrada selecionada somente nesta emissão.",
        "success"
      );
    } else if (key === "assinatura2") {
      setAssinatura2Status(
        "Assinatura 2 temporaria pronta para uso. Ela sobrescreve a assinatura cadastrada selecionada somente nesta emissao.",
        "success"
      );
    } else if (key === "assinatura3") {
      setAssinatura3Status(
        "Assinatura 3 temporaria pronta para uso. Ela sobrescreve a assinatura cadastrada selecionada somente nesta emissao.",
        "success"
      );
    } else if (isSeloSlot(key)) {
      const ui = getSecretariaAssetUi(key);
      ui.setManualStatus(
        `${capitalizeLabel(ui.label)} temporario pronto para uso. Ele sobrescreve o selo cadastrado selecionado somente nesta emissao.`,
        "success"
      );
    } else if (key === "instituicao") {
      setInstituicaoStatus(
        "Instituição temporária pronta para uso. Ela sobrescreve a instituição cadastrada selecionada somente nesta emissão.",
        "success"
      );
    }
    void renderLastCertificate();
  } catch (error) {
    console.error(error);
    input.value = "";
    assets[key] = null;
    syncTemplateControls();
    if (key === "template") {
      setTemplateStatus("Não foi possível carregar o molde informado.", "error");
    } else if (key === "logo") {
      setLogoStatus("Não foi possível carregar a logo informada.", "error");
    } else if (key === "assinatura") {
      setAssinaturaStatus("Não foi possível carregar a assinatura informada.", "error");
    } else if (key === "assinatura2") {
      setAssinatura2Status("Nao foi possivel carregar a assinatura 2 informada.", "error");
    } else if (key === "assinatura3") {
      setAssinatura3Status("Nao foi possivel carregar a assinatura 3 informada.", "error");
    } else if (isSeloSlot(key)) {
      const ui = getSecretariaAssetUi(key);
      ui.setManualStatus(`Nao foi possivel carregar o ${ui.label} informado.`, "error");
    } else if (key === "instituicao") {
      setInstituicaoStatus("Não foi possível carregar a instituição informada.", "error");
    }
  }
}
