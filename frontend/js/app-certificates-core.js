async function refreshProtectedData(options = {}) {
  if (!sessionState) return;

  await refreshGeneratorCatalogs();
  await loadCertificates(options.page || certListState.page || 1);
  if (canManageVisualAssets()) {
    await loadAdminData();
  }
}

async function refreshGeneratorCatalogs() {
  if (!sessionState) return;

  await loadAvailableTemplates();
  await loadAvailableSecretariaAssets();
  await loadLayoutPresets();
}

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

function syncCertificateEditUi() {
  const isEditing = Boolean(editingCertificate);
  if (certificateEditBanner) {
    certificateEditBanner.hidden = !isEditing;
  }
  if (certificateEditTitle) {
    certificateEditTitle.textContent = isEditing
      ? `Editando certificado ${editingCertificate.codigo || ""}`
      : "Editando certificado";
  }
  if (certificateEditMeta) {
    certificateEditMeta.textContent = isEditing
      ? "O codigo, o link de validacao e a ordem da listagem serao preservados."
      : "";
  }
  if (certificateEditWarning) {
    const hasSnapshot = Boolean(
      editingCertificate &&
        editingCertificate.render_snapshot &&
        typeof editingCertificate.render_snapshot === "object"
    );
    certificateEditWarning.hidden = !isEditing || hasSnapshot;
    certificateEditWarning.textContent = hasSnapshot
      ? ""
      : "Este certificado ainda nao tinha layout salvo. Revise as posicoes antes de salvar.";
  }
  if (certificateEditSaveBtn) {
    certificateEditSaveBtn.disabled =
      !isEditing || isCertificateEditSaving || isBatchRunning || isSingleGenerationRunning;
    certificateEditSaveBtn.textContent = isCertificateEditSaving
      ? "Salvando..."
      : "Salvar alteracoes";
  }
  if (certificateEditCancelBtn) {
    certificateEditCancelBtn.disabled = isCertificateEditSaving;
  }
  if (batchPreviewBtn) batchPreviewBtn.disabled = isEditing || isBatchRunning;
  if (batchGenerateBtn) batchGenerateBtn.disabled = isEditing || isBatchRunning;
  syncGenerateSubmitButton();
}

function closeCertificateEditDialog() {
  pendingCertificateEditConfirmation = null;
  if (editCertForm) editCertForm.reset();
  setEditCertStatus("", "info");
  if (editCertDialog && typeof editCertDialog.close === "function" && editCertDialog.open) {
    editCertDialog.close();
  }
}

function cancelCertificateEditMode(options = {}) {
  const code = editingCertificate ? sanitizeText(editingCertificate.codigo).toUpperCase() : "";
  editingCertificate = null;
  pendingCertificateEditConfirmation = null;
  isCertificateEditSaving = false;
  lastData = null;
  if (downloadBtn) downloadBtn.disabled = true;
  closeCertificateEditDialog();
  syncCertificateEditUi();
  void renderLastCertificate();
  if (!options.silent) {
    setBatchStatus(code ? `Edicao do certificado ${code} cancelada.` : "Edicao cancelada.", "info");
  }
}

async function ensureActiveSecretariaForCertificate(item) {
  if (!item || !sessionState || !item.secretaria_id) return;
  const targetSecretariaId = Number(item.secretaria_id);
  if (!targetSecretariaId || Number(sessionState.secretaria_ativa_id) === targetSecretariaId) {
    return;
  }

  const canSelectTarget = Array.isArray(sessionState.secretarias)
    && sessionState.secretarias.some((secretaria) => Number(secretaria.id) === targetSecretariaId);
  if (!canSelectTarget) {
    setBatchStatus(
      "Nao foi possivel trocar para a secretaria do certificado. Revise os ativos antes de salvar.",
      "error"
    );
    return;
  }

  setBatchStatus("Carregando ativos da secretaria do certificado...", "info");
  const session = await apiJsonRequest("/api/auth/select-secretaria", {
    method: "POST",
    body: JSON.stringify({ secretaria_id: targetSecretariaId }),
  });
  renderSession(session);
  await refreshProtectedData({ page: certListState.page || 1 });
}

