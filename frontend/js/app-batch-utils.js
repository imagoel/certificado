function canvasToPngBlob() {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error("Canvas nÃ£o disponÃ­vel."));
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("NÃ£o foi possÃ­vel converter o certificado para PNG."));
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

