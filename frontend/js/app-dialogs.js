function resolveConfirmAction(result) {
  if (!pendingConfirmAction) return;
  const resolver = pendingConfirmAction.resolve;
  pendingConfirmAction = null;
  if (confirmActionSummary) {
    confirmActionSummary.classList.remove("danger-summary");
  }
  if (confirmActionSubmitBtn) {
    confirmActionSubmitBtn.className = "";
  }
  if (
    confirmActionDialog &&
    typeof confirmActionDialog.close === "function" &&
    confirmActionDialog.open
  ) {
    confirmActionDialog.close();
  }
  resolver(Boolean(result));
}
function openConfirmActionDialog(options = {}) {
  if (
    !confirmActionDialog ||
    !confirmActionForm ||
    typeof confirmActionDialog.showModal !== "function"
  ) {
    return Promise.resolve(false);
  }

  if (pendingConfirmAction) {
    resolveConfirmAction(false);
  }

  const title = sanitizeText(options.title) || "Confirmar ação";
  const message = sanitizeText(options.message) || "Revise as informações antes de continuar.";
  const summary = sanitizeText(options.summary);
  const confirmLabel = sanitizeText(options.confirmLabel) || "Confirmar";
  const danger = Boolean(options.danger);

  if (confirmActionTitle) confirmActionTitle.textContent = title;
  if (confirmActionMessage) confirmActionMessage.textContent = message;
  if (confirmActionSummary) {
    confirmActionSummary.textContent = summary || "Esta ação será executada após a confirmação.";
    confirmActionSummary.classList.toggle("danger-summary", danger);
  }
  if (confirmActionSubmitBtn) {
    confirmActionSubmitBtn.textContent = confirmLabel;
    confirmActionSubmitBtn.className = danger ? "danger-btn" : "";
  }
  if (confirmActionForm) confirmActionForm.reset();

  if (confirmActionDialog.open) {
    confirmActionDialog.close();
  }
  confirmActionDialog.showModal();

  return new Promise((resolve) => {
    pendingConfirmAction = { resolve };
  });
}
function closeDeleteCertificateDialog() {
  pendingDeleteCertificate = null;
  pendingDeleteCertificates = [];
  if (deleteCertForm) deleteCertForm.reset();
  setDeleteCertStatus("", "info");
  if (deleteCertDialog && typeof deleteCertDialog.close === "function" && deleteCertDialog.open) {
    deleteCertDialog.close();
  }
}
function openDeleteCertificatesDialog(items) {
  if (!deleteCertDialog || !deleteCertForm || !isAdminSession()) return;

  const selectedItems = (items || []).filter((item) => item && item.codigo);
  if (!selectedItems.length) return;

  pendingDeleteCertificates = selectedItems;
  pendingDeleteCertificate = selectedItems.length === 1 ? selectedItems[0] : null;
  const count = selectedItems.length;
  const firstItem = selectedItems[0];
  if (deleteCertCurrentCodeInput) {
    deleteCertCurrentCodeInput.value =
      count === 1
        ? `${firstItem.codigo || ""} - ${firstItem.nome || "Participante"}`
        : `${count} certificados selecionados`;
  }
  if (deleteCertPasswordInput) {
    deleteCertPasswordInput.value = "";
  }
  if (deleteCertMessage) {
    deleteCertMessage.textContent =
      count === 1
        ? `Informe a senha do administrador para mover ${firstItem.nome || "este certificado"} para a lixeira.`
        : `Informe a senha do administrador para mover ${count} certificados para a lixeira.`;
  }
  setDeleteCertStatus("", "info");
  if (typeof deleteCertDialog.showModal === "function") {
    deleteCertDialog.showModal();
  }
}
function openDeleteCertificateDialog(item) {
  openDeleteCertificatesDialog([item]);
}
function closeResendEmailDialog() {
  pendingResendCertificate = null;
  if (resendEmailForm) resendEmailForm.reset();
  setResendEmailStatus("", "info");
  if (
    resendEmailDialog &&
    typeof resendEmailDialog.close === "function" &&
    resendEmailDialog.open
  ) {
    resendEmailDialog.close();
  }
}
function openResendEmailDialog(item) {
  if (!resendEmailDialog || !resendEmailForm || !canResendCertificateEmail(item)) return;

  pendingResendCertificate = item;
  const participantName = sanitizeText(item.nome) || "participante selecionado";
  const email = sanitizeText(item.email);

  if (resendEmailMessage) {
    resendEmailMessage.textContent = `O certificado de ${participantName} será enviado novamente.`;
  }
  if (resendEmailSummary) {
    resendEmailSummary.innerHTML = "";
    const name = document.createElement("strong");
    name.textContent = participantName;
    const details = document.createElement("p");
    details.className = "duplicate-cert-meta";
    details.textContent = `Destino: ${email}`;
    resendEmailSummary.append(name, details);
  }

  setResendEmailStatus("", "info");
  if (typeof resendEmailDialog.showModal === "function") {
    resendEmailDialog.showModal();
  }
}
function closeClearTrashDialog() {
  if (clearTrashForm) clearTrashForm.reset();
  setClearTrashStatus("", "info");
  if (clearTrashDialog && typeof clearTrashDialog.close === "function" && clearTrashDialog.open) {
    clearTrashDialog.close();
  }
}
function openClearTrashDialog() {
  if (!clearTrashDialog || !clearTrashForm || !isAdminSession()) return;

  if (clearTrashConfirmationInput) clearTrashConfirmationInput.value = "";
  if (clearTrashPasswordInput) clearTrashPasswordInput.value = "";
  setClearTrashStatus("", "info");
  if (typeof clearTrashDialog.showModal === "function") {
    clearTrashDialog.showModal();
  }
}
function renderDuplicateCertificateList(items = []) {
  if (!duplicateCertList) return;

  duplicateCertList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "duplicate-cert-meta";
    empty.textContent = "Nenhum certificado semelhante encontrado.";
    duplicateCertList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "duplicate-cert-item";

    const title = document.createElement("strong");
    title.textContent = `${item.codigo || "-"} · ${item.nome || "-"}`;

    const meta = document.createElement("p");
    meta.className = "duplicate-cert-meta";
    meta.textContent =
      `Curso: ${item.curso || "-"} | Conclusão: ${formatDate(item.concluido)} | ` +
      `Emitido em: ${formatDateTime(item.emitido_em)}`;

    const actions = document.createElement("div");
    actions.className = "inline-actions";

    const openTarget = item.arquivo_admin_url || item.arquivo_url || item.url_validacao || "";
    const openLabel = item.arquivo_admin_url || item.arquivo_url ? "Abrir PNG" : "Abrir validação";
    const openBtn = createInlineButton(openLabel, () => {
      if (!openTarget) return;
      window.open(openTarget, "_blank", "noopener,noreferrer");
    });
    openBtn.disabled = !openTarget;
    actions.appendChild(openBtn);

    wrapper.append(title, meta, actions);
    duplicateCertList.appendChild(wrapper);
  });
}
function closeDuplicateCertificateDialog({ keepPending = false } = {}) {
  if (!keepPending) {
    pendingDuplicateCertificate = null;
  }
  setDuplicateCertStatus("", "info");
  if (
    duplicateCertDialog &&
    typeof duplicateCertDialog.close === "function" &&
    duplicateCertDialog.open
  ) {
    duplicateCertDialog.close();
  }
}
function openDuplicateCertificateDialog(prepared, duplicates) {
  if (!duplicateCertDialog || !duplicateCertForm) return;

  pendingDuplicateCertificate = {
    prepared,
    duplicates: Array.isArray(duplicates) ? duplicates : [],
  };

  if (duplicateCertMessage) {
    duplicateCertMessage.textContent =
      "Já existem certificados emitidos com o mesmo nome, curso e data na secretaria ativa.";
  }
  if (duplicateCertSummary) {
    duplicateCertSummary.textContent =
      `${pendingDuplicateCertificate.duplicates.length} certificado(s) semelhante(s) encontrado(s). ` +
      "Abra um existente para reimpressão ou escolha gerar mesmo assim.";
  }

  renderDuplicateCertificateList(pendingDuplicateCertificate.duplicates);
  setDuplicateCertStatus("", "info");
  if (typeof duplicateCertDialog.showModal === "function") {
    duplicateCertDialog.showModal();
  }
}
function closeBatchConfirmDialog() {
  pendingBatchGeneration = null;
  if (batchConfirmForm) batchConfirmForm.reset();
  setBatchConfirmStatus("", "info");
  if (
    batchConfirmDialog &&
    typeof batchConfirmDialog.close === "function" &&
    batchConfirmDialog.open
  ) {
    batchConfirmDialog.close();
  }
}
