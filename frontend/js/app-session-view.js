
function setAuthenticatedView(authenticated) {
  if (loginShell) loginShell.hidden = authenticated;
  if (appContainer) appContainer.hidden = !authenticated;
  if (appShell) appShell.hidden = !authenticated;
}

function renderSession(session) {
  sessionState = session;
  setAuthenticatedView(true);
  setLoginStatus("", "info");

  if (sessionUser && session && session.usuario) {
    sessionUser.textContent = `${session.usuario.nome} (${session.usuario.papel})`;
  }

  const secretarias = Array.isArray(session.secretarias) ? session.secretarias : [];
  const secretariaAtiva = secretarias.find(
    (secretaria) => secretaria.id === session.secretaria_ativa_id
  );
  if (sessionSecretaria) {
    sessionSecretaria.textContent = secretariaAtiva
      ? `Secretaria ativa: ${secretariaAtiva.sigla} - ${secretariaAtiva.nome}`
      : "Nenhuma secretaria ativa selecionada.";
  }
  populateSecretariaOptions(secretariaSelect, secretarias, session.secretaria_ativa_id, false);
  if (secretariaWrap) secretariaWrap.hidden = secretarias.length <= 1;
  if (sessionSecretaria) sessionSecretaria.hidden = secretarias.length > 1;
  populateSecretariaOptions(
    certFilterSecretariaSelect,
    secretarias,
    certListState.filters.secretariaId,
    true
  );
  if (certFilterSecretariaWrap) {
    certFilterSecretariaWrap.hidden = secretarias.length <= 1;
  }
  populateSecretariaOptions(
    auditSecretariaSelect,
    secretarias,
    auditState.filters.secretariaId,
    true
  );
  if (auditSecretariaWrap) {
    auditSecretariaWrap.hidden = secretarias.length <= 1;
  }
  if (
    certFilterSecretariaSelect &&
    certListState.filters.secretariaId &&
    !Array.from(certFilterSecretariaSelect.options).some(
      (option) => option.value === String(certListState.filters.secretariaId)
    )
  ) {
    certListState.filters.secretariaId = "";
    certFilterSecretariaSelect.value = "";
  }

  syncAdminSectionVisibility(session);
  if (auditTab) {
    auditTab.hidden = !isAdminSession(session);
  }
  if (
    (!isAdminSession(session) && isAdminOnlySection(currentSection)) ||
    (currentSection === "admin" && !canManageVisualAssets(session))
  ) {
    switchSection("generator");
  }

  syncCertificateFilterInputsFromState();
  syncAuditFilterInputsFromState();
}

