async function refreshProtectedData(options = {}) {
  if (!sessionState) return;

  await loadAvailableTemplates();
  await loadAvailableSecretariaAssets();
  await loadCertificates(options.page || certListState.page || 1);
  if (canManageVisualAssets()) {
    await loadAdminData();
  }
}

async function registerSingleCertificate(cert) {
  const payload = {
    nome: cert.nome,
    curso: cert.curso,
    carga_h: cert.carga_h || 0,
    concluido: cert.data,
  };

  return apiJsonRequest("/api/certificados", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function findPossibleDuplicateCertificates(cert) {
  const query = buildQueryString({
    nome: sanitizeText(cert.nome),
    curso: sanitizeText(cert.curso),
    concluido: sanitizeText(cert.data),
    limite: 5,
  });
  const payload = await apiJsonRequest(`/api/certificados/possiveis-duplicados${query}`);
  return Array.isArray(payload) ? payload : [];
}

async function executeSingleCertificateGeneration(prepared) {
  if (!prepared) return;

  isSingleGenerationRunning = true;
  syncGenerateSubmitButton();
  let registeredCode = "";
  let uploadSucceeded = false;

  try {
    setBatchStatus("Registrando certificado no backend...", "info");
    const registered = await registerSingleCertificate({
      nome: prepared.nome,
      curso: prepared.curso,
      data: prepared.data,
      carga_h: prepared.cargaH,
    });

    const codigo = sanitizeText(registered.codigo).toUpperCase();
    registeredCode = codigo;
    const qrText = sanitizeText(registered.url_validacao);

    lastData = {
      nome: prepared.nome,
      curso: prepared.curso,
      data: prepared.data,
      cargaH: prepared.cargaH,
      codigo,
      linha1: prepared.linha1,
      linha2: prepared.linha2,
      qrText,
    };
    await drawCertificate(
      prepared.nome,
      prepared.curso,
      prepared.data,
      prepared.linha1,
      prepared.linha2,
      qrText,
      codigo,
      prepared.cargaH
    );
    const pngBlob = await canvasToPngBlob();
    ensureCertificatePngWithinLimit(pngBlob, codigo);
    setBatchStatus(`Salvando o certificado ${codigo} no servidor...`, "info");
    await uploadCertificateImage(codigo, pngBlob, codigo);
    uploadSucceeded = true;
    downloadBtn.disabled = false;
    setBatchStatus(
      `Certificado ${codigo} gerado com sucesso e salvo no servidor.`,
      "success"
    );
    await loadCertificates(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    const shouldAttemptCleanup = Boolean(registeredCode) && !uploadSucceeded;
    const cleanupResult = shouldAttemptCleanup
      ? await tryDiscardPendingCertificate(registeredCode)
      : null;

    if (error && error.operation === "png_size") {
      const codeLabel = sanitizeText(error.codigo || registeredCode).toUpperCase() || "sem codigo";
      error.message =
        cleanupResult && cleanupResult.discarded
          ? `O PNG do certificado ${codeLabel} excedeu o limite permitido e o cadastro pendente foi descartado automaticamente. Ajuste os ativos visuais e gere novamente.`
          : `O PNG do certificado ${codeLabel} excedeu o limite permitido. O cadastro pendente nao pode ser descartado automaticamente: ${cleanupResult && cleanupResult.message ? cleanupResult.message : "verifique o certificado pendente antes de tentar novamente."}`;
      error.operation = "png_size_handled";
    }

    if (error && error.operation === "png_upload") {
      const codeLabel = sanitizeText(error.codigo || registeredCode).toUpperCase() || "sem codigo";
      error.message =
        cleanupResult && cleanupResult.discarded
          ? `Nao foi possivel salvar o PNG do certificado ${codeLabel} apos ${error.maxAttempts || 1} tentativa(s). O cadastro pendente foi descartado automaticamente para evitar certificado incompleto no sistema.`
          : `Nao foi possivel salvar o PNG do certificado ${codeLabel} apos ${error.maxAttempts || 1} tentativa(s). O cadastro pendente nao pode ser descartado automaticamente: ${cleanupResult && cleanupResult.message ? cleanupResult.message : "verifique o certificado pendente antes de tentar novamente."}`;
      error.operation = "png_upload_handled";
    }

    if (
      shouldAttemptCleanup &&
      cleanupResult &&
      cleanupResult.discarded &&
      error &&
      !error.message
    ) {
      error.message = `Falha ao gerar o certificado. O cadastro pendente ${registeredCode} foi descartado automaticamente.`;
    }

    if (
      shouldAttemptCleanup &&
      cleanupResult &&
      !cleanupResult.discarded &&
      error &&
      !error.message
    ) {
      error.message = `Falha ao gerar o certificado. O cadastro pendente ${registeredCode} nao pode ser descartado automaticamente: ${cleanupResult.message}`;
    }

    const message = (() => {
      if (error && error.operation === "png_size") {
        const codeLabel = sanitizeText(error.codigo || registeredCode).toUpperCase() || "sem codigo";
        if (cleanupResult && cleanupResult.discarded) {
          return `O PNG do certificado ${codeLabel} excedeu o limite permitido e o cadastro pendente foi descartado automaticamente. Ajuste os ativos visuais e gere novamente.`;
        }
        return `O PNG do certificado ${codeLabel} excedeu o limite permitido. O cadastro pendente nao pode ser descartado automaticamente: ${cleanupResult && cleanupResult.message ? cleanupResult.message : "verifique o certificado pendente antes de tentar novamente."}`;
      }
      if (error && error.operation === "png_upload") {
        const codeLabel = sanitizeText(error.codigo).toUpperCase() || "sem código";
        return `Certificado ${codeLabel} registrado, mas o PNG não foi salvo no servidor após ${error.maxAttempts || 1} tentativa(s).`;
      }
      return error && error.message
        ? error.message
        : "Falha ao gerar o certificado. Tente novamente.";
    })();
    if (shouldAttemptCleanup) {
      downloadBtn.disabled = true;
      await loadCertificates(1);
    }
    setBatchStatus(message, "error");
  } finally {
    isSingleGenerationRunning = false;
    syncGenerateSubmitButton();
  }
}

async function registerBatchCertificates(items) {
  const payload = {
    itens: items.map((item) => ({
      nome: item.nome,
      curso: item.curso,
      carga_h: Number.isFinite(item.carga_h) ? item.carga_h : 0,
      concluido: item.data,
    })),
  };

  return apiJsonRequest("/api/certificados/lote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryPngUpload(error) {
  if (!error) return false;
  if (typeof error.status !== "number") return true;
  return error.status === 408 || error.status === 429 || error.status >= 500;
}

async function uploadCertificateImage(codigo, pngBlob, fileName, options = {}) {
  const certCode = sanitizeText(codigo).toUpperCase();
  if (!certCode) {
    throw new Error("Codigo do certificado ausente para upload do PNG.");
  }

  if (!pngBlob) {
    throw new Error("PNG do certificado ausente para upload.");
  }

  const safeName = sanitizeFileName(fileName || certCode, certCode);
  const maxAttempts = Math.max(1, Number.parseInt(options.maxAttempts, 10) || 3);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const formData = new FormData();
    formData.append("arquivo", pngBlob, `${safeName}.png`);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/certificados/${encodeURIComponent(certCode)}/arquivo`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      let payload = null;
      try {
        payload = await response.json();
      } catch (_error) {
        payload = null;
      }

      if (!response.ok) {
        const error = new Error(
          (payload && (payload.detail || payload.message)) ||
            `Falha ao enviar PNG do certificado (HTTP ${response.status}).`
        );
        error.status = response.status;
        error.operation = "png_upload";
        error.codigo = certCode;
        error.attempt = attempt;
        error.maxAttempts = maxAttempts;
        if (attempt < maxAttempts && shouldRetryPngUpload(error)) {
          await wait(700 * attempt);
          continue;
        }
        throw error;
      }

      return payload;
    } catch (error) {
      if (!error.operation) {
        error.operation = "png_upload";
        error.codigo = certCode;
        error.attempt = attempt;
        error.maxAttempts = maxAttempts;
      }
      if (attempt < maxAttempts && shouldRetryPngUpload(error)) {
        await wait(700 * attempt);
        continue;
      }
      throw error;
    }
  }
  return null;
}

async function discardPendingCertificate(codigo) {
  const certCode = sanitizeText(codigo).toUpperCase();
  if (!certCode) {
    throw new Error("Codigo do certificado ausente para descarte do pendente.");
  }

  try {
    return await apiJsonRequest(`/api/certificados/${encodeURIComponent(certCode)}/pendente`, {
      method: "DELETE",
    });
  } catch (error) {
    if (!error.operation) {
      error.operation = "pending_discard";
      error.codigo = certCode;
    }
    throw error;
  }
}

async function tryDiscardPendingCertificate(codigo) {
  const certCode = sanitizeText(codigo).toUpperCase();
  if (!certCode) {
    return {
      attempted: false,
      discarded: false,
      message: "Codigo ausente para descarte do pendente.",
    };
  }

  try {
    const payload = await discardPendingCertificate(certCode);
    return {
      attempted: true,
      discarded: true,
      payload,
      message:
        (payload && payload.message) ||
        `Certificado pendente ${certCode} descartado automaticamente.`,
    };
  } catch (error) {
    if (error && error.status === 404) {
      return {
        attempted: true,
        discarded: true,
        message: `O certificado pendente ${certCode} ja nao estava mais disponivel para descarte.`,
      };
    }

    return {
      attempted: true,
      discarded: false,
      error,
      message:
        (error && error.message) ||
        `Nao foi possivel descartar automaticamente o certificado pendente ${certCode}.`,
    };
  }
}

async function cleanupPendingCertificates(certificates) {
  const discarded = [];
  const failed = [];

  for (const cert of certificates || []) {
    if (!cert || !sanitizeText(cert.codigo)) continue;

    const result = await tryDiscardPendingCertificate(cert.codigo);
    if (result.discarded) {
      discarded.push({
        cert,
        message: result.message,
      });
      continue;
    }

    failed.push({
      cert,
      message: result.message,
      error: result.error || null,
    });
  }

  return { discarded, failed };
}

function buildFont(style, weight, size, family) {
  return `${style} ${weight} ${size}px ${family}`.replace(/\s+/g, " ").trim();
}

function measureTextWithFont(text, style, weight, size, family) {
  if (!ctx) return 0;
  ctx.font = buildFont(style, weight, size, family);
  return ctx.measureText(text).width;
}

function fitTextToWidth(text, options = {}) {
  const {
    style = "normal",
    weight = "normal",
    family = "sans-serif",
    startSize = 24,
    minSize = 14,
    maxWidth = 0,
  } = options;

  const normalized = sanitizeText(text);
  if (!normalized) return { text: "", size: startSize };

  let size = startSize;
  while (
    size > minSize &&
    measureTextWithFont(normalized, style, weight, size, family) > maxWidth
  ) {
    size -= 1;
  }

  if (measureTextWithFont(normalized, style, weight, size, family) <= maxWidth) {
    return { text: normalized, size };
  }

  let trimmed = normalized;
  while (
    trimmed.length > 0 &&
    measureTextWithFont(`${trimmed}...`, style, weight, size, family) > maxWidth
  ) {
    trimmed = trimmed.slice(0, -1);
  }

  return { text: trimmed ? `${trimmed}...` : "...", size };
}

function drawAdaptiveCenteredText(text, x, y, options = {}) {
  if (!ctx) return;
  const fitted = fitTextToWidth(text, options);
  ctx.font = buildFont(
    options.style || "normal",
    options.weight || "normal",
    fitted.size,
    options.family || "sans-serif"
  );
  ctx.fillText(fitted.text, x, y);
}

function fitRect(srcW, srcH, maxW, maxH) {
  const ratio = Math.min(maxW / srcW, maxH / srcH);
  return {
    width: srcW * ratio,
    height: srcH * ratio,
  };
}

function drawCenteredImage(image, x, y, maxW, maxH) {
  if (!ctx || !image) return;
  const size = fitRect(image.width, image.height, maxW, maxH);
  const drawX = x - size.width / 2;
  const drawY = y - size.height / 2;
  ctx.drawImage(image, drawX, drawY, size.width, size.height);
}

function drawCenteredLine(x, y, width) {
  if (!ctx) return;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  ctx.lineTo(x + width / 2, y);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSignatureLabelLines(lines, x, y, maxWidth) {
  if (!ctx || !lines.length) return;
  const lineHeight = lines.length > 1 ? 18 : 24;
  ctx.fillStyle = "#444";
  lines.forEach((line, index) => {
    drawAdaptiveCenteredText(line, x, y + index * lineHeight, {
      family: "Arial",
      startSize: lines.length > 1 ? 16 : 22,
      minSize: 11,
      maxWidth,
    });
  });
}

function drawSignatureBlock(slotKey) {
  if (!ctx || !isSignatureSlotActive(slotKey)) return;

  const slotLayout = layout[slotKey] || layout.assinatura;
  const activeImage = getActiveSignatureImage(slotKey);
  const lineWidth = Math.max(220, Math.min(320, slotLayout.maxW + 70));
  const lineY = slotLayout.y + 38;
  const labelY = lineY + 35;

  if (activeImage) {
    drawCenteredImage(
      activeImage,
      slotLayout.x,
      slotLayout.y,
      slotLayout.maxW,
      slotLayout.maxH
    );
  }

  drawCenteredLine(slotLayout.x, lineY, lineWidth);
  drawSignatureLabelLines(getSignatureLabelLines(slotKey), slotLayout.x, labelY, lineWidth + 40);
}

function drawSeloBlock(slotKey) {
  if (!ctx || !isSeloSlot(slotKey)) return;
  const activeImage = getActiveSeloImage(slotKey);
  if (!activeImage) return;

  const slotLayout = layout[slotKey];
  drawCenteredImage(
    activeImage,
    slotLayout.x,
    slotLayout.y,
    slotLayout.maxW,
    slotLayout.maxH
  );
}

function drawInstitutionBlock(activeInstituicaoImage) {
  if (!ctx) return;
  if (!shouldDrawInstitutionBlock()) return;

  const lineWidth = Math.max(220, Math.min(320, layout.instituicao.maxW + 70));
  const lineY = layout.instituicao.y + 38;

  if (activeInstituicaoImage) {
    drawCenteredImage(
      activeInstituicaoImage,
      layout.instituicao.x,
      layout.instituicao.y,
      layout.instituicao.maxW,
      layout.instituicao.maxH
    );
  }

  drawCenteredLine(layout.instituicao.x, lineY, lineWidth);
  drawSignatureLabelLines(["Instituição"], layout.instituicao.x, lineY + 35, lineWidth + 40);
}

function scaleHeightByWidth(width, ratio) {
  return Math.max(1, Math.round(width * ratio));
}

function configureRangeInput(input, min, max, value) {
  if (!input) return;
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
}

function syncAdvancedAssetControls() {
  configureRangeInput(
    assinaturaXInput,
    ASSINATURA_CONTROL_LIMITS.xMin,
    ASSINATURA_CONTROL_LIMITS.xMax,
    layout.assinatura.x
  );
  configureRangeInput(
    assinaturaYInput,
    ASSINATURA_CONTROL_LIMITS.yMin,
    ASSINATURA_CONTROL_LIMITS.yMax,
    layout.assinatura.y
  );
  configureRangeInput(
    assinaturaSizeInput,
    ASSINATURA_CONTROL_LIMITS.sizeMin,
    ASSINATURA_CONTROL_LIMITS.sizeMax,
    layout.assinatura.maxW
  );
  configureRangeInput(
    qrXInput,
    QR_CONTROL_LIMITS.xMin,
    QR_CONTROL_LIMITS.xMax,
    layout.qr.x
  );
  configureRangeInput(
    qrYInput,
    QR_CONTROL_LIMITS.yMin,
    QR_CONTROL_LIMITS.yMax,
    layout.qr.y
  );
  configureRangeInput(
    qrSizeInput,
    QR_CONTROL_LIMITS.sizeMin,
    QR_CONTROL_LIMITS.sizeMax,
    layout.qr.maxW
  );
  configureRangeInput(
    assinatura2XInput,
    EXTRA_ASSINATURA_CONTROL_LIMITS.xMin,
    EXTRA_ASSINATURA_CONTROL_LIMITS.xMax,
    layout.assinatura2.x
  );
  configureRangeInput(
    assinatura2YInput,
    EXTRA_ASSINATURA_CONTROL_LIMITS.yMin,
    EXTRA_ASSINATURA_CONTROL_LIMITS.yMax,
    layout.assinatura2.y
  );
  configureRangeInput(
    assinatura2SizeInput,
    EXTRA_ASSINATURA_CONTROL_LIMITS.sizeMin,
    EXTRA_ASSINATURA_CONTROL_LIMITS.sizeMax,
    layout.assinatura2.maxW
  );
  configureRangeInput(
    assinatura3XInput,
    EXTRA_ASSINATURA_CONTROL_LIMITS.xMin,
    EXTRA_ASSINATURA_CONTROL_LIMITS.xMax,
    layout.assinatura3.x
  );
  configureRangeInput(
    assinatura3YInput,
    EXTRA_ASSINATURA_CONTROL_LIMITS.yMin,
    EXTRA_ASSINATURA_CONTROL_LIMITS.yMax,
    layout.assinatura3.y
  );
  configureRangeInput(
    assinatura3SizeInput,
    EXTRA_ASSINATURA_CONTROL_LIMITS.sizeMin,
    EXTRA_ASSINATURA_CONTROL_LIMITS.sizeMax,
    layout.assinatura3.maxW
  );
  configureRangeInput(
    selo1XInput,
    SELO_CONTROL_LIMITS.xMin,
    SELO_CONTROL_LIMITS.xMax,
    layout.selo1.x
  );
  configureRangeInput(
    selo1YInput,
    SELO_CONTROL_LIMITS.yMin,
    SELO_CONTROL_LIMITS.yMax,
    layout.selo1.y
  );
  configureRangeInput(
    selo1SizeInput,
    SELO_CONTROL_LIMITS.sizeMin,
    SELO_CONTROL_LIMITS.sizeMax,
    layout.selo1.maxW
  );
  configureRangeInput(
    selo2XInput,
    SELO_CONTROL_LIMITS.xMin,
    SELO_CONTROL_LIMITS.xMax,
    layout.selo2.x
  );
  configureRangeInput(
    selo2YInput,
    SELO_CONTROL_LIMITS.yMin,
    SELO_CONTROL_LIMITS.yMax,
    layout.selo2.y
  );
  configureRangeInput(
    selo2SizeInput,
    SELO_CONTROL_LIMITS.sizeMin,
    SELO_CONTROL_LIMITS.sizeMax,
    layout.selo2.maxW
  );
  configureRangeInput(
    selo3XInput,
    SELO_CONTROL_LIMITS.xMin,
    SELO_CONTROL_LIMITS.xMax,
    layout.selo3.x
  );
  configureRangeInput(
    selo3YInput,
    SELO_CONTROL_LIMITS.yMin,
    SELO_CONTROL_LIMITS.yMax,
    layout.selo3.y
  );
  configureRangeInput(
    selo3SizeInput,
    SELO_CONTROL_LIMITS.sizeMin,
    SELO_CONTROL_LIMITS.sizeMax,
    layout.selo3.maxW
  );
  configureRangeInput(
    selo4XInput,
    SELO_CONTROL_LIMITS.xMin,
    SELO_CONTROL_LIMITS.xMax,
    layout.selo4.x
  );
  configureRangeInput(
    selo4YInput,
    SELO_CONTROL_LIMITS.yMin,
    SELO_CONTROL_LIMITS.yMax,
    layout.selo4.y
  );
  configureRangeInput(
    selo4SizeInput,
    SELO_CONTROL_LIMITS.sizeMin,
    SELO_CONTROL_LIMITS.sizeMax,
    layout.selo4.maxW
  );
  configureRangeInput(
    instituicaoXInput,
    INSTITUICAO_CONTROL_LIMITS.xMin,
    INSTITUICAO_CONTROL_LIMITS.xMax,
    layout.instituicao.x
  );
  configureRangeInput(
    instituicaoYInput,
    INSTITUICAO_CONTROL_LIMITS.yMin,
    INSTITUICAO_CONTROL_LIMITS.yMax,
    layout.instituicao.y
  );
  configureRangeInput(
    instituicaoSizeInput,
    INSTITUICAO_CONTROL_LIMITS.sizeMin,
    INSTITUICAO_CONTROL_LIMITS.sizeMax,
    layout.instituicao.maxW
  );
}

function updateControlLabels() {
  if (logoXVal) logoXVal.textContent = `${layout.logo.x} px`;
  if (logoYVal) logoYVal.textContent = `${layout.logo.y} px`;
  if (logoSizeVal) logoSizeVal.textContent = `${layout.logo.maxW} px`;
  if (qrXVal) qrXVal.textContent = `${layout.qr.x} px`;
  if (qrYVal) qrYVal.textContent = `${layout.qr.y} px`;
  if (qrSizeVal) qrSizeVal.textContent = `${layout.qr.maxW} px`;
  if (assinaturaXVal) assinaturaXVal.textContent = `${layout.assinatura.x} px`;
  if (assinaturaYVal) assinaturaYVal.textContent = `${layout.assinatura.y} px`;
  if (assinaturaSizeVal) assinaturaSizeVal.textContent = `${layout.assinatura.maxW} px`;
  if (assinatura2XVal) assinatura2XVal.textContent = `${layout.assinatura2.x} px`;
  if (assinatura2YVal) assinatura2YVal.textContent = `${layout.assinatura2.y} px`;
  if (assinatura2SizeVal) assinatura2SizeVal.textContent = `${layout.assinatura2.maxW} px`;
  if (assinatura3XVal) assinatura3XVal.textContent = `${layout.assinatura3.x} px`;
  if (assinatura3YVal) assinatura3YVal.textContent = `${layout.assinatura3.y} px`;
  if (assinatura3SizeVal) assinatura3SizeVal.textContent = `${layout.assinatura3.maxW} px`;
  if (selo1XVal) selo1XVal.textContent = `${layout.selo1.x} px`;
  if (selo1YVal) selo1YVal.textContent = `${layout.selo1.y} px`;
  if (selo1SizeVal) selo1SizeVal.textContent = `${layout.selo1.maxW} px`;
  if (selo2XVal) selo2XVal.textContent = `${layout.selo2.x} px`;
  if (selo2YVal) selo2YVal.textContent = `${layout.selo2.y} px`;
  if (selo2SizeVal) selo2SizeVal.textContent = `${layout.selo2.maxW} px`;
  if (selo3XVal) selo3XVal.textContent = `${layout.selo3.x} px`;
  if (selo3YVal) selo3YVal.textContent = `${layout.selo3.y} px`;
  if (selo3SizeVal) selo3SizeVal.textContent = `${layout.selo3.maxW} px`;
  if (selo4XVal) selo4XVal.textContent = `${layout.selo4.x} px`;
  if (selo4YVal) selo4YVal.textContent = `${layout.selo4.y} px`;
  if (selo4SizeVal) selo4SizeVal.textContent = `${layout.selo4.maxW} px`;
  if (instituicaoXVal) instituicaoXVal.textContent = `${layout.instituicao.x} px`;
  if (instituicaoYVal) instituicaoYVal.textContent = `${layout.instituicao.y} px`;
  if (instituicaoSizeVal) instituicaoSizeVal.textContent = `${layout.instituicao.maxW} px`;
}

function setHidden(element, shouldHide) {
  if (!element) return;
  element.hidden = Boolean(shouldHide);
}

function syncAdvancedControlVisibility() {
  const activeSelos = SELO_SLOT_KEYS.filter((slotKey) => Boolean(getActiveSeloImage(slotKey)));
  const seloGroupBySlot = {
    selo1: selo1AdjustGroup,
    selo2: selo2AdjustGroup,
    selo3: selo3AdjustGroup,
    selo4: selo4AdjustGroup,
  };

  setHidden(logoAdjustFieldset, !getActiveLogoImage());
  setHidden(qrAdjustFieldset, false);
  setHidden(assinaturaAdjustFieldset, !isSignatureSlotActive("assinatura"));
  setHidden(assinatura2AdjustFieldset, !isSignatureSlotActive("assinatura2"));
  setHidden(assinatura3AdjustFieldset, !isSignatureSlotActive("assinatura3"));
  setHidden(selosAdjustFieldset, activeSelos.length === 0);
  SELO_SLOT_KEYS.forEach((slotKey) => {
    setHidden(seloGroupBySlot[slotKey], !activeSelos.includes(slotKey));
  });
  setHidden(instituicaoAdjustFieldset, !isInstitutionSlotActive());
  updatePreviewHotspots();
}

function applySeloLayoutFromControls(slotKey, xInput, yInput, sizeInput) {
  if (!layout[slotKey]) return;
  if (xInput) layout[slotKey].x = Number(xInput.value);
  if (yInput) layout[slotKey].y = Number(yInput.value);
  if (sizeInput) {
    layout[slotKey].maxW = Number(sizeInput.value);
    layout[slotKey].maxH = scaleHeightByWidth(layout[slotKey].maxW, seloAspectRatio);
  }
}

function applyLayoutFromControls() {
  if (isBatchRunning) return;
  if (logoXInput) layout.logo.x = Number(logoXInput.value);
  if (logoYInput) layout.logo.y = Number(logoYInput.value);
  if (logoSizeInput) {
    layout.logo.maxW = Number(logoSizeInput.value);
    layout.logo.maxH = scaleHeightByWidth(layout.logo.maxW, logoAspectRatio);
  }
  if (qrXInput) layout.qr.x = Number(qrXInput.value);
  if (qrYInput) layout.qr.y = Number(qrYInput.value);
  if (qrSizeInput) {
    layout.qr.maxW = Number(qrSizeInput.value);
    layout.qr.maxH = Number(qrSizeInput.value);
  }
  if (assinaturaXInput) layout.assinatura.x = Number(assinaturaXInput.value);
  if (assinaturaYInput) layout.assinatura.y = Number(assinaturaYInput.value);
  if (assinaturaSizeInput) {
    layout.assinatura.maxW = Number(assinaturaSizeInput.value);
    layout.assinatura.maxH = scaleHeightByWidth(
      layout.assinatura.maxW,
      assinaturaAspectRatio
    );
  }
  if (assinatura2XInput) layout.assinatura2.x = Number(assinatura2XInput.value);
  if (assinatura2YInput) layout.assinatura2.y = Number(assinatura2YInput.value);
  if (assinatura2SizeInput) {
    layout.assinatura2.maxW = Number(assinatura2SizeInput.value);
    layout.assinatura2.maxH = scaleHeightByWidth(
      layout.assinatura2.maxW,
      assinaturaAspectRatio
    );
  }
  if (assinatura3XInput) layout.assinatura3.x = Number(assinatura3XInput.value);
  if (assinatura3YInput) layout.assinatura3.y = Number(assinatura3YInput.value);
  if (assinatura3SizeInput) {
    layout.assinatura3.maxW = Number(assinatura3SizeInput.value);
    layout.assinatura3.maxH = scaleHeightByWidth(
      layout.assinatura3.maxW,
      assinaturaAspectRatio
    );
  }
  applySeloLayoutFromControls("selo1", selo1XInput, selo1YInput, selo1SizeInput);
  applySeloLayoutFromControls("selo2", selo2XInput, selo2YInput, selo2SizeInput);
  applySeloLayoutFromControls("selo3", selo3XInput, selo3YInput, selo3SizeInput);
  applySeloLayoutFromControls("selo4", selo4XInput, selo4YInput, selo4SizeInput);
  if (instituicaoXInput) layout.instituicao.x = Number(instituicaoXInput.value);
  if (instituicaoYInput) layout.instituicao.y = Number(instituicaoYInput.value);
  if (instituicaoSizeInput) {
    layout.instituicao.maxW = Number(instituicaoSizeInput.value);
    layout.instituicao.maxH = scaleHeightByWidth(
      layout.instituicao.maxW,
      instituicaoAspectRatio
    );
  }

  updateControlLabels();
  syncAdvancedControlVisibility();
  void renderLastCertificate();
}

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
  const linha1 =
    sanitizeText(textoLinha1Input ? textoLinha1Input.value : "") || defaultTextoLinha1;
  const linha2 =
    sanitizeText(textoLinha2Input ? textoLinha2Input.value : "") || defaultTextoLinha2;
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
  drawAdaptiveCenteredText(curso, centerX, 510, {
    family: "Georgia",
    style: "italic",
    startSize: 46,
    minSize: 24,
    maxWidth: maxTextWidth,
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
    alert(error.message);
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

function setBatchStatus(message, type = "info") {
  if (!batchStatus) return;

  if (!message) {
    batchStatus.textContent = "";
    batchStatus.className = "status";
    return;
  }

  batchStatus.textContent = message;
  batchStatus.className = `status ${type}`;
}

function normalizeHeader(value) {
  return sanitizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function resolveCanonicalField(rawHeader) {
  const normalized = normalizeHeader(rawHeader);
  for (const [field, aliases] of Object.entries(fieldAliases)) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}

function hasSpreadsheetDateValue(value) {
  if (value instanceof Date) return true;
  if (typeof value === "number") return Number.isFinite(value);
  return sanitizeText(value) !== "";
}

function normalizeSpreadsheetDateResult(value) {
  const hasValue = hasSpreadsheetDateValue(value);

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { value: toDateInputValue(value), invalid: false };
  }

  if (
    typeof value === "number" &&
    window.XLSX &&
    window.XLSX.SSF &&
    typeof window.XLSX.SSF.parse_date_code === "function"
  ) {
    const parsed = window.XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return {
        value: `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`,
        invalid: false,
      };
    }
  }

  const text = sanitizeText(value);
  if (!text) return { value: "", invalid: false };

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { value: `${iso[1]}-${iso[2]}-${iso[3]}`, invalid: false };

  const br = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (br) return { value: `${br[3]}-${pad2(br[2])}-${pad2(br[1])}`, invalid: false };

  const ymd = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (ymd) return { value: `${ymd[1]}-${pad2(ymd[2])}-${pad2(ymd[3])}`, invalid: false };

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return { value: toDateInputValue(parsed), invalid: false };
  }

  return { value: "", invalid: hasValue };
}

function normalizeSpreadsheetDate(value) {
  return normalizeSpreadsheetDateResult(value).value;
}

function formatInvalidSpreadsheetDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  const text = sanitizeText(value);
  return text ? `"${text}"` : "valor nao reconhecido";
}

function normalizeCargaHorariaResult(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.trunc(value);
    return {
      value: rounded >= 0 && rounded <= MAX_CARGA_HORARIA ? rounded : null,
      invalid: rounded < 0 || rounded > MAX_CARGA_HORARIA,
    };
  }

  const text = sanitizeText(value);
  if (!text) return { value: null, invalid: false };

  const match = text.match(/^(\d{1,4})(?:\s*h(?:oras?)?)?$/i);
  if (!match) {
    return { value: null, invalid: true };
  }

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_CARGA_HORARIA) {
    return { value: null, invalid: true };
  }

  return { value: parsed, invalid: false };
}

function getFormCargaHorariaResult() {
  return normalizeCargaHorariaResult(cargaHInput ? cargaHInput.value : "");
}

function getFormCargaHorariaError() {
  const result = getFormCargaHorariaResult();
  if (!result.invalid) return "";
  return `A carga horária deve estar entre 0 e ${MAX_CARGA_HORARIA} horas.`;
}

function formatInvalidCargaHoraria(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  const text = sanitizeText(value);
  return text ? `"${text}"` : "valor nao reconhecido";
}

function sanitizeFileName(text, fallback) {
  const normalized = sanitizeText(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function isRowEmpty(row) {
  const values = Array.isArray(row) ? row : Object.values(row || {});
  return values.every((value) => sanitizeText(value) === "");
}

function extractSingleCellValue(row) {
  const values = (Array.isArray(row) ? row : Object.values(row || {}))
    .map((value) => normalizeParticipantName(value))
    .filter((value) => value.length > 0);

  return values.length === 1 ? values[0] : "";
}

function normalizeParticipantName(value) {
  const text = sanitizeText(value);
  if (!text) return "";

  const withoutLeadingNoise = text.replace(/^[^\p{L}\p{N}]+/u, "");
  return withoutLeadingNoise.replace(/\s+/g, " ").trim();
}

function buildFullName(firstName, lastName) {
  const first = normalizeParticipantName(firstName);
  const last = normalizeParticipantName(lastName);

  if (!first && !last) return "";
  if (!first) return last;
  if (!last) return first;

  const firstLower = first.toLowerCase();
  const lastLower = last.toLowerCase();
  if (firstLower === lastLower || firstLower.endsWith(` ${lastLower}`)) {
    return first;
  }

  return `${first} ${last}`;
}

function mapRowToCertificate(row, rowNumber, defaults = {}, options = {}) {
  const allowSingleCellFallback = options.allowSingleCellFallback !== false;
  const mapped = {};

  Object.entries(row).forEach(([header, value]) => {
    const field = resolveCanonicalField(header);
    if (!field) return;
    if (mapped[field] === undefined || mapped[field] === "") {
      mapped[field] = value;
    }
  });

  const defaultCurso = sanitizeText(defaults.curso);
  const defaultData = normalizeSpreadsheetDate(defaults.data);
  const defaultCargaHoraria = normalizeCargaHorariaResult(defaults.carga_h).value;
  const defaultLinha1 = sanitizeText(defaults.linha1) || defaultTextoLinha1;
  const defaultLinha2 = sanitizeText(defaults.linha2) || defaultTextoLinha2;

  const nome =
    buildFullName(mapped.nome, mapped.sobrenome) ||
    (allowSingleCellFallback ? extractSingleCellValue(row) : "");
  const curso = sanitizeText(mapped.curso) || defaultCurso;
  const mappedDateResult = normalizeSpreadsheetDateResult(mapped.data);
  if (mappedDateResult.invalid) {
    return {
      error: `linha ${rowNumber} (data invalida: ${formatInvalidSpreadsheetDate(mapped.data)})`,
    };
  }
  const data = mappedDateResult.value || defaultData;
  const mappedCargaHoraria = normalizeCargaHorariaResult(mapped.carga_h);
  if (mappedCargaHoraria.invalid) {
    return {
      error: `linha ${rowNumber} (carga horaria invalida: ${formatInvalidCargaHoraria(mapped.carga_h)})`,
    };
  }
  const carga_h = mappedCargaHoraria.value ?? defaultCargaHoraria ?? 0;

  const missingFields = [];
  if (!nome) missingFields.push("nome");
  if (!curso) missingFields.push("curso");
  if (!data) missingFields.push("data");

  if (missingFields.length > 0) {
    return { error: `linha ${rowNumber} (faltando: ${missingFields.join(", ")})` };
  }

  const linha1 = sanitizeText(mapped.linha1) || defaultLinha1;
  const linha2 = sanitizeText(mapped.linha2) || defaultLinha2;
  const arquivoBase =
    sanitizeText(mapped.arquivo) ||
    `${String(rowNumber).padStart(4, "0")}_${sanitizeFileName(nome, "aluno")}`;
  const fileName = `${sanitizeFileName(arquivoBase, `certificado_${rowNumber}`)}.png`;

  return { rowNumber, nome, curso, data, codigo: "", carga_h, linha1, linha2, fileName };
}

function buildSyntheticHeaders(columnCount) {
  const total = Math.max(1, Number(columnCount) || 1);
  return Array.from({ length: total }, (_value, index) => `coluna_${index + 1}`);
}

function buildRowObject(headers, rowValues) {
  const values = Array.isArray(rowValues) ? rowValues : Object.values(rowValues || {});
  const row = {};

  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });

  return row;
}

function collectRecognizedHeaderFields(rowValues) {
  const values = Array.isArray(rowValues) ? rowValues : Object.values(rowValues || {});
  const fields = [];

  values.forEach((value) => {
    const field = resolveCanonicalField(value);
    if (field && !fields.includes(field)) {
      fields.push(field);
    }
  });

  return fields;
}

function getSpreadsheetRowValues(rowEntry) {
  if (Array.isArray(rowEntry)) return rowEntry;
  if (rowEntry && Array.isArray(rowEntry.values)) return rowEntry.values;
  return Object.values(rowEntry || {});
}

function getSpreadsheetRowNumber(rowEntry, fallbackIndex) {
  if (rowEntry && Number.isInteger(rowEntry.rowNumber)) {
    return rowEntry.rowNumber;
  }
  return fallbackIndex + 1;
}

function detectSpreadsheetHeaderRow(rawRows) {
  const scanLimit = Math.min(rawRows.length, 10);
  let bestMatch = null;

  for (let index = 0; index < scanLimit; index += 1) {
    const rowValues = getSpreadsheetRowValues(rawRows[index]);
    if (isRowEmpty(rowValues)) continue;

    const fields = collectRecognizedHeaderFields(rowValues);
    if (!fields.length) continue;

    const hasNome = fields.includes("nome");
    const score = fields.length + (hasNome ? 3 : 0);

    if (
      !bestMatch ||
      score > bestMatch.score ||
      (score === bestMatch.score && hasNome && !bestMatch.hasNome)
    ) {
      bestMatch = {
        index,
        score,
        hasNome,
        headers: rowValues.map((value, headerIndex) => {
          const text = sanitizeText(value);
          return text || `coluna_${headerIndex + 1}`;
        }),
      };
    }
  }

  if (!bestMatch) {
    const maxColumns = rawRows.reduce((max, row) => {
      const values = getSpreadsheetRowValues(row);
      return Math.max(max, values.length);
    }, 0);

    return {
      index: -1,
      rowNumber: null,
      headers: buildSyntheticHeaders(maxColumns),
    };
  }

  return {
    index: bestMatch.index,
    rowNumber: bestMatch.index + 1,
    headers: bestMatch.headers,
  };
}

function detectCsvDelimiter(headerLine) {
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsvLine(line, delimiter) {
  const result = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === "\"") {
      if (insideQuotes && nextChar === "\"") {
        value += "\"";
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      result.push(value);
      value = "";
      continue;
    }

    value += char;
  }

  result.push(value);
  return result;
}

function parseCsvRows(text) {
  const normalizedText = text.replace(/^\uFEFF/, "");
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0);

  if (!lines.length) return [];

  const delimiter = detectCsvDelimiter(lines[0]);
  return lines.map((line, index) => ({
    rowNumber: index + 1,
    values: parseCsvLine(line, delimiter).map((item) => item.trim()),
  }));
}

function isSpreadsheetRowHidden(sheet, rowIndex) {
  const rowMetadata = Array.isArray(sheet && sheet["!rows"]) ? sheet["!rows"] : null;
  if (!rowMetadata || !rowMetadata[rowIndex]) return false;
  return Boolean(rowMetadata[rowIndex].hidden);
}

function normalizeZipEntryPath(path) {
  const normalized = String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) return "";
  return normalized.startsWith("xl/") ? normalized : `xl/${normalized}`;
}

async function readHiddenXlsxRows(bytes, sheetIndex = 0) {
  if (!window.JSZip || typeof DOMParser === "undefined") {
    return new Set();
  }

  const zip = await window.JSZip.loadAsync(bytes);
  const workbookEntry = zip.file("xl/workbook.xml");
  const workbookRelsEntry = zip.file("xl/_rels/workbook.xml.rels");
  if (!workbookEntry || !workbookRelsEntry) {
    return new Set();
  }

  const parser = new DOMParser();
  const workbookXml = await workbookEntry.async("string");
  const workbookDoc = parser.parseFromString(workbookXml, "application/xml");
  const sheetNodes = Array.from(workbookDoc.getElementsByTagName("sheet"));
  const targetSheet = sheetNodes[sheetIndex];
  if (!targetSheet) {
    return new Set();
  }

  const relId =
    targetSheet.getAttribute("r:id") ||
    targetSheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
  if (!relId) {
    return new Set();
  }

  const relsXml = await workbookRelsEntry.async("string");
  const relsDoc = parser.parseFromString(relsXml, "application/xml");
  const relationshipNodes = Array.from(relsDoc.getElementsByTagName("Relationship"));
  const relationship = relationshipNodes.find((node) => node.getAttribute("Id") === relId);
  if (!relationship) {
    return new Set();
  }

  const sheetPath = normalizeZipEntryPath(relationship.getAttribute("Target"));
  const sheetEntry = zip.file(sheetPath);
  if (!sheetEntry) {
    return new Set();
  }

  const sheetXml = await sheetEntry.async("string");
  const sheetDoc = parser.parseFromString(sheetXml, "application/xml");
  const rowNodes = Array.from(sheetDoc.getElementsByTagName("row"));
  const hiddenRows = new Set();

  rowNodes.forEach((rowNode) => {
    const isHidden = rowNode.getAttribute("hidden");
    const rowNumber = Number.parseInt(rowNode.getAttribute("r") || "", 10);
    if ((isHidden === "1" || isHidden === "true") && Number.isFinite(rowNumber)) {
      hiddenRows.add(rowNumber);
    }
  });

  return hiddenRows;
}

async function readSpreadsheetRows(file) {
  const fileName = (file.name || "").toLowerCase();
  if (fileName.endsWith(".csv")) {
    const csvText = await file.text();
    return parseCsvRows(csvText);
  }

  if (!window.XLSX) {
    throw new Error("Biblioteca de planilha indisponível.");
  }

  const bytes = await file.arrayBuffer();
  const workbook = window.XLSX.read(bytes, {
    type: "array",
    cellDates: true,
    cellStyles: true,
  });
  if (!workbook.SheetNames || !workbook.SheetNames.length) return [];

  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const rangeRef = firstSheet["!ref"];
  if (!rangeRef) return [];

  const range = window.XLSX.utils.decode_range(rangeRef);
  let hiddenRows = new Set();
  if (fileName.endsWith(".xlsx")) {
    try {
      hiddenRows = await readHiddenXlsxRows(bytes, 0);
    } catch (error) {
      console.warn("Nao foi possivel ler linhas ocultas da planilha.", error);
    }
  }
  const rows = [];

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    if (hiddenRows.has(rowIndex + 1) || isSpreadsheetRowHidden(firstSheet, rowIndex)) {
      continue;
    }

    const values = [];
    let hasContent = false;

    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const cellAddress = window.XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = firstSheet[cellAddress];
      let value = "";

      if (cell) {
        if (cell.t === "d" && cell.v instanceof Date) {
          value = cell.v;
        } else if (cell.w !== undefined && cell.w !== null && cell.w !== "") {
          value = cell.w;
        } else if (cell.v !== undefined && cell.v !== null) {
          value = cell.v;
        }
      }

      values.push(value);
      if (sanitizeText(value) !== "") {
        hasContent = true;
      }
    }

    if (hasContent) {
      rows.push({
        rowNumber: rowIndex + 1,
        values,
      });
    }
  }

  return rows;
}

function canvasToPngBlob() {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error("Canvas não disponível."));
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Não foi possível converter o certificado para PNG."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
}

function buildIgnoredRowsSummary(invalidRows, limit = 5) {
  if (!Array.isArray(invalidRows) || !invalidRows.length) return "";

  const preview = invalidRows.slice(0, limit).join(", ");
  const suffix = invalidRows.length > limit ? ", ..." : "";
  return `${invalidRows.length} linha(s) serao ignorada(s): ${preview}${suffix}.`;
}

function setBatchButtonsDisabled(disabled) {
  if (batchPreviewBtn) batchPreviewBtn.disabled = disabled;
  if (batchGenerateBtn) batchGenerateBtn.disabled = disabled;
  syncGenerateSubmitButton();
}

function syncGenerateSubmitButton() {
  if (!generateSubmitBtn) return;
  generateSubmitBtn.disabled = isBatchRunning || isSingleGenerationRunning;
  generateSubmitBtn.textContent = isSingleGenerationRunning
    ? "Gerando..."
    : "Gerar Certificado";
}

function getBatchDefaults() {
  return {
    curso: (() => {
      const input = document.getElementById("curso");
      return input ? input.value : "";
    })(),
    data: (() => {
      const input = document.getElementById("data");
      return input ? input.value : "";
    })(),
    carga_h: (() => {
      const input = cargaHInput;
      return input ? input.value : "";
    })(),
    linha1: textoLinha1Input ? textoLinha1Input.value : defaultTextoLinha1,
    linha2: textoLinha2Input ? textoLinha2Input.value : defaultTextoLinha2,
  };
}

function resetBatchPreview() {
  if (batchPreviewPanel) batchPreviewPanel.hidden = true;
  if (batchPreviewSummary) {
    batchPreviewSummary.textContent = "Selecione uma planilha e clique em Pré-visualizar.";
  }
  if (batchPreviewBody) {
    batchPreviewBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Nenhuma prévia carregada.</td>
      </tr>
    `;
  }
}

function renderBatchPreview(prepared) {
  if (!batchPreviewPanel || !batchPreviewSummary || !batchPreviewBody) return;

  batchPreviewPanel.hidden = false;

  const summaryParts = [
    `${prepared.fileName}: ${prepared.nonEmptyRows} linha(s) preenchida(s)`,
    `${prepared.certificates.length} válida(s)`,
  ];
  if (prepared.headerRowNumber) {
    summaryParts.push(`cabecalho detectado na linha ${prepared.headerRowNumber}`);
  }
  if (prepared.invalidRows.length) {
    summaryParts.push(`${prepared.invalidRows.length} ignorada(s)`);
  }
  if (prepared.skippedEmptyRows) {
    summaryParts.push(`${prepared.skippedEmptyRows} vazia(s) ignorada(s)`);
  }
  batchPreviewSummary.textContent = `${summaryParts.join(", ")}. Exibindo até 5 registro(s).`;

  batchPreviewBody.innerHTML = "";

  if (!prepared.previewItems.length) {
    batchPreviewBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Nenhuma linha válida disponível para pré-visualização.</td>
      </tr>
    `;
    return;
  }

  prepared.previewItems.forEach((item) => {
    const row = document.createElement("tr");

    const lineCell = document.createElement("td");
    lineCell.textContent = String(item.rowNumber || "-");

    const nameCell = document.createElement("td");
    nameCell.textContent = item.nome || "-";

    const courseCell = document.createElement("td");
    courseCell.textContent = item.curso || "-";

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.data);

    const cargaCell = document.createElement("td");
    cargaCell.textContent = `${item.carga_h || 0}h`;

    const fileCell = document.createElement("td");
    fileCell.textContent = item.fileName || "-";

    row.append(lineCell, nameCell, courseCell, dateCell, cargaCell, fileCell);
    batchPreviewBody.appendChild(row);
  });
}

async function prepareBatchCertificates(file) {
  const isCsvFile = (file.name || "").toLowerCase().endsWith(".csv");
  if (!isCsvFile && !window.XLSX) {
    throw new Error("Falha: biblioteca de planilha não carregou.");
  }

  const rawRows = await readSpreadsheetRows(file);
  if (!rawRows.length) {
    throw new Error("A planilha está vazia.");
  }

  const batchDefaults = getBatchDefaults();
  const defaultCargaResult = normalizeCargaHorariaResult(batchDefaults.carga_h);
  if (defaultCargaResult.invalid) {
    throw new Error(
      `A carga horária do formulário deve estar entre 0 e ${MAX_CARGA_HORARIA} horas.`
    );
  }
  const certificates = [];
  const invalidRows = [];
  const headerInfo = detectSpreadsheetHeaderRow(rawRows);
  const dataStartIndex = headerInfo.index >= 0 ? headerInfo.index + 1 : 0;
  const headers = headerInfo.headers;
  let nonEmptyRows = 0;
  let skippedEmptyRows = 0;

  for (let index = dataStartIndex; index < rawRows.length; index += 1) {
    const rowEntry = rawRows[index];
    const rowValues = getSpreadsheetRowValues(rowEntry);
    const rowNumber = getSpreadsheetRowNumber(rowEntry, index);
    if (isRowEmpty(rowValues)) {
      skippedEmptyRows += 1;
      continue;
    }

    nonEmptyRows += 1;
    const row = buildRowObject(headers, rowValues);
    const item = mapRowToCertificate(row, rowNumber, batchDefaults, {
      allowSingleCellFallback: headerInfo.index < 0,
    });
    if (item.error) {
      invalidRows.push(item.error);
      continue;
    }
    certificates.push(item);
  }

  return {
    fileName: file.name || "planilha",
    certificates,
    invalidRows,
    ignoredRows: invalidRows,
    nonEmptyRows,
    skippedEmptyRows,
    headerRowNumber: headerInfo.rowNumber,
    previewItems: certificates.slice(0, 5),
  };
}

function openBatchConfirmDialog(prepared) {
  const total = prepared.certificates.length;
  const ignoredCount = prepared.invalidRows.length;
  const moldeInfo = assets.template
    ? " O molde temporario carregado no formulario tambem sera aplicado em todos os certificados deste lote."
    : savedTemplate
      ? ` O modelo ${savedTemplate.nome} da secretaria ativa tambem sera aplicado neste lote.`
      : "";
  const ignoredInfo = ignoredCount
    ? ` ${ignoredCount} linha(s) com problema serao ignorada(s).`
    : "";
  const summary = `${total} certificado(s) serao gerado(s), terao os PNGs salvos no servidor e um arquivo ZIP sera baixado neste navegador.${ignoredInfo}${moldeInfo}`;

  if (
    !batchConfirmDialog ||
    !batchConfirmForm ||
    typeof batchConfirmDialog.showModal !== "function"
  ) {
    if (window.confirm(`${prepared.fileName}\n\n${summary}`)) {
      void executeBatchGeneration(prepared);
    }
    return;
  }

  pendingBatchGeneration = prepared;

  if (batchConfirmMessage) {
    batchConfirmMessage.textContent = `Confirme a geração do lote da planilha ${prepared.fileName}.`;
  }
  if (batchConfirmSummary) {
    batchConfirmSummary.textContent = summary;
  }
  setBatchConfirmStatus("", "info");
  if (batchConfirmDialog.open) {
    batchConfirmDialog.close();
  }
  batchConfirmDialog.showModal();
}

async function executeBatchGeneration(prepared) {
  if (!prepared || !Array.isArray(prepared.certificates) || !prepared.certificates.length) {
    setBatchStatus("Nenhum lote preparado para geração.", "error");
    return;
  }

  if (!window.JSZip) {
    setBatchStatus("Falha: biblioteca ZIP não carregou.", "error");
    return;
  }

  isBatchRunning = true;
  setBatchButtonsDisabled(true);
  const previousLastData = lastData ? { ...lastData } : null;
  let unresolvedCertificates = new Map();

  try {
    const certificates = prepared.certificates.map((item) => ({ ...item }));
    const failedUploads = [];
    const successfulCertificates = [];
    const discardedCertificates = [];

    setBatchStatus("Registrando lote no backend...", "info");
    const registered = await registerBatchCertificates(certificates);
    if (!Array.isArray(registered) || registered.length !== certificates.length) {
      throw new Error(
        "A API retornou quantidade inesperada de certificados. Tente novamente."
      );
    }

    certificates.forEach((cert, index) => {
      cert.codigo = sanitizeText(registered[index].codigo).toUpperCase();
      cert.qrText = sanitizeText(registered[index].url_validacao);
    });
    unresolvedCertificates = new Map(
      certificates.map((cert) => [sanitizeText(cert.codigo).toUpperCase(), cert])
    );

    const zip = new window.JSZip();

    for (let index = 0; index < certificates.length; index += 1) {
      const cert = certificates[index];
      setBatchStatus(`Gerando ${index + 1}/${certificates.length}: ${cert.nome}`, "info");

      await drawCertificate(
        cert.nome,
        cert.curso,
        cert.data,
        cert.linha1,
        cert.linha2,
        cert.qrText,
        cert.codigo,
        cert.carga_h || 0
      );

      const pngBlob = await canvasToPngBlob();
      try {
        ensureCertificatePngWithinLimit(pngBlob, cert.codigo);
      } catch (error) {
        const cleanupResult = await tryDiscardPendingCertificate(cert.codigo);
        failedUploads.push({
          codigo: cert.codigo,
          nome: cert.nome,
          message: error && error.message ? error.message : "PNG acima do limite permitido.",
          discarded: cleanupResult.discarded,
          cleanupMessage: cleanupResult.message,
        });
        if (cleanupResult.discarded) {
          discardedCertificates.push(cert);
          unresolvedCertificates.delete(cert.codigo);
        }
        continue;
      }

      setBatchStatus(
        `Salvando ${index + 1}/${certificates.length} no servidor: ${cert.nome}`,
        "info"
      );
      try {
        await uploadCertificateImage(cert.codigo, pngBlob, cert.fileName);
        zip.file(cert.fileName, pngBlob);
        successfulCertificates.push(cert);
        unresolvedCertificates.delete(cert.codigo);
      } catch (error) {
        if (error && error.status === 401) {
          throw error;
        }
        console.error(error);
        const cleanupResult = await tryDiscardPendingCertificate(cert.codigo);
        failedUploads.push({
          codigo: cert.codigo,
          nome: cert.nome,
          message: error && error.message ? error.message : "Falha no upload do PNG.",
          discarded: cleanupResult.discarded,
          cleanupMessage: cleanupResult.message,
        });
        if (cleanupResult.discarded) {
          discardedCertificates.push(cert);
          unresolvedCertificates.delete(cert.codigo);
        }
      }
    }

    if (unresolvedCertificates.size) {
      const cleanupSummary = await cleanupPendingCertificates(
        Array.from(unresolvedCertificates.values())
      );
      cleanupSummary.discarded.forEach(({ cert, message }) => {
        const previousIndex = failedUploads.findIndex((item) => item.codigo === cert.codigo);
        if (previousIndex >= 0) {
          failedUploads.splice(previousIndex, 1);
        }
        discardedCertificates.push(cert);
        failedUploads.push({
          codigo: cert.codigo,
          nome: cert.nome,
          message: "PNG nao foi concluido durante a geracao do lote.",
          discarded: true,
          cleanupMessage: message,
        });
        unresolvedCertificates.delete(cert.codigo);
      });
      cleanupSummary.failed.forEach(({ cert, message }) => {
        const previousIndex = failedUploads.findIndex((item) => item.codigo === cert.codigo);
        if (previousIndex >= 0) {
          failedUploads.splice(previousIndex, 1);
        }
        failedUploads.push({
          codigo: cert.codigo,
          nome: cert.nome,
          message: "PNG nao foi concluido durante a geracao do lote.",
          discarded: false,
          cleanupMessage: message,
        });
      });
    }

    if (successfulCertificates.length) {
      setBatchStatus("Compactando certificados em ZIP...", "info");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipName = `certificados_lote_${buildTimestamp()}.zip`;
      downloadBlob(zipBlob, zipName);
    }

    if (!previousLastData && successfulCertificates.length) {
      const lastGenerated = successfulCertificates[successfulCertificates.length - 1];
      lastData = {
        nome: lastGenerated.nome,
        curso: lastGenerated.curso,
        data: lastGenerated.data,
        cargaH: lastGenerated.carga_h || 0,
        codigo: lastGenerated.codigo,
        linha1: lastGenerated.linha1,
        linha2: lastGenerated.linha2,
        qrText: lastGenerated.qrText,
      };
      downloadBtn.disabled = false;
    }

    const ignoredCount = prepared.invalidRows.length;
    const ignoredSummary = buildIgnoredRowsSummary(prepared.invalidRows);
    if (failedUploads.length) {
      const preview = failedUploads
        .slice(0, 3)
        .map((item) => {
          const detail = item.discarded
            ? "descartado automaticamente"
            : summarizePngFailure(item.message);
          return `${item.codigo} (${detail})`;
        })
        .join(", ");
      const suffix = failedUploads.length > 3 ? ", ..." : "";
      const unresolvedCount = failedUploads.filter((item) => !item.discarded).length;
      const ignoredPreview = ignoredCount ? ` ${ignoredSummary}` : "";
      setBatchStatus(
        `Lote concluido com ressalvas: ${successfulCertificates.length} certificado(s) foram concluido(s) e incluidos no ZIP. ${discardedCertificates.length} certificado(s) foram descartado(s) automaticamente apos falha no PNG.${unresolvedCount ? ` ${unresolvedCount} pendente(s) nao puderam ser descartado(s) automaticamente.` : ""} Verifique: ${preview}${suffix}.${ignoredPreview}`,
        "error"
      );
    } else {
      const ignoredPreview = ignoredCount ? ` ${ignoredSummary}` : "";
      setBatchStatus(
        `Lote concluido: ${successfulCertificates.length} certificado(s) foram gerado(s), salvos no servidor e incluidos no ZIP com sucesso.${ignoredPreview}`,
        "success"
      );
    }
    await loadCertificates(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setBatchStatus(error.message || "Falha ao gerar lote.", "error");
  } finally {
    if (previousLastData) {
      lastData = previousLastData;
      await renderLastCertificate();
    }

    setBatchButtonsDisabled(false);
    isBatchRunning = false;
  }
}

async function handleBatchPreview() {
  if (!planilhaInput) return;
  if (isBatchRunning) return;
  if (!sessionState) {
    await handleUnauthorized();
    return;
  }

  const cargaError = getFormCargaHorariaError();
  if (cargaError) {
    setBatchStatus(cargaError, "error");
    resetBatchPreview();
    if (cargaHInput && typeof cargaHInput.reportValidity === "function") {
      cargaHInput.reportValidity();
    }
    return;
  }

  const file = planilhaInput.files && planilhaInput.files[0];
  if (!file) {
    setBatchStatus("Selecione uma planilha antes de pré-visualizar.", "error");
    resetBatchPreview();
    return;
  }

  try {
    setBatchStatus("Lendo planilha para pré-visualização...", "info");
    const prepared = await prepareBatchCertificates(file);
    renderBatchPreview(prepared);
    if (prepared.invalidRows.length) {
      const ignoredSummary = buildIgnoredRowsSummary(prepared.invalidRows);
      setBatchStatus(
        `Previa pronta: ${prepared.certificates.length} linha(s) valida(s). ${ignoredSummary}`,
        prepared.certificates.length ? "info" : "error"
      );
      return;
    }
    setBatchStatus(
      `Prévia pronta: ${prepared.certificates.length} certificado(s) válido(s) em ${prepared.fileName}.`,
      "success"
    );
  } catch (error) {
    console.error(error);
    setBatchStatus(error.message || "Falha ao pré-visualizar a planilha.", "error");
    resetBatchPreview();
  }
}

async function handleBatchGenerate() {
  if (!planilhaInput || !batchGenerateBtn) return;
  if (isBatchRunning) return;
  if (!sessionState) {
    await handleUnauthorized();
    return;
  }

  const cargaError = getFormCargaHorariaError();
  if (cargaError) {
    setBatchStatus(cargaError, "error");
    resetBatchPreview();
    if (cargaHInput && typeof cargaHInput.reportValidity === "function") {
      cargaHInput.reportValidity();
    }
    return;
  }

  const file = planilhaInput.files && planilhaInput.files[0];
  if (!file) {
    setBatchStatus("Selecione uma planilha antes de gerar o lote.", "error");
    resetBatchPreview();
    return;
  }

  try {
    setBatchStatus("Validando planilha antes da geração...", "info");
    if (!window.JSZip) {
      throw new Error("Falha: biblioteca ZIP não carregou.");
    }
    const prepared = await prepareBatchCertificates(file);
    renderBatchPreview(prepared);

    if (!prepared.certificates.length) {
      throw new Error("Nenhuma linha valida encontrada para gerar certificados.");
    }

    if (prepared.invalidRows.length) {
      const ignoredSummary = buildIgnoredRowsSummary(prepared.invalidRows);
      setBatchStatus(
        `Lote validado: ${prepared.certificates.length} certificado(s) pronto(s) para geracao. ${ignoredSummary}`,
        "info"
      );
    } else {
      setBatchStatus(
        `Lote validado: ${prepared.certificates.length} certificado(s) pronto(s) para confirmacao.`,
        "info"
      );
    }
    openBatchConfirmDialog(prepared);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setBatchStatus(error.message || "Falha ao validar o lote.", "error");
  }
}
