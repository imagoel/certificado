function setCertificateFormStatus(message, type = "info") {
  setStatusMessage(certificateFormStatus, message, type);
}
function setFormResponsesStatus(message, type = "info") {
  setStatusMessage(formResponsesStatus, message, type);
}
function getFormSecretariaById(secretariaId) {
  const id = Number(secretariaId);
  const secretarias = sessionState && Array.isArray(sessionState.secretarias)
    ? sessionState.secretarias
    : [];
  return secretarias.find((secretaria) => Number(secretaria.id) === id) || null;
}
function getSelectedCertificateForm() {
  const id = Number(formsState.selectedFormId);
  return formsState.items.find((item) => Number(item.id) === id) || null;
}
function syncFormsModeUi() {
  const isCreate = formsState.mode !== "manage";
  if (formsCreatePanel) formsCreatePanel.hidden = !isCreate;
  if (formsManagePanel) formsManagePanel.hidden = isCreate;
  if (formsRefreshBtn) formsRefreshBtn.hidden = isCreate;
  if (formsCreateModeBtn) {
    formsCreateModeBtn.classList.toggle("is-active", isCreate);
    formsCreateModeBtn.setAttribute("aria-pressed", isCreate ? "true" : "false");
  }
  if (formsManageModeBtn) {
    formsManageModeBtn.classList.toggle("is-active", !isCreate);
    formsManageModeBtn.setAttribute("aria-pressed", !isCreate ? "true" : "false");
  }
}
function switchFormsMode(mode) {
  formsState.mode = mode === "manage" ? "manage" : "create";
  syncFormsModeUi();
  if (formsState.mode === "manage") {
    void loadCertificateForms();
  }
}
