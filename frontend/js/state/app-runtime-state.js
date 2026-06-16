const fieldAliases = {
  nome: ["nome", "nomecompleto", "nomealuno", "primeironome", "firstname", "aluno", "participante"],
  sobrenome: ["sobrenome", "sobrenomealuno", "sobrenomedoaluno", "ultimonome", "lastname", "surname"],
  curso: ["curso", "nomecurso", "treinamento", "evento"],
  email: [
    "email",
    "e-mail",
    "e_mail",
    "emailaluno",
    "emaildoaluno",
    "emailparticipante",
    "correio",
    "correioeletronico",
  ],
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
let pendingDeleteCertificates = [];
let pendingResendCertificate = null;
let pendingConfirmAction = null;
let editingCertificate = null;
let pendingCertificateEditConfirmation = null;
let isCertificateEditSaving = false;
let pendingBatchGeneration = null;

let selectedPreviewAdjustTarget = "";
let isPreviewAdjustPanelApplying = false;

const DEFAULT_CERTIFICATE_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