function clearSessionUi(message = "") {
  sessionState = null;
  closeDeleteCertificateDialog();
  closeBatchConfirmDialog();
  certListState.page = 1;
  certListState.total = 0;
  certListState.totalPages = 1;
  certListState.filters.busca = "";
  certListState.filters.secretariaId = "";
  certListState.filters.concluidoDe = "";
  certListState.filters.concluidoAte = "";
  certListState.filters.emitidoDe = "";
  certListState.filters.emitidoAte = "";
  auditState.page = 1;
  auditState.total = 0;
  auditState.totalPages = 1;
  auditState.filters.busca = "";
  auditState.filters.evento = "";
  auditState.filters.secretariaId = "";
  auditState.filters.criadoDe = "";
  auditState.filters.criadoAte = "";
  setAuthenticatedView(false);
  downloadBtn.disabled = true;
  if (sessionUser) sessionUser.textContent = "";
  if (sessionSecretaria) sessionSecretaria.textContent = "";
  if (secretariaSelect) secretariaSelect.innerHTML = "";
  if (secretariaWrap) secretariaWrap.hidden = true;
  if (certFilterBuscaInput) certFilterBuscaInput.value = "";
  if (certFilterConcluidoDeInput) certFilterConcluidoDeInput.value = "";
  if (certFilterConcluidoAteInput) certFilterConcluidoAteInput.value = "";
  if (certFilterEmitidoDeInput) certFilterEmitidoDeInput.value = "";
  if (certFilterEmitidoAteInput) certFilterEmitidoAteInput.value = "";
  if (certFilterSecretariaSelect) {
    certFilterSecretariaSelect.innerHTML = '<option value="">Todas</option>';
  }
  if (certFilterSecretariaWrap) certFilterSecretariaWrap.hidden = false;
  if (auditSearchInput) auditSearchInput.value = "";
  if (auditEventSelect) auditEventSelect.value = "";
  if (auditCreatedDeInput) auditCreatedDeInput.value = "";
  if (auditCreatedAteInput) auditCreatedAteInput.value = "";
  if (auditSecretariaSelect) {
    auditSecretariaSelect.innerHTML = '<option value="">Todas</option>';
  }
  if (auditSecretariaWrap) auditSecretariaWrap.hidden = false;
  updateCertificateQuickFilterButtons();
  updateAuditQuickFilterButtons();
  if (certListBody) {
    certListBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">Faça login para carregar os certificados.</td>
      </tr>
    `;
  }
  if (certListSummary) certListSummary.textContent = "";
  if (certPageIndicator) certPageIndicator.textContent = "Página 1";
  if (auditSummary) auditSummary.textContent = "";
  if (auditPageIndicator) auditPageIndicator.textContent = "Página 1";
  if (adminTab) adminTab.hidden = true;
  if (auditTab) auditTab.hidden = true;
  if (userListBody) {
    userListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Faça login como administrador para gerenciar usuários.</td>
      </tr>
    `;
  }
  if (secretariaListBody) {
    secretariaListBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Faça login como administrador para gerenciar secretarias.</td>
      </tr>
    `;
  }
  if (auditListBody) {
    auditListBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Faça login como administrador para visualizar a auditoria.</td>
      </tr>
    `;
  }
  if (auditSummary) auditSummary.textContent = "";
  if (auditPageIndicator) auditPageIndicator.textContent = "Página 1";
  adminState.users = [];
  adminState.secretarias = [];
  adminState.templates = [];
  adminState.secretariaAssets = [];
  templateCatalogState.items = [];
  templateCatalogState.selectedId = "";
  secretariaAssetCatalogState.logo.items = [];
  secretariaAssetCatalogState.logo.selectedId = "";
  secretariaAssetCatalogState.assinatura.items = [];
  secretariaAssetCatalogState.assinatura.selectedId = "";
  secretariaAssetCatalogState.assinatura2.items = [];
  secretariaAssetCatalogState.assinatura2.selectedId = "";
  secretariaAssetCatalogState.assinatura3.items = [];
  secretariaAssetCatalogState.assinatura3.selectedId = "";
  secretariaAssetCatalogState.instituicao.items = [];
  secretariaAssetCatalogState.instituicao.selectedId = "";
  secretariaAssetCatalogState.selo.items = [];
  secretariaAssetCatalogState.selo.selectedId = "";
  SELO_SLOT_KEYS.forEach((type) => {
    const catalog = getSecretariaAssetCatalog(type);
    catalog.items = [];
    catalog.selectedId = "";
    assets[type] = null;
    setSavedSecretariaAsset(type, null, null);
  });
  assets.template = null;
  assets.logo = null;
  assets.assinatura = null;
  assets.assinatura2 = null;
  assets.assinatura3 = null;
  assets.instituicao = null;
  savedTemplate = null;
  savedTemplateImage = null;
  savedLogo = null;
  savedLogoImage = null;
  savedAssinatura = null;
  savedAssinaturaImage = null;
  savedAssinatura2 = null;
  savedAssinatura2Image = null;
  savedAssinatura3 = null;
  savedAssinatura3Image = null;
  savedInstituicao = null;
  savedInstituicaoImage = null;
  savedSelo1 = null;
  savedSelo1Image = null;
  savedSelo2 = null;
  savedSelo2Image = null;
  savedSelo3 = null;
  savedSelo3Image = null;
  savedSelo4 = null;
  savedSelo4Image = null;
  if (templateInput) templateInput.value = "";
  if (templateHideTitleInput) templateHideTitleInput.checked = false;
  if (logoInput) logoInput.value = "";
  if (assinaturaInput) assinaturaInput.value = "";
  if (assinatura2Input) assinatura2Input.value = "";
  if (assinatura3Input) assinatura3Input.value = "";
  if (selo1Input) selo1Input.value = "";
  if (selo2Input) selo2Input.value = "";
  if (selo3Input) selo3Input.value = "";
  if (selo4Input) selo4Input.value = "";
  if (assinaturaLabelInput) assinaturaLabelInput.value = DEFAULT_ASSINATURA_LABEL;
  if (assinatura2LabelInput) assinatura2LabelInput.value = "";
  if (assinatura3LabelInput) assinatura3LabelInput.value = "";
  if (instituicaoInput) instituicaoInput.value = "";
  syncTemplateControls();
  setTemplateStatus("", "info");
  if (templateSelect) {
    populateTemplateOptions(templateSelect, [], "", true);
  }
  if (templateLibraryWrap) templateLibraryWrap.hidden = false;
  setTemplateSelectStatus("", "info");
  populateSecretariaAssetOptions("logo", [], "", true);
  populateSecretariaAssetOptions("assinatura", [], "", true);
  populateSecretariaAssetOptions("assinatura2", [], "", true);
  populateSecretariaAssetOptions("assinatura3", [], "", true);
  populateSecretariaAssetOptions("instituicao", [], "", true);
  SELO_SLOT_KEYS.forEach((type) => {
    populateSecretariaAssetOptions(type, [], "", true);
  });
  if (logoLibraryWrap) logoLibraryWrap.hidden = false;
  if (assinaturaLibraryWrap) assinaturaLibraryWrap.hidden = false;
  if (assinaturasExtrasWrap) assinaturasExtrasWrap.hidden = false;
  if (selosExtrasWrap) selosExtrasWrap.hidden = false;
  if (instituicaoLibraryWrap) instituicaoLibraryWrap.hidden = false;
  setLogoSelectStatus("", "info");
  setAssinaturaSelectStatus("", "info");
  setAssinatura2SelectStatus("", "info");
  setAssinatura3SelectStatus("", "info");
  setSelo1SelectStatus("", "info");
  setSelo2SelectStatus("", "info");
  setSelo3SelectStatus("", "info");
  setSelo4SelectStatus("", "info");
  setInstituicaoSelectStatus("", "info");
  setLogoStatus("", "info");
  setAssinaturaStatus("", "info");
  setAssinatura2Status("", "info");
  setAssinatura3Status("", "info");
  setSelo1Status("", "info");
  setSelo2Status("", "info");
  setSelo3Status("", "info");
  setSelo4Status("", "info");
  setInstituicaoStatus("", "info");
  resetUserForm();
  resetSecretariaForm();
  resetTemplateAdminForm();
  resetSecretariaAssetForm();
  switchSection("generator");
  if (message) {
    setLoginStatus(message, "error");
  }
}

