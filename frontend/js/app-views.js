
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

function scrollAdminFormIntoView(form) {
  if (!form || typeof form.scrollIntoView !== "function") return;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncUserRoleUi() {
  if (!userRoleSelect || !userSecretariasSelect) return;

  const isAdmin = userRoleSelect.value === "admin_global";
  userSecretariasSelect.disabled = isAdmin;
  if (isAdmin) {
    setMultiSelectValues(userSecretariasSelect, []);
  }
  renderUserSecretariasChecklist();
}

function syncUserFormState() {
  const isEditing = Boolean(sanitizeText(userEditIdInput ? userEditIdInput.value : ""));
  if (userForm) {
    userForm.classList.toggle("is-editing", isEditing);
  }
  if (userSubmitBtn) {
    userSubmitBtn.textContent = isEditing ? "Atualizar Usuário" : "Salvar Usuário";
  }
  syncUserRoleUi();
}

function syncSecretariaFormState() {
  const isEditing = Boolean(
    sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "")
  );
  if (secretariaForm) {
    secretariaForm.classList.toggle("is-editing", isEditing);
  }
  if (secretariaSubmitBtn) {
    secretariaSubmitBtn.textContent = isEditing
      ? "Atualizar Secretaria"
      : "Salvar Secretaria";
  }
}

function resetUserForm() {
  if (userForm) userForm.reset();
  if (userEditIdInput) userEditIdInput.value = "";
  if (userActiveInput) userActiveInput.checked = true;
  if (userRoleSelect) userRoleSelect.value = "operador";
  if (userUsernameInput) userUsernameInput.disabled = false;
  if (userPasswordInput) {
    userPasswordInput.value = "";
    userPasswordInput.placeholder = "Obrigatória no cadastro";
  }
  setMultiSelectValues(userSecretariasSelect, []);
  syncUserFormState();
  setUserFormStatus("", "info");
}

function resetSecretariaForm() {
  if (secretariaForm) secretariaForm.reset();
  if (secretariaEditIdInput) secretariaEditIdInput.value = "";
  if (secretariaActiveInput) secretariaActiveInput.checked = true;
  syncSecretariaFormState();
  setSecretariaFormStatus("", "info");
}

function syncTemplateAdminFormState() {
  const editing = Boolean(
    sanitizeText(templateAdminEditIdInput ? templateAdminEditIdInput.value : "")
  );
  if (templateAdminSubmitBtn) {
    templateAdminSubmitBtn.textContent = editing ? "Atualizar Molde" : "Salvar Molde";
  }
  if (templateAdminSecretariaSelect) {
    templateAdminSecretariaSelect.disabled = editing;
  }
  if (templateAdminFileInput) {
    templateAdminFileInput.required = !editing;
  }
}

function resetTemplateAdminForm() {
  if (templateAdminForm) templateAdminForm.reset();
  if (templateAdminEditIdInput) templateAdminEditIdInput.value = "";
  if (templateAdminActiveInput) templateAdminActiveInput.checked = true;
  if (templateAdminDefaultInput) templateAdminDefaultInput.checked = false;
  if (templateAdminHideTitleInput) templateAdminHideTitleInput.checked = false;
  if (templateAdminOrderInput) templateAdminOrderInput.value = "0";
  syncTemplateAdminFormState();
  setTemplateAdminStatus("", "info");
}

function syncSecretariaAssetFormState() {
  const editing = Boolean(
    sanitizeText(secretariaAssetEditIdInput ? secretariaAssetEditIdInput.value : "")
  );
  if (secretariaAssetForm) {
    secretariaAssetForm.classList.toggle("is-editing", editing);
  }
  if (secretariaAssetSubmitBtn) {
    secretariaAssetSubmitBtn.textContent = editing ? "Atualizar Item" : "Salvar Item";
  }
  if (secretariaAssetSecretariaSelect) {
    secretariaAssetSecretariaSelect.disabled = editing;
  }
  if (secretariaAssetTypeSelect) {
    secretariaAssetTypeSelect.disabled = editing;
  }
  if (secretariaAssetFileInput) {
    secretariaAssetFileInput.required = !editing;
  }
  syncSecretariaAssetTypeUi();
}

function syncSecretariaAssetTypeUi() {
  const tipo = sanitizeText(
    secretariaAssetTypeSelect ? secretariaAssetTypeSelect.value : "logo"
  ).toLowerCase();
  let nameLabel = "Nome da logo";
  let placeholder = "Ex.: Logo institucional principal";
  if (tipo === "assinatura") {
    nameLabel = "Nome da assinatura";
    placeholder = "Ex.: Assinatura oficial da secretaria";
  } else if (tipo === "instituicao") {
    nameLabel = "Nome da instituição";
    placeholder = "Ex.: Instituição oficial ou marca institucional";
  } else if (tipo === "selo") {
    nameLabel = "Nome do selo";
    placeholder = "Ex.: Selo, icone ou marca parceira";
  }
  if (secretariaAssetNameLabel) {
    secretariaAssetNameLabel.textContent = nameLabel;
  }
  if (secretariaAssetNameInput) {
    secretariaAssetNameInput.placeholder = placeholder;
  }
}

function resetSecretariaAssetForm() {
  if (secretariaAssetForm) secretariaAssetForm.reset();
  if (secretariaAssetEditIdInput) secretariaAssetEditIdInput.value = "";
  if (secretariaAssetActiveInput) secretariaAssetActiveInput.checked = true;
  if (secretariaAssetDefaultInput) secretariaAssetDefaultInput.checked = false;
  if (secretariaAssetOrderInput) secretariaAssetOrderInput.value = "0";
  syncSecretariaAssetFormState();
  setSecretariaAssetAdminStatus("", "info");
}

function buildStatusPill(active, activeLabel = "Ativo", inactiveLabel = "Inativo") {
  const span = document.createElement("span");
  span.className = `status-pill ${active ? "ok" : "warn"}`;
  span.textContent = active ? activeLabel : inactiveLabel;
  return span;
}

