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
