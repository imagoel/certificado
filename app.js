const form = document.getElementById("cert-form");
const generateSubmitBtn = form ? form.querySelector('button[type="submit"]') : null;
const downloadBtn = document.getElementById("download");
const logoInput = document.getElementById("logo");
const assinaturaInput = document.getElementById("assinatura");
const logoRemoveBtn = document.getElementById("logo-remove");
const assinaturaRemoveBtn = document.getElementById("assinatura-remove");
const templateInput = document.getElementById("template");
const templateRemoveBtn = document.getElementById("template-remove");
const templateLibraryWrap = document.getElementById("template-library-wrap");
const templateSelect = document.getElementById("template-select");
const logoLibraryWrap = document.getElementById("logo-library-wrap");
const logoSelect = document.getElementById("logo-select");
const logoSelectStatus = document.getElementById("logo-select-status");
const assinaturaLibraryWrap = document.getElementById("assinatura-library-wrap");
const assinaturaSelect = document.getElementById("assinatura-select");
const assinaturaSelectStatus = document.getElementById("assinatura-select-status");
const planilhaInput = document.getElementById("planilha");
const batchPreviewBtn = document.getElementById("batch-preview");
const batchGenerateBtn = document.getElementById("batch-generate");
const loginForm = document.getElementById("login-form");
const loginShell = document.getElementById("login-shell");
const appShell = document.getElementById("app-shell");
const loginStatus = document.getElementById("login-status");
const logoutBtn = document.getElementById("logout-btn");
const sessionUser = document.getElementById("session-user");
const sessionSecretaria = document.getElementById("session-secretaria");
const secretariaWrap = document.getElementById("secretaria-wrap");
const secretariaSelect = document.getElementById("secretaria-select");
const generatorSection = document.getElementById("generator-section");
const certificatesSection = document.getElementById("certificates-section");
const auditSection = document.getElementById("audit-section");
const adminSection = document.getElementById("admin-section");
const sectionTabs = Array.from(document.querySelectorAll("[data-section]"));
const auditTab = document.getElementById("tab-audit");
const adminTab = document.getElementById("tab-admin");

const certListForm = document.getElementById("cert-list-filters");
const certFilterBuscaInput = document.getElementById("cert-filter-busca");
const certFilterSecretariaWrap = document.getElementById("cert-filter-secretaria-wrap");
const certFilterSecretariaSelect = document.getElementById("cert-filter-secretaria");
const certFilterConcluidoDeInput = document.getElementById("cert-filter-concluido-de");
const certFilterConcluidoAteInput = document.getElementById("cert-filter-concluido-ate");
const certFilterEmitidoDeInput = document.getElementById("cert-filter-emitido-de");
const certFilterEmitidoAteInput = document.getElementById("cert-filter-emitido-ate");
const certFilterComArquivoInput = document.getElementById("cert-filter-com-arquivo");
const certQuickTodayBtn = document.getElementById("cert-quick-today");
const certQuickLast7Btn = document.getElementById("cert-quick-last7");
const certQuickActiveSecretariaBtn = document.getElementById("cert-quick-active-secretaria");
const certQuickWithFileBtn = document.getElementById("cert-quick-with-file");
const certFilterResetBtn = document.getElementById("cert-filter-reset");
const certListStatus = document.getElementById("cert-list-status");
const certListSummary = document.getElementById("cert-list-summary");
const certListBody = document.getElementById("cert-list-body");
const certPrevPageBtn = document.getElementById("cert-prev-page");
const certNextPageBtn = document.getElementById("cert-next-page");
const certPageIndicator = document.getElementById("cert-page-indicator");

const userForm = document.getElementById("user-form");
const userEditIdInput = document.getElementById("user-edit-id");
const userNameInput = document.getElementById("user-name");
const userUsernameInput = document.getElementById("user-username");
const userPasswordInput = document.getElementById("user-password");
const userRoleSelect = document.getElementById("user-role");
const userActiveInput = document.getElementById("user-active");
const userSecretariasSelect = document.getElementById("user-secretarias");
const userSecretariasChecklist = document.getElementById("user-secretarias-checklist");
const userFormResetBtn = document.getElementById("user-form-reset");
const userFormStatus = document.getElementById("user-form-status");
const userListBody = document.getElementById("user-list-body");
const userSubmitBtn = userForm ? userForm.querySelector('button[type="submit"]') : null;

const secretariaForm = document.getElementById("secretaria-form");
const secretariaEditIdInput = document.getElementById("secretaria-edit-id");
const secretariaSiglaInput = document.getElementById("secretaria-sigla");
const secretariaNameInput = document.getElementById("secretaria-name");
const secretariaActiveInput = document.getElementById("secretaria-active");
const secretariaFormResetBtn = document.getElementById("secretaria-form-reset");
const secretariaFormStatus = document.getElementById("secretaria-form-status");
const secretariaListBody = document.getElementById("secretaria-list-body");
const secretariaSubmitBtn = secretariaForm
  ? secretariaForm.querySelector('button[type="submit"]')
  : null;
const templateAdminForm = document.getElementById("template-admin-form");
const templateAdminEditIdInput = document.getElementById("template-admin-edit-id");
const templateAdminSecretariaSelect = document.getElementById("template-admin-secretaria");
const templateAdminNameInput = document.getElementById("template-admin-name");
const templateAdminActiveInput = document.getElementById("template-admin-active");
const templateAdminDefaultInput = document.getElementById("template-admin-default");
const templateAdminOrderInput = document.getElementById("template-admin-order");
const templateAdminFileInput = document.getElementById("template-admin-file");
const templateAdminResetBtn = document.getElementById("template-admin-reset");
const templateAdminStatus = document.getElementById("template-admin-status");
const templateAdminListBody = document.getElementById("template-admin-list-body");
const templateAdminSubmitBtn = templateAdminForm
  ? templateAdminForm.querySelector('button[type="submit"]')
  : null;
const secretariaAssetForm = document.getElementById("secretaria-asset-form");
const secretariaAssetEditIdInput = document.getElementById("secretaria-asset-edit-id");
const secretariaAssetSecretariaSelect = document.getElementById("secretaria-asset-secretaria");
const secretariaAssetTypeSelect = document.getElementById("secretaria-asset-type");
const secretariaAssetNameInput = document.getElementById("secretaria-asset-name");
const secretariaAssetNameLabel = document.getElementById("secretaria-asset-name-label");
const secretariaAssetActiveInput = document.getElementById("secretaria-asset-active");
const secretariaAssetDefaultInput = document.getElementById("secretaria-asset-default");
const secretariaAssetOrderInput = document.getElementById("secretaria-asset-order");
const secretariaAssetFileInput = document.getElementById("secretaria-asset-file");
const secretariaAssetResetBtn = document.getElementById("secretaria-asset-reset");
const secretariaAssetStatus = document.getElementById("secretaria-asset-status");
const secretariaAssetListBody = document.getElementById("secretaria-asset-list-body");
const secretariaAssetSubmitBtn = secretariaAssetForm
  ? secretariaAssetForm.querySelector('button[type="submit"]')
  : null;

const auditForm = document.getElementById("audit-form");
const auditSearchInput = document.getElementById("audit-search");
const auditEventSelect = document.getElementById("audit-event");
const auditSecretariaWrap = document.getElementById("audit-secretaria-wrap");
const auditSecretariaSelect = document.getElementById("audit-secretaria");
const auditCreatedDeInput = document.getElementById("audit-created-de");
const auditCreatedAteInput = document.getElementById("audit-created-ate");
const auditQuickTodayBtn = document.getElementById("audit-quick-today");
const auditQuickLast7Btn = document.getElementById("audit-quick-last7");
const auditQuickActiveSecretariaBtn = document.getElementById("audit-quick-active-secretaria");
const auditResetBtn = document.getElementById("audit-reset");
const auditStatus = document.getElementById("audit-status");
const auditSummary = document.getElementById("audit-summary");
const auditListBody = document.getElementById("audit-list-body");
const auditPrevPageBtn = document.getElementById("audit-prev-page");
const auditNextPageBtn = document.getElementById("audit-next-page");
const auditPageIndicator = document.getElementById("audit-page-indicator");

const duplicateCertDialog = document.getElementById("duplicate-cert-dialog");
const duplicateCertForm = document.getElementById("duplicate-cert-form");
const duplicateCertMessage = document.getElementById("duplicate-cert-message");
const duplicateCertSummary = document.getElementById("duplicate-cert-summary");
const duplicateCertList = document.getElementById("duplicate-cert-list");
const duplicateCertStatus = document.getElementById("duplicate-cert-status");
const duplicateCertViewExistingBtn = document.getElementById("duplicate-cert-view-existing");
const duplicateCertCancelBtn = document.getElementById("duplicate-cert-cancel");

const deleteCertDialog = document.getElementById("delete-cert-dialog");
const deleteCertForm = document.getElementById("delete-cert-form");
const deleteCertMessage = document.getElementById("delete-cert-message");
const deleteCertCurrentCodeInput = document.getElementById("delete-cert-current-code");
const deleteCertConfirmCodeInput = document.getElementById("delete-cert-confirm-code");
const deleteCertPasswordInput = document.getElementById("delete-cert-password");
const deleteCertStatus = document.getElementById("delete-cert-status");
const deleteCertCancelBtn = document.getElementById("delete-cert-cancel");

const batchStatus = document.getElementById("batch-status");
const batchPreviewPanel = document.getElementById("batch-preview-panel");
const batchPreviewSummary = document.getElementById("batch-preview-summary");
const batchPreviewBody = document.getElementById("batch-preview-body");
const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const nomeInput = document.getElementById("nome");
const cursoInput = document.getElementById("curso");
const dataInput = document.getElementById("data");
const cargaHInput = document.getElementById("carga_h");
const logoStatus = document.getElementById("logo-status");
const assinaturaStatus = document.getElementById("assinatura-status");
const templateStatus = document.getElementById("template-status");
const templateSelectStatus = document.getElementById("template-select-status");

const batchConfirmDialog = document.getElementById("batch-confirm-dialog");
const batchConfirmForm = document.getElementById("batch-confirm-form");
const batchConfirmMessage = document.getElementById("batch-confirm-message");
const batchConfirmSummary = document.getElementById("batch-confirm-summary");
const batchConfirmStatus = document.getElementById("batch-confirm-status");
const batchConfirmCancelBtn = document.getElementById("batch-confirm-cancel");

const logoXInput = document.getElementById("logoX");
const logoYInput = document.getElementById("logoY");
const logoSizeInput = document.getElementById("logoSize");
const assinaturaXInput = document.getElementById("assinaturaX");
const assinaturaYInput = document.getElementById("assinaturaY");
const assinaturaSizeInput = document.getElementById("assinaturaSize");

const textoLinha1Input = document.getElementById("textoLinha1");
const textoLinha2Input = document.getElementById("textoLinha2");

const logoXVal = document.getElementById("logoXVal");
const logoYVal = document.getElementById("logoYVal");
const logoSizeVal = document.getElementById("logoSizeVal");
const assinaturaXVal = document.getElementById("assinaturaXVal");
const assinaturaYVal = document.getElementById("assinaturaYVal");
const assinaturaSizeVal = document.getElementById("assinaturaSizeVal");

const defaultTextoLinha1 = "Certificamos que";
const defaultTextoLinha2 = "concluiu com êxito o curso";
const MAX_CARGA_HORARIA = 2000;

const assets = {
  template: null,
  logo: null,
  assinatura: null,
};

const layout = {
  logo: { x: 600, y: 95, maxW: 150, maxH: 95 },
  assinatura: { x: 330, y: 662, maxW: 230, maxH: 80 },
  qr: { x: 160, y: 175, maxW: 120, maxH: 120 },
};