function fillUserForm(usuario) {
  if (!usuario) return;
  if (userEditIdInput) userEditIdInput.value = String(usuario.id);
  if (userNameInput) userNameInput.value = usuario.nome || "";
  if (userUsernameInput) {
    userUsernameInput.value = usuario.username || "";
    userUsernameInput.disabled = true;
  }
  if (userPasswordInput) {
    userPasswordInput.value = "";
    userPasswordInput.placeholder = "Preencha somente para trocar a senha";
  }
  if (userRoleSelect) userRoleSelect.value = usuario.papel || "operador";
  if (userActiveInput) userActiveInput.checked = Boolean(usuario.ativo);
  setMultiSelectValues(
    userSecretariasSelect,
    (usuario.secretarias || []).map((secretaria) => secretaria.id)
  );
  syncUserFormState();
  setUserFormStatus(`Editando usuário ${usuario.username}.`, "info");
  scrollAdminFormIntoView(userForm);
}

function fillSecretariaForm(secretaria) {
  if (!secretaria) return;
  if (secretariaEditIdInput) secretariaEditIdInput.value = String(secretaria.id);
  if (secretariaSiglaInput) secretariaSiglaInput.value = secretaria.sigla || "";
  if (secretariaNameInput) secretariaNameInput.value = secretaria.nome || "";
  if (secretariaActiveInput) secretariaActiveInput.checked = Boolean(secretaria.ativa);
  syncSecretariaFormState();
  setSecretariaFormStatus(`Editando secretaria ${secretaria.sigla}.`, "info");
  scrollAdminFormIntoView(secretariaForm);
}

function fillTemplateAdminForm(template) {
  if (!template) return;
  if (templateAdminEditIdInput) templateAdminEditIdInput.value = String(template.id);
  if (templateAdminSecretariaSelect) {
    templateAdminSecretariaSelect.value = String(template.secretaria_id || "");
  }
  if (templateAdminNameInput) templateAdminNameInput.value = template.nome || "";
  if (templateAdminActiveInput) templateAdminActiveInput.checked = Boolean(template.ativo);
  if (templateAdminDefaultInput) templateAdminDefaultInput.checked = Boolean(template.padrao);
  if (templateAdminHideTitleInput) {
    templateAdminHideTitleInput.checked = Boolean(template.ocultar_titulo_certificado);
  }
  if (templateAdminOrderInput) templateAdminOrderInput.value = String(template.ordem || 0);
  if (templateAdminFileInput) templateAdminFileInput.value = "";
  syncTemplateAdminFormState();
  setTemplateAdminStatus(
    `Editando molde ${template.nome}. Envie um novo arquivo somente se quiser substituí-lo.`,
    "info"
  );
  scrollAdminFormIntoView(templateAdminForm);
}

function fillSecretariaAssetForm(asset) {
  if (!asset) return;
  if (secretariaAssetEditIdInput) secretariaAssetEditIdInput.value = String(asset.id);
  if (secretariaAssetSecretariaSelect) {
    secretariaAssetSecretariaSelect.value = String(asset.secretaria_id || "");
  }
  if (secretariaAssetTypeSelect) {
    secretariaAssetTypeSelect.value = asset.tipo || "logo";
  }
  if (secretariaAssetNameInput) secretariaAssetNameInput.value = asset.nome || "";
  if (secretariaAssetActiveInput) secretariaAssetActiveInput.checked = Boolean(asset.ativo);
  if (secretariaAssetDefaultInput) secretariaAssetDefaultInput.checked = Boolean(asset.padrao);
  if (secretariaAssetOrderInput) secretariaAssetOrderInput.value = String(asset.ordem || 0);
  if (secretariaAssetFileInput) secretariaAssetFileInput.value = "";
  syncSecretariaAssetFormState();
  setSecretariaAssetAdminStatus(
    `Editando ${getSecretariaAssetDisplayLabel(asset.tipo)} ${asset.nome}. Envie um novo arquivo somente se quiser substituí-lo.`,
    "info"
  );
  scrollAdminFormIntoView(secretariaAssetForm);
}

function renderCertificateRows(items) {
  if (!certListBody) return;

  if (!items.length) {
    certListBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">Nenhum certificado encontrado com os filtros atuais.</td>
      </tr>
    `;
    return;
  }

  certListBody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    const codeCell = document.createElement("td");
    codeCell.className = "cert-col-code";
    const codeChip = document.createElement("span");
    codeChip.className = "code-chip";
    codeChip.textContent = item.codigo || "-";
    codeCell.appendChild(codeChip);

    const nameCell = document.createElement("td");
    nameCell.className = "cert-name-cell";

    const nameTitle = document.createElement("strong");
    nameTitle.className = "cert-name-title";
    nameTitle.textContent = item.nome || "-";

    const nameMeta = document.createElement("div");
    nameMeta.className = "table-mobile-meta";
    const mobileMeta = [
      `Secretaria: ${item.secretaria_sigla || "-"}`,
      `Conclusão: ${formatDate(item.concluido)}`,
      `Emitido em: ${formatDateTime(item.emitido_em)}`,
      `Emitido por: ${item.emitido_por_username || "-"}`,
    ];
    mobileMeta.forEach((text) => {
      const metaLine = document.createElement("span");
      metaLine.className = "table-mobile-meta-item";
      metaLine.textContent = text;
      nameMeta.appendChild(metaLine);
    });

    nameCell.append(nameTitle, nameMeta);

    const courseCell = document.createElement("td");
    courseCell.className = "cert-col-course";
    courseCell.textContent = item.curso || "-";

    const secretariaCell = document.createElement("td");
    secretariaCell.className = "cert-col-secondary";
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const concluidoCell = document.createElement("td");
    concluidoCell.className = "cert-col-secondary";
    concluidoCell.textContent = formatDate(item.concluido);

    const emittedCell = document.createElement("td");
    emittedCell.className = "cert-col-secondary";
    emittedCell.textContent = formatDateTime(item.emitido_em);

    const emittedByCell = document.createElement("td");
    emittedByCell.className = "cert-col-secondary";
    emittedByCell.textContent = item.emitido_por_username || "-";

    const actionsCell = document.createElement("td");
    actionsCell.className = "cert-col-actions";
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions cert-actions";

    actionsWrap.appendChild(
      createIconButton("Validar certificado", "eye", () => {
        window.open(item.url_validacao, "_blank", "noopener,noreferrer");
      })
    );

    const pngButton = createIconButton("Abrir PNG", "download", () => {
      if (item.arquivo_admin_url || item.arquivo_url) {
        window.open(item.arquivo_admin_url || item.arquivo_url, "_blank", "noopener,noreferrer");
      }
    });
    pngButton.disabled = !(item.arquivo_admin_url || item.arquivo_url);
    actionsWrap.appendChild(pngButton);

    if (isAdminSession()) {
      const menu = document.createElement("details");
      menu.className = "action-menu";

      const summary = document.createElement("summary");
      summary.className = "icon-btn action-menu-trigger";
      summary.title = "Mais ações";
      summary.setAttribute("aria-label", "Mais ações");
      summary.appendChild(createIconSvg("more"));

      const menuContent = document.createElement("div");
      menuContent.className = "action-menu-content";
      const deleteButton = createInlineButton(
        "Excluir",
        () => {
          menu.open = false;
          openDeleteCertificateDialog(item);
        },
        "action-menu-item danger-action"
      );
      menuContent.appendChild(deleteButton);
      menu.append(summary, menuContent);
      actionsWrap.appendChild(menu);
    }

    actionsCell.appendChild(actionsWrap);

    row.append(
      codeCell,
      nameCell,
      courseCell,
      secretariaCell,
      concluidoCell,
      emittedCell,
      emittedByCell,
      actionsCell
    );

    certListBody.appendChild(row);
  });
}

function renderUsersTable() {
  if (!userListBody) return;

  if (!adminState.users.length) {
    userListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhum usuário cadastrado.</td>
      </tr>
    `;
    return;
  }

  userListBody.innerHTML = "";

  adminState.users.forEach((usuario) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = usuario.nome || "-";

    const usernameCell = document.createElement("td");
    usernameCell.textContent = usuario.username || "-";

    const roleCell = document.createElement("td");
    roleCell.textContent = usuario.papel || "-";

    const secretariasCell = document.createElement("td");
    secretariasCell.textContent = (usuario.secretarias || []).length
      ? usuario.secretarias.map((secretaria) => secretaria.sigla).join(", ")
      : "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(usuario.ativo));

    const loginCell = document.createElement("td");
    loginCell.textContent = formatDateTime(usuario.ultimo_login_em);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillUserForm(usuario);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          void deleteUser(usuario);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(
      nameCell,
      usernameCell,
      roleCell,
      secretariasCell,
      statusCell,
      loginCell,
      actionsCell
    );
    userListBody.appendChild(row);
  });
}

