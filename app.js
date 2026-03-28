const form = document.getElementById("cert-form");
const downloadBtn = document.getElementById("download");
const logoInput = document.getElementById("logo");
const assinaturaInput = document.getElementById("assinatura");
const templateInput = document.getElementById("template");
const templateRemoveBtn = document.getElementById("template-remove");
const templateLibraryWrap = document.getElementById("template-library-wrap");
const templateSelect = document.getElementById("template-select");
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
const adminSection = document.getElementById("admin-section");
const sectionTabs = Array.from(document.querySelectorAll("[data-section]"));
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

const auditForm = document.getElementById("audit-form");
const auditSearchInput = document.getElementById("audit-search");
const auditEventSelect = document.getElementById("audit-event");
const auditSecretariaWrap = document.getElementById("audit-secretaria-wrap");
const auditSecretariaSelect = document.getElementById("audit-secretaria");
const auditResetBtn = document.getElementById("audit-reset");
const auditStatus = document.getElementById("audit-status");
const auditSummary = document.getElementById("audit-summary");
const auditListBody = document.getElementById("audit-list-body");
const auditPrevPageBtn = document.getElementById("audit-prev-page");
const auditNextPageBtn = document.getElementById("audit-next-page");
const auditPageIndicator = document.getElementById("audit-page-indicator");
const auditPanel = document.getElementById("audit-panel");

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
let sessionState = null;
let currentSection = "generator";
let pendingDeleteCertificate = null;
let pendingBatchGeneration = null;
let savedTemplate = null;
let savedTemplateImage = null;

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
};

const templateCatalogState = {
  items: [],
  selectedId: "",
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
  },
};

