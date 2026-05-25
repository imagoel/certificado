
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

function resetPreviewLayoutDefaults() {
  if (isBatchRunning) return;

  Object.assign(layout.logo, DEFAULT_LOGO_LAYOUT);
  Object.assign(layout.assinatura, DEFAULT_ASSINATURA_LAYOUT);
  Object.assign(layout.assinatura2, DEFAULT_ASSINATURA2_LAYOUT);
  Object.assign(layout.assinatura3, DEFAULT_ASSINATURA3_LAYOUT);
  Object.assign(layout.instituicao, DEFAULT_INSTITUICAO_LAYOUT);
  Object.assign(layout.selo1, DEFAULT_SELO_LAYOUTS.selo1);
  Object.assign(layout.selo2, DEFAULT_SELO_LAYOUTS.selo2);
  Object.assign(layout.selo3, DEFAULT_SELO_LAYOUTS.selo3);
  Object.assign(layout.selo4, DEFAULT_SELO_LAYOUTS.selo4);
  Object.assign(layout.qr, DEFAULT_QR_LAYOUT);

  syncAdvancedAssetControls();
  updateControlLabels();
  syncAdvancedControlVisibility();
  setPreviewAdjustStatus("Posições restauradas.");
  void renderLastCertificate();
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