const fieldAliases = {
  nome: ["nome", "nomecompleto", "nomealuno", "primeironome", "firstname", "aluno", "participante"],
  sobrenome: ["sobrenome", "sobrenomealuno", "sobrenomedoaluno", "ultimonome", "lastname", "surname"],
  curso: ["curso", "nomecurso", "treinamento", "evento"],
  data: ["data", "concluido", "conclusao", "dataconclusao", "datadeconclusao"],
  carga_h: ["cargah", "cargahoraria", "cargahoras", "cargahora", "cargahorastotais"],
  linha1: ["linha1", "textolinha1", "texto1", "frase1"],
  linha2: ["linha2", "textolinha2", "texto2", "frase2"],
  arquivo: ["arquivo", "nomearquivo", "filename", "file"],
};

let lastData = null;
let renderTicket = 0;
let isBatchRunning = false;
let isSingleGenerationRunning = false;
let sessionState = null;
let currentSection = "generator";
let pendingDuplicateCertificate = null;
let pendingDeleteCertificate = null;
let pendingBatchGeneration = null;
let savedTemplate = null;
let savedTemplateImage = null;
let savedLogo = null;
let savedLogoImage = null;
let savedAssinatura = null;
let savedAssinaturaImage = null;

const DEFAULT_CERTIFICATE_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

const certListState = {
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 1,
  filters: {
    busca: "",
    secretariaId: "",
    concluidoDe: "",
    concluidoAte: "",
    emitidoDe: "",
    emitidoAte: "",
    somenteComArquivo: false,
  },
};

const adminState = {
  users: [],
  secretarias: [],
  templates: [],
  secretariaAssets: [],
};

const templateCatalogState = {
  items: [],
  selectedId: "",
};
const secretariaAssetCatalogState = {
  logo: { items: [], selectedId: "" },
  assinatura: { items: [], selectedId: "" },
};

const auditState = {
  page: 1,
  perPage: 12,
  total: 0,
  totalPages: 1,
  filters: {
    busca: "",
    evento: "",
    secretariaId: "",
    criadoDe: "",
    criadoAte: "",
  },
};

const qrImageCache = new Map();
const certificateAspectRatio = 1200 / 850;
const logoAspectRatio = 95 / 150;
const assinaturaAspectRatio = 80 / 230;
const viewSections = {
  generator: generatorSection,
  certificates: certificatesSection,
  audit: auditSection,
  admin: adminSection,
};
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Sao_Paulo",
});

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
  if (certFilterComArquivoInput) {
    certFilterComArquivoInput.checked = Boolean(certListState.filters.somenteComArquivo);
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
  certListState.filters.somenteComArquivo = certFilterComArquivoInput
    ? certFilterComArquivoInput.checked
    : false;
}

