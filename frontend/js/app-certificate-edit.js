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
