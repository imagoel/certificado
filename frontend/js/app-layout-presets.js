const LAYOUT_PRESET_VERSION = 1;
const LAYOUT_PRESET_TARGET_KEYS = [
  "logo",
  "qr",
  "assinatura",
  "assinatura2",
  "assinatura3",
  "instituicao",
  ...SELO_SLOT_KEYS,
];
const LAYOUT_PRESET_ASSET_KEYS = [
  "logo",
  "assinatura",
  "assinatura2",
  "assinatura3",
  "instituicao",
  ...SELO_SLOT_KEYS,
];
const LAYOUT_PRESET_NUMERIC_FIELDS = [
  "x",
  "y",
  "maxW",
  "maxH",
  "imageOffsetX",
  "imageOffsetY",
  "imageMaxW",
  "imageMaxH",
];

function setLayoutPresetStatus(message, type = "info") {
  setStatusMessage(layoutPresetStatus, message, type);
}

function getLayoutPresetById(presetId) {
  const normalizedId = presetId ? String(presetId) : "";
  return layoutPresetState.items.find((item) => String(item.id) === normalizedId) || null;
}

function populateLayoutPresetOptions() {
  if (!layoutPresetSelect) return;

  const selectedText = layoutPresetState.selectedId ? String(layoutPresetState.selectedId) : "";
  layoutPresetSelect.innerHTML = "";

  const blankOption = document.createElement("option");
  blankOption.value = "";
  blankOption.textContent = layoutPresetState.items.length
    ? "Selecionar layout..."
    : "Nenhum layout salvo";
  blankOption.selected = !selectedText;
  layoutPresetSelect.appendChild(blankOption);

  layoutPresetState.items.forEach((preset) => {
    const option = document.createElement("option");
    option.value = String(preset.id);
    option.textContent = preset.nome;
    option.selected = String(preset.id) === selectedText;
    layoutPresetSelect.appendChild(option);
  });
}

function syncLayoutPresetControls() {
  const hasSession = Boolean(sessionState && sessionState.secretaria_ativa_id);
  const isBusy = Boolean(layoutPresetState.isSaving || layoutPresetState.isApplying);
  const hasSelectedPreset = Boolean(layoutPresetState.selectedId);

  if (layoutPresetSelect) {
    layoutPresetSelect.disabled = !hasSession || isBusy || !layoutPresetState.items.length;
  }
  if (layoutPresetApplyBtn) {
    layoutPresetApplyBtn.disabled = !hasSession || isBusy || !hasSelectedPreset;
  }
  if (layoutPresetNameInput) {
    layoutPresetNameInput.disabled = !hasSession || isBusy;
  }
  if (layoutPresetSaveBtn) {
    layoutPresetSaveBtn.disabled = !hasSession || isBusy;
  }
}

function syncLayoutPresetSelectUi() {
  populateLayoutPresetOptions();
  syncLayoutPresetControls();
}

function cloneLayoutPresetTarget(targetKey) {
  const current = layout[targetKey] || {};
  const target = {};
  LAYOUT_PRESET_NUMERIC_FIELDS.forEach((field) => {
    const value = Number(current[field]);
    if (Number.isFinite(value)) {
      target[field] = value;
    }
  });
  return target;
}

function buildLayoutPresetPayload() {
  const layoutSnapshot = {};
  LAYOUT_PRESET_TARGET_KEYS.forEach((targetKey) => {
    layoutSnapshot[targetKey] = cloneLayoutPresetTarget(targetKey);
  });

  const selectedAssets = {};
  LAYOUT_PRESET_ASSET_KEYS.forEach((type) => {
    selectedAssets[type] = String(getSecretariaAssetCatalog(type).selectedId || "");
  });

  return {
    version: LAYOUT_PRESET_VERSION,
    layout: layoutSnapshot,
    selections: {
      templateId: String(templateCatalogState.selectedId || ""),
      assets: selectedAssets,
    },
    labels: {
      assinatura: assinaturaLabelInput ? assinaturaLabelInput.value : DEFAULT_ASSINATURA_LABEL,
      assinatura2: assinatura2LabelInput ? assinatura2LabelInput.value : "",
      assinatura3: assinatura3LabelInput ? assinatura3LabelInput.value : "",
    },
    templateHideTitle: Boolean(templateHideTitleInput && templateHideTitleInput.checked),
  };
}

