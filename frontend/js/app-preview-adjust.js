function getPreviewAdjustTargetLabel(target) {
  if (target === "logo") return "Logo";
  if (target === "qr") return "QR Code";
  if (target === "assinaturaImage") return "Imagem da assinatura";
  if (target === "assinatura") return "Assinatura";
  if (target === "assinatura2Image") return "Imagem da assinatura 2";
  if (target === "assinatura2") return "Assinatura 2";
  if (target === "assinatura3Image") return "Imagem da assinatura 3";
  if (target === "assinatura3") return "Assinatura 3";
  if (target === "instituicao") return "Instituicao";
  if (isSeloSlot(target)) return `Selo ${getSeloSlotNumber(target)}`;
  return "Item";
}

function getPreviewHotspotLabel(target) {
  return isSignatureImagePreviewTarget(target) ? "Imagem" : getPreviewAdjustTargetLabel(target);
}

function getPreviewAdjustTargetControlElement(target) {
  if (target === "logo") return logoAdjustFieldset;
  if (target === "qr") return qrAdjustFieldset;
  if (target === "assinatura") return assinaturaAdjustFieldset;
  if (target === "assinatura2") return assinatura2AdjustFieldset;
  if (target === "assinatura3") return assinatura3AdjustFieldset;
  if (target === "instituicao") return instituicaoAdjustFieldset;
  if (target === "selo1") return selo1AdjustGroup;
  if (target === "selo2") return selo2AdjustGroup;
  if (target === "selo3") return selo3AdjustGroup;
  if (target === "selo4") return selo4AdjustGroup;
  return null;
}

function isSignaturePreviewTarget(target) {
  return target === "assinatura" || target === "assinatura2" || target === "assinatura3";
}

function getSignatureSlotFromImageTarget(target) {
  return SIGNATURE_IMAGE_TARGETS[target] || "";
}

function isSignatureImagePreviewTarget(target) {
  return Boolean(getSignatureSlotFromImageTarget(target));
}

function getPreviewAdjustTargetInputs(target) {
  if (target === "logo") {
    return { x: logoXInput, y: logoYInput, size: logoSizeInput };
  }
  if (target === "qr") {
    return { x: qrXInput, y: qrYInput, size: qrSizeInput };
  }
  if (target === "assinatura") {
    return {
      x: assinaturaXInput,
      y: assinaturaYInput,
      size: assinaturaSizeInput,
      label: assinaturaLabelInput,
    };
  }
  if (target === "assinaturaImage") {
    return {
      x: assinaturaImageXInput,
      y: assinaturaImageYInput,
      size: assinaturaImageSizeInput,
    };
  }
  if (target === "assinatura2") {
    return {
      x: assinatura2XInput,
      y: assinatura2YInput,
      size: assinatura2SizeInput,
      label: assinatura2LabelInput,
    };
  }
  if (target === "assinatura2Image") {
    return {
      x: assinatura2ImageXInput,
      y: assinatura2ImageYInput,
      size: assinatura2ImageSizeInput,
    };
  }
  if (target === "assinatura3") {
    return {
      x: assinatura3XInput,
      y: assinatura3YInput,
      size: assinatura3SizeInput,
      label: assinatura3LabelInput,
    };
  }
  if (target === "assinatura3Image") {
    return {
      x: assinatura3ImageXInput,
      y: assinatura3ImageYInput,
      size: assinatura3ImageSizeInput,
    };
  }
  if (target === "instituicao") {
    return { x: instituicaoXInput, y: instituicaoYInput, size: instituicaoSizeInput };
  }
  if (target === "selo1") {
    return { x: selo1XInput, y: selo1YInput, size: selo1SizeInput };
  }
  if (target === "selo2") {
    return { x: selo2XInput, y: selo2YInput, size: selo2SizeInput };
  }
  if (target === "selo3") {
    return { x: selo3XInput, y: selo3YInput, size: selo3SizeInput };
  }
  if (target === "selo4") {
    return { x: selo4XInput, y: selo4YInput, size: selo4SizeInput };
  }
  return { x: null, y: null, size: null };
}