async function openCertificateEditMode(item) {
  if (!item || !isAdminSession() || certListState.trashMode) return;

  try {
    await ensureActiveSecretariaForCertificate(item);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setBatchStatus(
      (error && error.message) ||
        "Nao foi possivel carregar a secretaria do certificado para edicao.",
      "error"
    );
    return;
  }

  editingCertificate = { ...item };
  const codigo = sanitizeText(item.codigo).toUpperCase();
  const qrText = sanitizeText(item.url_validacao);

  if (nomeInput) nomeInput.value = item.nome || "";
  if (cursoInput) cursoInput.value = item.curso || "";
  if (emailInput) emailInput.value = item.email || "";
  populateCertificateReplyEmailOptions(item.reply_email_id || "");
  if (dataInput) dataInput.value = item.concluido || "";
  if (cargaHInput) cargaHInput.value = item.carga_h ? String(item.carga_h) : "";

  const prepared = getCertificateFormPrepared();
  lastData = buildCertificateLastData(prepared, codigo, qrText);
  downloadBtn.disabled = false;
  switchSection("generator");
  syncCertificateEditUi();
  setBatchStatus(
    `Editando certificado ${codigo}. Ajuste os dados e revise a previa antes de salvar.`,
    "info"
  );

  if (item.render_snapshot && typeof item.render_snapshot === "object") {
    await applyLayoutPresetPayload(item.render_snapshot);
    setPreviewAdjustStatus(`Layout salvo do certificado ${codigo} aplicado.`);
    return;
  }

  setPreviewAdjustStatus(
    `Certificado ${codigo} sem layout salvo. Revise as posicoes antes de salvar.`
  );
  await renderLastCertificate();
}

function openCertificateEditConfirmDialog() {
  if (!editingCertificate || !isAdminSession()) {
    setBatchStatus("Nenhum certificado em edicao.", "error");
    return;
  }

  let prepared = null;
  try {
    prepared = getCertificateFormPrepared();
  } catch (error) {
    setBatchStatus(error.message || "Revise os dados do certificado.", "error");
    if (error.field === "email" && emailInput && typeof emailInput.reportValidity === "function") {
      emailInput.reportValidity();
    }
    if (error.field === "carga_h" && cargaHInput && typeof cargaHInput.reportValidity === "function") {
      cargaHInput.reportValidity();
    }
    return;
  }

  syncEditingCertificateLastDataFromForm();
  pendingCertificateEditConfirmation = prepared;
  const codigo = sanitizeText(editingCertificate.codigo).toUpperCase();

  if (!editCertDialog || !editCertForm || typeof editCertDialog.showModal !== "function") {
    setBatchStatus("Modal de confirmacao indisponivel neste navegador.", "error");
    return;
  }

  if (editCertCurrentCodeInput) editCertCurrentCodeInput.value = codigo;
  if (editCertConfirmCodeInput) editCertConfirmCodeInput.value = "";
  if (editCertPasswordInput) editCertPasswordInput.value = "";
  if (editCertMessage) {
    editCertMessage.textContent =
      `Confirme o codigo ${codigo} e informe a senha do administrador para salvar a edicao.`;
  }
  setEditCertStatus("", "info");
  editCertDialog.showModal();
}