function applyLayoutTargetSnapshot(targetKey, snapshot) {
  if (!layout[targetKey] || !snapshot || typeof snapshot !== "object") return;

  LAYOUT_PRESET_NUMERIC_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(snapshot, field)) return;
    const value = Number(snapshot[field]);
    if (Number.isFinite(value)) {
      layout[targetKey][field] = value;
    }
  });
}

function clearTemporaryLayoutUploads() {
  const inputByType = {
    template: templateInput,
    logo: logoInput,
    assinatura: assinaturaInput,
    assinatura2: assinatura2Input,
    assinatura3: assinatura3Input,
    instituicao: instituicaoInput,
    selo1: selo1Input,
    selo2: selo2Input,
    selo3: selo3Input,
    selo4: selo4Input,
  };

  Object.entries(inputByType).forEach(([type, input]) => {
    assets[type] = null;
    if (input) input.value = "";
  });
  if (templateHideTitleInput) templateHideTitleInput.checked = false;
  syncTemplateControls();
}

async function applyLayoutPresetSelections(selections = {}) {
  clearTemporaryLayoutUploads();
  await applySavedTemplateSelection(selections.templateId || "", { silentStatus: true });

  const selectedAssets = selections.assets && typeof selections.assets === "object"
    ? selections.assets
    : {};
  for (const type of LAYOUT_PRESET_ASSET_KEYS) {
    await applySavedSecretariaAssetSelection(type, selectedAssets[type] || "", {
      silentStatus: true,
    });
  }
}

async function applyLayoutPresetPayload(payload = {}) {
  const presetPayload = payload && typeof payload === "object" ? payload : {};
  await applyLayoutPresetSelections(presetPayload.selections || {});

  const layoutSnapshot = presetPayload.layout && typeof presetPayload.layout === "object"
    ? presetPayload.layout
    : {};
  LAYOUT_PRESET_TARGET_KEYS.forEach((targetKey) => {
    applyLayoutTargetSnapshot(targetKey, layoutSnapshot[targetKey]);
  });

  const labels = presetPayload.labels && typeof presetPayload.labels === "object"
    ? presetPayload.labels
    : {};
  if (assinaturaLabelInput && Object.prototype.hasOwnProperty.call(labels, "assinatura")) {
    assinaturaLabelInput.value = String(labels.assinatura || "");
  }
  if (assinatura2LabelInput && Object.prototype.hasOwnProperty.call(labels, "assinatura2")) {
    assinatura2LabelInput.value = String(labels.assinatura2 || "");
  }
  if (assinatura3LabelInput && Object.prototype.hasOwnProperty.call(labels, "assinatura3")) {
    assinatura3LabelInput.value = String(labels.assinatura3 || "");
  }
  if (
    templateHideTitleInput &&
    Object.prototype.hasOwnProperty.call(presetPayload, "templateHideTitle")
  ) {
    templateHideTitleInput.checked = Boolean(presetPayload.templateHideTitle);
  }

  syncAdvancedAssetControls();
  updateControlLabels();
  syncAdvancedControlVisibility();
  await renderLastCertificate();
}