function isPreviewAdjustTargetActive(target) {
  if (target === "logo") return Boolean(getActiveLogoImage());
  if (target === "qr") return true;
  if (target === "assinatura" || target === "assinatura2" || target === "assinatura3") {
    return isSignatureSlotActive(target);
  }
  if (isSignatureImagePreviewTarget(target)) {
    return Boolean(getActiveSignatureImage(getSignatureSlotFromImageTarget(target)));
  }
  if (target === "instituicao") return isInstitutionSlotActive();
  if (isSeloSlot(target)) return Boolean(getActiveSeloImage(target));
  return false;
}

function getCenteredCanvasRect(x, y, width, height, padding = 10) {
  return {
    x: x - width / 2 - padding,
    y: y - height / 2 - padding,
    width: width + padding * 2,
    height: height + padding * 2,
  };
}

function normalizeCanvasRect(rect, minWidth = 72, minHeight = 54) {
  if (!canvas || !rect) return null;
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const width = Math.max(rect.width, minWidth);
  const height = Math.max(rect.height, minHeight);
  const x = Math.max(0, Math.min(canvas.width - width, centerX - width / 2));
  const y = Math.max(0, Math.min(canvas.height - height, centerY - height / 2));
  return { x, y, width, height };
}

function getSignaturePreviewRect(slotKey) {
  const slotLayout = layout[slotKey] || layout.assinatura;
  const lineWidth = Math.max(220, Math.min(320, slotLayout.maxW + 70));
  const lineY = slotLayout.y + 38;
  const labelHeight = getSignatureLabelLines(slotKey).length > 1 ? 56 : 34;
  const top = Math.min(slotLayout.y - slotLayout.maxH / 2, lineY - 12) - 12;
  const bottom = lineY + 35 + labelHeight;
  return normalizeCanvasRect({
    x: slotLayout.x - lineWidth / 2 - 20,
    y: top,
    width: lineWidth + 40,
    height: bottom - top,
  }, 240, 86);
}

function getSignatureImagePreviewRect(slotKey) {
  if (!getActiveSignatureImage(slotKey)) return null;
  const slotLayout = layout[slotKey] || layout.assinatura;
  return normalizeCanvasRect(
    getCenteredCanvasRect(
      slotLayout.x + (slotLayout.imageOffsetX || 0),
      slotLayout.y + (slotLayout.imageOffsetY || 0),
      slotLayout.imageMaxW || slotLayout.maxW,
      slotLayout.imageMaxH || slotLayout.maxH,
      8
    ),
    88,
    44
  );
}

function getInstitutionPreviewRect() {
  const lineWidth = Math.max(220, Math.min(320, layout.instituicao.maxW + 70));
  const lineY = layout.instituicao.y + 38;
  const top = Math.min(layout.instituicao.y - layout.instituicao.maxH / 2, lineY - 12) - 12;
  const bottom = lineY + 72;
  return normalizeCanvasRect({
    x: layout.instituicao.x - lineWidth / 2 - 20,
    y: top,
    width: lineWidth + 40,
    height: bottom - top,
  }, 240, 86);
}

function getPreviewAdjustTargetRect(target) {
  if (!canvas) return null;
  if (target === "logo") {
    return normalizeCanvasRect(
      getCenteredCanvasRect(layout.logo.x, layout.logo.y, layout.logo.maxW, layout.logo.maxH, 12),
      90,
      58
    );
  }
  if (target === "qr") {
    return normalizeCanvasRect(
      getCenteredCanvasRect(layout.qr.x, layout.qr.y, layout.qr.maxW, layout.qr.maxH, 8),
      76,
      76
    );
  }
  if (target === "assinatura" || target === "assinatura2" || target === "assinatura3") {
    return getSignaturePreviewRect(target);
  }
  if (isSignatureImagePreviewTarget(target)) {
    return getSignatureImagePreviewRect(getSignatureSlotFromImageTarget(target));
  }
  if (target === "instituicao") return getInstitutionPreviewRect();
  if (isSeloSlot(target)) {
    const slotLayout = layout[target];
    return normalizeCanvasRect(
      getCenteredCanvasRect(slotLayout.x, slotLayout.y, slotLayout.maxW, slotLayout.maxH, 10),
      72,
      52
    );
  }
  return null;
}

