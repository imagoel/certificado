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
