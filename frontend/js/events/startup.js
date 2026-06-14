function initializeApp() {
  setTodayDate();
  syncUserFormState();
  syncSecretariaFormState();
  syncTemplateAdminFormState();
  syncSecretariaAssetFormState();
  setSecretariaAssetTypeFilter(adminUiState.assetTypeFilter, { syncForm: true });
  syncAdminModuleUi();
  syncCertificateEditUi();
  syncGenerateSubmitButton();
  syncAdvancedAssetControls();
  updateControlLabels();
  syncTemplateControls();
  syncPreviewHotspotToggle();
  syncAdvancedControlVisibility();
  setTemplateStatus("", "info");
  setLogoStatus("", "info");
  setAssinaturaStatus("", "info");
  setSelo1Status("", "info");
  setSelo2Status("", "info");
  setSelo3Status("", "info");
  setSelo4Status("", "info");
  setInstituicaoStatus("", "info");
  void renderLastCertificate();
  void refreshSession();
}