const qrImageCache = new Map();
const certificateAspectRatio = 1200 / 850;
const logoAspectRatio = 95 / 150;
const assinaturaAspectRatio = 80 / 230;
const viewSections = {
  generator: generatorSection,
  certificates: certificatesSection,
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

function getActiveTemplateImage() {
  return assets.template || savedTemplateImage;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const parsed = new Date(dateStr);
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
  if (auditPanel) {
    auditPanel.hidden = !isAdminSession(session);
  }
  if (!isAdminSession(session) && currentSection === "admin") {
    switchSection("generator");
  }
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
  if (auditSecretariaSelect) {
    auditSecretariaSelect.innerHTML = '<option value="">Todas</option>';
  }
  if (auditSecretariaWrap) auditSecretariaWrap.hidden = false;
  if (certListBody) {
    certListBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">Faça login para carregar os certificados.</td>
      </tr>
    `;
  }
  if (certListSummary) certListSummary.textContent = "";
  if (certPageIndicator) certPageIndicator.textContent = "Página 1";
  if (adminTab) adminTab.hidden = true;
  if (auditPanel) auditPanel.hidden = true;
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
  templateCatalogState.items = [];
  templateCatalogState.selectedId = "";
  assets.template = null;
  savedTemplate = null;
  savedTemplateImage = null;
  if (templateInput) templateInput.value = "";
  syncTemplateControls();
  setTemplateStatus("Nenhum molde carregado. O certificado segue com o fundo padrão.", "info");
  if (templateSelect) {
    populateTemplateOptions(templateSelect, [], "", true);
  }
  if (templateLibraryWrap) templateLibraryWrap.hidden = true;
  setTemplateSelectStatus("", "info");
  resetUserForm();
  resetSecretariaForm();
  resetTemplateAdminForm();
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
  if (isAdmin && !sanitizeText(userEditIdInput ? userEditIdInput.value : "")) {
    setMultiSelectValues(userSecretariasSelect, []);
  }
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
    const codeChip = document.createElement("span");
    codeChip.className = "code-chip";
    codeChip.textContent = item.codigo || "-";
    codeCell.appendChild(codeChip);

    const nameCell = document.createElement("td");
    nameCell.textContent = item.nome || "-";

    const courseCell = document.createElement("td");
    courseCell.textContent = item.curso || "-";

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const concluidoCell = document.createElement("td");
    concluidoCell.textContent = formatDate(item.concluido);

    const emittedCell = document.createElement("td");
    emittedCell.textContent = formatDateTime(item.emitido_em);

    const emittedByCell = document.createElement("td");
    emittedByCell.textContent = item.emitido_por_username || "-";

    const fileCell = document.createElement("td");
    fileCell.appendChild(
      buildStatusPill(item.arquivo_disponivel, "PNG salvo", "Sem PNG")
    );

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";

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
  setAuditStatus("Carregando auditoria...", "info");

  try {
    const payload = await apiJsonRequest(
      `/api/admin/auditoria${buildQueryString({
        pagina: auditState.page,
        por_pagina: auditState.perPage,
        busca: auditState.filters.busca,
        evento: auditState.filters.evento,
        secretaria_id: auditState.filters.secretariaId,
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
    const [secretarias, usuarios, templates] = await Promise.all([
      apiJsonRequest("/api/admin/secretarias"),
      apiJsonRequest("/api/admin/usuarios"),
      apiJsonRequest("/api/admin/templates"),
    ]);

    adminState.secretarias = Array.isArray(secretarias) ? secretarias : [];
    adminState.users = Array.isArray(usuarios) ? usuarios : [];
    adminState.templates = Array.isArray(templates) ? templates : [];
    populateSecretariaOptions(
      userSecretariasSelect,
      adminState.secretarias,
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
      auditSecretariaSelect,
      adminState.secretarias,
      auditState.filters.secretariaId,
      true
    );
    renderSecretariasTable();
    renderUsersTable();
    renderTemplatesTable();

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

    await loadAuditEvents(auditState.page || 1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    if (error && error.status === 403) {
      if (adminTab) adminTab.hidden = true;
      if (currentSection === "admin") switchSection("generator");
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
  }
}

async function applySavedTemplateSelection(templateId, options = {}) {
  const { silentStatus = false } = options;
  const normalizedId = templateId ? String(templateId) : "";
  templateCatalogState.selectedId = normalizedId;
  if (templateSelect) {
    templateSelect.value = normalizedId;
  }

  if (!normalizedId) {
    savedTemplate = null;
    savedTemplateImage = null;
    if (!silentStatus) {
      const fallbackMessage = templateCatalogState.items.length
        ? "Nenhum modelo cadastrado selecionado. O preview usará o fundo padrão ou o molde temporário."
        : "A secretaria ativa ainda não tem moldes cadastrados.";
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
      setTemplateSelectStatus(
        (error && error.message) || "Nao foi possivel carregar o modelo selecionado.",
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
    if (templateLibraryWrap) templateLibraryWrap.hidden = true;
    if (templateSelect) populateTemplateOptions(templateSelect, [], "", true);
    setTemplateSelectStatus("", "info");
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/templates${buildQueryString({ secretaria_id: sessionState.secretaria_ativa_id })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    templateCatalogState.items = items;
    if (templateLibraryWrap) templateLibraryWrap.hidden = items.length === 0;
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
    if (templateLibraryWrap) templateLibraryWrap.hidden = true;
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

async function refreshProtectedData(options = {}) {
  if (!sessionState) return;

  await loadAvailableTemplates();
  await loadCertificates(options.page || certListState.page || 1);
  if (isAdminSession()) {
    await loadAdminData();
  }
}

async function registerSingleCertificate(cert) {
  const payload = {
    codigo: cert.codigo || null,
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

async function registerBatchCertificates(items) {
  const payload = {
    itens: items.map((item) => ({
      codigo: item.codigo || null,
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

async function uploadCertificateImage(codigo, pngBlob, fileName) {
  const certCode = sanitizeText(codigo).toUpperCase();
  if (!certCode) {
    throw new Error("Codigo do certificado ausente para upload do PNG.");
  }

  if (!pngBlob) {
    throw new Error("PNG do certificado ausente para upload.");
  }

  const safeName = sanitizeFileName(fileName || certCode, certCode);
  const formData = new FormData();
  formData.append("arquivo", pngBlob, `${safeName}.png`);

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
    throw error;
  }

  return payload;
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
  if (logoXVal) logoXVal.textContent = layout.logo.x;
  if (logoYVal) logoYVal.textContent = layout.logo.y;
  if (logoSizeVal) logoSizeVal.textContent = layout.logo.maxW;
  if (assinaturaXVal) assinaturaXVal.textContent = layout.assinatura.x;
  if (assinaturaYVal) assinaturaYVal.textContent = layout.assinatura.y;
  if (assinaturaSizeVal) assinaturaSizeVal.textContent = layout.assinatura.maxW;
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

function validateTemplateFile(file) {
  if (!file) return;
  const suffix = ((file.name || "").split(".").pop() || "").toLowerCase();
  const allowedSuffixes = new Set(["png", "jpg", "jpeg", "webp"]);
  const normalizedType = sanitizeText(file.type).toLowerCase();
  const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!allowedSuffixes.has(suffix) || (normalizedType && !allowedMimeTypes.has(normalizedType))) {
    throw new Error("Formato invalido para molde. Use PNG, JPG, JPEG ou WEBP.");
  }
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
  const cargaResult = normalizeCargaHorariaResult(cargaHInput ? cargaHInput.value : "");

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

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (activeTemplateImage) {
    drawTemplateBackground(activeTemplateImage);
  } else {
    drawDefaultCertificateFrame();
  }

  if (assets.logo) {
    drawCenteredImage(
      assets.logo,
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

  if (assets.assinatura) {
    drawCenteredImage(
      assets.assinatura,
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
    if (key === "template") {
      syncTemplateControls();
      const message = savedTemplate
        ? `Molde temporário removido. A prévia voltou a usar o modelo ${savedTemplate.nome}.`
        : "Nenhum molde carregado. O certificado seguirá usando o fundo padrão.";
      setTemplateStatus(message, "info");
    }
    void renderLastCertificate();
    return;
  }

  try {
    if (key === "template") {
      validateTemplateFile(file);
    }
    assets[key] = await loadImage(file, options);
    if (key === "template") {
      syncTemplateControls();
      const warning = getTemplateWarning(assets.template);
      setTemplateStatus(
        warning ||
          `Molde temporário ${file.name} carregado. Ele sobrescreve o modelo cadastrado selecionado nesta tela.`,
        warning ? "info" : "success"
      );
    }
    void renderLastCertificate();
  } catch (error) {
    alert(error.message);
    input.value = "";
    assets[key] = null;
    if (key === "template") {
      syncTemplateControls();
      setTemplateStatus("Não foi possível carregar o molde informado.", "error");
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
      value: rounded >= 0 && rounded <= 2000 ? rounded : null,
      invalid: rounded < 0 || rounded > 2000,
    };
  }

  const text = sanitizeText(value);
  if (!text) return { value: null, invalid: false };

  const match = text.match(/^(\d{1,4})(?:\s*h(?:oras?)?)?$/i);
  if (!match) {
    return { value: null, invalid: true };
  }

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2000) {
    return { value: null, invalid: true };
  }

  return { value: parsed, invalid: false };
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
  return Object.values(row).every((value) => sanitizeText(value) === "");
}

function extractSingleCellValue(row) {
  const values = Object.values(row)
    .map((value) => sanitizeText(value))
    .filter((value) => value.length > 0);

  return values.length === 1 ? values[0] : "";
}

function buildFullName(firstName, lastName) {
  const first = sanitizeText(firstName);
  const last = sanitizeText(lastName);

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

function mapRowToCertificate(row, rowNumber, defaults = {}) {
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

  const nome = buildFullName(mapped.nome, mapped.sobrenome) || extractSingleCellValue(row);
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
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) return [];

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((item) => item.trim());
  const rows = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex], delimiter);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || "";
    });

    rows.push(row);
  }

  return rows;
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
  const workbook = window.XLSX.read(bytes, { type: "array", cellDates: true });
  if (!workbook.SheetNames || !workbook.SheetNames.length) return [];

  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  return window.XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: true });
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

function setBatchButtonsDisabled(disabled) {
  if (batchPreviewBtn) batchPreviewBtn.disabled = disabled;
  if (batchGenerateBtn) batchGenerateBtn.disabled = disabled;
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
  if (prepared.invalidRows.length) {
    summaryParts.push(`${prepared.invalidRows.length} com erro`);
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

  const rows = await readSpreadsheetRows(file);
  if (!rows.length) {
    throw new Error("A planilha está vazia.");
  }

  const batchDefaults = getBatchDefaults();
  const certificates = [];
  const invalidRows = [];
  let nonEmptyRows = 0;
  let skippedEmptyRows = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (isRowEmpty(row)) {
      skippedEmptyRows += 1;
      return;
    }

    nonEmptyRows += 1;
    const item = mapRowToCertificate(row, rowNumber, batchDefaults);
    if (item.error) {
      invalidRows.push(item.error);
      return;
    }
    certificates.push(item);
  });

  return {
    fileName: file.name || "planilha",
    certificates,
    invalidRows,
    nonEmptyRows,
    skippedEmptyRows,
    previewItems: certificates.slice(0, 5),
  };
}

function openBatchConfirmDialog(prepared) {
  const total = prepared.certificates.length;
  const moldeInfo = assets.template
    ? " O molde temporário carregado no formulário também será aplicado em todos os certificados deste lote."
    : savedTemplate
      ? ` O modelo ${savedTemplate.nome} da secretaria ativa também será aplicado neste lote.`
      : "";
  const summary = `${total} certificado(s) serão gerado(s), terão os PNGs salvos no servidor e um arquivo ZIP será baixado neste navegador.${moldeInfo}`;

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

  try {
    const certificates = prepared.certificates.map((item) => ({ ...item }));

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
      zip.file(cert.fileName, pngBlob);

      setBatchStatus(
        `Salvando ${index + 1}/${certificates.length} no servidor: ${cert.nome}`,
        "info"
      );
      await uploadCertificateImage(cert.codigo, pngBlob, cert.fileName);
    }

    setBatchStatus("Compactando certificados em ZIP...", "info");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipName = `certificados_lote_${buildTimestamp()}.zip`;
    downloadBlob(zipBlob, zipName);

    if (!previousLastData && certificates.length) {
      const lastGenerated = certificates[certificates.length - 1];
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

    setBatchStatus(
      `Lote concluído: ${certificates.length} certificado(s) gerado(s), com PNGs salvos no servidor e ZIP baixado com sucesso.`,
      "success"
    );
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
      const preview = prepared.invalidRows.slice(0, 5).join(", ");
      const suffix = prepared.invalidRows.length > 5 ? ", ..." : "";
      setBatchStatus(
        `Prévia carregada com pendências (${prepared.invalidRows.length}): ${preview}${suffix}.`,
        "error"
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

    if (prepared.invalidRows.length) {
      const preview = prepared.invalidRows.slice(0, 5).join(", ");
      const suffix = prepared.invalidRows.length > 5 ? ", ..." : "";
      throw new Error(
        `Existem linhas com dados invalidos ou incompletos (${prepared.invalidRows.length}): ${preview}${suffix}.`
      );
    }

    if (!prepared.certificates.length) {
      throw new Error("Nenhuma linha válida encontrada para gerar certificados.");
    }

    setBatchStatus(
      `Lote validado: ${prepared.certificates.length} certificado(s) pronto(s) para confirmação.`,
      "info"
    );
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
    if (isBatchRunning) return;
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
    const cargaH = cargaHInput ? Math.max(0, parseInt(cargaHInput.value, 10) || 0) : 0;

    if (!nome || !curso || !data) return;

    try {
      const textoLinha1 = textoLinha1Input ? textoLinha1Input.value.trim() : "";
      const textoLinha2 = textoLinha2Input ? textoLinha2Input.value.trim() : "";
      const linha1 = textoLinha1 || defaultTextoLinha1;
      const linha2 = textoLinha2 || defaultTextoLinha2;

      setBatchStatus("Registrando certificado no backend...", "info");
      const registered = await registerSingleCertificate({
        codigo: null,
        nome,
        curso,
        data,
        carga_h: cargaH,
      });

      const codigo = sanitizeText(registered.codigo).toUpperCase();
      const qrText = sanitizeText(registered.url_validacao);

      lastData = { nome, curso, data, cargaH, codigo, linha1, linha2, qrText };
      await drawCertificate(nome, curso, data, linha1, linha2, qrText, codigo, cargaH);
      const pngBlob = await canvasToPngBlob();
      await uploadCertificateImage(codigo, pngBlob, codigo);
      downloadBtn.disabled = false;
      setBatchStatus("", "info");
      await loadCertificates(1);
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      const message =
        error && error.message
          ? error.message
          : "Falha ao gerar o certificado. Tente novamente.";
      setBatchStatus(message, "error");
    }
  });

  if (logoInput) {
    logoInput.addEventListener("change", () => {
      void handleAssetChange(logoInput, "logo");
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
    if (section === "admin" && !isAdminSession()) return;
    switchSection(section || "generator");
    if (section === "certificates" && sessionState) {
      void loadCertificates(certListState.page || 1);
    }
    if (section === "admin" && sessionState && isAdminSession()) {
      void loadAdminData();
    }
  });
});

if (certListForm) {
  certListForm.addEventListener("submit", async (event) => {
    event.preventDefault();
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
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certFilterResetBtn) {
  certFilterResetBtn.addEventListener("click", async () => {
    certListState.filters.busca = "";
    certListState.filters.secretariaId = "";
    certListState.filters.concluidoDe = "";
    certListState.filters.concluidoAte = "";
    certListState.filters.emitidoDe = "";
    certListState.filters.emitidoAte = "";
    certListState.filters.somenteComArquivo = false;
    certListState.page = 1;
    if (certFilterBuscaInput) certFilterBuscaInput.value = "";
    if (certFilterSecretariaSelect) certFilterSecretariaSelect.value = "";
    if (certFilterConcluidoDeInput) certFilterConcluidoDeInput.value = "";
    if (certFilterConcluidoAteInput) certFilterConcluidoAteInput.value = "";
    if (certFilterEmitidoDeInput) certFilterEmitidoDeInput.value = "";
    if (certFilterEmitidoAteInput) certFilterEmitidoAteInput.value = "";
    if (certFilterComArquivoInput) certFilterComArquivoInput.checked = false;
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
    auditState.filters.busca = auditSearchInput ? auditSearchInput.value.trim() : "";
    auditState.filters.evento = auditEventSelect ? auditEventSelect.value : "";
    auditState.filters.secretariaId = auditSecretariaSelect
      ? auditSecretariaSelect.value
      : "";
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditResetBtn) {
  auditResetBtn.addEventListener("click", async () => {
    auditState.filters.busca = "";
    auditState.filters.evento = "";
    auditState.filters.secretariaId = "";
    auditState.page = 1;
    if (auditSearchInput) auditSearchInput.value = "";
    if (auditEventSelect) auditEventSelect.value = "";
    if (auditSecretariaSelect) auditSecretariaSelect.value = "";
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
updateControlLabels();
syncTemplateControls();
setTemplateStatus("Nenhum molde carregado. O certificado segue com o fundo padrão.", "info");
void renderLastCertificate();
void refreshSession();
