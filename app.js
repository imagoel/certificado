const form = document.getElementById("cert-form");
const downloadBtn = document.getElementById("download");
const logoInput = document.getElementById("logo");
const assinaturaInput = document.getElementById("assinatura");
const planilhaInput = document.getElementById("planilha");
const batchGenerateBtn = document.getElementById("batch-generate");

const batchStatus = document.getElementById("batch-status");
const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const cargaHInput = document.getElementById("carga_h");

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
  linha1: ["linha1", "textolinha1", "texto1", "frase1"],
  linha2: ["linha2", "textolinha2", "texto2", "frase2"],
  arquivo: ["arquivo", "nomearquivo", "filename", "file"],
};

let lastData = null;
let renderTicket = 0;
let isBatchRunning = false;

const qrImageCache = new Map();
const logoAspectRatio = 95 / 150;
const assinaturaAspectRatio = 80 / 230;

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
  if (window.location.port === "29180") {
    return window.location.origin.replace(/\/+$/, "");
  }
  const host = window.location.hostname || "localhost";
  return `${window.location.protocol}//${host}:29180`;
}

async function apiJsonRequest(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
    throw new Error(
      (payload && (payload.detail || payload.message)) ||
        `Falha na API de certificados (HTTP ${response.status}).`
    );
  }

  return payload;
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
      carga_h: 0,
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
    throw new Error(
      (payload && (payload.detail || payload.message)) ||
        `Falha ao enviar PNG do certificado (HTTP ${response.status}).`
    );
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

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(trimAssetImage(image));
      image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
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

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#1a4f8b";
  ctx.lineWidth = 16;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.strokeStyle = "#d9b14c";
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);

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
  if (!lastData) return;
  try {
    await drawCertificate(
      lastData.nome,
      lastData.curso,
      lastData.data,
      lastData.linha1,
      lastData.linha2,
      lastData.qrText || "",
      lastData.codigo || "",
      lastData.cargaH || 0
    );
  } catch (error) {
    console.error(error);
  }
}

