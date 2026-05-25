const form = document.getElementById("cert-form");
const generateSubmitBtn = form ? form.querySelector('button[type="submit"]') : null;
const downloadBtn = document.getElementById("download");
const logoInput = document.getElementById("logo");
const assinaturaInput = document.getElementById("assinatura");
const assinatura2Input = document.getElementById("assinatura2");
const assinatura3Input = document.getElementById("assinatura3");
const instituicaoInput = document.getElementById("instituicao");
const logoRemoveBtn = document.getElementById("logo-remove");
const assinaturaRemoveBtn = document.getElementById("assinatura-remove");
const assinatura2RemoveBtn = document.getElementById("assinatura2-remove");
const assinatura3RemoveBtn = document.getElementById("assinatura3-remove");
const instituicaoRemoveBtn = document.getElementById("instituicao-remove");
const templateInput = document.getElementById("template");
const templateRemoveBtn = document.getElementById("template-remove");
const templateLibraryWrap = document.getElementById("template-library-wrap");
const templateSelect = document.getElementById("template-select");
const templateHideTitleInput = document.getElementById("template-hide-title");
const logoLibraryWrap = document.getElementById("logo-library-wrap");
const logoSelect = document.getElementById("logo-select");
const logoSelectStatus = document.getElementById("logo-select-status");
const assinaturaLibraryWrap = document.getElementById("assinatura-library-wrap");
const assinaturaSelect = document.getElementById("assinatura-select");
const assinaturaSelectStatus = document.getElementById("assinatura-select-status");
const assinaturasExtrasWrap = document.getElementById("assinaturas-extras-wrap");
const assinatura2Select = document.getElementById("assinatura2-select");
const assinatura2SelectStatus = document.getElementById("assinatura2-select-status");
const assinatura3Select = document.getElementById("assinatura3-select");
const assinatura3SelectStatus = document.getElementById("assinatura3-select-status");
const selosExtrasWrap = document.getElementById("selos-extras-wrap");
const selo1Input = document.getElementById("selo1");
const selo2Input = document.getElementById("selo2");
const selo3Input = document.getElementById("selo3");
const selo4Input = document.getElementById("selo4");
const selo1RemoveBtn = document.getElementById("selo1-remove");
const selo2RemoveBtn = document.getElementById("selo2-remove");
const selo3RemoveBtn = document.getElementById("selo3-remove");
const selo4RemoveBtn = document.getElementById("selo4-remove");
const selo1Select = document.getElementById("selo1-select");
const selo2Select = document.getElementById("selo2-select");
const selo3Select = document.getElementById("selo3-select");
const selo4Select = document.getElementById("selo4-select");
const selo1SelectStatus = document.getElementById("selo1-select-status");
const selo2SelectStatus = document.getElementById("selo2-select-status");
const selo3SelectStatus = document.getElementById("selo3-select-status");
const selo4SelectStatus = document.getElementById("selo4-select-status");
const instituicaoLibraryWrap = document.getElementById("instituicao-library-wrap");
const instituicaoSelect = document.getElementById("instituicao-select");
const instituicaoSelectStatus = document.getElementById("instituicao-select-status");
const planilhaInput = document.getElementById("planilha");
const batchPreviewBtn = document.getElementById("batch-preview");
const batchGenerateBtn = document.getElementById("batch-generate");
const loginForm = document.getElementById("login-form");
const loginShell = document.getElementById("login-shell");
const appContainer = document.getElementById("app-container");
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
const adminModuleTabs = Array.from(document.querySelectorAll("[data-admin-module-tab]"));
const userAdminPanel = document.getElementById("user-admin-panel");
const secretariaAdminPanel = document.getElementById("secretaria-admin-panel");
const templateManagementPanel = document.getElementById("template-management-panel");
const visualAssetManagementPanel = document.getElementById("visual-asset-management-panel");
const adminAssetFilterBtns = Array.from(document.querySelectorAll("[data-admin-asset-filter]"));
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
const certQuickTodayBtn = document.getElementById("cert-quick-today");
const certQuickLast7Btn = document.getElementById("cert-quick-last7");
const certQuickActiveSecretariaBtn = document.getElementById("cert-quick-active-secretaria");
const certFilterResetBtn = document.getElementById("cert-filter-reset");
const certExportCsvBtn = document.getElementById("cert-export-csv");
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
const templateAdminHideTitleInput = document.getElementById("template-admin-hide-title");
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
const auditExportCsvBtn = document.getElementById("audit-export-csv");
const auditPrintReportBtn = document.getElementById("audit-print-report");
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
const previewWrap = document.getElementById("preview-wrap");
const previewCanvasFrame = document.getElementById("preview-canvas-frame");
const previewHotspots = document.getElementById("preview-hotspots");
const previewShowHotspotsInput = document.getElementById("preview-show-hotspots");
const previewResetLayoutBtn = document.getElementById("preview-reset-layout");
const previewAdjustStatus = document.getElementById("preview-adjust-status");
const previewAdjustPanel = document.getElementById("preview-adjust-panel");
const previewAdjustTitle = document.getElementById("preview-adjust-title");
const previewAdjustCloseBtn = document.getElementById("preview-adjust-close");
const previewAdjustLabelWrap = document.getElementById("preview-adjust-label-wrap");
const previewAdjustLabelInput = document.getElementById("preview-adjust-label");
const previewAdjustXInput = document.getElementById("preview-adjust-x");
const previewAdjustYInput = document.getElementById("preview-adjust-y");
const previewAdjustSizeInput = document.getElementById("preview-adjust-size");
const previewAdjustXVal = document.getElementById("preview-adjust-x-val");
const previewAdjustYVal = document.getElementById("preview-adjust-y-val");
const previewAdjustSizeVal = document.getElementById("preview-adjust-size-val");
const nomeInput = document.getElementById("nome");
const cursoInput = document.getElementById("curso");
const dataInput = document.getElementById("data");
const cargaHInput = document.getElementById("carga_h");
const logoStatus = document.getElementById("logo-status");
const assinaturaStatus = document.getElementById("assinatura-status");
const assinatura2Status = document.getElementById("assinatura2-status");
const assinatura3Status = document.getElementById("assinatura3-status");
const selo1Status = document.getElementById("selo1-status");
const selo2Status = document.getElementById("selo2-status");
const selo3Status = document.getElementById("selo3-status");
const selo4Status = document.getElementById("selo4-status");
const instituicaoStatus = document.getElementById("instituicao-status");
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
const qrXInput = document.getElementById("qrX");
const qrYInput = document.getElementById("qrY");
const qrSizeInput = document.getElementById("qrSize");
const assinaturaXInput = document.getElementById("assinaturaX");
const assinaturaYInput = document.getElementById("assinaturaY");
const assinaturaSizeInput = document.getElementById("assinaturaSize");
const assinaturaLabelInput = document.getElementById("assinaturaLabel");
const assinatura2XInput = document.getElementById("assinatura2X");
const assinatura2YInput = document.getElementById("assinatura2Y");
const assinatura2SizeInput = document.getElementById("assinatura2Size");
const assinatura2LabelInput = document.getElementById("assinatura2Label");
const assinatura3XInput = document.getElementById("assinatura3X");
const assinatura3YInput = document.getElementById("assinatura3Y");
const assinatura3SizeInput = document.getElementById("assinatura3Size");
const assinatura3LabelInput = document.getElementById("assinatura3Label");
const selo1XInput = document.getElementById("selo1X");
const selo1YInput = document.getElementById("selo1Y");
const selo1SizeInput = document.getElementById("selo1Size");
const selo2XInput = document.getElementById("selo2X");
const selo2YInput = document.getElementById("selo2Y");
const selo2SizeInput = document.getElementById("selo2Size");
const selo3XInput = document.getElementById("selo3X");
const selo3YInput = document.getElementById("selo3Y");
const selo3SizeInput = document.getElementById("selo3Size");
const selo4XInput = document.getElementById("selo4X");
const selo4YInput = document.getElementById("selo4Y");
const selo4SizeInput = document.getElementById("selo4Size");
const instituicaoXInput = document.getElementById("instituicaoX");
const instituicaoYInput = document.getElementById("instituicaoY");
const instituicaoSizeInput = document.getElementById("instituicaoSize");
const logoAdjustFieldset = document.getElementById("logo-adjust-fieldset");
const qrAdjustFieldset = document.getElementById("qr-adjust-fieldset");
const assinaturaAdjustFieldset = document.getElementById("assinatura-adjust-fieldset");
const assinatura2AdjustFieldset = document.getElementById("assinatura2-adjust-fieldset");
const assinatura3AdjustFieldset = document.getElementById("assinatura3-adjust-fieldset");
const selosAdjustFieldset = document.getElementById("selos-adjust-fieldset");
const selo1AdjustGroup = document.getElementById("selo1-adjust-group");
const selo2AdjustGroup = document.getElementById("selo2-adjust-group");
const selo3AdjustGroup = document.getElementById("selo3-adjust-group");
const selo4AdjustGroup = document.getElementById("selo4-adjust-group");
const instituicaoAdjustFieldset = document.getElementById("instituicao-adjust-fieldset");