function setPreviewAdjustStatus(message) {
  if (!previewAdjustStatus) return;
  previewAdjustStatus.textContent = message || "";
}

function syncPreviewAdjustRange(sourceInput, targetInput, valueElement) {
  if (!sourceInput || !targetInput) return false;
  targetInput.min = sourceInput.min;
  targetInput.max = sourceInput.max;
  targetInput.step = sourceInput.step;
  targetInput.value = sourceInput.value;
  if (valueElement) valueElement.textContent = `${sourceInput.value} px`;
  return true;
}

function isPreviewAdjustPanelControlActive() {
  return Boolean(
    previewAdjustPanel &&
    document.activeElement &&
    previewAdjustPanel.contains(document.activeElement)
  );
}

function positionPreviewAdjustPanel(options = {}) {
  if (!options.force && isPreviewAdjustPanelControlActive()) {
    return;
  }
  if (!previewAdjustPanel || !previewCanvasFrame || !canvas || !selectedPreviewAdjustTarget) {
    return;
  }
  const rect = getPreviewAdjustTargetRect(selectedPreviewAdjustTarget);
  if (!rect) return;

  const frameWidth = previewCanvasFrame.clientWidth;
  const frameHeight = previewCanvasFrame.clientHeight;
  if (!frameWidth || !frameHeight) return;

  const scaleX = frameWidth / canvas.width;
  const scaleY = frameHeight / canvas.height;
  const panelWidth = previewAdjustPanel.offsetWidth || 300;
  const panelHeight = previewAdjustPanel.offsetHeight || 180;
  const margin = 8;
  const gap = 10;
  const targetLeft = rect.x * scaleX;
  const targetTop = rect.y * scaleY;
  const targetRight = (rect.x + rect.width) * scaleX;
  const targetBottom = (rect.y + rect.height) * scaleY;
  const targetCenterX = (targetLeft + targetRight) / 2;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const maxLeft = Math.max(margin, frameWidth - panelWidth - margin);
  const maxTop = Math.max(margin, frameHeight - panelHeight - margin);
  const preferredTop = targetTop - panelHeight - gap;
  const fallbackTop = targetBottom + gap;

  const left = clamp(targetCenterX - panelWidth / 2, margin, maxLeft);
  const top = preferredTop >= margin
    ? preferredTop
    : fallbackTop + panelHeight <= frameHeight - margin
      ? fallbackTop
      : clamp(targetTop, margin, maxTop);

  previewAdjustPanel.style.left = `${left}px`;
  previewAdjustPanel.style.top = `${clamp(top, margin, maxTop)}px`;
}

function syncPreviewAdjustPanel() {
  if (!previewAdjustPanel) return;
  const target = selectedPreviewAdjustTarget;
  const controls = getPreviewAdjustTargetInputs(target);
  const isReady =
    target &&
    isPreviewAdjustTargetActive(target) &&
    controls.x &&
    controls.y &&
    controls.size;

  previewAdjustPanel.hidden = !isReady;
  if (!isReady) return;

  if (previewAdjustTitle) {
    previewAdjustTitle.textContent = `Ajustar ${getPreviewAdjustTargetLabel(target)}`;
  }
  if (previewAdjustLabelWrap && previewAdjustLabelInput) {
    const shouldShowLabel = isSignaturePreviewTarget(target) && controls.label;
    previewAdjustLabelWrap.hidden = !shouldShowLabel;
    if (shouldShowLabel) previewAdjustLabelInput.value = controls.label.value || "";
  }
  syncPreviewAdjustRange(controls.x, previewAdjustXInput, previewAdjustXVal);
  syncPreviewAdjustRange(controls.y, previewAdjustYInput, previewAdjustYVal);
  syncPreviewAdjustRange(controls.size, previewAdjustSizeInput, previewAdjustSizeVal);
  if (!isPreviewAdjustPanelApplying) {
    positionPreviewAdjustPanel();
  }
}