function resetCertificateFiltersState() {
  certListState.filters.busca = "";
  certListState.filters.secretariaId = "";
  certListState.filters.concluidoDe = "";
  certListState.filters.concluidoAte = "";
  certListState.filters.emitidoDe = "";
  certListState.filters.emitidoAte = "";
  certListState.filters.somenteComArquivo = false;
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
  setQuickButtonState(certQuickWithFileBtn, Boolean(certListState.filters.somenteComArquivo));
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
    `O PNG final${certLabel} ficou com ${formatFileSize(pngBlob.size)} e excede o limite configurado de ${formatFileSize(maxBytes)}. Isso costuma acontecer quando molde, logo ou assinatura estao muito pesados. Use imagens mais leves ou peca ao administrador para ajustar o limite do sistema.`
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

function setLogoStatus(message, type = "info") {
  setStatusMessage(logoStatus, message, type);
}

function setAssinaturaStatus(message, type = "info") {
  setStatusMessage(assinaturaStatus, message, type);
}

function setSecretariaAssetAdminStatus(message, type = "info") {
  setStatusMessage(secretariaAssetStatus, message, type);
}

function getSecretariaAssetCatalog(type) {
  return secretariaAssetCatalogState[type] || { items: [], selectedId: "" };
}

function getSavedSecretariaAsset(type) {
  return type === "logo" ? savedLogo : savedAssinatura;
}

function getSavedSecretariaAssetImage(type) {
  return type === "logo" ? savedLogoImage : savedAssinaturaImage;
}

function setSavedSecretariaAsset(type, asset, image) {
  if (type === "logo") {
    savedLogo = asset;
    savedLogoImage = image;
    return;
  }
  savedAssinatura = asset;
  savedAssinaturaImage = image;
}

function getSecretariaAssetUi(type) {
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

function getActiveTemplateImage() {
  return assets.template || savedTemplateImage;
}

function getActiveLogoImage() {
  return assets.logo || savedLogoImage;
}

function getActiveAssinaturaImage() {
  return assets.assinatura || savedAssinaturaImage;
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

function isAdminOnlySection(sectionName) {
  return sectionName === "admin" || sectionName === "audit";
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
    option.textContent = template.padrao ? `${template.nome} (padrão)` : template.nome;
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

function setAuthenticatedView(authenticated) {
  if (loginShell) loginShell.hidden = authenticated;
  if (appShell) appShell.hidden = !authenticated;
}

function renderSession(session) {
  sessionState = session;
  setAuthenticatedView(true);
  setLoginStatus("", "info");

  if (sessionUser && session && session.usuario) {
    sessionUser.textContent = `${session.usuario.nome} (${session.usuario.papel})`;
  }

  const secretarias = Array.isArray(session.secretarias) ? session.secretarias : [];
  const secretariaAtiva = secretarias.find(
    (secretaria) => secretaria.id === session.secretaria_ativa_id
  );
  if (sessionSecretaria) {
    sessionSecretaria.textContent = secretariaAtiva
      ? `Secretaria ativa: ${secretariaAtiva.sigla} - ${secretariaAtiva.nome}`
      : "Nenhuma secretaria ativa selecionada.";
  }
  populateSecretariaOptions(secretariaSelect, secretarias, session.secretaria_ativa_id, false);
  if (secretariaWrap) secretariaWrap.hidden = secretarias.length <= 1;
  populateSecretariaOptions(
    certFilterSecretariaSelect,
    secretarias,
    certListState.filters.secretariaId,
    true
  );
  if (certFilterSecretariaWrap) {
    certFilterSecretariaWrap.hidden = secretarias.length <= 1;
  }
  populateSecretariaOptions(
    auditSecretariaSelect,
    secretarias,
    auditState.filters.secretariaId,
    true
  );
  if (auditSecretariaWrap) {
    auditSecretariaWrap.hidden = secretarias.length <= 1;
  }
  if (
    certFilterSecretariaSelect &&
    certListState.filters.secretariaId &&
    !Array.from(certFilterSecretariaSelect.options).some(
      (option) => option.value === String(certListState.filters.secretariaId)
    )
  ) {
    certListState.filters.secretariaId = "";
    certFilterSecretariaSelect.value = "";
  }

  if (adminTab) {
    adminTab.hidden = !isAdminSession(session);
  }
  if (auditTab) {
    auditTab.hidden = !isAdminSession(session);
  }
  if (!isAdminSession(session) && isAdminOnlySection(currentSection)) {
    switchSection("generator");
  }

  syncCertificateFilterInputsFromState();
  syncAuditFilterInputsFromState();
}

function clearSessionUi(message = "") {
  sessionState = null;
  closeDeleteCertificateDialog();
  closeBatchConfirmDialog();
  certListState.page = 1;
  certListState.total = 0;
  certListState.totalPages = 1;
  certListState.filters.busca = "";
  certListState.filters.secretariaId = "";
  certListState.filters.concluidoDe = "";
  certListState.filters.concluidoAte = "";
  certListState.filters.emitidoDe = "";
  certListState.filters.emitidoAte = "";
  certListState.filters.somenteComArquivo = false;
  auditState.page = 1;
  auditState.total = 0;
  auditState.totalPages = 1;
  auditState.filters.busca = "";
  auditState.filters.evento = "";
  auditState.filters.secretariaId = "";
  auditState.filters.criadoDe = "";
  auditState.filters.criadoAte = "";
  setAuthenticatedView(false);
  downloadBtn.disabled = true;
  if (sessionUser) sessionUser.textContent = "";
  if (sessionSecretaria) sessionSecretaria.textContent = "";
  if (secretariaSelect) secretariaSelect.innerHTML = "";
  if (secretariaWrap) secretariaWrap.hidden = true;
  if (certFilterBuscaInput) certFilterBuscaInput.value = "";
  if (certFilterConcluidoDeInput) certFilterConcluidoDeInput.value = "";
  if (certFilterConcluidoAteInput) certFilterConcluidoAteInput.value = "";
  if (certFilterEmitidoDeInput) certFilterEmitidoDeInput.value = "";
  if (certFilterEmitidoAteInput) certFilterEmitidoAteInput.value = "";
  if (certFilterComArquivoInput) certFilterComArquivoInput.checked = false;
  if (certFilterSecretariaSelect) {
    certFilterSecretariaSelect.innerHTML = '<option value="">Todas</option>';
  }
  if (certFilterSecretariaWrap) certFilterSecretariaWrap.hidden = false;
  if (auditSearchInput) auditSearchInput.value = "";
  if (auditEventSelect) auditEventSelect.value = "";
  if (auditCreatedDeInput) auditCreatedDeInput.value = "";
  if (auditCreatedAteInput) auditCreatedAteInput.value = "";
  if (auditSecretariaSelect) {
    auditSecretariaSelect.innerHTML = '<option value="">Todas</option>';
  }
  if (auditSecretariaWrap) auditSecretariaWrap.hidden = false;
  updateCertificateQuickFilterButtons();
  updateAuditQuickFilterButtons();
  if (certListBody) {
    certListBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">Faça login para carregar os certificados.</td>
      </tr>
    `;
  }
  if (certListSummary) certListSummary.textContent = "";
  if (certPageIndicator) certPageIndicator.textContent = "Página 1";
  if (auditSummary) auditSummary.textContent = "";
  if (auditPageIndicator) auditPageIndicator.textContent = "Página 1";
  if (adminTab) adminTab.hidden = true;
  if (auditTab) auditTab.hidden = true;
  if (userListBody) {
    userListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Faça login como administrador para gerenciar usuários.</td>
      </tr>
    `;
  }
  if (secretariaListBody) {
    secretariaListBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Faça login como administrador para gerenciar secretarias.</td>
      </tr>
    `;
  }
  if (auditListBody) {
    auditListBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Faça login como administrador para visualizar a auditoria.</td>
      </tr>
    `;
  }
  if (auditSummary) auditSummary.textContent = "";
  if (auditPageIndicator) auditPageIndicator.textContent = "Página 1";
  adminState.users = [];
  adminState.secretarias = [];
  adminState.templates = [];
  adminState.secretariaAssets = [];
  templateCatalogState.items = [];
  templateCatalogState.selectedId = "";
  secretariaAssetCatalogState.logo.items = [];
  secretariaAssetCatalogState.logo.selectedId = "";
  secretariaAssetCatalogState.assinatura.items = [];
  secretariaAssetCatalogState.assinatura.selectedId = "";
  assets.template = null;
  assets.logo = null;
  assets.assinatura = null;
  savedTemplate = null;
  savedTemplateImage = null;
  savedLogo = null;
  savedLogoImage = null;
  savedAssinatura = null;
  savedAssinaturaImage = null;
  if (templateInput) templateInput.value = "";
  if (logoInput) logoInput.value = "";
  if (assinaturaInput) assinaturaInput.value = "";
  syncTemplateControls();
  setTemplateStatus("", "info");
  if (templateSelect) {
    populateTemplateOptions(templateSelect, [], "", true);
  }
  if (templateLibraryWrap) templateLibraryWrap.hidden = false;
  setTemplateSelectStatus("", "info");
  populateSecretariaAssetOptions("logo", [], "", true);
  populateSecretariaAssetOptions("assinatura", [], "", true);
  if (logoLibraryWrap) logoLibraryWrap.hidden = false;
  if (assinaturaLibraryWrap) assinaturaLibraryWrap.hidden = false;
  setLogoSelectStatus("", "info");
  setAssinaturaSelectStatus("", "info");
  setLogoStatus("", "info");
  setAssinaturaStatus("", "info");
  resetUserForm();
  resetSecretariaForm();
  resetTemplateAdminForm();
  resetSecretariaAssetForm();
  switchSection("generator");
  if (message) {
    setLoginStatus(message, "error");
  }
}

async function fetchSession() {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok || !payload || !payload.autenticado) {
    return null;
  }

  return payload;
}

async function refreshSession(message = "") {
  try {
    const session = await fetchSession();
    if (!session) {
      clearSessionUi(message);
      return null;
    }

    renderSession(session);
    await refreshProtectedData({ page: 1 });
    return session;
  } catch (error) {
    console.error(error);
    clearSessionUi("Nao foi possivel validar a sessao.");
    return null;
  }
}

async function handleUnauthorized(message = "Sua sessao expirou. Entre novamente.") {
  clearSessionUi(message);
}

function setCertListStatus(message, type = "info") {
  setStatusMessage(certListStatus, message, type);
}

function setUserFormStatus(message, type = "info") {
  setStatusMessage(userFormStatus, message, type);
}

function setSecretariaFormStatus(message, type = "info") {
  setStatusMessage(secretariaFormStatus, message, type);
}

function setAuditStatus(message, type = "info") {
  setStatusMessage(auditStatus, message, type);
}

function setDeleteCertStatus(message, type = "info") {
  setStatusMessage(deleteCertStatus, message, type);
}

function setBatchConfirmStatus(message, type = "info") {
  setStatusMessage(batchConfirmStatus, message, type);
}

function setDuplicateCertStatus(message, type = "info") {
  setStatusMessage(duplicateCertStatus, message, type);
}

function closeDeleteCertificateDialog() {
  pendingDeleteCertificate = null;
  if (deleteCertForm) deleteCertForm.reset();
  setDeleteCertStatus("", "info");
  if (deleteCertDialog && typeof deleteCertDialog.close === "function" && deleteCertDialog.open) {
    deleteCertDialog.close();
  }
}

function openDeleteCertificateDialog(item) {
  if (!deleteCertDialog || !deleteCertForm || !isAdminSession()) return;

  pendingDeleteCertificate = item;
  if (deleteCertCurrentCodeInput) {
    deleteCertCurrentCodeInput.value = item.codigo || "";
  }
  if (deleteCertConfirmCodeInput) {
    deleteCertConfirmCodeInput.value = "";
  }
  if (deleteCertPasswordInput) {
    deleteCertPasswordInput.value = "";
  }
  if (deleteCertMessage) {
    deleteCertMessage.textContent = `Confirme o código ${item.codigo} e informe a senha do administrador para excluir ${item.nome}.`;
  }
  setDeleteCertStatus("", "info");
  if (typeof deleteCertDialog.showModal === "function") {
    deleteCertDialog.showModal();
  }
}

function renderDuplicateCertificateList(items = []) {
  if (!duplicateCertList) return;

  duplicateCertList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "duplicate-cert-meta";
    empty.textContent = "Nenhum certificado semelhante encontrado.";
    duplicateCertList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "duplicate-cert-item";

    const title = document.createElement("strong");
    title.textContent = `${item.codigo || "-"} · ${item.nome || "-"}`;

    const meta = document.createElement("p");
    meta.className = "duplicate-cert-meta";
    meta.textContent =
      `Curso: ${item.curso || "-"} | Conclusão: ${formatDate(item.concluido)} | ` +
      `Emitido em: ${formatDateTime(item.emitido_em)}`;

    const actions = document.createElement("div");
    actions.className = "inline-actions";

    const openTarget = item.arquivo_admin_url || item.arquivo_url || item.url_validacao || "";
    const openLabel = item.arquivo_admin_url || item.arquivo_url ? "Abrir PNG" : "Abrir validação";
    const openBtn = createInlineButton(openLabel, () => {
      if (!openTarget) return;
      window.open(openTarget, "_blank", "noopener,noreferrer");
    });
    openBtn.disabled = !openTarget;
    actions.appendChild(openBtn);

    wrapper.append(title, meta, actions);
    duplicateCertList.appendChild(wrapper);
  });
}

function closeDuplicateCertificateDialog({ keepPending = false } = {}) {
  if (!keepPending) {
    pendingDuplicateCertificate = null;
  }
  setDuplicateCertStatus("", "info");
  if (
    duplicateCertDialog &&
    typeof duplicateCertDialog.close === "function" &&
    duplicateCertDialog.open
  ) {
    duplicateCertDialog.close();
  }
}

function openDuplicateCertificateDialog(prepared, duplicates) {
  if (!duplicateCertDialog || !duplicateCertForm) return;

  pendingDuplicateCertificate = {
    prepared,
    duplicates: Array.isArray(duplicates) ? duplicates : [],
  };

  if (duplicateCertMessage) {
    duplicateCertMessage.textContent =
      "Já existem certificados emitidos com o mesmo nome, curso e data na secretaria ativa.";
  }
  if (duplicateCertSummary) {
    duplicateCertSummary.textContent =
      `${pendingDuplicateCertificate.duplicates.length} certificado(s) semelhante(s) encontrado(s). ` +
      "Abra um existente para reimpressão ou escolha gerar mesmo assim.";
  }

  renderDuplicateCertificateList(pendingDuplicateCertificate.duplicates);
  setDuplicateCertStatus("", "info");
  if (typeof duplicateCertDialog.showModal === "function") {
    duplicateCertDialog.showModal();
  }
}

function closeBatchConfirmDialog() {
  pendingBatchGeneration = null;
  if (batchConfirmForm) batchConfirmForm.reset();
  setBatchConfirmStatus("", "info");
  if (
    batchConfirmDialog &&
    typeof batchConfirmDialog.close === "function" &&
    batchConfirmDialog.open
  ) {
    batchConfirmDialog.close();
  }
}

function scrollAdminFormIntoView(form) {
  if (!form || typeof form.scrollIntoView !== "function") return;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncUserRoleUi() {
  if (!userRoleSelect || !userSecretariasSelect) return;

  const isAdmin = userRoleSelect.value === "admin_global";
  userSecretariasSelect.disabled = isAdmin;
  if (isAdmin) {
    setMultiSelectValues(userSecretariasSelect, []);
  }
  renderUserSecretariasChecklist();
}

function syncUserFormState() {
  const isEditing = Boolean(sanitizeText(userEditIdInput ? userEditIdInput.value : ""));
  if (userForm) {
    userForm.classList.toggle("is-editing", isEditing);
  }
  if (userSubmitBtn) {
    userSubmitBtn.textContent = isEditing ? "Atualizar Usuário" : "Salvar Usuário";
  }
  syncUserRoleUi();
}

function syncSecretariaFormState() {
  const isEditing = Boolean(
    sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "")
  );
  if (secretariaForm) {
    secretariaForm.classList.toggle("is-editing", isEditing);
  }
  if (secretariaSubmitBtn) {
    secretariaSubmitBtn.textContent = isEditing
      ? "Atualizar Secretaria"
      : "Salvar Secretaria";
  }
}

function resetUserForm() {
  if (userForm) userForm.reset();
  if (userEditIdInput) userEditIdInput.value = "";
  if (userActiveInput) userActiveInput.checked = true;
  if (userRoleSelect) userRoleSelect.value = "operador";
  if (userUsernameInput) userUsernameInput.disabled = false;
  if (userPasswordInput) {
    userPasswordInput.value = "";
    userPasswordInput.placeholder = "Obrigatória no cadastro";
  }
  setMultiSelectValues(userSecretariasSelect, []);
  syncUserFormState();
  setUserFormStatus("", "info");
}

function resetSecretariaForm() {
  if (secretariaForm) secretariaForm.reset();
  if (secretariaEditIdInput) secretariaEditIdInput.value = "";
  if (secretariaActiveInput) secretariaActiveInput.checked = true;
  syncSecretariaFormState();
  setSecretariaFormStatus("", "info");
}

function syncTemplateAdminFormState() {
  const editing = Boolean(
    sanitizeText(templateAdminEditIdInput ? templateAdminEditIdInput.value : "")
  );
  if (templateAdminSubmitBtn) {
    templateAdminSubmitBtn.textContent = editing ? "Atualizar Molde" : "Salvar Molde";
  }
  if (templateAdminSecretariaSelect) {
    templateAdminSecretariaSelect.disabled = editing;
  }
  if (templateAdminFileInput) {
    templateAdminFileInput.required = !editing;
  }
}

function resetTemplateAdminForm() {
  if (templateAdminForm) templateAdminForm.reset();
  if (templateAdminEditIdInput) templateAdminEditIdInput.value = "";
  if (templateAdminActiveInput) templateAdminActiveInput.checked = true;
  if (templateAdminDefaultInput) templateAdminDefaultInput.checked = false;
  if (templateAdminOrderInput) templateAdminOrderInput.value = "0";
  syncTemplateAdminFormState();
  setTemplateAdminStatus("", "info");
}

function syncSecretariaAssetFormState() {
  const editing = Boolean(
    sanitizeText(secretariaAssetEditIdInput ? secretariaAssetEditIdInput.value : "")
  );
  if (secretariaAssetForm) {
    secretariaAssetForm.classList.toggle("is-editing", editing);
  }
  if (secretariaAssetSubmitBtn) {
    secretariaAssetSubmitBtn.textContent = editing ? "Atualizar Item" : "Salvar Item";
  }
  if (secretariaAssetSecretariaSelect) {
    secretariaAssetSecretariaSelect.disabled = editing;
  }
  if (secretariaAssetTypeSelect) {
    secretariaAssetTypeSelect.disabled = editing;
  }
  if (secretariaAssetFileInput) {
    secretariaAssetFileInput.required = !editing;
  }
  syncSecretariaAssetTypeUi();
}

function syncSecretariaAssetTypeUi() {
  const tipo = sanitizeText(
    secretariaAssetTypeSelect ? secretariaAssetTypeSelect.value : "logo"
  ).toLowerCase();
  const isAssinatura = tipo === "assinatura";
  if (secretariaAssetNameLabel) {
    secretariaAssetNameLabel.textContent = isAssinatura
      ? "Nome da assinatura"
      : "Nome da logo";
  }
  if (secretariaAssetNameInput) {
    secretariaAssetNameInput.placeholder = isAssinatura
      ? "Ex.: Assinatura oficial da secretaria"
      : "Ex.: Logo institucional principal";
  }
}

function resetSecretariaAssetForm() {
  if (secretariaAssetForm) secretariaAssetForm.reset();
  if (secretariaAssetEditIdInput) secretariaAssetEditIdInput.value = "";
  if (secretariaAssetActiveInput) secretariaAssetActiveInput.checked = true;
  if (secretariaAssetDefaultInput) secretariaAssetDefaultInput.checked = false;
  if (secretariaAssetOrderInput) secretariaAssetOrderInput.value = "0";
  syncSecretariaAssetFormState();
  setSecretariaAssetAdminStatus("", "info");
}

function buildStatusPill(active, activeLabel = "Ativo", inactiveLabel = "Inativo") {
  const span = document.createElement("span");
  span.className = `status-pill ${active ? "ok" : "warn"}`;
  span.textContent = active ? activeLabel : inactiveLabel;
  return span;
}

function fillUserForm(usuario) {
  if (!usuario) return;
  if (userEditIdInput) userEditIdInput.value = String(usuario.id);
  if (userNameInput) userNameInput.value = usuario.nome || "";
  if (userUsernameInput) {
    userUsernameInput.value = usuario.username || "";
    userUsernameInput.disabled = true;
  }
  if (userPasswordInput) {
    userPasswordInput.value = "";
    userPasswordInput.placeholder = "Preencha somente para trocar a senha";
  }
  if (userRoleSelect) userRoleSelect.value = usuario.papel || "operador";
  if (userActiveInput) userActiveInput.checked = Boolean(usuario.ativo);
  setMultiSelectValues(
    userSecretariasSelect,
    (usuario.secretarias || []).map((secretaria) => secretaria.id)
  );
  syncUserFormState();
  setUserFormStatus(`Editando usuário ${usuario.username}.`, "info");
  scrollAdminFormIntoView(userForm);
}

function fillSecretariaForm(secretaria) {
  if (!secretaria) return;
  if (secretariaEditIdInput) secretariaEditIdInput.value = String(secretaria.id);
  if (secretariaSiglaInput) secretariaSiglaInput.value = secretaria.sigla || "";
  if (secretariaNameInput) secretariaNameInput.value = secretaria.nome || "";
  if (secretariaActiveInput) secretariaActiveInput.checked = Boolean(secretaria.ativa);
  syncSecretariaFormState();
  setSecretariaFormStatus(`Editando secretaria ${secretaria.sigla}.`, "info");
  scrollAdminFormIntoView(secretariaForm);
}

function fillTemplateAdminForm(template) {
  if (!template) return;
  if (templateAdminEditIdInput) templateAdminEditIdInput.value = String(template.id);
  if (templateAdminSecretariaSelect) {
    templateAdminSecretariaSelect.value = String(template.secretaria_id || "");
  }
  if (templateAdminNameInput) templateAdminNameInput.value = template.nome || "";
  if (templateAdminActiveInput) templateAdminActiveInput.checked = Boolean(template.ativo);
  if (templateAdminDefaultInput) templateAdminDefaultInput.checked = Boolean(template.padrao);
  if (templateAdminOrderInput) templateAdminOrderInput.value = String(template.ordem || 0);
  if (templateAdminFileInput) templateAdminFileInput.value = "";
  syncTemplateAdminFormState();
  setTemplateAdminStatus(
    `Editando molde ${template.nome}. Envie um novo arquivo somente se quiser substituí-lo.`,
    "info"
  );
  scrollAdminFormIntoView(templateAdminForm);
}

function fillSecretariaAssetForm(asset) {
  if (!asset) return;
  if (secretariaAssetEditIdInput) secretariaAssetEditIdInput.value = String(asset.id);
  if (secretariaAssetSecretariaSelect) {
    secretariaAssetSecretariaSelect.value = String(asset.secretaria_id || "");
  }
  if (secretariaAssetTypeSelect) {
    secretariaAssetTypeSelect.value = asset.tipo || "logo";
  }
  if (secretariaAssetNameInput) secretariaAssetNameInput.value = asset.nome || "";
  if (secretariaAssetActiveInput) secretariaAssetActiveInput.checked = Boolean(asset.ativo);
  if (secretariaAssetDefaultInput) secretariaAssetDefaultInput.checked = Boolean(asset.padrao);
  if (secretariaAssetOrderInput) secretariaAssetOrderInput.value = String(asset.ordem || 0);
  if (secretariaAssetFileInput) secretariaAssetFileInput.value = "";
  syncSecretariaAssetFormState();
  setSecretariaAssetAdminStatus(
    `Editando ${asset.tipo} ${asset.nome}. Envie um novo arquivo somente se quiser substituí-lo.`,
    "info"
  );
  scrollAdminFormIntoView(secretariaAssetForm);
}

function renderCertificateRows(items) {
  if (!certListBody) return;

  if (!items.length) {
    certListBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">Nenhum certificado encontrado com os filtros atuais.</td>
      </tr>
    `;
    return;
  }

  certListBody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    const codeCell = document.createElement("td");
    codeCell.className = "cert-col-code";
    const codeChip = document.createElement("span");
    codeChip.className = "code-chip";
    codeChip.textContent = item.codigo || "-";
    codeCell.appendChild(codeChip);

    const nameCell = document.createElement("td");
    nameCell.className = "cert-name-cell";

    const nameTitle = document.createElement("strong");
    nameTitle.className = "cert-name-title";
    nameTitle.textContent = item.nome || "-";

    const nameMeta = document.createElement("div");
    nameMeta.className = "table-mobile-meta";
    const mobileMeta = [
      `Secretaria: ${item.secretaria_sigla || "-"}`,
      `Conclusão: ${formatDate(item.concluido)}`,
      `Emitido em: ${formatDateTime(item.emitido_em)}`,
      `Emitido por: ${item.emitido_por_username || "-"}`,
    ];
    mobileMeta.forEach((text) => {
      const metaLine = document.createElement("span");
      metaLine.className = "table-mobile-meta-item";
      metaLine.textContent = text;
      nameMeta.appendChild(metaLine);
    });

    nameCell.append(nameTitle, nameMeta);

    const courseCell = document.createElement("td");
    courseCell.className = "cert-col-course";
    courseCell.textContent = item.curso || "-";

    const secretariaCell = document.createElement("td");
    secretariaCell.className = "cert-col-secondary";
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const concluidoCell = document.createElement("td");
    concluidoCell.className = "cert-col-secondary";
    concluidoCell.textContent = formatDate(item.concluido);

    const emittedCell = document.createElement("td");
    emittedCell.className = "cert-col-secondary";
    emittedCell.textContent = formatDateTime(item.emitido_em);

    const emittedByCell = document.createElement("td");
    emittedByCell.className = "cert-col-secondary";
    emittedByCell.textContent = item.emitido_por_username || "-";

    const fileCell = document.createElement("td");
    fileCell.className = "cert-col-status";
    fileCell.appendChild(
      buildStatusPill(item.arquivo_disponivel, "PNG salvo", "Sem PNG")
    );

    const actionsCell = document.createElement("td");
    actionsCell.className = "cert-col-actions";
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions cert-actions";

    actionsWrap.appendChild(
      createInlineButton("Validar", () => {
        window.open(item.url_validacao, "_blank", "noopener,noreferrer");
      })
    );

    const pngButton = createInlineButton("Abrir PNG", () => {
      if (item.arquivo_admin_url || item.arquivo_url) {
        window.open(item.arquivo_admin_url || item.arquivo_url, "_blank", "noopener,noreferrer");
      }
    });
    pngButton.disabled = !(item.arquivo_admin_url || item.arquivo_url);
    actionsWrap.appendChild(pngButton);

    const preencherButton = createInlineButton("Preencher", () => {
      const nomeInput = document.getElementById("nome");
      const cursoInput = document.getElementById("curso");
      const dataInput = document.getElementById("data");
      if (nomeInput) nomeInput.value = item.nome || "";
      if (cursoInput) cursoInput.value = item.curso || "";
      if (dataInput) dataInput.value = item.concluido || "";
      if (cargaHInput) cargaHInput.value = item.carga_h || 0;
      switchSection("generator");
    });
    actionsWrap.appendChild(preencherButton);

    if (isAdminSession()) {
      actionsWrap.appendChild(
        createInlineButton(
          "Excluir",
          () => {
            openDeleteCertificateDialog(item);
          },
          "danger-btn"
        )
      );
    }

    actionsCell.appendChild(actionsWrap);

    row.append(
      codeCell,
      nameCell,
      courseCell,
      secretariaCell,
      concluidoCell,
      emittedCell,
      emittedByCell,
      fileCell,
      actionsCell
    );

    certListBody.appendChild(row);
  });
}

function renderUsersTable() {
  if (!userListBody) return;

  if (!adminState.users.length) {
    userListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhum usuário cadastrado.</td>
      </tr>
    `;
    return;
  }

  userListBody.innerHTML = "";

  adminState.users.forEach((usuario) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = usuario.nome || "-";

    const usernameCell = document.createElement("td");
    usernameCell.textContent = usuario.username || "-";

    const roleCell = document.createElement("td");
    roleCell.textContent = usuario.papel || "-";

    const secretariasCell = document.createElement("td");
    secretariasCell.textContent = (usuario.secretarias || []).length
      ? usuario.secretarias.map((secretaria) => secretaria.sigla).join(", ")
      : "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(usuario.ativo));

    const loginCell = document.createElement("td");
    loginCell.textContent = formatDateTime(usuario.ultimo_login_em);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillUserForm(usuario);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          void deleteUser(usuario);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(
      nameCell,
      usernameCell,
      roleCell,
      secretariasCell,
      statusCell,
      loginCell,
      actionsCell
    );
    userListBody.appendChild(row);
  });
}

