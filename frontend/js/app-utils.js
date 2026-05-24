function pad2(value) {
  return String(value).padStart(2, "0");
}

function sanitizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function formatDate(dateStr) {
  if (!dateStr || !dateStr.includes("-")) return dateStr || "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getLastDaysRange(days) {
  const end = new Date();
  const start = addDays(end, -(days - 1));
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
}

function setTodayDate() {
  const dateInput = document.getElementById("data");
  if (!dateInput) return;
  dateInput.value = toDateInputValue(new Date());
}

function getApiBaseUrl() {
  const fromWindow = sanitizeText(window.CERT_API_BASE_URL || "");
  if (fromWindow) return fromWindow.replace(/\/+$/, "");
  const { hostname, port, protocol, origin } = window.location;
  if (port === "29180") {
    return origin.replace(/\/+$/, "");
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:29180`;
  }
  return origin.replace(/\/+$/, "");
}

function getPreviewQrText() {
  return `${window.location.origin.replace(/\/+$/, "")}/validar/ABC-2026-00000`;
}

function formatFileSize(bytes) {
  const safeBytes = Number(bytes) || 0;
  if (safeBytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let value = safeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const decimals = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(decimals).replace(".", ",")} ${units[unitIndex]}`;
}

function setQuickButtonState(button, active) {
  if (!button) return;
  button.classList.toggle("is-active", Boolean(active));
}

function syncCertificateFilterInputsFromState() {
  if (certFilterBuscaInput) certFilterBuscaInput.value = certListState.filters.busca || "";
  if (certFilterSecretariaSelect) {
    certFilterSecretariaSelect.value = certListState.filters.secretariaId || "";
  }
  if (certFilterConcluidoDeInput) {
    certFilterConcluidoDeInput.value = certListState.filters.concluidoDe || "";
  }
  if (certFilterConcluidoAteInput) {
    certFilterConcluidoAteInput.value = certListState.filters.concluidoAte || "";
  }
  if (certFilterEmitidoDeInput) {
    certFilterEmitidoDeInput.value = certListState.filters.emitidoDe || "";
  }
  if (certFilterEmitidoAteInput) {
    certFilterEmitidoAteInput.value = certListState.filters.emitidoAte || "";
  }
  updateCertificateQuickFilterButtons();
}

function readCertificateFiltersFromInputs() {
  certListState.filters.busca = certFilterBuscaInput ? certFilterBuscaInput.value.trim() : "";
  certListState.filters.secretariaId = certFilterSecretariaSelect
    ? certFilterSecretariaSelect.value
    : "";
  certListState.filters.concluidoDe = certFilterConcluidoDeInput
    ? certFilterConcluidoDeInput.value
    : "";
  certListState.filters.concluidoAte = certFilterConcluidoAteInput
    ? certFilterConcluidoAteInput.value
    : "";
  certListState.filters.emitidoDe = certFilterEmitidoDeInput
    ? certFilterEmitidoDeInput.value
    : "";
  certListState.filters.emitidoAte = certFilterEmitidoAteInput
    ? certFilterEmitidoAteInput.value
    : "";
}

function resetCertificateFiltersState() {
  certListState.filters.busca = "";
  certListState.filters.secretariaId = "";
  certListState.filters.concluidoDe = "";
  certListState.filters.concluidoAte = "";
  certListState.filters.emitidoDe = "";
  certListState.filters.emitidoAte = "";
}

function updateCertificateQuickFilterButtons() {
  const todayRange = getLastDaysRange(1);
  const last7Range = getLastDaysRange(7);
  const activeSecretariaId = sessionState && sessionState.secretaria_ativa_id
    ? String(sessionState.secretaria_ativa_id)
    : "";

  setQuickButtonState(
    certQuickTodayBtn,
    certListState.filters.emitidoDe === todayRange.start
      && certListState.filters.emitidoAte === todayRange.end
  );
  setQuickButtonState(
    certQuickLast7Btn,
    certListState.filters.emitidoDe === last7Range.start
      && certListState.filters.emitidoAte === last7Range.end
  );
  setQuickButtonState(
    certQuickActiveSecretariaBtn,
    Boolean(activeSecretariaId)
      && String(certListState.filters.secretariaId || "") === activeSecretariaId
  );
}

function syncAuditFilterInputsFromState() {
  if (auditSearchInput) auditSearchInput.value = auditState.filters.busca || "";
  if (auditEventSelect) auditEventSelect.value = auditState.filters.evento || "";
  if (auditSecretariaSelect) {
    auditSecretariaSelect.value = auditState.filters.secretariaId || "";
  }
  if (auditCreatedDeInput) auditCreatedDeInput.value = auditState.filters.criadoDe || "";
  if (auditCreatedAteInput) auditCreatedAteInput.value = auditState.filters.criadoAte || "";
  updateAuditQuickFilterButtons();
}

function readAuditFiltersFromInputs() {
  auditState.filters.busca = auditSearchInput ? auditSearchInput.value.trim() : "";
  auditState.filters.evento = auditEventSelect ? auditEventSelect.value : "";
  auditState.filters.secretariaId = auditSecretariaSelect
    ? auditSecretariaSelect.value
    : "";
  auditState.filters.criadoDe = auditCreatedDeInput ? auditCreatedDeInput.value : "";
  auditState.filters.criadoAte = auditCreatedAteInput ? auditCreatedAteInput.value : "";
}

function resetAuditFiltersState() {
  auditState.filters.busca = "";
  auditState.filters.evento = "";
  auditState.filters.secretariaId = "";
  auditState.filters.criadoDe = "";
  auditState.filters.criadoAte = "";
}

function updateAuditQuickFilterButtons() {
  const todayRange = getLastDaysRange(1);
  const last7Range = getLastDaysRange(7);
  const activeSecretariaId = sessionState && sessionState.secretaria_ativa_id
    ? String(sessionState.secretaria_ativa_id)
    : "";

  setQuickButtonState(
    auditQuickTodayBtn,
    auditState.filters.criadoDe === todayRange.start
      && auditState.filters.criadoAte === todayRange.end
  );
  setQuickButtonState(
    auditQuickLast7Btn,
    auditState.filters.criadoDe === last7Range.start
      && auditState.filters.criadoAte === last7Range.end
  );
  setQuickButtonState(
    auditQuickActiveSecretariaBtn,
    Boolean(activeSecretariaId)
      && String(auditState.filters.secretariaId || "") === activeSecretariaId
  );
}

function getCertificateUploadMaxBytes() {
  const fromSession = Number.parseInt(
    sessionState &&
      sessionState.configuracoes &&
      sessionState.configuracoes.certificados_max_upload_bytes,
    10
  );
  if (Number.isFinite(fromSession) && fromSession > 0) {
    return fromSession;
  }
  return DEFAULT_CERTIFICATE_UPLOAD_MAX_BYTES;
}

function ensureCertificatePngWithinLimit(pngBlob, codigo = "") {
  if (!pngBlob) {
    throw new Error("PNG do certificado ausente para validacao.");
  }

  const maxBytes = getCertificateUploadMaxBytes();
  if (pngBlob.size <= maxBytes) {
    return;
  }

  const codeLabel = sanitizeText(codigo).toUpperCase();
  const certLabel = codeLabel ? ` do certificado ${codeLabel}` : "";
  const error = new Error(
    `O PNG final${certLabel} ficou com ${formatFileSize(pngBlob.size)} e excede o limite configurado de ${formatFileSize(maxBytes)}. Isso costuma acontecer quando molde, logo, assinatura ou instituicao estao muito pesados. Use imagens mais leves ou peca ao administrador para ajustar o limite do sistema.`
  );
  error.operation = "png_size";
  error.codigo = codeLabel;
  error.maxBytes = maxBytes;
  error.actualBytes = pngBlob.size;
  throw error;
}

function summarizePngFailure(errorMessage) {
  const message = sanitizeText(errorMessage).toLowerCase();
  if (!message) return "falha no upload";
  if (message.includes("excede o limite") || message.includes("muito pesado")) {
    return "png acima do limite";
  }
  if (message.includes("nao foi salvo no servidor")) {
    return "nao salvo no servidor";
  }
  return "falha no upload";
}

async function apiJsonRequest(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      (payload && (payload.detail || payload.message)) ||
        `Falha na API de certificados (HTTP ${response.status}).`
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function apiFormRequest(path, formData, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...options,
    body: formData,
    headers: {
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      (payload && (payload.detail || payload.message)) ||
        `Falha na API de certificados (HTTP ${response.status}).`
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

function setLoginStatus(message, type = "info") {
  if (!loginStatus) return;

  if (!message) {
    loginStatus.textContent = "";
    loginStatus.className = "status";
    return;
  }

  loginStatus.textContent = message;
  loginStatus.className = `status ${type}`;
}

function setStatusMessage(element, message, type = "info") {
  if (!element) return;

  if (!message) {
    element.textContent = "";
    element.className = "status";
    return;
  }

  element.textContent = message;
  element.className = `status ${type}`;
}

function setTemplateSelectStatus(message, type = "info") {
  setStatusMessage(templateSelectStatus, message, type);
}

function setTemplateAdminStatus(message, type = "info") {
  setStatusMessage(templateAdminStatus, message, type);
}

function setLogoSelectStatus(message, type = "info") {
  setStatusMessage(logoSelectStatus, message, type);
}

function setAssinaturaSelectStatus(message, type = "info") {
  setStatusMessage(assinaturaSelectStatus, message, type);
}

function setAssinatura2SelectStatus(message, type = "info") {
  setStatusMessage(assinatura2SelectStatus, message, type);
}

function setAssinatura3SelectStatus(message, type = "info") {
  setStatusMessage(assinatura3SelectStatus, message, type);
}

function setSelo1SelectStatus(message, type = "info") {
  setStatusMessage(selo1SelectStatus, message, type);
}

function setSelo2SelectStatus(message, type = "info") {
  setStatusMessage(selo2SelectStatus, message, type);
}

function setSelo3SelectStatus(message, type = "info") {
  setStatusMessage(selo3SelectStatus, message, type);
}

function setSelo4SelectStatus(message, type = "info") {
  setStatusMessage(selo4SelectStatus, message, type);
}

function setInstituicaoSelectStatus(message, type = "info") {
  setStatusMessage(instituicaoSelectStatus, message, type);
}

function setLogoStatus(message, type = "info") {
  setStatusMessage(logoStatus, message, type);
}

function setAssinaturaStatus(message, type = "info") {
  setStatusMessage(assinaturaStatus, message, type);
}

function setAssinatura2Status(message, type = "info") {
  setStatusMessage(assinatura2Status, message, type);
}

function setAssinatura3Status(message, type = "info") {
  setStatusMessage(assinatura3Status, message, type);
}

function setSelo1Status(message, type = "info") {
  setStatusMessage(selo1Status, message, type);
}

function setSelo2Status(message, type = "info") {
  setStatusMessage(selo2Status, message, type);
}

function setSelo3Status(message, type = "info") {
  setStatusMessage(selo3Status, message, type);
}

function setSelo4Status(message, type = "info") {
  setStatusMessage(selo4Status, message, type);
}

function setInstituicaoStatus(message, type = "info") {
  setStatusMessage(instituicaoStatus, message, type);
}

function setSecretariaAssetAdminStatus(message, type = "info") {
  setStatusMessage(secretariaAssetStatus, message, type);
}

function capitalizeLabel(label) {
  const text = sanitizeText(label);
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getSecretariaAssetCatalog(type) {
  return secretariaAssetCatalogState[type] || { items: [], selectedId: "" };
}

function isSeloSlot(type) {
  return SELO_SLOT_KEYS.includes(type);
}

function getSeloSlotNumber(type) {
  const index = SELO_SLOT_KEYS.indexOf(type);
  return index >= 0 ? index + 1 : 0;
}

function getSeloSlotUiParts(type) {
  if (type === "selo1") {
    return {
      select: selo1Select,
      removeBtn: selo1RemoveBtn,
      setSelectStatus: setSelo1SelectStatus,
      setManualStatus: setSelo1Status,
    };
  }
  if (type === "selo2") {
    return {
      select: selo2Select,
      removeBtn: selo2RemoveBtn,
      setSelectStatus: setSelo2SelectStatus,
      setManualStatus: setSelo2Status,
    };
  }
  if (type === "selo3") {
    return {
      select: selo3Select,
      removeBtn: selo3RemoveBtn,
      setSelectStatus: setSelo3SelectStatus,
      setManualStatus: setSelo3Status,
    };
  }
  return {
    select: selo4Select,
    removeBtn: selo4RemoveBtn,
    setSelectStatus: setSelo4SelectStatus,
    setManualStatus: setSelo4Status,
  };
}

function getSavedSecretariaAsset(type) {
  if (type === "logo") return savedLogo;
  if (type === "assinatura") return savedAssinatura;
  if (type === "assinatura2") return savedAssinatura2;
  if (type === "assinatura3") return savedAssinatura3;
  if (type === "instituicao") return savedInstituicao;
  if (type === "selo1") return savedSelo1;
  if (type === "selo2") return savedSelo2;
  if (type === "selo3") return savedSelo3;
  if (type === "selo4") return savedSelo4;
  return null;
}

function getSavedSecretariaAssetImage(type) {
  if (type === "logo") return savedLogoImage;
  if (type === "assinatura") return savedAssinaturaImage;
  if (type === "assinatura2") return savedAssinatura2Image;
  if (type === "assinatura3") return savedAssinatura3Image;
  if (type === "instituicao") return savedInstituicaoImage;
  if (type === "selo1") return savedSelo1Image;
  if (type === "selo2") return savedSelo2Image;
  if (type === "selo3") return savedSelo3Image;
  if (type === "selo4") return savedSelo4Image;
  return null;
}

function setSavedSecretariaAsset(type, asset, image) {
  if (type === "logo") {
    savedLogo = asset;
    savedLogoImage = image;
    return;
  }
  if (type === "assinatura") {
    savedAssinatura = asset;
    savedAssinaturaImage = image;
    return;
  }
  if (type === "assinatura2") {
    savedAssinatura2 = asset;
    savedAssinatura2Image = image;
    return;
  }
  if (type === "assinatura3") {
    savedAssinatura3 = asset;
    savedAssinatura3Image = image;
    return;
  }
  if (type === "instituicao") {
    savedInstituicao = asset;
    savedInstituicaoImage = image;
    return;
  }
  if (type === "selo1") {
    savedSelo1 = asset;
    savedSelo1Image = image;
    return;
  }
  if (type === "selo2") {
    savedSelo2 = asset;
    savedSelo2Image = image;
    return;
  }
  if (type === "selo3") {
    savedSelo3 = asset;
    savedSelo3Image = image;
    return;
  }
  if (type === "selo4") {
    savedSelo4 = asset;
    savedSelo4Image = image;
  }
}

function getSecretariaAssetUi(type) {
  if (isSeloSlot(type)) {
    const slotNumber = getSeloSlotNumber(type);
    const slotUi = getSeloSlotUiParts(type);
    return {
      label: `selo ${slotNumber}`,
      pluralLabel: "selos",
      wrap: selosExtrasWrap,
      select: slotUi.select,
      removeBtn: slotUi.removeBtn,
      setSelectStatus: slotUi.setSelectStatus,
      setManualStatus: slotUi.setManualStatus,
      blankLabel: `Nao usar selo ${slotNumber}`,
      missingFileMessage:
        "O arquivo do selo cadastrado nao foi encontrado no servidor. Reenvie o selo na administracao.",
    };
  }
  if (type === "logo") {
    return {
      label: "logo",
      pluralLabel: "logos",
      wrap: logoLibraryWrap,
      select: logoSelect,
      removeBtn: logoRemoveBtn,
      setSelectStatus: setLogoSelectStatus,
      setManualStatus: setLogoStatus,
      blankLabel: "Não usar logo cadastrada",
      missingFileMessage:
        "O arquivo da logo cadastrada não foi encontrado no servidor. Reenvie a logo na administração.",
    };
  }
  if (type === "assinatura") {
    return {
      label: "assinatura",
      pluralLabel: "assinaturas",
      wrap: assinaturaLibraryWrap,
      select: assinaturaSelect,
      removeBtn: assinaturaRemoveBtn,
      setSelectStatus: setAssinaturaSelectStatus,
      setManualStatus: setAssinaturaStatus,
      blankLabel: "Não usar assinatura cadastrada",
      missingFileMessage:
        "O arquivo da assinatura cadastrada não foi encontrado no servidor. Reenvie a assinatura na administração.",
    };
  }
  if (type === "assinatura2") {
    return {
      label: "assinatura 2",
      pluralLabel: "assinaturas",
      wrap: assinaturasExtrasWrap,
      select: assinatura2Select,
      removeBtn: assinatura2RemoveBtn,
      setSelectStatus: setAssinatura2SelectStatus,
      setManualStatus: setAssinatura2Status,
      blankLabel: "Nao usar assinatura 2",
      missingFileMessage:
        "O arquivo da assinatura cadastrada nao foi encontrado no servidor. Reenvie a assinatura na administracao.",
    };
  }
  if (type === "assinatura3") {
    return {
      label: "assinatura 3",
      pluralLabel: "assinaturas",
      wrap: assinaturasExtrasWrap,
      select: assinatura3Select,
      removeBtn: assinatura3RemoveBtn,
      setSelectStatus: setAssinatura3SelectStatus,
      setManualStatus: setAssinatura3Status,
      blankLabel: "Nao usar assinatura 3",
      missingFileMessage:
        "O arquivo da assinatura cadastrada nao foi encontrado no servidor. Reenvie a assinatura na administracao.",
    };
  }
  if (type === "instituicao") {
    return {
      label: "instituição",
      pluralLabel: "instituições",
      wrap: instituicaoLibraryWrap,
      select: instituicaoSelect,
      removeBtn: instituicaoRemoveBtn,
      setSelectStatus: setInstituicaoSelectStatus,
      setManualStatus: setInstituicaoStatus,
      blankLabel: "Não usar instituição cadastrada",
      missingFileMessage:
        "O arquivo da instituição cadastrada não foi encontrado no servidor. Reenvie a instituição na administração.",
    };
  }
  if (type === "selo") {
    return {
      label: "selo",
      pluralLabel: "selos",
      wrap: selosExtrasWrap,
      select: null,
      removeBtn: null,
      setSelectStatus: () => undefined,
      setManualStatus: () => undefined,
      blankLabel: "Nao usar selo",
      missingFileMessage:
        "O arquivo do selo cadastrado nao foi encontrado no servidor. Reenvie o selo na administracao.",
    };
  }
  return getSecretariaAssetUi("logo");
}

function getSecretariaAssetDisplayLabel(type, capitalize = false) {
  const label = getSecretariaAssetUi(type).label || "asset";
  return capitalize ? capitalizeLabel(label) : label;
}

function getActiveTemplateImage() {
  return assets.template || savedTemplateImage;
}

function shouldDrawCertificateTitle() {
  if (assets.template) {
    return !(templateHideTitleInput && templateHideTitleInput.checked);
  }
  if (savedTemplateImage && savedTemplate) {
    return !Boolean(savedTemplate.ocultar_titulo_certificado);
  }
  return true;
}

function getActiveLogoImage() {
  return assets.logo || savedLogoImage;
}

function getActiveAssinaturaImage() {
  return assets.assinatura || savedAssinaturaImage;
}

function getActiveSignatureImage(slotKey) {
  if (slotKey === "assinatura2") return assets.assinatura2 || savedAssinatura2Image;
  if (slotKey === "assinatura3") return assets.assinatura3 || savedAssinatura3Image;
  return getActiveAssinaturaImage();
}

function getActiveSeloImage(slotKey) {
  if (!isSeloSlot(slotKey)) return null;
  return assets[slotKey] || getSavedSecretariaAssetImage(slotKey);
}

function getSignatureLabel(slotKey) {
  return getSignatureLabelLines(slotKey).join("\n");
}

function getSignatureLabelLines(slotKey) {
  let rawText = "";
  if (slotKey === "assinatura2") {
    rawText = assinatura2LabelInput ? assinatura2LabelInput.value : "";
  } else if (slotKey === "assinatura3") {
    rawText = assinatura3LabelInput ? assinatura3LabelInput.value : "";
  } else {
    rawText = assinaturaLabelInput ? assinaturaLabelInput.value : DEFAULT_ASSINATURA_LABEL;
  }

  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => sanitizeText(line))
    .filter(Boolean)
    .slice(0, 3);

  if (slotKey === "assinatura" && !lines.length) {
    return [DEFAULT_ASSINATURA_LABEL];
  }
  return lines;
}

function isSignatureSlotActive(slotKey) {
  if (slotKey === "assinatura") return true;
  return Boolean(getActiveSignatureImage(slotKey) || getSignatureLabel(slotKey));
}

function getActiveInstituicaoImage() {
  return assets.instituicao || savedInstituicaoImage;
}

function shouldDrawInstitutionBlock() {
  return !isSignatureSlotActive("assinatura2") && !isSignatureSlotActive("assinatura3");
}

function isInstitutionSlotActive() {
  return shouldDrawInstitutionBlock() && Boolean(getActiveInstituicaoImage());
}

function getPreviewAdjustTargetLabel(target) {
  if (target === "logo") return "Logo";
  if (target === "qr") return "QR Code";
  if (target === "assinatura") return "Assinatura";
  if (target === "assinatura2") return "Assinatura 2";
  if (target === "assinatura3") return "Assinatura 3";
  if (target === "instituicao") return "Instituicao";
  if (isSeloSlot(target)) return `Selo ${getSeloSlotNumber(target)}`;
  return "Item";
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
  if (target === "assinatura2") {
    return {
      x: assinatura2XInput,
      y: assinatura2YInput,
      size: assinatura2SizeInput,
      label: assinatura2LabelInput,
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
  previewAdjustStatus.textContent = message || "Clique em um item destacado para abrir os ajustes perto dele.";
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

function positionPreviewAdjustPanel() {
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
    label.textContent = getPreviewAdjustTargetLabel(target);
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
  setPreviewAdjustStatus(`Ajustando: ${label}. Use o painel que abriu perto do item para mover ou alterar o tamanho.`);
  if (previewAdjustXInput) previewAdjustXInput.focus({ preventScroll: true });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";

  const normalizedDateStr = String(dateStr)
    .trim()
    .replace(/(\.\d{3})\d+(?=Z|[+-]\d{2}:\d{2}$)/, "$1");
  const hasExplicitTimezone = /(Z|[+-]\d{2}:\d{2})$/i.test(normalizedDateStr);
  const parsed = new Date(hasExplicitTimezone ? normalizedDateStr : `${normalizedDateStr}Z`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return dateTimeFormatter.format(parsed);
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const text = sanitizeText(value);
    if (!text && typeof value !== "number") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function isAdminSession(session = sessionState) {
  return Boolean(session && session.usuario && session.usuario.papel === "admin_global");
}

function canManageVisualAssets(session = sessionState) {
  return Boolean(session && Array.isArray(session.secretarias) && session.secretarias.length > 0);
}

function isAdminOnlySection(sectionName) {
  return sectionName === "audit";
}

function syncAdminSectionVisibility(session = sessionState) {
  const admin = isAdminSession(session);
  const canManageAssets = canManageVisualAssets(session);
  if (userAdminPanel) userAdminPanel.hidden = !admin;
  if (secretariaAdminPanel) secretariaAdminPanel.hidden = !admin;
  if (templateManagementPanel) templateManagementPanel.hidden = !canManageAssets;
  if (visualAssetManagementPanel) visualAssetManagementPanel.hidden = !canManageAssets;
  if (adminTab) {
    adminTab.hidden = !canManageAssets;
    adminTab.textContent = admin ? "Administração" : "Moldes e marcas";
  }
}

function switchSection(sectionName) {
  currentSection = viewSections[sectionName] ? sectionName : "generator";

  Object.entries(viewSections).forEach(([name, element]) => {
    if (!element) return;
    element.hidden = name !== currentSection;
  });

  sectionTabs.forEach((button) => {
    const isActive = button.dataset.section === currentSection;
    button.classList.toggle("is-active", isActive);
  });
}

function populateSecretariaOptions(select, secretarias, selectedValue = "", includeAll = false) {
  if (!select) return;

  const selectedText = selectedValue === null || selectedValue === undefined
    ? ""
    : String(selectedValue);
  select.innerHTML = "";

  if (includeAll) {
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Todas";
    if (!selectedText) {
      allOption.selected = true;
    }
    select.appendChild(allOption);
  }

  (Array.isArray(secretarias) ? secretarias : []).forEach((secretaria) => {
    const option = document.createElement("option");
    option.value = String(secretaria.id);
    option.textContent = `${secretaria.sigla} - ${secretaria.nome}`;
    option.selected = String(secretaria.id) === selectedText;
    select.appendChild(option);
  });

  if (select && select.id === "user-secretarias") {
    renderUserSecretariasChecklist();
  }
}

function populateTemplateOptions(select, templates, selectedValue = "", includeBlank = true) {
  if (!select) return;

  const selectedText = selectedValue === null || selectedValue === undefined
    ? ""
    : String(selectedValue);
  select.innerHTML = "";

  if (includeBlank) {
    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = "Usar fundo padrão";
    if (!selectedText) {
      blankOption.selected = true;
    }
    select.appendChild(blankOption);
  }

  (Array.isArray(templates) ? templates : []).forEach((template) => {
    const option = document.createElement("option");
    option.value = String(template.id);
    const labels = [];
    if (template.padrao) labels.push("padrão");
    if (template.ocultar_titulo_certificado) labels.push("título no molde");
    option.textContent = labels.length
      ? `${template.nome} (${labels.join(", ")})`
      : template.nome;
    option.selected = String(template.id) === selectedText;
    select.appendChild(option);
  });
}

function populateSecretariaAssetOptions(type, items, selectedValue = "", includeBlank = true) {
  const ui = getSecretariaAssetUi(type);
  const select = ui.select;
  if (!select) return;

  const selectedText =
    selectedValue === null || selectedValue === undefined ? "" : String(selectedValue);
  select.innerHTML = "";

  if (includeBlank) {
    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = ui.blankLabel;
    if (!selectedText) {
      blankOption.selected = true;
    }
    select.appendChild(blankOption);
  }

  (Array.isArray(items) ? items : []).forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.padrao ? `${item.nome} (padrão)` : item.nome;
    option.selected = String(item.id) === selectedText;
    select.appendChild(option);
  });
}

function syncExtraSignatureCatalogs(items = [], options = {}) {
  const availableItems = Array.isArray(items) ? items : [];
  const { statusMessage = "", statusType = "info" } = options;

  ["assinatura2", "assinatura3"].forEach((type) => {
    const catalog = getSecretariaAssetCatalog(type);
    const ui = getSecretariaAssetUi(type);
    catalog.items = availableItems;

    const selectedExists = availableItems.some(
      (item) => String(item.id) === String(catalog.selectedId || "")
    );
    if (!selectedExists) {
      catalog.selectedId = "";
      setSavedSecretariaAsset(type, null, null);
    }

    populateSecretariaAssetOptions(type, availableItems, catalog.selectedId, true);
    if (ui.wrap) ui.wrap.hidden = false;
    if (statusMessage || !availableItems.length) {
      const message =
        statusMessage ||
        "A secretaria ativa ainda nao tem assinaturas cadastradas para usar nos itens extras.";
      ui.setSelectStatus(message, statusType);
    } else {
      ui.setSelectStatus("", "info");
    }
  });
}

function syncSeloCatalogs(items = [], options = {}) {
  const availableItems = Array.isArray(items) ? items : [];
  const { statusMessage = "", statusType = "info" } = options;

  SELO_SLOT_KEYS.forEach((type) => {
    const catalog = getSecretariaAssetCatalog(type);
    const ui = getSecretariaAssetUi(type);
    catalog.items = availableItems;

    const selectedExists = availableItems.some(
      (item) => String(item.id) === String(catalog.selectedId || "")
    );
    if (!selectedExists) {
      catalog.selectedId = "";
      setSavedSecretariaAsset(type, null, null);
    }

    populateSecretariaAssetOptions(type, availableItems, catalog.selectedId, true);
    if (ui.wrap) ui.wrap.hidden = false;
    if (statusMessage || !availableItems.length) {
      const message =
        statusMessage ||
        "A secretaria ativa ainda nao tem selos cadastrados. Voce pode enviar arquivos temporarios nesta emissao.";
      ui.setSelectStatus(message, statusType);
    } else {
      ui.setSelectStatus("", "info");
    }
  });
}

function getMultiSelectValues(select) {
  if (!select) return [];
  return Array.from(select.selectedOptions).map((option) => Number(option.value));
}

function setMultiSelectValues(select, values = []) {
  if (!select) return;
  const selected = new Set((values || []).map((value) => Number(value)));
  Array.from(select.options).forEach((option) => {
    option.selected = selected.has(Number(option.value));
  });

  if (select && select.id === "user-secretarias") {
    renderUserSecretariasChecklist();
  }
}

function renderUserSecretariasChecklist() {
  if (!userSecretariasChecklist || !userSecretariasSelect) return;

  const options = Array.from(userSecretariasSelect.options);
  const disabled = Boolean(userSecretariasSelect.disabled);
  userSecretariasChecklist.innerHTML = "";
  userSecretariasSelect.hidden = true;

  if (disabled) {
    const info = document.createElement("p");
    info.className = "checkbox-list-empty";
    info.textContent =
      "Admin global acessa todas as secretarias. Os vinculos sao limpos automaticamente ao salvar.";
    userSecretariasChecklist.appendChild(info);
    return;
  }

  if (!options.length) {
    const empty = document.createElement("p");
    empty.className = "checkbox-list-empty";
    empty.textContent = "Cadastre secretarias para vinculá-las aos operadores.";
    userSecretariasChecklist.appendChild(empty);
    return;
  }

  options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "checkbox-list-item";
    if (disabled) {
      label.classList.add("is-disabled");
    }

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = option.value;
    input.checked = option.selected;
    input.disabled = disabled;
    input.addEventListener("change", () => {
      option.selected = input.checked;
    });

    const text = document.createElement("span");
    text.textContent = option.textContent || "";

    label.append(input, text);
    userSecretariasChecklist.append(label);
  });
}

function createInlineButton(label, onClick, className = "secondary-btn") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

function createIconSvg(iconName) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("icon-btn-svg");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const paths = {
    eye: "M12 5c5.2 0 8.6 4.7 9.7 6.5.2.3.2.7 0 1C20.6 14.3 17.2 19 12 19s-8.6-4.7-9.7-6.5a1 1 0 0 1 0-1C3.4 9.7 6.8 5 12 5Zm0 2c-3.7 0-6.4 3-7.6 5 1.2 2 3.9 5 7.6 5s6.4-3 7.6-5c-1.2-2-3.9-5-7.6-5Zm0 2.5A2.5 2.5 0 1 1 12 14.5 2.5 2.5 0 0 1 12 9.5Z",
    download: "M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z",
    more: "M6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z",
  };
  path.setAttribute("d", paths[iconName] || paths.more);
  svg.appendChild(path);
  return svg;
}

function createIconButton(label, iconName, onClick, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-btn ${className}`.trim();
  button.title = label;
  button.setAttribute("aria-label", label);
  button.appendChild(createIconSvg(iconName));
  button.addEventListener("click", onClick);
  return button;
}