async function offerResendEditedCertificateEmail(payload, codigo) {
  if (!payload || !payload.email) {
    return {
      attempted: false,
      message: `Certificado ${codigo} atualizado com sucesso.`,
      type: "success",
    };
  }

  const targetCode = sanitizeText(payload.codigo || codigo).toUpperCase();
  const participantName = sanitizeText(payload.nome) || "participante selecionado";
  const confirmed = await openConfirmActionDialog({
    title: "Reenviar certificado atualizado?",
    message: `O certificado de ${participantName} foi atualizado com sucesso.`,
    summary: `Destino: ${payload.email}`,
    confirmLabel: "Reenviar e-mail",
  });
  if (!confirmed) {
    return {
      attempted: false,
      message: `Certificado ${targetCode} atualizado com sucesso. E-mail nao reenviado.`,
      type: "success",
    };
  }

  try {
    setBatchStatus(`Reenviando e-mail atualizado do certificado ${targetCode}...`, "info");
    const resendPayload = await apiJsonRequest(
      `/api/certificados/${encodeURIComponent(targetCode)}/reenviar-email`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    if (resendPayload && resendPayload.email_envio_status === "enviado") {
      return {
        attempted: true,
        message: `Certificado ${targetCode} atualizado e e-mail reenviado com sucesso.`,
        type: "success",
      };
    }

    return {
      attempted: true,
      message: `Certificado ${targetCode} atualizado, mas o e-mail nao foi enviado.`,
      type: "error",
    };
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return {
        attempted: true,
        message: "Sessao encerrada antes do reenvio do e-mail.",
        type: "error",
      };
    }
    return {
      attempted: true,
      message:
        `Certificado ${targetCode} atualizado, mas nao foi possivel reenviar o e-mail agora. ` +
        "Tente novamente pela aba Certificados.",
      type: "error",
    };
  }
}

async function saveCertificateEdit(prepared, password, confirmationCode) {
  if (!editingCertificate || !prepared || isCertificateEditSaving) return;

  const codigo = sanitizeText(editingCertificate.codigo).toUpperCase();
  const qrText = sanitizeText(editingCertificate.url_validacao);
  const confirmCode = sanitizeText(confirmationCode).toUpperCase();
  if (confirmCode !== codigo) {
    setEditCertStatus("Digite o codigo exato do certificado para confirmar.", "error");
    return;
  }
  if (!password) {
    setEditCertStatus("Informe a senha do administrador.", "error");
    return;
  }

  isCertificateEditSaving = true;
  syncCertificateEditUi();

  try {
    setEditCertStatus(`Gerando novo PNG de ${codigo}...`, "info");
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

    const formData = new FormData();
    formData.append("nome", prepared.nome);
    formData.append("curso", prepared.curso);
    formData.append("email", prepared.email || "");
    if (prepared.replyEmailId) {
      formData.append("reply_email_id", String(prepared.replyEmailId));
    }
    formData.append("concluido", prepared.data);
    formData.append("carga_h", String(prepared.cargaH || 0));
    formData.append("render_snapshot", JSON.stringify(buildLayoutPresetPayload()));
    formData.append("password", password);
    formData.append("confirmacao_codigo", confirmCode);
    formData.append("arquivo", pngBlob, `${sanitizeFileName(codigo, codigo)}.png`);

    setEditCertStatus(`Salvando alteracoes de ${codigo}...`, "info");
    const payload = await apiFormRequest(
      `/api/admin/certificados/${encodeURIComponent(codigo)}`,
      formData,
      { method: "PATCH" }
    );

    lastData = buildCertificateLastData(
      {
        nome: payload.nome || prepared.nome,
        curso: payload.curso || prepared.curso,
        email: payload.email || prepared.email || "",
        data: payload.concluido || prepared.data,
        cargaH: payload.carga_h || 0,
        linha1: prepared.linha1,
        linha2: prepared.linha2,
      },
      payload.codigo || codigo,
      payload.url_validacao || qrText
    );
    editingCertificate = null;
    pendingCertificateEditConfirmation = null;
    downloadBtn.disabled = false;
    closeCertificateEditDialog();
    syncCertificateEditUi();
    const resendResult = await offerResendEditedCertificateEmail(payload, codigo);
    setBatchStatus(resendResult.message, resendResult.type);
    await loadCertificates(certListState.page || 1);
    await loadAuditEvents(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      if (error.message === "Senha do administrador invalida.") {
        setEditCertStatus(error.message, "error");
        if (editCertPasswordInput) editCertPasswordInput.value = "";
        return;
      }
      await handleUnauthorized();
      return;
    }
    setEditCertStatus(
      (error && error.message) || "Nao foi possivel salvar a edicao.",
      "error"
    );
  } finally {
    isCertificateEditSaving = false;
    syncCertificateEditUi();
  }
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