const textoLinha1Input = document.getElementById("textoLinha1");
const textoLinha2Input = document.getElementById("textoLinha2");

const logoXVal = document.getElementById("logoXVal");
const logoYVal = document.getElementById("logoYVal");
const logoSizeVal = document.getElementById("logoSizeVal");
const qrXVal = document.getElementById("qrXVal");
const qrYVal = document.getElementById("qrYVal");
const qrSizeVal = document.getElementById("qrSizeVal");
const assinaturaXVal = document.getElementById("assinaturaXVal");
const assinaturaYVal = document.getElementById("assinaturaYVal");
const assinaturaSizeVal = document.getElementById("assinaturaSizeVal");
const assinatura2XVal = document.getElementById("assinatura2XVal");
const assinatura2YVal = document.getElementById("assinatura2YVal");
const assinatura2SizeVal = document.getElementById("assinatura2SizeVal");
const assinatura3XVal = document.getElementById("assinatura3XVal");
const assinatura3YVal = document.getElementById("assinatura3YVal");
const assinatura3SizeVal = document.getElementById("assinatura3SizeVal");
const selo1XVal = document.getElementById("selo1XVal");
const selo1YVal = document.getElementById("selo1YVal");
const selo1SizeVal = document.getElementById("selo1SizeVal");
const selo2XVal = document.getElementById("selo2XVal");
const selo2YVal = document.getElementById("selo2YVal");
const selo2SizeVal = document.getElementById("selo2SizeVal");
const selo3XVal = document.getElementById("selo3XVal");
const selo3YVal = document.getElementById("selo3YVal");
const selo3SizeVal = document.getElementById("selo3SizeVal");
const selo4XVal = document.getElementById("selo4XVal");
const selo4YVal = document.getElementById("selo4YVal");
const selo4SizeVal = document.getElementById("selo4SizeVal");
const instituicaoXVal = document.getElementById("instituicaoXVal");
const instituicaoYVal = document.getElementById("instituicaoYVal");
const instituicaoSizeVal = document.getElementById("instituicaoSizeVal");

