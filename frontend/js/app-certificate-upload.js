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
    if (options.renderSnapshot) {
      formData.append("render_snapshot", JSON.stringify(options.renderSnapshot));
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/certificados/${encodeURIComponent(certCode)}/arquivo`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            ...getCsrfHeaders("POST"),
          },
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
