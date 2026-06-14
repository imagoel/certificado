
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
    if (aliases.some((alias) => normalizeHeader(alias) === normalized)) return field;
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
  const defaultLinha1 = sanitizeText(defaults.linha1);
  const defaultLinha2 = sanitizeText(defaults.linha2);

  const nome =
    buildFullName(mapped.nome, mapped.sobrenome) ||
    (allowSingleCellFallback ? extractSingleCellValue(row) : "");
  const curso = sanitizeText(mapped.curso) || defaultCurso;
  const emailResult = normalizeOptionalEmailResult(mapped.email);
  if (emailResult.invalid) {
    return {
      error: `linha ${rowNumber} (email invalido: ${formatInvalidEmail(mapped.email)})`,
    };
  }

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
  const email = emailResult.value;
  const arquivoBase =
    sanitizeText(mapped.arquivo) ||
    `${String(rowNumber).padStart(4, "0")}_${sanitizeFileName(nome, "aluno")}`;
  const fileName = `${sanitizeFileName(arquivoBase, `certificado_${rowNumber}`)}.png`;

  return { rowNumber, nome, email, curso, data, codigo: "", carga_h, linha1, linha2, fileName };
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