function renderSecretariasTable() {
  if (!secretariaListBody) return;

  if (!adminState.secretarias.length) {
    secretariaListBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Nenhuma secretaria cadastrada.</td>
      </tr>
    `;
    return;
  }

  secretariaListBody.innerHTML = "";

  adminState.secretarias.forEach((secretaria) => {
    const row = document.createElement("tr");

    const siglaCell = document.createElement("td");
    siglaCell.textContent = secretaria.sigla || "-";

    const nomeCell = document.createElement("td");
    nomeCell.textContent = secretaria.nome || "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(secretaria.ativa));

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillSecretariaForm(secretaria);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          void deleteSecretaria(secretaria);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(siglaCell, nomeCell, statusCell, actionsCell);
    secretariaListBody.appendChild(row);
  });
}

function renderTemplatesTable() {
  if (!templateAdminListBody) return;

  if (!adminState.templates.length) {
    templateAdminListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhum molde cadastrado até o momento.</td>
      </tr>
    `;
    return;
  }

  templateAdminListBody.innerHTML = "";

  adminState.templates.forEach((template) => {
    const row = document.createElement("tr");

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = template.secretaria_sigla || "-";

    const nomeCell = document.createElement("td");
    nomeCell.textContent = template.nome || "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(template.ativo));

    const defaultCell = document.createElement("td");
    defaultCell.appendChild(buildStatusPill(template.padrao, "Padrão", "Opcional"));

    const titleCell = document.createElement("td");
    titleCell.appendChild(
      buildStatusPill(
        template.ocultar_titulo_certificado,
        "No molde",
        "Gerado"
      )
    );

    const orderCell = document.createElement("td");
    orderCell.textContent = String(template.ordem || 0);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Abrir", () => {
        window.open(template.arquivo_url, "_blank", "noopener,noreferrer");
      })
    );
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillTemplateAdminForm(template);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          const confirmado = window.confirm(
            `Excluir o molde ${template.nome} da secretaria ${template.secretaria_sigla}?`
          );
          if (!confirmado) return;
          void deleteTemplate(template);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(
      secretariaCell,
      nomeCell,
      statusCell,
      defaultCell,
      titleCell,
      orderCell,
      actionsCell
    );
    templateAdminListBody.appendChild(row);
  });
}

function renderSecretariaAssetsTable() {
  if (!secretariaAssetListBody) return;

  if (!adminState.secretariaAssets.length) {
    secretariaAssetListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhuma logo, assinatura ou instituição cadastrada até o momento.</td>
      </tr>
    `;
    return;
  }

  secretariaAssetListBody.innerHTML = "";

  adminState.secretariaAssets.forEach((asset) => {
    const row = document.createElement("tr");

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = asset.secretaria_sigla || "-";

    const tipoCell = document.createElement("td");
    const tipoPill = document.createElement("span");
    tipoPill.className = "asset-type-pill";
    tipoPill.textContent = getSecretariaAssetDisplayLabel(asset.tipo, true) || "-";
    tipoCell.appendChild(tipoPill);

    const nomeCell = document.createElement("td");
    nomeCell.textContent = asset.nome || "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(asset.ativo));

    const defaultCell = document.createElement("td");
    defaultCell.appendChild(buildStatusPill(asset.padrao, "Padrão", "Opcional"));

    const orderCell = document.createElement("td");
    orderCell.textContent = String(asset.ordem || 0);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Abrir", () => {
        window.open(asset.arquivo_url, "_blank", "noopener,noreferrer");
      })
    );
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillSecretariaAssetForm(asset);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        async () => {
          const confirmado = window.confirm(
            `Excluir ${getSecretariaAssetDisplayLabel(asset.tipo)} ${asset.nome} da secretaria ${asset.secretaria_sigla}?`
          );
          if (!confirmado) return;
          await deleteSecretariaAsset(asset);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(secretariaCell, tipoCell, nomeCell, statusCell, defaultCell, orderCell, actionsCell);
    secretariaAssetListBody.appendChild(row);
  });
}

function renderAuditRows(items) {
  if (!auditListBody) return;

  if (!items.length) {
    auditListBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Nenhum evento de auditoria encontrado.</td>
      </tr>
    `;
    return;
  }

  auditListBody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    const whenCell = document.createElement("td");
    whenCell.textContent = formatDateTime(item.criado_em);

    const eventCell = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = "code-chip";
    chip.textContent = item.evento || "-";
    eventCell.appendChild(chip);

    const userCell = document.createElement("td");
    userCell.textContent = item.usuario_username || item.usuario_nome || "-";

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const certCell = document.createElement("td");
    certCell.textContent = item.certificado_codigo || "-";

    const detailsCell = document.createElement("td");
    detailsCell.textContent = item.descricao || "-";

    row.append(whenCell, eventCell, userCell, secretariaCell, certCell, detailsCell);
    auditListBody.appendChild(row);
  });
}