const defaultTextoLinha1 = "Certificamos que";
const defaultTextoLinha2 = "concluiu com êxito o curso";
const MAX_CARGA_HORARIA = 2000;
const CERTIFICATE_CANVAS_WIDTH = 1200;
const DEFAULT_LOGO_LAYOUT = Object.freeze({
  x: 600,
  y: 95,
  maxW: 150,
  maxH: 95,
});
const DEFAULT_ASSINATURA_LAYOUT = Object.freeze({
  x: 330,
  y: 662,
  maxW: 230,
  maxH: 80,
});
const DEFAULT_ASSINATURA2_LAYOUT = Object.freeze({
  x: CERTIFICATE_CANVAS_WIDTH / 2,
  y: DEFAULT_ASSINATURA_LAYOUT.y,
  maxW: DEFAULT_ASSINATURA_LAYOUT.maxW,
  maxH: DEFAULT_ASSINATURA_LAYOUT.maxH,
});
const DEFAULT_ASSINATURA3_LAYOUT = Object.freeze({
  x: CERTIFICATE_CANVAS_WIDTH - DEFAULT_ASSINATURA_LAYOUT.x,
  y: DEFAULT_ASSINATURA_LAYOUT.y,
  maxW: DEFAULT_ASSINATURA_LAYOUT.maxW,
  maxH: DEFAULT_ASSINATURA_LAYOUT.maxH,
});
const DEFAULT_INSTITUICAO_LAYOUT = Object.freeze({
  x: CERTIFICATE_CANVAS_WIDTH - DEFAULT_ASSINATURA_LAYOUT.x,
  y: DEFAULT_ASSINATURA_LAYOUT.y,
  maxW: DEFAULT_ASSINATURA_LAYOUT.maxW,
  maxH: DEFAULT_ASSINATURA_LAYOUT.maxH,
});
const DEFAULT_SELO_LAYOUTS = Object.freeze({
  selo1: Object.freeze({ x: 410, y: 745, maxW: 80, maxH: 55 }),
  selo2: Object.freeze({ x: 520, y: 745, maxW: 80, maxH: 55 }),
  selo3: Object.freeze({ x: 640, y: 745, maxW: 80, maxH: 55 }),
  selo4: Object.freeze({ x: 760, y: 745, maxW: 80, maxH: 55 }),
});
const ASSINATURA_CONTROL_LIMITS = Object.freeze({
  xMin: 140,
  xMax: 520,
  yMin: 600,
  yMax: 720,
  sizeMin: 120,
  sizeMax: 360,
});
const INSTITUICAO_CONTROL_LIMITS = Object.freeze({
  xMin: CERTIFICATE_CANVAS_WIDTH - ASSINATURA_CONTROL_LIMITS.xMax,
  xMax: CERTIFICATE_CANVAS_WIDTH - ASSINATURA_CONTROL_LIMITS.xMin,
  yMin: ASSINATURA_CONTROL_LIMITS.yMin,
  yMax: ASSINATURA_CONTROL_LIMITS.yMax,
  sizeMin: ASSINATURA_CONTROL_LIMITS.sizeMin,
  sizeMax: ASSINATURA_CONTROL_LIMITS.sizeMax,
});
const EXTRA_ASSINATURA_CONTROL_LIMITS = Object.freeze({
  xMin: 140,
  xMax: 1060,
  yMin: 560,
  yMax: 760,
  sizeMin: ASSINATURA_CONTROL_LIMITS.sizeMin,
  sizeMax: ASSINATURA_CONTROL_LIMITS.sizeMax,
});
const SELO_CONTROL_LIMITS = Object.freeze({
  xMin: 80,
  xMax: 1120,
  yMin: 620,
  yMax: 805,
  sizeMin: 35,
  sizeMax: 180,
});
const QR_CONTROL_LIMITS = Object.freeze({
  xMin: 70,
  xMax: 1130,
  yMin: 70,
  yMax: 780,
  sizeMin: 60,
  sizeMax: 220,
});
const DEFAULT_QR_LAYOUT = Object.freeze({
  x: 160,
  y: 175,
  maxW: 120,
  maxH: 120,
});
const DEFAULT_ASSINATURA_LABEL = "Assinatura do Responsável";
const SELO_SLOT_KEYS = ["selo1", "selo2", "selo3", "selo4"];
const PREVIEW_ADJUST_TARGET_KEYS = [
  "logo",
  "qr",
  "assinatura",
  "assinatura2",
  "assinatura3",
  "instituicao",
  ...SELO_SLOT_KEYS,
];

