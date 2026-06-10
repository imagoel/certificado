function setQuickButtonState(button, active) {
  if (!button) return;
  button.classList.toggle("is-active", Boolean(active));
}

function syncCertificateFilterInputsFromState() {
  if (certFilterBuscaInput) certFilterBuscaInput.value = certListState.filters.busca || "";
  if (certFilterSecretariaSelect) {
    certFilterSecretariaSelect.value = certListState.filters.secretariaId || "";
  }
  if (certFilterConcluidoDeInput) {
    certFilterConcluidoDeInput.value = certListState.filters.concluidoDe || "";
  }
  if (certFilterConcluidoAteInput) {
    certFilterConcluidoAteInput.value = certListState.filters.concluidoAte || "";
  }
  if (certFilterEmitidoDeInput) {
    certFilterEmitidoDeInput.value = certListState.filters.emitidoDe || "";
  }
  if (certFilterEmitidoAteInput) {
    certFilterEmitidoAteInput.value = certListState.filters.emitidoAte || "";
  }
  updateCertificateQuickFilterButtons();
}

function readCertificateFiltersFromInputs() {
  certListState.filters.busca = certFilterBuscaInput ? certFilterBuscaInput.value.trim() : "";
  certListState.filters.secretariaId = certFilterSecretariaSelect
    ? certFilterSecretariaSelect.value
    : "";
  certListState.filters.concluidoDe = certFilterConcluidoDeInput
    ? certFilterConcluidoDeInput.value
    : "";
  certListState.filters.concluidoAte = certFilterConcluidoAteInput
    ? certFilterConcluidoAteInput.value
    : "";
  certListState.filters.emitidoDe = certFilterEmitidoDeInput
    ? certFilterEmitidoDeInput.value
    : "";
  certListState.filters.emitidoAte = certFilterEmitidoAteInput
    ? certFilterEmitidoAteInput.value
    : "";
}

function resetCertificateFiltersState() {
  certListState.filters.busca = "";
  certListState.filters.secretariaId = "";
  certListState.filters.concluidoDe = "";
  certListState.filters.concluidoAte = "";
  certListState.filters.emitidoDe = "";
  certListState.filters.emitidoAte = "";
}

function updateCertificateQuickFilterButtons() {
  const todayRange = getLastDaysRange(1);
  const last7Range = getLastDaysRange(7);
  const activeSecretariaId = sessionState && sessionState.secretaria_ativa_id
    ? String(sessionState.secretaria_ativa_id)
    : "";

  setQuickButtonState(
    certQuickTodayBtn,
    certListState.filters.emitidoDe === todayRange.start
      && certListState.filters.emitidoAte === todayRange.end
  );
  setQuickButtonState(
    certQuickLast7Btn,
    certListState.filters.emitidoDe === last7Range.start
      && certListState.filters.emitidoAte === last7Range.end
  );
  setQuickButtonState(
    certQuickActiveSecretariaBtn,
    Boolean(activeSecretariaId)
      && String(certListState.filters.secretariaId || "") === activeSecretariaId
  );
}

function syncAuditFilterInputsFromState() {
  if (auditSearchInput) auditSearchInput.value = auditState.filters.busca || "";
  if (auditEventSelect) auditEventSelect.value = auditState.filters.evento || "";
  if (auditSecretariaSelect) {
    auditSecretariaSelect.value = auditState.filters.secretariaId || "";
  }
  if (auditCreatedDeInput) auditCreatedDeInput.value = auditState.filters.criadoDe || "";
  if (auditCreatedAteInput) auditCreatedAteInput.value = auditState.filters.criadoAte || "";
  updateAuditQuickFilterButtons();
}

function readAuditFiltersFromInputs() {
  auditState.filters.busca = auditSearchInput ? auditSearchInput.value.trim() : "";
  auditState.filters.evento = auditEventSelect ? auditEventSelect.value : "";
  auditState.filters.secretariaId = auditSecretariaSelect
    ? auditSecretariaSelect.value
    : "";
  auditState.filters.criadoDe = auditCreatedDeInput ? auditCreatedDeInput.value : "";
  auditState.filters.criadoAte = auditCreatedAteInput ? auditCreatedAteInput.value : "";
}

function resetAuditFiltersState() {
  auditState.filters.busca = "";
  auditState.filters.evento = "";
  auditState.filters.secretariaId = "";
  auditState.filters.criadoDe = "";
  auditState.filters.criadoAte = "";
}

function updateAuditQuickFilterButtons() {
  const todayRange = getLastDaysRange(1);
  const last7Range = getLastDaysRange(7);
  const activeSecretariaId = sessionState && sessionState.secretaria_ativa_id
    ? String(sessionState.secretaria_ativa_id)
    : "";

  setQuickButtonState(
    auditQuickTodayBtn,
    auditState.filters.criadoDe === todayRange.start
      && auditState.filters.criadoAte === todayRange.end
  );
  setQuickButtonState(
    auditQuickLast7Btn,
    auditState.filters.criadoDe === last7Range.start
      && auditState.filters.criadoAte === last7Range.end
  );
  setQuickButtonState(
    auditQuickActiveSecretariaBtn,
    Boolean(activeSecretariaId)
      && String(auditState.filters.secretariaId || "") === activeSecretariaId
  );
}
