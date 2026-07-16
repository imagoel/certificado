async function registerSingleCertificate(cert) {
  const payload = {
    nome: cert.nome,
    email: cert.email || null,
    reply_email_id: cert.replyEmailId || null,
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
function getCertificateFormPrepared() {
  const nome = nomeInput ? nomeInput.value.trim() : "";
  const curso = cursoInput ? cursoInput.value.trim() : "";
  const emailResult = normalizeOptionalEmailResult(emailInput ? emailInput.value : "");
  const data = dataInput ? dataInput.value : "";
  const cargaResult = getFormCargaHorariaResult();
  if (emailInput && typeof emailInput.setCustomValidity === "function") {
    emailInput.setCustomValidity("");
  }
  if (emailResult.invalid) {
    const error = new Error("Email do participante invalido.");
    if (emailInput && typeof emailInput.setCustomValidity === "function") {
      emailInput.setCustomValidity(error.message);
    }
    error.field = "email";
    throw error;
  }

  if (cargaResult.invalid) {
    const error = new Error(
      `A carga horaria deve estar entre 0 e ${MAX_CARGA_HORARIA} horas.`
    );
    error.field = "carga_h";
    throw error;
  }

  if (!nome || !curso || !data) {
    const error = new Error("Preencha nome, curso e data de conclusao.");
    error.field = "required";
    throw error;
  }

  return {
    nome,
    curso,
    email: emailResult.value,
    replyEmailId: getSelectedReplyEmailId(),
    data,
    cargaH: cargaResult.value ?? 0,
    linha1: textoLinha1Input ? textoLinha1Input.value.trim() : "",
    linha2: textoLinha2Input ? textoLinha2Input.value.trim() : "",
  };
}
function buildCertificateLastData(prepared, codigo, qrText) {
  return {
    nome: prepared.nome,
    curso: prepared.curso,
    email: prepared.email || "",
    replyEmailId: prepared.replyEmailId || null,
    data: prepared.data,
    cargaH: prepared.cargaH,
    codigo: sanitizeText(codigo).toUpperCase(),
    linha1: prepared.linha1,
    linha2: prepared.linha2,
    qrText: sanitizeText(qrText),
  };
}
function syncEditingCertificateLastDataFromForm() {
  if (!editingCertificate || !lastData) return;
  const cargaResult = getFormCargaHorariaResult();
  lastData.nome = nomeInput ? nomeInput.value.trim() : "";
  lastData.curso = cursoInput ? cursoInput.value.trim() : "";
  lastData.email = emailInput ? emailInput.value.trim() : "";
  lastData.replyEmailId = getSelectedReplyEmailId();
  lastData.data = dataInput ? dataInput.value : "";
  lastData.cargaH = cargaResult.invalid ? 0 : (cargaResult.value ?? 0);
  lastData.linha1 = textoLinha1Input ? textoLinha1Input.value.trim() : "";
  lastData.linha2 = textoLinha2Input ? textoLinha2Input.value.trim() : "";
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
      email: prepared.email,
      replyEmailId: prepared.replyEmailId,
      curso: prepared.curso,
      data: prepared.data,
      carga_h: prepared.cargaH,
    });

    const codigo = sanitizeText(registered.codigo).toUpperCase();
    registeredCode = codigo;
    const qrText = sanitizeText(registered.url_validacao);

    lastData = buildCertificateLastData(prepared, codigo, qrText);
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
    await uploadCertificateImage(codigo, pngBlob, codigo, {
      renderSnapshot: buildLayoutPresetPayload(),
    });
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
      email: item.email || null,
      reply_email_id: item.replyEmailId || getSelectedReplyEmailId() || null,
      curso: item.curso,
      carga_h: Number.isFinite(item.carga_h) ? item.carga_h : 0,
      concluido: item.data,
      formulario_resposta_id: item.formularioRespostaId || null,
    })),
  };

  return apiJsonRequest("/api/certificados/lote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