function renderSecretariasTable() {
  if (!secretariaListBody) return;

  if (!adminState.secretarias.length) {
    secretariaListBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Nenhuma secretaria cadastrada.</td>
      </tr>
    `;
    return;
  }

  secretariaListBody.innerHTML = "";

  adminState.secretarias.forEach((secretaria) => {
    const row = document.createElement("tr");

    const siglaCell = document.createElement("td");
    siglaCell.textContent = secretaria.sigla || "-";

    const nomeCell = document.createElement("td");
    nomeCell.textContent = secretaria.nome || "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(secretaria.ativa));

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillSecretariaForm(secretaria);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          void deleteSecretaria(secretaria);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(siglaCell, nomeCell, statusCell, actionsCell);
    secretariaListBody.appendChild(row);
  });
}

function renderTemplatesTable() {
  if (!templateAdminListBody) return;

  if (!adminState.templates.length) {
    templateAdminListBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Nenhum molde cadastrado até o momento.</td>
      </tr>
    `;
    return;
  }

  templateAdminListBody.innerHTML = "";

  adminState.templates.forEach((template) => {
    const row = document.createElement("tr");

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = template.secretaria_sigla || "-";

    const nomeCell = document.createElement("td");
    nomeCell.textContent = template.nome || "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(template.ativo));

    const defaultCell = document.createElement("td");
    defaultCell.appendChild(buildStatusPill(template.padrao, "Padrão", "Opcional"));

    const orderCell = document.createElement("td");
    orderCell.textContent = String(template.ordem || 0);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Abrir", () => {
        window.open(template.arquivo_url, "_blank", "noopener,noreferrer");
      })
    );
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillTemplateAdminForm(template);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          const confirmado = window.confirm(
            `Excluir o molde ${template.nome} da secretaria ${template.secretaria_sigla}?`
          );
          if (!confirmado) return;
          void deleteTemplate(template);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(secretariaCell, nomeCell, statusCell, defaultCell, orderCell, actionsCell);
    templateAdminListBody.appendChild(row);
  });
}

