function registerSectionEvents() {
  sectionTabs.forEach((button) => {
    button.addEventListener("click", () => {
      const { section } = button.dataset;
      if (isAdminOnlySection(section) && !isAdminSession()) return;
      if (section === "emails" && !canManageReplyEmails()) return;
      if (section === "forms" && !canManageCertificateForms()) return;
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
      if (section === "emails" && sessionState && canManageReplyEmails()) {
        void loadAdminData();
      }
      if (section === "forms" && sessionState && canManageCertificateForms()) {
        void loadCertificateForms();
      }
      if (section === "generator" && sessionState) {
        void refreshGeneratorCatalogs();
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