function setAuditReportButtonsBusy(busy) {
  if (auditExportCsvBtn) auditExportCsvBtn.disabled = busy;
  if (auditPrintReportBtn) auditPrintReportBtn.disabled = busy;
}

function getSelectedOptionText(select, fallback = "Todos") {
  if (!select) return fallback;
  const selected = select.selectedOptions && select.selectedOptions[0];
  return sanitizeText(selected ? selected.textContent : "") || fallback;
}

function setCertificateReportButtonBusy(busy) {
  if (certExportCsvBtn) certExportCsvBtn.disabled = busy;
}

function getCertificateReportQueryParams(page, perPage) {
  return {
    pagina: page,
    por_pagina: perPage,
    busca: certListState.filters.busca,
    secretaria_id: certListState.filters.secretariaId,
    concluido_de: certListState.filters.concluidoDe,
    concluido_ate: certListState.filters.concluidoAte,
    emitido_de: certListState.filters.emitidoDe,
    emitido_ate: certListState.filters.emitidoAte,
  };
}

function getCertificateReportFilters() {
  const concluidoStart = sanitizeText(certListState.filters.concluidoDe);
  const concluidoEnd = sanitizeText(certListState.filters.concluidoAte);
  const emitidoStart = sanitizeText(certListState.filters.emitidoDe);
  const emitidoEnd = sanitizeText(certListState.filters.emitidoAte);
  const periodLabel = (start, end) =>
    start && end
      ? `${formatDate(start)} a ${formatDate(end)}`
      : start
        ? `A partir de ${formatDate(start)}`
        : end
          ? `Até ${formatDate(end)}`
          : "Todos";

  return [
    { label: "Busca", value: sanitizeText(certListState.filters.busca) || "Todas" },
    { label: "Secretaria", value: getSelectedOptionText(certFilterSecretariaSelect, "Todas") },
    { label: "Conclusão", value: periodLabel(concluidoStart, concluidoEnd) },
    { label: "Emissão", value: periodLabel(emitidoStart, emitidoEnd) },
  ];
}

async function fetchCertificateReportItems() {
  readCertificateFiltersFromInputs();
  updateCertificateQuickFilterButtons();

  const perPage = 100;
  let page = 1;
  let totalPages = 1;
  let total = 0;
  const items = [];

  do {
    const payload = await apiJsonRequest(
      `/api/certificados${buildQueryString(getCertificateReportQueryParams(page, perPage))}`
    );
    const pageItems = Array.isArray(payload.itens) ? payload.itens : [];
    items.push(...pageItems);
    total = payload.total || items.length;
    totalPages = payload.paginas || 1;
    page += 1;
  } while (page <= totalPages);

  return {
    items,
    total,
    filters: getCertificateReportFilters(),
    generatedAt: new Date(),
  };
}

function getCertificateReportRow(item) {
  return [
    item.codigo || "-",
    item.nome || "-",
    item.cpf || "-",
    item.curso || "-",
    String(item.carga_h || 0),
    formatDate(item.concluido),
    formatDateTime(item.emitido_em),
    item.emitido_por_username || "-",
    item.secretaria_sigla || "-",
    item.secretaria_nome || "-",
    item.url_validacao || "-",
  ];
}

function buildCertificateCsvReport(report) {
  const headers = [
    "Código",
    "Participante",
    "CPF",
    "Curso",
    "Carga horária",
    "Data de conclusão",
    "Emitido em",
    "Emitido por",
    "Secretaria",
    "Nome da secretaria",
    "URL de validação",
  ];
  const rows = report.items.map(getCertificateReportRow);

  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\r\n")}`;
}

async function exportCertificateCsvReport() {
  if (!sessionState) return;
  setCertificateReportButtonBusy(true);
  setCertListStatus("Gerando relatório CSV dos certificados...", "info");

  try {
    const report = await fetchCertificateReportItems();
    const csv = buildCertificateCsvReport(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `relatorio-certificados-${buildTimestamp()}.csv`);
    setCertListStatus(`Relatório CSV gerado com ${report.total} certificado(s).`, "info");
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setCertListStatus((error && error.message) || "Não foi possível gerar o relatório.", "error");
  } finally {
    setCertificateReportButtonBusy(false);
  }
}

function getAuditReportFilters() {
  const periodStart = sanitizeText(auditState.filters.criadoDe);
  const periodEnd = sanitizeText(auditState.filters.criadoAte);
  const period =
    periodStart && periodEnd
      ? `${formatDate(periodStart)} a ${formatDate(periodEnd)}`
      : periodStart
        ? `A partir de ${formatDate(periodStart)}`
        : periodEnd
          ? `Até ${formatDate(periodEnd)}`
          : "Todos";

  return [
    { label: "Busca", value: sanitizeText(auditState.filters.busca) || "Todas" },
    { label: "Evento", value: getSelectedOptionText(auditEventSelect, "Todos") },
    { label: "Secretaria", value: getSelectedOptionText(auditSecretariaSelect, "Todas") },
    { label: "Período", value: period },
  ];
}

function getAuditReportQueryParams(page, perPage) {
  return {
    pagina: page,
    por_pagina: perPage,
    busca: auditState.filters.busca,
    evento: auditState.filters.evento,
    secretaria_id: auditState.filters.secretariaId,
    criado_de: auditState.filters.criadoDe,
    criado_ate: auditState.filters.criadoAte,
  };
}

async function fetchAuditReportEvents() {
  readAuditFiltersFromInputs();
  updateAuditQuickFilterButtons();

  const perPage = 100;
  let page = 1;
  let totalPages = 1;
  let total = 0;
  const items = [];

  do {
    const payload = await apiJsonRequest(
      `/api/admin/auditoria${buildQueryString(getAuditReportQueryParams(page, perPage))}`
    );
    const pageItems = Array.isArray(payload.itens) ? payload.itens : [];
    items.push(...pageItems);
    total = payload.total || items.length;
    totalPages = payload.paginas || 1;
    page += 1;
  } while (page <= totalPages);

  return {
    items,
    total,
    filters: getAuditReportFilters(),
    generatedAt: new Date(),
  };
}