function renderSecretariaAssetsTable() {
  if (!secretariaAssetListBody) return;

  if (!adminState.secretariaAssets.length) {
    secretariaAssetListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhuma logo ou assinatura cadastrada até o momento.</td>
      </tr>
    `;
    return;
  }

  secretariaAssetListBody.innerHTML = "";

  adminState.secretariaAssets.forEach((asset) => {
    const row = document.createElement("tr");

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = asset.secretaria_sigla || "-";

    const tipoCell = document.createElement("td");
    const tipoPill = document.createElement("span");
    tipoPill.className = "asset-type-pill";
    tipoPill.textContent = asset.tipo || "-";
    tipoCell.appendChild(tipoPill);

    const nomeCell = document.createElement("td");
    nomeCell.textContent = asset.nome || "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(asset.ativo));

    const defaultCell = document.createElement("td");
    defaultCell.appendChild(buildStatusPill(asset.padrao, "Padrão", "Opcional"));

    const orderCell = document.createElement("td");
    orderCell.textContent = String(asset.ordem || 0);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Abrir", () => {
        window.open(asset.arquivo_url, "_blank", "noopener,noreferrer");
      })
    );
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillSecretariaAssetForm(asset);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        async () => {
          const confirmado = window.confirm(
            `Excluir ${asset.tipo} ${asset.nome} da secretaria ${asset.secretaria_sigla}?`
          );
          if (!confirmado) return;
          await deleteSecretariaAsset(asset);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(secretariaCell, tipoCell, nomeCell, statusCell, defaultCell, orderCell, actionsCell);
    secretariaAssetListBody.appendChild(row);
  });
}

function renderAuditRows(items) {
  if (!auditListBody) return;

  if (!items.length) {
    auditListBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Nenhum evento de auditoria encontrado.</td>
      </tr>
    `;
    return;
  }

  auditListBody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    const whenCell = document.createElement("td");
    whenCell.textContent = formatDateTime(item.criado_em);

    const eventCell = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = "code-chip";
    chip.textContent = item.evento || "-";
    eventCell.appendChild(chip);

    const userCell = document.createElement("td");
    userCell.textContent = item.usuario_username || item.usuario_nome || "-";

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const certCell = document.createElement("td");
    certCell.textContent = item.certificado_codigo || "-";

    const detailsCell = document.createElement("td");
    detailsCell.textContent = item.descricao || "-";

    row.append(whenCell, eventCell, userCell, secretariaCell, certCell, detailsCell);
    auditListBody.appendChild(row);
  });
}

async function loadCertificates(page = certListState.page) {
  if (!sessionState) return;

  certListState.page = page;
  syncCertificateFilterInputsFromState();
  setCertListStatus("Carregando certificados...", "info");

  try {
    const payload = await apiJsonRequest(
      `/api/certificados${buildQueryString({
        pagina: certListState.page,
        por_pagina: certListState.perPage,
        busca: certListState.filters.busca,
        secretaria_id: certListState.filters.secretariaId,
        concluido_de: certListState.filters.concluidoDe,
        concluido_ate: certListState.filters.concluidoAte,
        emitido_de: certListState.filters.emitidoDe,
        emitido_ate: certListState.filters.emitidoAte,
        somente_com_arquivo: certListState.filters.somenteComArquivo || "",
      })}`
    );

    certListState.total = payload.total || 0;
    certListState.totalPages = payload.paginas || 1;
    renderCertificateRows(payload.itens || []);

    if (certListSummary) {
      certListSummary.textContent = `${certListState.total} certificado(s) encontrado(s)`;
    }
    if (certPageIndicator) {
      certPageIndicator.textContent = `Página ${payload.pagina} de ${payload.paginas}`;
    }
    if (certPrevPageBtn) certPrevPageBtn.disabled = payload.pagina <= 1;
    if (certNextPageBtn) certNextPageBtn.disabled = payload.pagina >= payload.paginas;
    setCertListStatus("", "info");
  } catch (error) {
    console.error(error);
    if (unresolvedCertificates.size) {
      await cleanupPendingCertificates(Array.from(unresolvedCertificates.values()));
    }
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setCertListStatus(
      (error && error.message) || "Nao foi possivel carregar os certificados.",
      "error"
    );
  }
}

async function loadAuditEvents(page = auditState.page) {
  if (!sessionState || !isAdminSession()) return;

  auditState.page = page;
  syncAuditFilterInputsFromState();
  setAuditStatus("Carregando auditoria...", "info");

  try {
    const payload = await apiJsonRequest(
      `/api/admin/auditoria${buildQueryString({
        pagina: auditState.page,
        por_pagina: auditState.perPage,
        busca: auditState.filters.busca,
        evento: auditState.filters.evento,
        secretaria_id: auditState.filters.secretariaId,
        criado_de: auditState.filters.criadoDe,
        criado_ate: auditState.filters.criadoAte,
      })}`
    );

    auditState.total = payload.total || 0;
    auditState.totalPages = payload.paginas || 1;
    renderAuditRows(payload.itens || []);
    if (auditSummary) {
      auditSummary.textContent = `${auditState.total} evento(s)`;
    }
    if (auditPageIndicator) {
      auditPageIndicator.textContent = `Página ${payload.pagina} de ${payload.paginas}`;
    }
    if (auditPrevPageBtn) auditPrevPageBtn.disabled = payload.pagina <= 1;
    if (auditNextPageBtn) auditNextPageBtn.disabled = payload.pagina >= payload.paginas;
    setAuditStatus("", "info");
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    if (error && error.status === 403) {
      if (auditListBody) {
        auditListBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">A auditoria é restrita ao administrador.</td>
          </tr>
        `;
      }
      if (auditTab) auditTab.hidden = true;
      if (currentSection === "audit") switchSection("generator");
      return;
    }
    setAuditStatus(
      (error && error.message) || "Nao foi possivel carregar a auditoria.",
      "error"
    );
  }
}

async function loadAdminData() {
  if (!sessionState || !isAdminSession()) return;

  try {
    const editingUserId = sanitizeText(userEditIdInput ? userEditIdInput.value : "");
    const editingSecretariaId = sanitizeText(
      secretariaEditIdInput ? secretariaEditIdInput.value : ""
    );
    const editingTemplateId = sanitizeText(
      templateAdminEditIdInput ? templateAdminEditIdInput.value : ""
    );
    const editingSecretariaAssetId = sanitizeText(
      secretariaAssetEditIdInput ? secretariaAssetEditIdInput.value : ""
    );
    const [secretarias, usuarios, templates, secretariaAssets] = await Promise.all([
      apiJsonRequest("/api/admin/secretarias"),
      apiJsonRequest("/api/admin/usuarios"),
      apiJsonRequest("/api/admin/templates"),
      apiJsonRequest("/api/admin/secretaria-assets"),
    ]);

    adminState.secretarias = Array.isArray(secretarias) ? secretarias : [];
    adminState.users = Array.isArray(usuarios) ? usuarios : [];
    adminState.templates = Array.isArray(templates) ? templates : [];
    adminState.secretariaAssets = Array.isArray(secretariaAssets) ? secretariaAssets : [];
    populateSecretariaOptions(
      userSecretariasSelect,
      adminState.secretarias.filter((secretaria) => secretaria.ativa),
      "",
      false
    );
    populateSecretariaOptions(
      templateAdminSecretariaSelect,
      adminState.secretarias,
      templateAdminSecretariaSelect ? templateAdminSecretariaSelect.value : "",
      false
    );
    populateSecretariaOptions(
      secretariaAssetSecretariaSelect,
      adminState.secretarias,
      secretariaAssetSecretariaSelect ? secretariaAssetSecretariaSelect.value : "",
      false
    );
    populateSecretariaOptions(
      auditSecretariaSelect,
      adminState.secretarias,
      auditState.filters.secretariaId,
      true
    );
    renderUserSecretariasChecklist();
    renderSecretariasTable();
    renderUsersTable();
    renderTemplatesTable();
    renderSecretariaAssetsTable();

    if (editingUserId) {
      const currentUser = adminState.users.find((usuario) => String(usuario.id) === editingUserId);
      if (currentUser) {
        fillUserForm(currentUser);
      }
    }

    if (editingSecretariaId) {
      const currentSecretaria = adminState.secretarias.find(
        (secretaria) => String(secretaria.id) === editingSecretariaId
      );
      if (currentSecretaria) {
        fillSecretariaForm(currentSecretaria);
      }
    }

    if (editingTemplateId) {
      const currentTemplate = adminState.templates.find(
        (template) => String(template.id) === editingTemplateId
      );
      if (currentTemplate) {
        fillTemplateAdminForm(currentTemplate);
      }
    }

    if (editingSecretariaAssetId) {
      const currentAsset = adminState.secretariaAssets.find(
        (asset) => String(asset.id) === editingSecretariaAssetId
      );
      if (currentAsset) {
        fillSecretariaAssetForm(currentAsset);
      }
    }

    await loadAuditEvents(auditState.page || 1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    if (error && error.status === 403) {
      if (adminTab) adminTab.hidden = true;
      if (auditTab) auditTab.hidden = true;
      if (isAdminOnlySection(currentSection)) switchSection("generator");
      return;
    }
    setUserFormStatus(
      (error && error.message) || "Nao foi possivel carregar os usuarios.",
      "error"
    );
    setSecretariaFormStatus(
      (error && error.message) || "Nao foi possivel carregar as secretarias.",
      "error"
    );
    setTemplateAdminStatus(
      (error && error.message) || "Nao foi possivel carregar os moldes.",
      "error"
    );
    setSecretariaAssetAdminStatus(
      (error && error.message) || "Nao foi possivel carregar logos e assinaturas.",
      "error"
    );
  }
}

async function applySavedTemplateSelection(templateId, options = {}) {
  const { silentStatus = false } = options;
  const normalizedId = templateId ? String(templateId) : "";
  templateCatalogState.selectedId = normalizedId;
  if (templateSelect) {
    templateSelect.value = normalizedId;
  }
  if (!assets.template) {
    setTemplateStatus("", "info");
  }

  if (!normalizedId) {
    savedTemplate = null;
    savedTemplateImage = null;
    if (!silentStatus) {
      const fallbackMessage = templateCatalogState.items.length
        ? ""
        : "A secretaria ativa ainda não tem moldes cadastrados. Você pode usar um arquivo temporário nesta emissão.";
      setTemplateSelectStatus(fallbackMessage, "info");
    }
    await renderLastCertificate();
    return;
  }

  const template = templateCatalogState.items.find(
    (item) => String(item.id) === normalizedId
  );
  if (!template) {
    savedTemplate = null;
    savedTemplateImage = null;
    templateCatalogState.selectedId = "";
    if (templateSelect) templateSelect.value = "";
    if (!silentStatus) {
      setTemplateSelectStatus("O modelo selecionado nao esta mais disponivel.", "error");
    }
    await renderLastCertificate();
    return;
  }

  try {
    if (!silentStatus) {
      setTemplateSelectStatus(`Carregando modelo ${template.nome}...`, "info");
    }
    const response = await fetch(template.arquivo_url, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = new Error(`Falha ao carregar o molde (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    const blob = await response.blob();
    savedTemplateImage = await loadImageFromBlob(blob);
    savedTemplate = template;
    if (!silentStatus) {
      const suffix = assets.template
        ? " O molde temporário local continua sobrescrevendo esta seleção na prévia."
        : "";
      setTemplateSelectStatus(`Modelo ${template.nome} pronto para uso.${suffix}`, "success");
    }
    await renderLastCertificate();
  } catch (error) {
    console.error(error);
    savedTemplate = null;
    savedTemplateImage = null;
    if (!silentStatus) {
      let message =
        (error && error.message) || "Nao foi possivel carregar o modelo selecionado.";
      if (error && error.status === 404) {
        message =
          "O arquivo do molde cadastrado nao foi encontrado no servidor. Reenvie o molde na administracao.";
      }
      setTemplateSelectStatus(
        message,
        "error"
      );
    }
  }
}

async function loadAvailableTemplates() {
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    templateCatalogState.items = [];
    templateCatalogState.selectedId = "";
    savedTemplate = null;
    savedTemplateImage = null;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) populateTemplateOptions(templateSelect, [], "", true);
    setTemplateSelectStatus(
      "Selecione uma secretaria para usar um molde cadastrado ou enviar um arquivo temporário.",
      "info"
    );
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/templates${buildQueryString({ secretaria_id: sessionState.secretaria_ativa_id })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    templateCatalogState.items = items;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) {
      populateTemplateOptions(templateSelect, items, templateCatalogState.selectedId, true);
    }

    const currentSelected = items.find(
      (item) => String(item.id) === String(templateCatalogState.selectedId || "")
    );
    const defaultTemplate = items.find((item) => item.padrao) || items[0] || null;
    const nextTemplateId = currentSelected
      ? String(currentSelected.id)
      : defaultTemplate
        ? String(defaultTemplate.id)
        : "";

    await applySavedTemplateSelection(nextTemplateId, { silentStatus: false });
  } catch (error) {
    console.error(error);
    templateCatalogState.items = [];
    templateCatalogState.selectedId = "";
    savedTemplate = null;
    savedTemplateImage = null;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) populateTemplateOptions(templateSelect, [], "", true);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setTemplateSelectStatus(
      (error && error.message) || "Nao foi possivel carregar os modelos da secretaria.",
      "error"
    );
  }
}

