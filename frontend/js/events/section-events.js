function registerSectionEvents() {
  sectionTabs.forEach((button) => {
    button.addEventListener("click", () => {
      const { section } = button.dataset;
      if (isAdminOnlySection(section) && !isAdminSession()) return;
      if (section === "admin" && !canManageVisualAssets()) return;
      switchSection(section || "generator");
      if (section === "certificates" && sessionState) {
        void loadCertificates(certListState.page || 1);
      }
      if (section === "audit" && sessionState && isAdminSession()) {
        void loadAuditEvents(auditState.page || 1);
      }
      if (section === "admin" && sessionState && canManageVisualAssets()) {
        void loadAdminData();
      }
    });
  });

  adminModuleTabs.forEach((button) => {
    button.addEventListener("click", () => {
      switchAdminModule(button.dataset.adminModuleTab || getDefaultAdminModule());
    });
  });

  adminAssetFilterBtns.forEach((button) => {
    button.addEventListener("click", () => {
      setSecretariaAssetTypeFilter(button.dataset.adminAssetFilter || "logo", {
        syncForm: true,
      });
      renderSecretariaAssetsTable();
    });
  });
}