function getAuditReportRow(item) {
  return [
    formatDateTime(item.criado_em),
    item.evento || "-",
    item.usuario_username || item.usuario_nome || "-",
    item.secretaria_sigla || "-",
    item.certificado_codigo || "-",
    item.entidade_tipo || "-",
    item.descricao || "-",
  ];
}

function escapeCsvCell(value) {
  const text = String(value === null || value === undefined ? "" : value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildAuditCsvReport(report) {
  const headers = ["Quando", "Evento", "Usuário", "Secretaria", "Certificado", "Entidade", "Detalhes"];
  const rows = report.items.map(getAuditReportRow);
  const metaRows = [
    ["Relatório de auditoria"],
    ["Gerado em", formatDateTime(report.generatedAt.toISOString())],
    ["Total de eventos", String(report.total)],
    ...report.filters.map((filter) => [filter.label, filter.value]),
    [],
  ];

  return `\uFEFF${[...metaRows, headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\r\n")}`;
}

function escapeHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAuditPrintReportHtml(report) {
  const filtersHtml = report.filters
    .map(
      (filter) => `
        <div class="filter-item">
          <span>${escapeHtml(filter.label)}</span>
          <strong>${escapeHtml(filter.value)}</strong>
        </div>
      `
    )
    .join("");

  const rowsHtml = report.items.length
    ? report.items
        .map((item) => {
          const row = getAuditReportRow(item);
          return `
            <tr>
              ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="7" class="empty">Nenhum evento encontrado.</td></tr>';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de auditoria</title>
  <style>
    body { margin: 28px; color: #112031; font-family: Arial, sans-serif; }
    header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #1a4f8b; padding-bottom: 14px; margin-bottom: 18px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    p { margin: 0; color: #526781; }
    .total { align-self: flex-start; padding: 8px 12px; border-radius: 8px; background: #eef5ff; color: #1a4f8b; font-weight: 700; white-space: nowrap; }
    .filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 18px; }
    .filter-item { border: 1px solid #d9e3ef; border-radius: 8px; padding: 8px 10px; }
    .filter-item span { display: block; color: #5a6b7b; font-size: 12px; }
    .filter-item strong { display: block; margin-top: 2px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #d9e3ef; padding: 8px 7px; text-align: left; vertical-align: top; }
    th { background: #f7fbff; color: #1a4f8b; }
    .empty { text-align: center; color: #5a6b7b; padding: 18px; }
    @media print {
      body { margin: 16mm; }
      header { break-inside: avoid; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Relatório de auditoria</h1>
      <p>Gerado em ${escapeHtml(formatDateTime(report.generatedAt.toISOString()))}</p>
    </div>
    <div class="total">${escapeHtml(String(report.total))} evento(s)</div>
  </header>
  <section class="filters">${filtersHtml}</section>
  <table>
    <thead>
      <tr>
        <th>Quando</th>
        <th>Evento</th>
        <th>Usuário</th>
        <th>Secretaria</th>
        <th>Certificado</th>
        <th>Entidade</th>
        <th>Detalhes</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <script>
    window.addEventListener("load", () => setTimeout(() => window.print(), 250));
  </script>
</body>
</html>`;
}

function writeAuditReportLoading(reportWindow) {
  if (!reportWindow) return;
  reportWindow.document.open();
  reportWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head><meta charset="UTF-8" /><title>Gerando relatório</title></head>
      <body style="font-family: Arial, sans-serif; padding: 28px;">Gerando relatório de auditoria...</body>
    </html>
  `);
  reportWindow.document.close();
}

async function exportAuditCsvReport() {
  if (!sessionState || !isAdminSession()) return;
  setAuditReportButtonsBusy(true);
  setAuditStatus("Gerando relatório CSV da auditoria...", "info");

  try {
    const report = await fetchAuditReportEvents();
    const csv = buildAuditCsvReport(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `relatorio-auditoria-${buildTimestamp()}.csv`);
    setAuditStatus(`Relatório CSV gerado com ${report.total} evento(s).`, "info");
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setAuditStatus((error && error.message) || "Não foi possível gerar o relatório.", "error");
  } finally {
    setAuditReportButtonsBusy(false);
  }
}

async function printAuditReport(reportWindow) {
  if (!sessionState || !isAdminSession()) return;
  setAuditReportButtonsBusy(true);
  setAuditStatus("Gerando relatório para impressão...", "info");

  try {
    const report = await fetchAuditReportEvents();
    reportWindow.document.open();
    reportWindow.document.write(buildAuditPrintReportHtml(report));
    reportWindow.document.close();
    reportWindow.focus();
    setAuditStatus(`Relatório para impressão gerado com ${report.total} evento(s).`, "info");
  } catch (error) {
    console.error(error);
    if (reportWindow && !reportWindow.closed) {
      reportWindow.close();
    }
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setAuditStatus((error && error.message) || "Não foi possível gerar o relatório.", "error");
  } finally {
    setAuditReportButtonsBusy(false);
  }
}

async function loadCertificates(page = certListState.page) {
  if (!sessionState) return;

  certListState.page = page;
  syncCertificateFilterInputsFromState();
  setCertListStatus("Carregando certificados...", "info");

  try {
    const payload = await apiJsonRequest(
      `/api/certificados${buildQueryString({
        pagina: certListState.page,
        por_pagina: certListState.perPage,
        busca: certListState.filters.busca,
        secretaria_id: certListState.filters.secretariaId,
        concluido_de: certListState.filters.concluidoDe,
        concluido_ate: certListState.filters.concluidoAte,
        emitido_de: certListState.filters.emitidoDe,
        emitido_ate: certListState.filters.emitidoAte,
      })}`
    );

    certListState.total = payload.total || 0;
    certListState.totalPages = payload.paginas || 1;
    renderCertificateRows(payload.itens || []);

    if (certListSummary) {
      certListSummary.textContent = `${certListState.total} certificado(s) encontrado(s)`;
    }
    if (certPageIndicator) {
      certPageIndicator.textContent = `Página ${payload.pagina} de ${payload.paginas}`;
    }
    if (certPrevPageBtn) certPrevPageBtn.disabled = payload.pagina <= 1;
    if (certNextPageBtn) certNextPageBtn.disabled = payload.pagina >= payload.paginas;
    setCertListStatus("", "info");
  } catch (error) {
    console.error(error);
    if (unresolvedCertificates.size) {
      await cleanupPendingCertificates(Array.from(unresolvedCertificates.values()));
    }
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setCertListStatus(
      (error && error.message) || "Nao foi possivel carregar os certificados.",
      "error"
    );
  }
}

async function loadAuditEvents(page = auditState.page) {
  if (!sessionState || !isAdminSession()) return;

  auditState.page = page;
  syncAuditFilterInputsFromState();
  setAuditStatus("Carregando auditoria...", "info");

  try {
    const payload = await apiJsonRequest(
      `/api/admin/auditoria${buildQueryString({
        pagina: auditState.page,
        por_pagina: auditState.perPage,
        busca: auditState.filters.busca,
        evento: auditState.filters.evento,
        secretaria_id: auditState.filters.secretariaId,
        criado_de: auditState.filters.criadoDe,
        criado_ate: auditState.filters.criadoAte,
      })}`
    );

    auditState.total = payload.total || 0;
    auditState.totalPages = payload.paginas || 1;
    renderAuditRows(payload.itens || []);
    if (auditSummary) {
      auditSummary.textContent = `${auditState.total} evento(s)`;
    }
    if (auditPageIndicator) {
      auditPageIndicator.textContent = `Página ${payload.pagina} de ${payload.paginas}`;
    }
    if (auditPrevPageBtn) auditPrevPageBtn.disabled = payload.pagina <= 1;
    if (auditNextPageBtn) auditNextPageBtn.disabled = payload.pagina >= payload.paginas;
    setAuditStatus("", "info");
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    if (error && error.status === 403) {
      if (auditListBody) {
        auditListBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">A auditoria é restrita ao administrador.</td>
          </tr>
        `;
      }
      if (auditTab) auditTab.hidden = true;
      if (currentSection === "audit") switchSection("generator");
      return;
    }
    setAuditStatus(
      (error && error.message) || "Nao foi possivel carregar a auditoria.",
      "error"
    );
  }
}

async function loadAdminData() {
  if (!sessionState || !canManageVisualAssets()) return;

  try {
    syncAdminSectionVisibility();
    const admin = isAdminSession();
    const editingUserId = sanitizeText(userEditIdInput ? userEditIdInput.value : "");
    const editingSecretariaId = sanitizeText(
      secretariaEditIdInput ? secretariaEditIdInput.value : ""
    );
    const editingTemplateId = sanitizeText(
      templateAdminEditIdInput ? templateAdminEditIdInput.value : ""
    );
    const editingSecretariaAssetId = sanitizeText(
      secretariaAssetEditIdInput ? secretariaAssetEditIdInput.value : ""
    );
    const requests = [
      apiJsonRequest("/api/admin/templates"),
      apiJsonRequest("/api/admin/secretaria-assets"),
    ];
    if (admin) {
      requests.unshift(apiJsonRequest("/api/admin/secretarias"), apiJsonRequest("/api/admin/usuarios"));
    }
    const payloads = await Promise.all(requests);
    const manageableSecretarias = admin ? payloads[0] : (sessionState.secretarias || []);
    const templates = admin ? payloads[2] : payloads[0];
    const secretariaAssets = admin ? payloads[3] : payloads[1];

    adminState.secretarias = Array.isArray(manageableSecretarias) ? manageableSecretarias : [];
    adminState.users = admin && Array.isArray(payloads[1]) ? payloads[1] : [];
    adminState.templates = Array.isArray(templates) ? templates : [];
    adminState.secretariaAssets = Array.isArray(secretariaAssets) ? secretariaAssets : [];
    if (admin) {
      populateSecretariaOptions(
        userSecretariasSelect,
        adminState.secretarias.filter((secretaria) => secretaria.ativa),
        "",
        false
      );
    }
    populateSecretariaOptions(
      templateAdminSecretariaSelect,
      adminState.secretarias,
      templateAdminSecretariaSelect ? templateAdminSecretariaSelect.value : "",
      false
    );
    populateSecretariaOptions(
      secretariaAssetSecretariaSelect,
      adminState.secretarias,
      secretariaAssetSecretariaSelect ? secretariaAssetSecretariaSelect.value : "",
      false
    );
    if (admin) {
      populateSecretariaOptions(
        auditSecretariaSelect,
        adminState.secretarias,
        auditState.filters.secretariaId,
        true
      );
      renderUserSecretariasChecklist();
      renderSecretariasTable();
      renderUsersTable();
    }
    renderTemplatesTable();
    renderSecretariaAssetsTable();

    if (admin && editingUserId) {
      const currentUser = adminState.users.find((usuario) => String(usuario.id) === editingUserId);
      if (currentUser) {
        fillUserForm(currentUser);
      }
    }

    if (admin && editingSecretariaId) {
      const currentSecretaria = adminState.secretarias.find(
        (secretaria) => String(secretaria.id) === editingSecretariaId
      );
      if (currentSecretaria) {
        fillSecretariaForm(currentSecretaria);
      }
    }

    if (editingTemplateId) {
      const currentTemplate = adminState.templates.find(
        (template) => String(template.id) === editingTemplateId
      );
      if (currentTemplate) {
        fillTemplateAdminForm(currentTemplate);
      }
    }

    if (editingSecretariaAssetId) {
      const currentAsset = adminState.secretariaAssets.find(
        (asset) => String(asset.id) === editingSecretariaAssetId
      );
      if (currentAsset) {
        fillSecretariaAssetForm(currentAsset);
      }
    }

    if (admin) {
      await loadAuditEvents(auditState.page || 1);
    }
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    if (error && error.status === 403) {
      if (!canManageVisualAssets()) {
        if (adminTab) adminTab.hidden = true;
      }
      if (!isAdminSession() && auditTab) auditTab.hidden = true;
      if (isAdminOnlySection(currentSection)) switchSection("generator");
      return;
    }
    setUserFormStatus(
      (error && error.message) || "Nao foi possivel carregar os usuarios.",
      "error"
    );
    setSecretariaFormStatus(
      (error && error.message) || "Nao foi possivel carregar as secretarias.",
      "error"
    );
    setTemplateAdminStatus(
      (error && error.message) || "Nao foi possivel carregar os moldes.",
      "error"
    );
    setSecretariaAssetAdminStatus(
      (error && error.message) || "Nao foi possivel carregar logos, assinaturas e instituicoes.",
      "error"
    );
  }
}

async function applySavedTemplateSelection(templateId, options = {}) {
  const { silentStatus = false } = options;
  const normalizedId = templateId ? String(templateId) : "";
  templateCatalogState.selectedId = normalizedId;
  if (templateSelect) {
    templateSelect.value = normalizedId;
  }
  if (!assets.template) {
    setTemplateStatus("", "info");
  }

  if (!normalizedId) {
    savedTemplate = null;
    savedTemplateImage = null;
    if (!silentStatus) {
      const fallbackMessage = templateCatalogState.items.length
        ? ""
        : "A secretaria ativa ainda não tem moldes cadastrados. Você pode usar um arquivo temporário nesta emissão.";
      setTemplateSelectStatus(fallbackMessage, "info");
    }
    await renderLastCertificate();
    return;
  }

  const template = templateCatalogState.items.find(
    (item) => String(item.id) === normalizedId
  );
  if (!template) {
    savedTemplate = null;
    savedTemplateImage = null;
    templateCatalogState.selectedId = "";
    if (templateSelect) templateSelect.value = "";
    if (!silentStatus) {
      setTemplateSelectStatus("O modelo selecionado nao esta mais disponivel.", "error");
    }
    await renderLastCertificate();
    return;
  }

  try {
    if (!silentStatus) {
      setTemplateSelectStatus(`Carregando modelo ${template.nome}...`, "info");
    }
    const response = await fetch(template.arquivo_url, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = new Error(`Falha ao carregar o molde (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    const blob = await response.blob();
    savedTemplateImage = await loadImageFromBlob(blob);
    savedTemplate = template;
    if (!silentStatus) {
      const suffix = assets.template
        ? " O molde temporário local continua sobrescrevendo esta seleção na prévia."
        : "";
      setTemplateSelectStatus(`Modelo ${template.nome} pronto para uso.${suffix}`, "success");
    }
    await renderLastCertificate();
  } catch (error) {
    console.error(error);
    savedTemplate = null;
    savedTemplateImage = null;
    if (!silentStatus) {
      let message =
        (error && error.message) || "Nao foi possivel carregar o modelo selecionado.";
      if (error && error.status === 404) {
        message =
          "O arquivo do molde cadastrado nao foi encontrado no servidor. Reenvie o molde na administracao.";
      }
      setTemplateSelectStatus(
        message,
        "error"
      );
    }
  }
}

async function loadAvailableTemplates() {
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    templateCatalogState.items = [];
    templateCatalogState.selectedId = "";
    savedTemplate = null;
    savedTemplateImage = null;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) populateTemplateOptions(templateSelect, [], "", true);
    setTemplateSelectStatus(
      "Selecione uma secretaria para usar um molde cadastrado ou enviar um arquivo temporário.",
      "info"
    );
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/templates${buildQueryString({ secretaria_id: sessionState.secretaria_ativa_id })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    templateCatalogState.items = items;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) {
      populateTemplateOptions(templateSelect, items, templateCatalogState.selectedId, true);
    }

    const currentSelected = items.find(
      (item) => String(item.id) === String(templateCatalogState.selectedId || "")
    );
    const defaultTemplate = items.find((item) => item.padrao) || items[0] || null;
    const nextTemplateId = currentSelected
      ? String(currentSelected.id)
      : defaultTemplate
        ? String(defaultTemplate.id)
        : "";

    await applySavedTemplateSelection(nextTemplateId, { silentStatus: false });
  } catch (error) {
    console.error(error);
    templateCatalogState.items = [];
    templateCatalogState.selectedId = "";
    savedTemplate = null;
    savedTemplateImage = null;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) populateTemplateOptions(templateSelect, [], "", true);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setTemplateSelectStatus(
      (error && error.message) || "Nao foi possivel carregar os modelos da secretaria.",
      "error"
    );
  }
}

async function applySavedSecretariaAssetSelection(type, assetId, options = {}) {
  const { silentStatus = false } = options;
  const ui = getSecretariaAssetUi(type);
  const catalog = getSecretariaAssetCatalog(type);
  const normalizedId = assetId ? String(assetId) : "";
  catalog.selectedId = normalizedId;
  if (ui.select) {
    ui.select.value = normalizedId;
  }
  if (!assets[type]) {
    ui.setManualStatus("", "info");
  }

  if (!normalizedId) {
    setSavedSecretariaAsset(type, null, null);
    if (!silentStatus) {
      const fallbackMessage = catalog.items.length
        ? ""
        : `A secretaria ativa ainda não tem ${ui.pluralLabel} cadastradas. Você pode usar uma ${ui.label} temporária nesta emissão.`;
      ui.setSelectStatus(fallbackMessage, "info");
    }
    await renderLastCertificate();
    return;
  }

  const asset = catalog.items.find((item) => String(item.id) === normalizedId);
  if (!asset) {
    setSavedSecretariaAsset(type, null, null);
    catalog.selectedId = "";
    if (ui.select) ui.select.value = "";
    if (!silentStatus) {
      ui.setSelectStatus(`A ${ui.label} selecionada não está mais disponível.`, "error");
    }
    await renderLastCertificate();
    return;
  }

  try {
    if (!silentStatus) {
      ui.setSelectStatus(`Carregando ${ui.label} ${asset.nome}...`, "info");
    }
    const response = await fetch(asset.arquivo_url, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = new Error(`Falha ao carregar a ${ui.label} (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    const blob = await response.blob();
    const image = await loadImageFromBlob(blob);
    setSavedSecretariaAsset(type, asset, image);
    if (!silentStatus) {
      const manualOverride = assets[type]
        ? ` A ${ui.label} temporária local continua sobrescrevendo esta seleção na prévia.`
        : "";
      ui.setSelectStatus(
        `${ui.label.charAt(0).toUpperCase() + ui.label.slice(1)} ${asset.nome} pronta para uso.${manualOverride}`,
        "success"
      );
    }
    await renderLastCertificate();
  } catch (error) {
    console.error(error);
    setSavedSecretariaAsset(type, null, null);
    if (!silentStatus) {
      let message = (error && error.message) || `Não foi possível carregar a ${ui.label} selecionada.`;
      if (error && error.status === 404) {
        message = ui.missingFileMessage;
      }
      ui.setSelectStatus(message, "error");
    }
    await renderLastCertificate();
  }
}

async function loadAvailableSecretariaAssetType(type) {
  const ui = getSecretariaAssetUi(type);
  const catalog = getSecretariaAssetCatalog(type);
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    catalog.items = [];
    catalog.selectedId = "";
    setSavedSecretariaAsset(type, null, null);
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, [], "", true);
    if (type === "assinatura") {
      syncExtraSignatureCatalogs([], {
        statusMessage:
          "Selecione uma secretaria para usar assinaturas extras cadastradas ou enviar arquivos temporarios.",
      });
    }
    ui.setSelectStatus(
      `Selecione uma secretaria para usar ${ui.pluralLabel} cadastradas ou enviar um arquivo temporário.`,
      "info"
    );
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/secretaria-assets${buildQueryString({
        tipo: type,
        secretaria_id: sessionState.secretaria_ativa_id,
      })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    catalog.items = items;
    if (type === "assinatura") {
      syncExtraSignatureCatalogs(items);
    }
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, items, catalog.selectedId, true);

    const currentSelected = items.find(
      (item) => String(item.id) === String(catalog.selectedId || "")
    );
    const defaultItem = items.find((item) => item.padrao) || items[0] || null;
    const nextAssetId = currentSelected
      ? String(currentSelected.id)
      : defaultItem
        ? String(defaultItem.id)
        : "";
    await applySavedSecretariaAssetSelection(type, nextAssetId, { silentStatus: false });
  } catch (error) {
    console.error(error);
    catalog.items = [];
    catalog.selectedId = "";
    setSavedSecretariaAsset(type, null, null);
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, [], "", true);
    if (type === "assinatura") {
      syncExtraSignatureCatalogs([], {
        statusMessage: "Nao foi possivel carregar as assinaturas extras da secretaria.",
        statusType: "error",
      });
    }
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    ui.setSelectStatus(
      (error && error.message) || `Não foi possível carregar as ${ui.pluralLabel} da secretaria.`,
      "error"
    );
  }
}

async function loadAvailableSeloAssets() {
  const catalog = getSecretariaAssetCatalog("selo");
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    catalog.items = [];
    catalog.selectedId = "";
    syncSeloCatalogs([], {
      statusMessage:
        "Selecione uma secretaria para usar selos cadastrados ou enviar arquivos temporarios.",
    });
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/secretaria-assets${buildQueryString({
        tipo: "selo",
        secretaria_id: sessionState.secretaria_ativa_id,
      })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    catalog.items = items;
    syncSeloCatalogs(items);

    await Promise.all(
      SELO_SLOT_KEYS.map((type) => {
        const slotCatalog = getSecretariaAssetCatalog(type);
        if (!slotCatalog.selectedId) return Promise.resolve();
        return applySavedSecretariaAssetSelection(type, slotCatalog.selectedId, {
          silentStatus: true,
        });
      })
    );
  } catch (error) {
    console.error(error);
    catalog.items = [];
    catalog.selectedId = "";
    syncSeloCatalogs([], {
      statusMessage: "Nao foi possivel carregar os selos da secretaria.",
      statusType: "error",
    });
    if (error && error.status === 401) {
      await handleUnauthorized();
    }
  }
}

async function loadAvailableSecretariaAssets() {
  await loadAvailableSecretariaAssetType("logo");
  await loadAvailableSecretariaAssetType("assinatura");
  await loadAvailableSecretariaAssetType("instituicao");
  await loadAvailableSeloAssets();
}

async function deleteTemplate(template) {
  if (!template) return;

  try {
    const payload = await apiJsonRequest(`/api/admin/templates/${template.id}`, {
      method: "DELETE",
      body: "{}",
    });
    setTemplateAdminStatus(
      (payload && payload.message) || `Molde ${template.nome} excluido com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAvailableTemplates();
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
      setTemplateAdminStatus(
        (error && error.message) || "Nao foi possivel excluir o molde.",
        "error"
      );
    }
  }

async function deleteSecretariaAsset(asset) {
  if (!asset) return;

  try {
    const payload = await apiJsonRequest(`/api/admin/secretaria-assets/${asset.id}`, {
      method: "DELETE",
      body: "{}",
    });
    setSecretariaAssetAdminStatus(
      (payload && payload.message)
        || `${capitalizeLabel(getSecretariaAssetDisplayLabel(asset.tipo))} ${asset.nome} excluída com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAvailableSecretariaAssets();
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setSecretariaAssetAdminStatus(
      (error && error.message) || "Nao foi possivel excluir o item.",
      "error"
    );
  }
}

async function deleteUser(usuario) {
  if (!usuario || !isAdminSession()) return;

  const confirmed = window.confirm(
    `Excluir o usuário ${usuario.username}? Os certificados já emitidos continuarão no histórico, mas ficarão sem vínculo com esse usuário.`
  );
  if (!confirmed) return;

  try {
    setUserFormStatus(`Excluindo usuário ${usuario.username}...`, "info");
    const payload = await apiJsonRequest(`/api/admin/usuarios/${usuario.id}`, {
      method: "DELETE",
      body: "{}",
    });
    if (sanitizeText(userEditIdInput ? userEditIdInput.value : "") === String(usuario.id)) {
      resetUserForm();
    }
    setUserFormStatus(
      (payload && payload.message) || `Usuário ${usuario.username} excluído com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAuditEvents(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setUserFormStatus(
      (error && error.message) || "Nao foi possivel excluir o usuario.",
      "error"
    );
  }
}

async function deleteSecretaria(secretaria) {
  if (!secretaria || !isAdminSession()) return;

  const confirmed = window.confirm(
    `Excluir a secretaria ${secretaria.sigla}? Isso removerá os moldes dela e desvinculará os usuários. Se houver certificados emitidos, a exclusão será bloqueada.`
  );
  if (!confirmed) return;

  try {
    setSecretariaFormStatus(`Excluindo secretaria ${secretaria.sigla}...`, "info");
    const payload = await apiJsonRequest(`/api/admin/secretarias/${secretaria.id}`, {
      method: "DELETE",
      body: "{}",
    });
    if (
      sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "") ===
      String(secretaria.id)
    ) {
      resetSecretariaForm();
    }
    setSecretariaFormStatus(
      (payload && payload.message) || `Secretaria ${secretaria.sigla} excluída com sucesso.`,
      "success"
    );
    await refreshSession();
    await loadAdminData();
    await loadAvailableTemplates();
    await loadAuditEvents(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setSecretariaFormStatus(
      (error && error.message) || "Nao foi possivel excluir a secretaria.",
      "error"
    );
  }
}
