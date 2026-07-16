function clearSessionUi(message = "") {
  sessionState = null;
  closeDeleteCertificateDialog();
  closeCertificateEditDialog();
  closeClearTrashDialog();
  closeBatchConfirmDialog();
  certListState.page = 1;
  certListState.total = 0;
  certListState.totalPages = 1;
  certListState.trashMode = false;
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
  if (replyEmailSelect) {
    replyEmailSelect.innerHTML = "";
    replyEmailSelect.disabled = true;
  }
  if (replyEmailStatus) replyEmailStatus.textContent = "";
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
  syncCertificateTrashModeUi();
  syncCertificateBulkSelectionUi();
  updateAuditQuickFilterButtons();
  if (certListBody) {
    certListBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Faça login para carregar os certificados.</td>
      </tr>
    `;
  }
  if (certListSummary) certListSummary.textContent = "";
  if (certPageIndicator) certPageIndicator.textContent = "Página 1";
  if (auditSummary) auditSummary.textContent = "";
  if (auditPageIndicator) auditPageIndicator.textContent = "Página 1";
  if (adminTab) adminTab.hidden = true;
  if (formsTab) formsTab.hidden = true;
  if (emailsTab) emailsTab.hidden = true;
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
  adminState.selectedEmailSecretariaId = "";
  adminState.templates = [];
  adminState.secretariaAssets = [];
  if (emailSecretariaSelect) emailSecretariaSelect.innerHTML = "";
  resetReplyEmailForm();
  renderReplyEmailAdminPanel();
  adminUiState.module = "users";
  adminUiState.assetTypeFilter = "logo";
  templateCatalogState.items = [];
  templateCatalogState.selectedId = "";
  layoutPresetState.items = [];
  layoutPresetState.selectedId = "";
  layoutPresetState.isSaving = false;
  layoutPresetState.isApplying = false;
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
  syncLayoutPresetSelectUi();
  setLayoutPresetStatus("", "info");
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