async function fetchSession() {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok || !payload || !payload.autenticado) {
    return null;
  }

  return payload;
}

async function refreshSession(message = "") {
  try {
    const session = await fetchSession();
    if (!session) {
      clearSessionUi(message);
      return null;
    }

    renderSession(session);
    await refreshProtectedData({ page: 1 });
    return session;
  } catch (error) {
    console.error(error);
    clearSessionUi("Nao foi possivel validar a sessao.");
    return null;
  }
}

async function handleUnauthorized(message = "Sua sessao expirou. Entre novamente.") {
  clearSessionUi(message);
}

function setCertListStatus(message, type = "info") {
  setStatusMessage(certListStatus, message, type);
}

function setUserFormStatus(message, type = "info") {
  setStatusMessage(userFormStatus, message, type);
}

function setSecretariaFormStatus(message, type = "info") {
  setStatusMessage(secretariaFormStatus, message, type);
}

function setAuditStatus(message, type = "info") {
  setStatusMessage(auditStatus, message, type);
}

function setDeleteCertStatus(message, type = "info") {
  setStatusMessage(deleteCertStatus, message, type);
}

function setBatchConfirmStatus(message, type = "info") {
  setStatusMessage(batchConfirmStatus, message, type);
}

function setDuplicateCertStatus(message, type = "info") {
  setStatusMessage(duplicateCertStatus, message, type);
}

function closeDeleteCertificateDialog() {
  pendingDeleteCertificate = null;
  if (deleteCertForm) deleteCertForm.reset();
  setDeleteCertStatus("", "info");
  if (deleteCertDialog && typeof deleteCertDialog.close === "function" && deleteCertDialog.open) {
    deleteCertDialog.close();
  }
}

function openDeleteCertificateDialog(item) {
  if (!deleteCertDialog || !deleteCertForm || !isAdminSession()) return;

  pendingDeleteCertificate = item;
  if (deleteCertCurrentCodeInput) {
    deleteCertCurrentCodeInput.value = item.codigo || "";
  }
  if (deleteCertConfirmCodeInput) {
    deleteCertConfirmCodeInput.value = "";
  }
  if (deleteCertPasswordInput) {
    deleteCertPasswordInput.value = "";
  }
  if (deleteCertMessage) {
    deleteCertMessage.textContent = `Confirme o código ${item.codigo} e informe a senha do administrador para excluir ${item.nome}.`;
  }
  setDeleteCertStatus("", "info");
  if (typeof deleteCertDialog.showModal === "function") {
    deleteCertDialog.showModal();
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