async function loadLayoutPresets() {
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    layoutPresetState.items = [];
    layoutPresetState.selectedId = "";
    if (layoutPresetNameInput) layoutPresetNameInput.value = "";
    syncLayoutPresetSelectUi();
    setLayoutPresetStatus("", "info");
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/layout-presets${buildQueryString({ secretaria_id: sessionState.secretaria_ativa_id })}`
    );
    layoutPresetState.items = Array.isArray(payload) ? payload : [];
    const selectedStillExists = layoutPresetState.items.some(
      (item) => String(item.id) === String(layoutPresetState.selectedId || "")
    );
    if (!selectedStillExists) {
      layoutPresetState.selectedId = "";
      if (layoutPresetNameInput) layoutPresetNameInput.value = "";
    }
    syncLayoutPresetSelectUi();
    setLayoutPresetStatus("", "info");
  } catch (error) {
    console.error(error);
    layoutPresetState.items = [];
    layoutPresetState.selectedId = "";
    syncLayoutPresetSelectUi();
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setLayoutPresetStatus(
      (error && error.message) || "Nao foi possivel carregar os layouts salvos.",
      "error"
    );
  }
}

function handleLayoutPresetSelectionChange() {
  layoutPresetState.selectedId = layoutPresetSelect ? layoutPresetSelect.value : "";
  const selectedPreset = getLayoutPresetById(layoutPresetState.selectedId);
  if (layoutPresetNameInput && selectedPreset) {
    layoutPresetNameInput.value = selectedPreset.nome;
  }
  setLayoutPresetStatus("", "info");
  syncLayoutPresetControls();
}

async function applySelectedLayoutPreset() {
  if (layoutPresetState.isApplying) return;
  const selectedPreset = getLayoutPresetById(layoutPresetState.selectedId);
  if (!selectedPreset) {
    setLayoutPresetStatus("Selecione um layout salvo para aplicar.", "error");
    return;
  }

  layoutPresetState.isApplying = true;
  syncLayoutPresetControls();
  setLayoutPresetStatus(`Aplicando ${selectedPreset.nome}...`, "info");

  try {
    await applyLayoutPresetPayload(selectedPreset.payload || {});
    if (layoutPresetNameInput) layoutPresetNameInput.value = selectedPreset.nome;
    setLayoutPresetStatus(`Layout ${selectedPreset.nome} aplicado.`, "success");
    setPreviewAdjustStatus(`Layout "${selectedPreset.nome}" aplicado.`);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setLayoutPresetStatus(
      (error && error.message) || "Nao foi possivel aplicar o layout salvo.",
      "error"
    );
  } finally {
    layoutPresetState.isApplying = false;
    syncLayoutPresetControls();
  }
}

async function saveCurrentLayoutPreset() {
  if (layoutPresetState.isSaving) return;
  const name = sanitizeText(layoutPresetNameInput ? layoutPresetNameInput.value : "");
  if (name.length < 2) {
    setLayoutPresetStatus("Informe um nome para salvar o layout.", "error");
    if (layoutPresetNameInput) layoutPresetNameInput.focus();
    return;
  }

  const existingPreset = layoutPresetState.items.find(
    (item) => sanitizeText(item.nome).toLowerCase() === name.toLowerCase()
  );
  layoutPresetState.isSaving = true;
  syncLayoutPresetControls();
  setLayoutPresetStatus(existingPreset ? "Atualizando layout..." : "Salvando layout...", "info");

  try {
    const savedPreset = await apiJsonRequest("/api/layout-presets", {
      method: "POST",
      body: JSON.stringify({
        nome: name,
        payload: buildLayoutPresetPayload(),
      }),
    });
    const nextItems = layoutPresetState.items.filter(
      (item) => String(item.id) !== String(savedPreset.id)
    );
    nextItems.push(savedPreset);
    nextItems.sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));
    layoutPresetState.items = nextItems;
    layoutPresetState.selectedId = String(savedPreset.id);
    if (layoutPresetNameInput) layoutPresetNameInput.value = savedPreset.nome;
    syncLayoutPresetSelectUi();
    setLayoutPresetStatus(
      existingPreset ? `Layout ${savedPreset.nome} atualizado.` : `Layout ${savedPreset.nome} salvo.`,
      "success"
    );
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setLayoutPresetStatus(
      (error && error.message) || "Nao foi possivel salvar o layout.",
      "error"
    );
  } finally {
    layoutPresetState.isSaving = false;
    syncLayoutPresetControls();
  }
}