const assets = {
  template: null,
  logo: null,
  assinatura: null,
  assinatura2: null,
  assinatura3: null,
  instituicao: null,
  selo1: null,
  selo2: null,
  selo3: null,
  selo4: null,
};

const layout = {
  logo: { ...DEFAULT_LOGO_LAYOUT },
  assinatura: { ...DEFAULT_ASSINATURA_LAYOUT },
  assinatura2: { ...DEFAULT_ASSINATURA2_LAYOUT },
  assinatura3: { ...DEFAULT_ASSINATURA3_LAYOUT },
  instituicao: { ...DEFAULT_INSTITUICAO_LAYOUT },
  selo1: { ...DEFAULT_SELO_LAYOUTS.selo1 },
  selo2: { ...DEFAULT_SELO_LAYOUTS.selo2 },
  selo3: { ...DEFAULT_SELO_LAYOUTS.selo3 },
  selo4: { ...DEFAULT_SELO_LAYOUTS.selo4 },
  qr: { ...DEFAULT_QR_LAYOUT },
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
let savedAssinatura2 = null;
let savedAssinatura2Image = null;
let savedAssinatura3 = null;
let savedAssinatura3Image = null;
let savedInstituicao = null;
let savedInstituicaoImage = null;
let savedSelo1 = null;
let savedSelo1Image = null;
let savedSelo2 = null;
let savedSelo2Image = null;
let savedSelo3 = null;
let savedSelo3Image = null;
let savedSelo4 = null;
let savedSelo4Image = null;
let selectedPreviewAdjustTarget = "";
let isPreviewAdjustPanelApplying = false;

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
  },
};

const adminState = {
  users: [],
  secretarias: [],
  templates: [],
  secretariaAssets: [],
};
const adminUiState = {
  module: "users",
  assetTypeFilter: "logo",
};

const templateCatalogState = {
  items: [],
  selectedId: "",
};
const secretariaAssetCatalogState = {
  logo: { items: [], selectedId: "" },
  assinatura: { items: [], selectedId: "" },
  assinatura2: { items: [], selectedId: "" },
  assinatura3: { items: [], selectedId: "" },
  instituicao: { items: [], selectedId: "" },
  selo: { items: [], selectedId: "" },
  selo1: { items: [], selectedId: "" },
  selo2: { items: [], selectedId: "" },
  selo3: { items: [], selectedId: "" },
  selo4: { items: [], selectedId: "" },
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
const instituicaoAspectRatio = 80 / 230;
const seloAspectRatio = 55 / 80;
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
