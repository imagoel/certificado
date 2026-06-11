async function refreshProtectedData(options = {}) {
  if (!sessionState) return;

  await loadAvailableTemplates();
  await loadAvailableSecretariaAssets();
  await loadLayoutPresets();
  await loadCertificates(options.page || certListState.page || 1);
  if (canManageVisualAssets()) {
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