function applyPreviewAdjustPanelControls() {
  if (!selectedPreviewAdjustTarget) return;
  const controls = getPreviewAdjustTargetInputs(selectedPreviewAdjustTarget);
  if (controls.label && previewAdjustLabelInput) {
    controls.label.value = previewAdjustLabelInput.value;
  }
  if (controls.x && previewAdjustXInput) controls.x.value = previewAdjustXInput.value;
  if (controls.y && previewAdjustYInput) controls.y.value = previewAdjustYInput.value;
  if (controls.size && previewAdjustSizeInput) controls.size.value = previewAdjustSizeInput.value;
  isPreviewAdjustPanelApplying = true;
  try {
    applyLayoutFromControls();
  } finally {
    isPreviewAdjustPanelApplying = false;
  }
}

function commitPreviewAdjustPanelControls() {
  positionPreviewAdjustPanel();
}

function clearPreviewAdjustTarget() {
  selectedPreviewAdjustTarget = "";
  updatePreviewHotspots();
  updatePreviewAdjustControlSelection();
  syncPreviewAdjustPanel();
  setPreviewAdjustStatus("");
}

function updatePreviewAdjustControlSelection() {
  PREVIEW_ADJUST_TARGET_KEYS.forEach((target) => {
    const element = getPreviewAdjustTargetControlElement(target);
    if (!element) return;
    element.classList.add("preview-adjust-target");
    element.classList.toggle("is-selected", target === selectedPreviewAdjustTarget);
  });
}

function syncPreviewHotspotToggle() {
  if (!previewWrap || !previewShowHotspotsInput) return;
  previewWrap.classList.toggle("is-showing-hotspots", previewShowHotspotsInput.checked);
}

function updatePreviewHotspots() {
  if (!previewHotspots || !canvas) return;

  if (
    selectedPreviewAdjustTarget &&
    !isPreviewAdjustTargetActive(selectedPreviewAdjustTarget)
  ) {
    selectedPreviewAdjustTarget = "";
  }

  previewHotspots.replaceChildren();

  PREVIEW_ADJUST_TARGET_KEYS.forEach((target) => {
    if (!isPreviewAdjustTargetActive(target)) return;
    const rect = getPreviewAdjustTargetRect(target);
    if (!rect) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "preview-hotspot";
    button.classList.toggle("is-nested-hotspot", isSignatureImagePreviewTarget(target));
    button.dataset.previewTarget = target;
    button.setAttribute("aria-label", `Ajustar ${getPreviewAdjustTargetLabel(target)}`);
    button.setAttribute("aria-pressed", target === selectedPreviewAdjustTarget ? "true" : "false");
    button.classList.toggle("is-selected", target === selectedPreviewAdjustTarget);
    button.style.left = `${(rect.x / canvas.width) * 100}%`;
    button.style.top = `${(rect.y / canvas.height) * 100}%`;
    button.style.width = `${(rect.width / canvas.width) * 100}%`;
    button.style.height = `${(rect.height / canvas.height) * 100}%`;

    const label = document.createElement("span");
    label.className = "preview-hotspot-label";
    label.textContent = getPreviewHotspotLabel(target);
    button.appendChild(label);
    button.addEventListener("click", () => selectPreviewAdjustTarget(target));

    previewHotspots.appendChild(button);
  });

  updatePreviewAdjustControlSelection();
  syncPreviewAdjustPanel();
  if (!selectedPreviewAdjustTarget) {
    setPreviewAdjustStatus("");
  }
}

function selectPreviewAdjustTarget(target) {
  if (!isPreviewAdjustTargetActive(target)) return;
  selectedPreviewAdjustTarget = target;

  syncAdvancedControlVisibility();
  updatePreviewHotspots();

  const label = getPreviewAdjustTargetLabel(target);
  setPreviewAdjustStatus(`Ajustando: ${label}`);
  if (previewAdjustXInput) previewAdjustXInput.focus({ preventScroll: true });
}
