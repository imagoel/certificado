function registerFormsEvents() {
  if (certificateFormForm) {
    certificateFormForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void saveCertificateForm();
    });
  }

  if (certificateFormResetBtn) {
    certificateFormResetBtn.addEventListener("click", () => {
      resetCertificateForm();
    });
  }

  if (formsRefreshBtn) {
    formsRefreshBtn.addEventListener("click", () => {
      void loadCertificateForms();
    });
  }

  if (certificateFormSecretariaSelect) {
    certificateFormSecretariaSelect.addEventListener("change", () => {
      populateCertificateFormReplyEmails();
    });
  }

  [
    certificateFormExtra1TypeSelect,
    certificateFormExtra2TypeSelect,
    certificateFormExtra3TypeSelect,
  ].forEach((select) => {
    if (!select) return;
    select.addEventListener("change", () => {
      syncCertificateFormExtraOptionsVisibility();
    });
  });

  if (formCopyLinkBtn) {
    formCopyLinkBtn.addEventListener("click", () => {
      void copySelectedFormLink();
    });
  }

  if (formDownloadQrBtn) {
    formDownloadQrBtn.addEventListener("click", () => {
      void downloadSelectedFormQrCode();
    });
  }

  if (formExportCsvBtn) {
    formExportCsvBtn.addEventListener("click", () => {
      void exportSelectedFormResponsesCsv();
    });
  }

  if (formLoadGeneratorBtn) {
    formLoadGeneratorBtn.addEventListener("click", () => {
      loadSelectedFormResponsesIntoGenerator();
    });
  }
}
