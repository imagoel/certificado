function registerListingEvents() {
  if (certListForm) {
    certListForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      readCertificateFiltersFromInputs();
      certListState.page = 1;
      await loadCertificates(1);
    });
  }

  if (certFilterResetBtn) {
    certFilterResetBtn.addEventListener("click", async () => {
      resetCertificateFiltersState();
      certListState.page = 1;
      syncCertificateFilterInputsFromState();
      await loadCertificates(1);
    });
  }

  if (certQuickTodayBtn) {
    certQuickTodayBtn.addEventListener("click", async () => {
      const todayRange = getLastDaysRange(1);
      certListState.filters.emitidoDe = todayRange.start;
      certListState.filters.emitidoAte = todayRange.end;
      certListState.page = 1;
      await loadCertificates(1);
    });
  }

  if (certQuickLast7Btn) {
    certQuickLast7Btn.addEventListener("click", async () => {
      const range = getLastDaysRange(7);
      certListState.filters.emitidoDe = range.start;
      certListState.filters.emitidoAte = range.end;
      certListState.page = 1;
      await loadCertificates(1);
    });
  }

  if (certQuickActiveSecretariaBtn) {
    certQuickActiveSecretariaBtn.addEventListener("click", async () => {
      certListState.filters.secretariaId = sessionState && sessionState.secretaria_ativa_id
        ? String(sessionState.secretaria_ativa_id)
        : "";
      certListState.page = 1;
      await loadCertificates(1);
    });
  }

  if (certExportCsvBtn) {
    certExportCsvBtn.addEventListener("click", () => {
      void exportCertificateCsvReport();
    });
  }

  if (certClearTrashBtn) {
    certClearTrashBtn.addEventListener("click", () => {
      openClearTrashDialog();
    });
  }

  if (certTrashActiveBtn) {
    certTrashActiveBtn.addEventListener("click", async () => {
      if (!certListState.trashMode) return;
      certListState.trashMode = false;
      certListState.page = 1;
      syncCertificateTrashModeUi();
      await loadCertificates(1);
    });
  }

  if (certTrashDeletedBtn) {
    certTrashDeletedBtn.addEventListener("click", async () => {
      if (certListState.trashMode || !isAdminSession()) return;
      certListState.trashMode = true;
      certListState.page = 1;
      syncCertificateTrashModeUi();
      await loadCertificates(1);
    });
  }

  if (certPrevPageBtn) {
    certPrevPageBtn.addEventListener("click", () => {
      if (certListState.page > 1) {
        void loadCertificates(certListState.page - 1);
      }
    });
  }

  if (certNextPageBtn) {
    certNextPageBtn.addEventListener("click", () => {
      if (certListState.page < certListState.totalPages) {
        void loadCertificates(certListState.page + 1);
      }
    });
  }

  if (auditForm) {
    auditForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      readAuditFiltersFromInputs();
      auditState.page = 1;
      await loadAuditEvents(1);
    });
  }

  if (auditResetBtn) {
    auditResetBtn.addEventListener("click", async () => {
      resetAuditFiltersState();
      auditState.page = 1;
      syncAuditFilterInputsFromState();
      await loadAuditEvents(1);
    });
  }

  if (auditQuickTodayBtn) {
    auditQuickTodayBtn.addEventListener("click", async () => {
      const todayRange = getLastDaysRange(1);
      auditState.filters.criadoDe = todayRange.start;
      auditState.filters.criadoAte = todayRange.end;
      auditState.page = 1;
      await loadAuditEvents(1);
    });
  }

  if (auditQuickLast7Btn) {
    auditQuickLast7Btn.addEventListener("click", async () => {
      const range = getLastDaysRange(7);
      auditState.filters.criadoDe = range.start;
      auditState.filters.criadoAte = range.end;
      auditState.page = 1;
      await loadAuditEvents(1);
    });
  }

  if (auditQuickActiveSecretariaBtn) {
    auditQuickActiveSecretariaBtn.addEventListener("click", async () => {
      auditState.filters.secretariaId = sessionState && sessionState.secretaria_ativa_id
        ? String(sessionState.secretaria_ativa_id)
        : "";
      auditState.page = 1;
      await loadAuditEvents(1);
    });
  }

  if (auditExportCsvBtn) {
    auditExportCsvBtn.addEventListener("click", () => {
      void exportAuditCsvReport();
    });
  }

  if (auditPrintReportBtn) {
    auditPrintReportBtn.addEventListener("click", () => {
      const reportWindow = window.open("", "_blank");
      if (!reportWindow) {
        setAuditStatus("Permita pop-ups para abrir o relatório de impressão.", "error");
        return;
      }
      writeAuditReportLoading(reportWindow);
      void printAuditReport(reportWindow);
    });
  }

  if (auditPrevPageBtn) {
    auditPrevPageBtn.addEventListener("click", () => {
      if (auditState.page > 1) {
        void loadAuditEvents(auditState.page - 1);
      }
    });
  }

  if (auditNextPageBtn) {
    auditNextPageBtn.addEventListener("click", () => {
      if (auditState.page < auditState.totalPages) {
        void loadAuditEvents(auditState.page + 1);
      }
    });
  }
}