async function applySavedSecretariaAssetSelection(type, assetId, options = {}) {
  const { silentStatus = false } = options;
  const ui = getSecretariaAssetUi(type);
  const catalog = getSecretariaAssetCatalog(type);
  const normalizedId = assetId ? String(assetId) : "";
  catalog.selectedId = normalizedId;
  if (ui.select) {
    ui.select.value = normalizedId;
  }
  if (!assets[type]) {
    ui.setManualStatus("", "info");
  }

  if (!normalizedId) {
    setSavedSecretariaAsset(type, null, null);
    if (!silentStatus) {
      const fallbackMessage = catalog.items.length
        ? ""
        : `A secretaria ativa ainda não tem ${ui.pluralLabel} cadastradas. Você pode usar uma ${ui.label} temporária nesta emissão.`;
      ui.setSelectStatus(fallbackMessage, "info");
    }
    await renderLastCertificate();
    return;
  }

  const asset = catalog.items.find((item) => String(item.id) === normalizedId);
  if (!asset) {
    setSavedSecretariaAsset(type, null, null);
    catalog.selectedId = "";
    if (ui.select) ui.select.value = "";
    if (!silentStatus) {
      ui.setSelectStatus(`A ${ui.label} selecionada não está mais disponível.`, "error");
    }
    await renderLastCertificate();
    return;
  }

  try {
    if (!silentStatus) {
      ui.setSelectStatus(`Carregando ${ui.label} ${asset.nome}...`, "info");
    }
    const response = await fetch(asset.arquivo_url, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = new Error(`Falha ao carregar a ${ui.label} (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    const blob = await response.blob();
    const image = await loadImageFromBlob(blob);
    setSavedSecretariaAsset(type, asset, image);
    if (!silentStatus) {
      const manualOverride = assets[type]
        ? ` A ${ui.label} temporária local continua sobrescrevendo esta seleção na prévia.`
        : "";
      ui.setSelectStatus(
        `${ui.label.charAt(0).toUpperCase() + ui.label.slice(1)} ${asset.nome} pronta para uso.${manualOverride}`,
        "success"
      );
    }
    await renderLastCertificate();
  } catch (error) {
    console.error(error);
    setSavedSecretariaAsset(type, null, null);
    if (!silentStatus) {
      let message = (error && error.message) || `Não foi possível carregar a ${ui.label} selecionada.`;
      if (error && error.status === 404) {
        message = ui.missingFileMessage;
      }
      ui.setSelectStatus(message, "error");
    }
    await renderLastCertificate();
  }
}

async function loadAvailableSecretariaAssetType(type) {
  const ui = getSecretariaAssetUi(type);
  const catalog = getSecretariaAssetCatalog(type);
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    catalog.items = [];
    catalog.selectedId = "";
    setSavedSecretariaAsset(type, null, null);
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, [], "", true);
    ui.setSelectStatus(
      `Selecione uma secretaria para usar ${ui.pluralLabel} cadastradas ou enviar um arquivo temporário.`,
      "info"
    );
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/secretaria-assets${buildQueryString({
        tipo: type,
        secretaria_id: sessionState.secretaria_ativa_id,
      })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    catalog.items = items;
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, items, catalog.selectedId, true);

    const currentSelected = items.find(
      (item) => String(item.id) === String(catalog.selectedId || "")
    );
    const defaultItem = items.find((item) => item.padrao) || items[0] || null;
    const nextAssetId = currentSelected
      ? String(currentSelected.id)
      : defaultItem
        ? String(defaultItem.id)
        : "";
    await applySavedSecretariaAssetSelection(type, nextAssetId, { silentStatus: false });
  } catch (error) {
    console.error(error);
    catalog.items = [];
    catalog.selectedId = "";
    setSavedSecretariaAsset(type, null, null);
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, [], "", true);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    ui.setSelectStatus(
      (error && error.message) || `Não foi possível carregar as ${ui.pluralLabel} da secretaria.`,
      "error"
    );
  }
}

async function loadAvailableSecretariaAssets() {
  await loadAvailableSecretariaAssetType("logo");
  await loadAvailableSecretariaAssetType("assinatura");
}

async function deleteTemplate(template) {
  if (!template) return;

  try {
    const payload = await apiJsonRequest(`/api/admin/templates/${template.id}`, {
      method: "DELETE",
      body: "{}",
    });
    setTemplateAdminStatus(
      (payload && payload.message) || `Molde ${template.nome} excluido com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAvailableTemplates();
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
      setTemplateAdminStatus(
        (error && error.message) || "Nao foi possivel excluir o molde.",
        "error"
      );
    }
  }

async function deleteSecretariaAsset(asset) {
  if (!asset) return;

  try {
    const payload = await apiJsonRequest(`/api/admin/secretaria-assets/${asset.id}`, {
      method: "DELETE",
      body: "{}",
    });
    setSecretariaAssetAdminStatus(
      (payload && payload.message) || `${asset.tipo} ${asset.nome} excluída com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAvailableSecretariaAssets();
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setSecretariaAssetAdminStatus(
      (error && error.message) || "Nao foi possivel excluir o item.",
      "error"
    );
  }
}

async function deleteUser(usuario) {
  if (!usuario || !isAdminSession()) return;

  const confirmed = window.confirm(
    `Excluir o usuário ${usuario.username}? Os certificados já emitidos continuarão no histórico, mas ficarão sem vínculo com esse usuário.`
  );
  if (!confirmed) return;

  try {
    setUserFormStatus(`Excluindo usuário ${usuario.username}...`, "info");
    const payload = await apiJsonRequest(`/api/admin/usuarios/${usuario.id}`, {
      method: "DELETE",
      body: "{}",
    });
    if (sanitizeText(userEditIdInput ? userEditIdInput.value : "") === String(usuario.id)) {
      resetUserForm();
    }
    setUserFormStatus(
      (payload && payload.message) || `Usuário ${usuario.username} excluído com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAuditEvents(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setUserFormStatus(
      (error && error.message) || "Nao foi possivel excluir o usuario.",
      "error"
    );
  }
}

async function deleteSecretaria(secretaria) {
  if (!secretaria || !isAdminSession()) return;

  const confirmed = window.confirm(
    `Excluir a secretaria ${secretaria.sigla}? Isso removerá os moldes dela e desvinculará os usuários. Se houver certificados emitidos, a exclusão será bloqueada.`
  );
  if (!confirmed) return;

  try {
    setSecretariaFormStatus(`Excluindo secretaria ${secretaria.sigla}...`, "info");
    const payload = await apiJsonRequest(`/api/admin/secretarias/${secretaria.id}`, {
      method: "DELETE",
      body: "{}",
    });
    if (
      sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "") ===
      String(secretaria.id)
    ) {
      resetSecretariaForm();
    }
    setSecretariaFormStatus(
      (payload && payload.message) || `Secretaria ${secretaria.sigla} excluída com sucesso.`,
      "success"
    );
    await refreshSession();
    await loadAdminData();
    await loadAvailableTemplates();
    await loadAuditEvents(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setSecretariaFormStatus(
      (error && error.message) || "Nao foi possivel excluir a secretaria.",
      "error"
    );
  }
}

async function refreshProtectedData(options = {}) {
  if (!sessionState) return;

  await loadAvailableTemplates();
  await loadAvailableSecretariaAssets();
  await loadCertificates(options.page || certListState.page || 1);
  if (isAdminSession()) {
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

function scaleHeightByWidth(width, ratio) {
  return Math.max(1, Math.round(width * ratio));
}

function updateControlLabels() {
  if (logoXVal) logoXVal.textContent = `${layout.logo.x} px`;
  if (logoYVal) logoYVal.textContent = `${layout.logo.y} px`;
  if (logoSizeVal) logoSizeVal.textContent = `${layout.logo.maxW} px`;
  if (assinaturaXVal) assinaturaXVal.textContent = `${layout.assinatura.x} px`;
  if (assinaturaYVal) assinaturaYVal.textContent = `${layout.assinatura.y} px`;
  if (assinaturaSizeVal) assinaturaSizeVal.textContent = `${layout.assinatura.maxW} px`;
}

function applyLayoutFromControls() {
  if (isBatchRunning) return;
  if (logoXInput) layout.logo.x = Number(logoXInput.value);
  if (logoYInput) layout.logo.y = Number(logoYInput.value);
  if (logoSizeInput) {
    layout.logo.maxW = Number(logoSizeInput.value);
    layout.logo.maxH = scaleHeightByWidth(layout.logo.maxW, logoAspectRatio);
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

  updateControlLabels();
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
    qrText: "",
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
  const activeAssinaturaImage = getActiveAssinaturaImage();

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
  ctx.fillText("CERTIFICADO", centerX, 190);

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

  ctx.beginPath();
  ctx.moveTo(180, 700);
  ctx.lineTo(480, 700);
  ctx.moveTo(720, 700);
  ctx.lineTo(1020, 700);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (activeAssinaturaImage) {
    drawCenteredImage(
      activeAssinaturaImage,
      layout.assinatura.x,
      layout.assinatura.y,
      layout.assinatura.maxW,
      layout.assinatura.maxH
    );
  }

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

  ctx.font = "22px Arial";
  ctx.fillStyle = "#444";
  ctx.fillText("Assinatura do Responsável", 330, 735);
  ctx.fillText("Instituição", 870, 735);
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
}

async function handleAssetChange(input, key, options = {}) {
  if (!input) return;
  const file = input.files[0];

  if (!file) {
    assets[key] = null;
    syncTemplateControls();
    if (key === "template") {
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
    }
    void renderLastCertificate();
    return;
  }

  try {
    if (key === "template") {
      validateTemplateFile(file);
    } else {
      validateVisualAssetFile(file, key);
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

if (!form || !downloadBtn || !canvas || !ctx) {
  alert("Erro de inicialização. Recarregue com Ctrl+F5.");
} else {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isBatchRunning || isSingleGenerationRunning) return;
    if (!sessionState) {
      await handleUnauthorized();
      return;
    }

    const nomeInput = document.getElementById("nome");
    const cursoInput = document.getElementById("curso");
    const dataInput = document.getElementById("data");

    const nome = nomeInput ? nomeInput.value.trim() : "";
    const curso = cursoInput ? cursoInput.value.trim() : "";
    const data = dataInput ? dataInput.value : "";
    const cargaResult = getFormCargaHorariaResult();
    if (cargaResult.invalid) {
      setBatchStatus(
        `A carga horária deve estar entre 0 e ${MAX_CARGA_HORARIA} horas.`,
        "error"
      );
      return;
    }
    const cargaH = cargaResult.value ?? 0;

    if (!nome || !curso || !data) return;

    try {
      const textoLinha1 = textoLinha1Input ? textoLinha1Input.value.trim() : "";
      const textoLinha2 = textoLinha2Input ? textoLinha2Input.value.trim() : "";
      const prepared = {
        nome,
        curso,
        data,
        cargaH,
        linha1: textoLinha1 || defaultTextoLinha1,
        linha2: textoLinha2 || defaultTextoLinha2,
      };

      setBatchStatus("Verificando possíveis certificados já emitidos...", "info");
      const duplicates = await findPossibleDuplicateCertificates(prepared);
      if (duplicates.length) {
        setBatchStatus(
          `Encontramos ${duplicates.length} certificado(s) semelhante(s) já emitido(s).`,
          "error"
        );
        openDuplicateCertificateDialog(prepared, duplicates);
        return;
      }

      await executeSingleCertificateGeneration(prepared);
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      setBatchStatus(
        (error && error.message) || "Nao foi possivel verificar certificados semelhantes.",
        "error"
      );
    }
  });

  if (logoInput) {
    logoInput.addEventListener("change", () => {
      void handleAssetChange(logoInput, "logo");
    });
  }

  if (logoSelect) {
    logoSelect.addEventListener("change", () => {
      void applySavedSecretariaAssetSelection("logo", logoSelect.value);
    });
  }

  if (logoRemoveBtn) {
    logoRemoveBtn.addEventListener("click", () => {
      assets.logo = null;
      if (logoInput) logoInput.value = "";
      syncTemplateControls();
      const message = savedLogo
        ? `Logo temporária removida. O preview voltou a usar a logo ${savedLogo.nome}.`
        : "Logo temporária removida. O preview voltou a usar a configuração padrão da tela.";
      setLogoStatus(message, "info");
      void renderLastCertificate();
    });
  }

  if (templateInput) {
    templateInput.addEventListener("change", () => {
      void handleAssetChange(templateInput, "template", { trim: false });
    });
  }

  if (templateSelect) {
    templateSelect.addEventListener("change", () => {
      void applySavedTemplateSelection(templateSelect.value);
    });
  }

  if (templateRemoveBtn) {
    templateRemoveBtn.addEventListener("click", () => {
      assets.template = null;
      if (templateInput) templateInput.value = "";
      syncTemplateControls();
      const message = savedTemplate
        ? `Molde temporário removido. O preview voltou a usar o modelo ${savedTemplate.nome}.`
        : "Molde temporário removido. O preview voltou a usar o fundo padrão do certificado.";
      setTemplateStatus(message, "info");
      void renderLastCertificate();
    });
  }

  if (assinaturaInput) {
    assinaturaInput.addEventListener("change", () => {
      void handleAssetChange(assinaturaInput, "assinatura");
    });
  }

  if (assinaturaSelect) {
    assinaturaSelect.addEventListener("change", () => {
      void applySavedSecretariaAssetSelection("assinatura", assinaturaSelect.value);
    });
  }

  if (assinaturaRemoveBtn) {
    assinaturaRemoveBtn.addEventListener("click", () => {
      assets.assinatura = null;
      if (assinaturaInput) assinaturaInput.value = "";
      syncTemplateControls();
      const message = savedAssinatura
        ? `Assinatura temporária removida. O preview voltou a usar a assinatura ${savedAssinatura.nome}.`
        : "Assinatura temporária removida. O preview voltou a usar a configuração padrão da tela.";
      setAssinaturaStatus(message, "info");
      void renderLastCertificate();
    });
  }

  if (logoXInput) logoXInput.addEventListener("input", applyLayoutFromControls);
  if (logoYInput) logoYInput.addEventListener("input", applyLayoutFromControls);
  if (logoSizeInput) logoSizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaXInput) assinaturaXInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaYInput) assinaturaYInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaSizeInput) assinaturaSizeInput.addEventListener("input", applyLayoutFromControls);

  if (textoLinha1Input) {
    textoLinha1Input.addEventListener("input", () => {
      if (isBatchRunning) return;
      if (lastData) {
        lastData.linha1 = textoLinha1Input.value.trim() || defaultTextoLinha1;
      }
      void renderLastCertificate();
    });
  }

  if (textoLinha2Input) {
    textoLinha2Input.addEventListener("input", () => {
      if (isBatchRunning) return;
      if (lastData) {
        lastData.linha2 = textoLinha2Input.value.trim() || defaultTextoLinha2;
      }
      void renderLastCertificate();
    });
  }

  [nomeInput, cursoInput, dataInput, cargaHInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      if (isBatchRunning || lastData) return;
      void renderLastCertificate();
    });
  });

  if (planilhaInput) {
    planilhaInput.addEventListener("change", () => {
      closeBatchConfirmDialog();
      const file = planilhaInput.files && planilhaInput.files[0];
      if (!file) {
        setBatchStatus("", "info");
        resetBatchPreview();
        return;
      }
      resetBatchPreview();
      setBatchStatus(`Planilha selecionada: ${file.name}. Use Pré-visualizar antes de gerar.`, "info");
    });
  }



  if (batchPreviewBtn) {
    batchPreviewBtn.addEventListener("click", () => {
      void handleBatchPreview();
    });
  }

  if (batchGenerateBtn) {
    batchGenerateBtn.addEventListener("click", () => {
      void handleBatchGenerate();
    });
  }

  if (batchConfirmCancelBtn) {
    batchConfirmCancelBtn.addEventListener("click", () => {
      closeBatchConfirmDialog();
    });
  }

  if (batchConfirmDialog) {
    batchConfirmDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeBatchConfirmDialog();
    });
  }

  if (batchConfirmForm) {
    batchConfirmForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!pendingBatchGeneration) {
        setBatchConfirmStatus("Nenhum lote preparado para confirmação.", "error");
        return;
      }

      const prepared = pendingBatchGeneration;
      closeBatchConfirmDialog();
      void executeBatchGeneration(prepared);
    });
  }

  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${(lastData && lastData.codigo) || "certificado"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

sectionTabs.forEach((button) => {
  button.addEventListener("click", () => {
    const { section } = button.dataset;
    if (isAdminOnlySection(section) && !isAdminSession()) return;
    switchSection(section || "generator");
    if (section === "certificates" && sessionState) {
      void loadCertificates(certListState.page || 1);
    }
    if (section === "audit" && sessionState && isAdminSession()) {
      void loadAuditEvents(auditState.page || 1);
    }
    if (section === "admin" && sessionState && isAdminSession()) {
      void loadAdminData();
    }
  });
});

if (certListForm) {
  certListForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    readCertificateFiltersFromInputs();
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certFilterResetBtn) {
  certFilterResetBtn.addEventListener("click", async () => {
    resetCertificateFiltersState();
    certListState.page = 1;
    syncCertificateFilterInputsFromState();
    await loadCertificates(1);
  });
}

if (certQuickTodayBtn) {
  certQuickTodayBtn.addEventListener("click", async () => {
    const todayRange = getLastDaysRange(1);
    certListState.filters.emitidoDe = todayRange.start;
    certListState.filters.emitidoAte = todayRange.end;
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certQuickLast7Btn) {
  certQuickLast7Btn.addEventListener("click", async () => {
    const range = getLastDaysRange(7);
    certListState.filters.emitidoDe = range.start;
    certListState.filters.emitidoAte = range.end;
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certQuickActiveSecretariaBtn) {
  certQuickActiveSecretariaBtn.addEventListener("click", async () => {
    certListState.filters.secretariaId = sessionState && sessionState.secretaria_ativa_id
      ? String(sessionState.secretaria_ativa_id)
      : "";
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certQuickWithFileBtn) {
  certQuickWithFileBtn.addEventListener("click", async () => {
    certListState.filters.somenteComArquivo = !certListState.filters.somenteComArquivo;
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certPrevPageBtn) {
  certPrevPageBtn.addEventListener("click", () => {
    if (certListState.page > 1) {
      void loadCertificates(certListState.page - 1);
    }
  });
}

if (certNextPageBtn) {
  certNextPageBtn.addEventListener("click", () => {
    if (certListState.page < certListState.totalPages) {
      void loadCertificates(certListState.page + 1);
    }
  });
}

if (auditForm) {
  auditForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    readAuditFiltersFromInputs();
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditResetBtn) {
  auditResetBtn.addEventListener("click", async () => {
    resetAuditFiltersState();
    auditState.page = 1;
    syncAuditFilterInputsFromState();
    await loadAuditEvents(1);
  });
}

if (auditQuickTodayBtn) {
  auditQuickTodayBtn.addEventListener("click", async () => {
    const todayRange = getLastDaysRange(1);
    auditState.filters.criadoDe = todayRange.start;
    auditState.filters.criadoAte = todayRange.end;
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditQuickLast7Btn) {
  auditQuickLast7Btn.addEventListener("click", async () => {
    const range = getLastDaysRange(7);
    auditState.filters.criadoDe = range.start;
    auditState.filters.criadoAte = range.end;
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditQuickActiveSecretariaBtn) {
  auditQuickActiveSecretariaBtn.addEventListener("click", async () => {
    auditState.filters.secretariaId = sessionState && sessionState.secretaria_ativa_id
      ? String(sessionState.secretaria_ativa_id)
      : "";
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditPrevPageBtn) {
  auditPrevPageBtn.addEventListener("click", () => {
    if (auditState.page > 1) {
      void loadAuditEvents(auditState.page - 1);
    }
  });
}

if (auditNextPageBtn) {
  auditNextPageBtn.addEventListener("click", () => {
    if (auditState.page < auditState.totalPages) {
      void loadAuditEvents(auditState.page + 1);
    }
  });
}

if (userRoleSelect) {
  userRoleSelect.addEventListener("change", () => {
    syncUserRoleUi();
  });
}

if (userFormResetBtn) {
  userFormResetBtn.addEventListener("click", () => {
    resetUserForm();
  });
}

if (userForm) {
  userForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdminSession()) return;

    const editingId = sanitizeText(userEditIdInput ? userEditIdInput.value : "");
    const payload = {
      nome: userNameInput ? userNameInput.value.trim() : "",
      username: userUsernameInput ? userUsernameInput.value.trim() : "",
      password: userPasswordInput ? userPasswordInput.value : "",
      papel: userRoleSelect ? userRoleSelect.value : "operador",
      ativo: userActiveInput ? userActiveInput.checked : true,
      secretaria_ids: getMultiSelectValues(userSecretariasSelect),
    };

    if (!payload.nome || !payload.username) {
      setUserFormStatus("Preencha nome e usuário.", "error");
      return;
    }
    if (!editingId && !payload.password) {
      setUserFormStatus("Informe uma senha para o novo usuário.", "error");
      return;
    }
    if (payload.papel !== "admin_global" && payload.secretaria_ids.length === 0) {
      setUserFormStatus("Selecione pelo menos uma secretaria para o operador.", "error");
      return;
    }

    try {
      setUserFormStatus("Salvando usuário...", "info");
      if (editingId) {
        const updatePayload = {
          nome: payload.nome,
          papel: payload.papel,
          ativo: payload.ativo,
          secretaria_ids: payload.secretaria_ids,
        };
        if (payload.password) {
          updatePayload.password = payload.password;
        }
        await apiJsonRequest(`/api/admin/usuarios/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(updatePayload),
        });
      } else {
        await apiJsonRequest("/api/admin/usuarios", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetUserForm();
      setUserFormStatus("Usuário salvo com sucesso.", "success");
      await loadAdminData();
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      setUserFormStatus(
        (error && error.message) || "Nao foi possivel salvar o usuario.",
        "error"
      );
    }
  });
}

if (secretariaFormResetBtn) {
  secretariaFormResetBtn.addEventListener("click", () => {
    resetSecretariaForm();
  });
}

if (secretariaForm) {
  secretariaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdminSession()) return;

    const editingId = sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "");
    const payload = {
      sigla: secretariaSiglaInput ? secretariaSiglaInput.value.trim() : "",
      nome: secretariaNameInput ? secretariaNameInput.value.trim() : "",
      ativa: secretariaActiveInput ? secretariaActiveInput.checked : true,
    };

    if (!payload.sigla || !payload.nome) {
      setSecretariaFormStatus("Preencha sigla e nome da secretaria.", "error");
      return;
    }

    try {
      setSecretariaFormStatus("Salvando secretaria...", "info");
      if (editingId) {
        await apiJsonRequest(`/api/admin/secretarias/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiJsonRequest("/api/admin/secretarias", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetSecretariaForm();
      setSecretariaFormStatus("Secretaria salva com sucesso.", "success");
      await refreshSession();
      await loadAdminData();
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      setSecretariaFormStatus(
        (error && error.message) || "Nao foi possivel salvar a secretaria.",
        "error"
      );
    }
  });
}

if (templateAdminResetBtn) {
  templateAdminResetBtn.addEventListener("click", () => {
    resetTemplateAdminForm();
  });
}

if (templateAdminForm) {
  templateAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdminSession()) return;

    const editingId = sanitizeText(templateAdminEditIdInput ? templateAdminEditIdInput.value : "");
    const file = templateAdminFileInput && templateAdminFileInput.files
      ? templateAdminFileInput.files[0]
      : null;
    const payload = {
      secretariaId: templateAdminSecretariaSelect ? templateAdminSecretariaSelect.value : "",
      nome: templateAdminNameInput ? templateAdminNameInput.value.trim() : "",
      ativo: templateAdminActiveInput ? templateAdminActiveInput.checked : true,
      padrao: templateAdminDefaultInput ? templateAdminDefaultInput.checked : false,
      ordem: templateAdminOrderInput ? templateAdminOrderInput.value : "0",
    };

    if (!payload.secretariaId || !payload.nome) {
      setTemplateAdminStatus("Selecione a secretaria e informe o nome do molde.", "error");
      return;
    }
    if (!editingId && !file) {
      setTemplateAdminStatus("Envie o arquivo do molde para o cadastro inicial.", "error");
      return;
    }

    const formData = new FormData();
    formData.set("nome", payload.nome);
    formData.set("ativo", String(payload.ativo));
    formData.set("padrao", String(payload.padrao));
    formData.set("ordem", String(payload.ordem || 0));
    if (file) {
      formData.set("arquivo", file, file.name);
    }

    try {
      setTemplateAdminStatus("Salvando molde...", "info");
      if (editingId) {
        await apiFormRequest(`/api/admin/templates/${editingId}`, formData, {
          method: "PATCH",
        });
      } else {
        formData.set("secretaria_id", payload.secretariaId);
        await apiFormRequest("/api/admin/templates", formData, {
          method: "POST",
        });
      }

      resetTemplateAdminForm();
      setTemplateAdminStatus("Molde salvo com sucesso.", "success");
      await loadAdminData();
      await loadAvailableTemplates();
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      setTemplateAdminStatus(
        (error && error.message) || "Nao foi possivel salvar o molde.",
        "error"
      );
    }
  });
}

if (secretariaAssetResetBtn) {
  secretariaAssetResetBtn.addEventListener("click", () => {
    resetSecretariaAssetForm();
  });
}

if (secretariaAssetTypeSelect) {
  secretariaAssetTypeSelect.addEventListener("change", () => {
    syncSecretariaAssetTypeUi();
  });
}

if (secretariaAssetForm) {
  secretariaAssetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdminSession()) return;

    const editingId = sanitizeText(
      secretariaAssetEditIdInput ? secretariaAssetEditIdInput.value : ""
    );
    const file = secretariaAssetFileInput && secretariaAssetFileInput.files
      ? secretariaAssetFileInput.files[0]
      : null;
    const payload = {
      secretariaId: secretariaAssetSecretariaSelect ? secretariaAssetSecretariaSelect.value : "",
      tipo: secretariaAssetTypeSelect ? secretariaAssetTypeSelect.value : "logo",
      nome: secretariaAssetNameInput ? secretariaAssetNameInput.value.trim() : "",
      ativo: secretariaAssetActiveInput ? secretariaAssetActiveInput.checked : true,
      padrao: secretariaAssetDefaultInput ? secretariaAssetDefaultInput.checked : false,
      ordem: secretariaAssetOrderInput ? secretariaAssetOrderInput.value : "0",
    };

    if (!payload.secretariaId || !payload.nome || !payload.tipo) {
      setSecretariaAssetAdminStatus(
        "Selecione a secretaria, o tipo e informe o nome do item.",
        "error"
      );
      return;
    }
    if (!editingId && !file) {
      setSecretariaAssetAdminStatus(
        "Envie o arquivo da logo ou assinatura para o cadastro inicial.",
        "error"
      );
      return;
    }

    const formData = new FormData();
    formData.set("nome", payload.nome);
    formData.set("ativo", String(payload.ativo));
    formData.set("padrao", String(payload.padrao));
    formData.set("ordem", String(payload.ordem || 0));
    if (file) {
      formData.set("arquivo", file, file.name);
    }

    try {
      setSecretariaAssetAdminStatus(`Salvando ${payload.tipo}...`, "info");
      if (editingId) {
        await apiFormRequest(`/api/admin/secretaria-assets/${editingId}`, formData, {
          method: "PATCH",
        });
      } else {
        formData.set("secretaria_id", payload.secretariaId);
        formData.set("tipo", payload.tipo);
        await apiFormRequest("/api/admin/secretaria-assets", formData, {
          method: "POST",
        });
      }

      resetSecretariaAssetForm();
      setSecretariaAssetAdminStatus("Item salvo com sucesso.", "success");
      await loadAdminData();
      await loadAvailableSecretariaAssets();
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      setSecretariaAssetAdminStatus(
        (error && error.message) || "Nao foi possivel salvar o item.",
        "error"
      );
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usernameInput = document.getElementById("login-username");
    const passwordInput = document.getElementById("login-password");
    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!username || !password) {
      setLoginStatus("Informe usuário e senha.", "error");
      return;
    }

    try {
      setLoginStatus("Entrando...", "info");
      const session = await apiJsonRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      renderSession(session);
      await refreshProtectedData({ page: 1 });
      switchSection("generator");
      if (passwordInput) passwordInput.value = "";
    } catch (error) {
      console.error(error);
      setLoginStatus(
        (error && error.message) || "Nao foi possivel fazer login.",
        "error"
      );
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await apiJsonRequest("/api/auth/logout", { method: "POST", body: "{}" });
    } catch (error) {
      console.error(error);
    } finally {
      clearSessionUi();
      setLoginStatus("Sessao encerrada.", "info");
    }
  });
}

if (secretariaSelect) {
  secretariaSelect.addEventListener("change", async () => {
    const secretariaId = Number(secretariaSelect.value);
    if (!secretariaId) return;

    try {
      const session = await apiJsonRequest("/api/auth/select-secretaria", {
        method: "POST",
        body: JSON.stringify({ secretaria_id: secretariaId }),
      });
      renderSession(session);
      certListState.page = 1;
      await refreshProtectedData({ page: 1 });
      await renderLastCertificate();
      setBatchStatus("Secretaria ativa atualizada.", "success");
      setCertListStatus("Lista atualizada para a nova secretaria ativa.", "success");
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      setBatchStatus(
        (error && error.message) || "Nao foi possivel trocar a secretaria.",
        "error"
      );
    }
  });
}

if (deleteCertCancelBtn) {
  deleteCertCancelBtn.addEventListener("click", () => {
    closeDeleteCertificateDialog();
  });
}

if (duplicateCertCancelBtn) {
  duplicateCertCancelBtn.addEventListener("click", () => {
    closeDuplicateCertificateDialog();
    setBatchStatus("Geração cancelada. Use um certificado existente ou ajuste os dados.", "info");
  });
}

if (duplicateCertViewExistingBtn) {
  duplicateCertViewExistingBtn.addEventListener("click", () => {
    if (!pendingDuplicateCertificate || !pendingDuplicateCertificate.duplicates.length) {
      setDuplicateCertStatus("Nenhum certificado existente disponível para abrir.", "error");
      return;
    }

    const [firstMatch] = pendingDuplicateCertificate.duplicates;
    const openTarget =
      firstMatch.arquivo_admin_url || firstMatch.arquivo_url || firstMatch.url_validacao || "";
    if (!openTarget) {
      setDuplicateCertStatus("O certificado existente não possui um arquivo para abrir.", "error");
      return;
    }

    window.open(openTarget, "_blank", "noopener,noreferrer");
    closeDuplicateCertificateDialog();
    setBatchStatus(
      `Abrindo o certificado existente ${firstMatch.codigo}. Gere um novo apenas se realmente precisar duplicar.`,
      "info"
    );
  });
}

if (duplicateCertDialog) {
  duplicateCertDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDuplicateCertificateDialog();
  });
}

if (duplicateCertForm) {
  duplicateCertForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!pendingDuplicateCertificate || isSingleGenerationRunning || isBatchRunning) {
      setDuplicateCertStatus("Nenhuma geração pendente para confirmar.", "error");
      return;
    }

    const prepared = pendingDuplicateCertificate.prepared;
    closeDuplicateCertificateDialog();
    await executeSingleCertificateGeneration(prepared);
  });
}

if (deleteCertDialog) {
  deleteCertDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDeleteCertificateDialog();
  });
}

if (deleteCertForm) {
  deleteCertForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!pendingDeleteCertificate || !isAdminSession()) return;

    const codigo = sanitizeText(pendingDeleteCertificate.codigo).toUpperCase();
    const confirmacaoCodigo = sanitizeText(
      deleteCertConfirmCodeInput ? deleteCertConfirmCodeInput.value : ""
    ).toUpperCase();
    const password = deleteCertPasswordInput ? deleteCertPasswordInput.value : "";

    if (!codigo) {
      setDeleteCertStatus("Nenhum certificado selecionado para exclusao.", "error");
      return;
    }
    if (confirmacaoCodigo !== codigo) {
      setDeleteCertStatus("Digite o codigo exato do certificado para confirmar.", "error");
      return;
    }
    if (!password) {
      setDeleteCertStatus("Informe a senha do administrador.", "error");
      return;
    }

    try {
      setDeleteCertStatus(`Excluindo ${codigo}...`, "info");
      const payload = await apiJsonRequest(
        `/api/admin/certificados/${encodeURIComponent(codigo)}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            password,
            confirmacao_codigo: confirmacaoCodigo,
          }),
        }
      );

      if (lastData && sanitizeText(lastData.codigo).toUpperCase() === codigo) {
        lastData = null;
        downloadBtn.disabled = true;
      }

      closeDeleteCertificateDialog();
      setCertListStatus(
        (payload && payload.message) || `Certificado ${codigo} excluido com sucesso.`,
        "success"
      );
      await loadCertificates(1);
      if (isAdminSession()) {
        await loadAuditEvents(1);
      }
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        if (error.message === "Senha do administrador invalida.") {
          setDeleteCertStatus(error.message, "error");
          if (deleteCertPasswordInput) deleteCertPasswordInput.value = "";
          return;
        }
        await handleUnauthorized();
        return;
      }
      setDeleteCertStatus(
        (error && error.message) || "Nao foi possivel excluir o certificado.",
        "error"
      );
    }
  });
}

setTodayDate();
syncUserFormState();
syncSecretariaFormState();
syncTemplateAdminFormState();
syncSecretariaAssetFormState();
syncGenerateSubmitButton();
updateControlLabels();
syncTemplateControls();
setTemplateStatus("", "info");
setLogoStatus("", "info");
setAssinaturaStatus("", "info");
void renderLastCertificate();
void refreshSession();
