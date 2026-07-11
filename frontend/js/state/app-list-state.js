const certListState = {
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 1,
  trashMode: false,
  selectedCodes: new Set(),
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
  selectedEmailSecretariaId: "",
  templates: [],
  secretariaAssets: [],
};
const adminUiState = {
  module: "users",
  assetTypeFilter: "logo",
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

const formsState = {
  items: [],
  responses: [],
  selectedFormId: "",
  mode: "create",
  isLoading: false,
};

const viewSections = {
  generator: generatorSection,
  certificates: certificatesSection,
  forms: formsSection,
  emails: emailsSection,
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