async function handleAssetChange(input, key) {
  if (!input) return;
  const file = input.files[0];

  if (!file) {
    assets[key] = null;
    void renderLastCertificate();
    return;
  }

  try {
    assets[key] = await loadImage(file);
    void renderLastCertificate();
  } catch (error) {
    alert(error.message);
    input.value = "";
    assets[key] = null;
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

function normalizeSpreadsheetDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toDateInputValue(value);
  }

  if (
    typeof value === "number" &&
    window.XLSX &&
    window.XLSX.SSF &&
    typeof window.XLSX.SSF.parse_date_code === "function"
  ) {
    const parsed = window.XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
    }
  }

  const text = sanitizeText(value);
  if (!text) return "";

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const br = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (br) return `${br[3]}-${pad2(br[2])}-${pad2(br[1])}`;

  const ymd = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${pad2(ymd[2])}-${pad2(ymd[3])}`;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateInputValue(parsed);
  }

  return "";
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
  const defaultLinha1 = sanitizeText(defaults.linha1) || defaultTextoLinha1;
  const defaultLinha2 = sanitizeText(defaults.linha2) || defaultTextoLinha2;

  const nome = buildFullName(mapped.nome, mapped.sobrenome) || extractSingleCellValue(row);
  const curso = sanitizeText(mapped.curso) || defaultCurso;
  const data = normalizeSpreadsheetDate(mapped.data) || defaultData;

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

  return { nome, curso, data, codigo: "", linha1, linha2, fileName };
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



async function handleBatchGenerate() {
  if (!planilhaInput || !batchGenerateBtn) return;
  if (isBatchRunning) return;

  const file = planilhaInput.files && planilhaInput.files[0];
  if (!file) {
    setBatchStatus("Selecione uma planilha antes de gerar o lote.", "error");
    return;
  }

  const isCsvFile = (file.name || "").toLowerCase().endsWith(".csv");

  if (!isCsvFile && !window.XLSX) {
    setBatchStatus("Falha: biblioteca de planilha não carregou.", "error");
    return;
  }

  if (!window.JSZip) {
    setBatchStatus("Falha: biblioteca ZIP não carregou.", "error");
    return;
  }

  isBatchRunning = true;
  batchGenerateBtn.disabled = true;

  const previousLastData = lastData ? { ...lastData } : null;
  const batchDefaults = {
    curso: (() => {
      const input = document.getElementById("curso");
      return input ? input.value : "";
    })(),
    data: (() => {
      const input = document.getElementById("data");
      return input ? input.value : "";
    })(),
    linha1: textoLinha1Input ? textoLinha1Input.value : defaultTextoLinha1,
    linha2: textoLinha2Input ? textoLinha2Input.value : defaultTextoLinha2,
  };

  try {
    setBatchStatus("Lendo planilha...", "info");
    const rows = await readSpreadsheetRows(file);
    if (!rows.length) {
      throw new Error("A planilha está vazia.");
    }

    const certificates = [];
    const invalidRows = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      if (isRowEmpty(row)) return;
      const item = mapRowToCertificate(row, rowNumber, batchDefaults);
      if (item.error) {
        invalidRows.push(item.error);
        return;
      }
      certificates.push(item);
    });

    if (invalidRows.length) {
      const preview = invalidRows.slice(0, 5).join(", ");
      const suffix = invalidRows.length > 5 ? ", ..." : "";
      throw new Error(
        `Existem linhas com campos obrigatórios faltando (${invalidRows.length}): ${preview}${suffix}.`
      );
    }

    if (!certificates.length) {
      throw new Error("Nenhuma linha válida encontrada para gerar certificados.");
    }

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
      setBatchStatus(
        `Gerando ${index + 1}/${certificates.length}: ${cert.nome}`,
        "info"
      );

      await drawCertificate(
        cert.nome,
        cert.curso,
        cert.data,
        cert.linha1,
        cert.linha2,
        cert.qrText,
        cert.codigo
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
        codigo: lastGenerated.codigo,
        linha1: lastGenerated.linha1,
        linha2: lastGenerated.linha2,
        qrText: lastGenerated.qrText,
      };
      downloadBtn.disabled = false;
    }

    setBatchStatus(
      `Lote concluído: ${certificates.length} certificado(s) gerado(s).`,
      "success"
    );
  } catch (error) {
    console.error(error);
    setBatchStatus(error.message || "Falha ao gerar lote.", "error");
  } finally {
    if (previousLastData) {
      lastData = previousLastData;
      await renderLastCertificate();
    }

    batchGenerateBtn.disabled = false;
    isBatchRunning = false;
  }
}

if (!form || !downloadBtn || !canvas || !ctx) {
  alert("Erro de inicialização. Recarregue com Ctrl+F5.");
} else {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isBatchRunning) return;

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
    } catch (error) {
      console.error(error);
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
      if (!lastData || isBatchRunning) return;
      lastData.linha1 = textoLinha1Input.value.trim() || defaultTextoLinha1;
      void renderLastCertificate();
    });
  }

  if (textoLinha2Input) {
    textoLinha2Input.addEventListener("input", () => {
      if (!lastData || isBatchRunning) return;
      lastData.linha2 = textoLinha2Input.value.trim() || defaultTextoLinha2;
      void renderLastCertificate();
    });
  }

  if (planilhaInput) {
    planilhaInput.addEventListener("change", () => {
      const file = planilhaInput.files && planilhaInput.files[0];
      if (!file) {
        setBatchStatus("", "info");
        return;
      }
      setBatchStatus(`Planilha selecionada: ${file.name}`, "info");
    });
  }



  if (batchGenerateBtn) {
    batchGenerateBtn.addEventListener("click", () => {
      void handleBatchGenerate();
    });
  }

  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "certificado.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

setTodayDate();
updateControlLabels();
