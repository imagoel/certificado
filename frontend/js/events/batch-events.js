function registerBatchEvents() {
  if (planilhaInput) {
    planilhaInput.addEventListener("change", () => {
      closeBatchConfirmDialog();
      loadedExternalBatch = null;
      const file = planilhaInput.files && planilhaInput.files[0];
      if (!file) {
        setBatchStatus("", "info");
        resetBatchPreview();
        return;
      }
      resetBatchPreview();
      void handleBatchPreview();
    });
  }



  if (batchPreviewBtn) {
    batchPreviewBtn.addEventListener("click", () => {
      void handleBatchPreview();
    });
  }

  if (batchGenerateBtn) {
    batchGenerateBtn.addEventListener("click", () => {
      void handleBatchGenerate();
    });
  }

  if (batchConfirmCancelBtn) {
    batchConfirmCancelBtn.addEventListener("click", () => {
      closeBatchConfirmDialog();
    });
  }

  if (batchConfirmDialog) {
    batchConfirmDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeBatchConfirmDialog();
    });
  }

  if (batchConfirmForm) {
    batchConfirmForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!pendingBatchGeneration) {
        setBatchConfirmStatus("Nenhum lote preparado para confirmação.", "error");
        return;
      }

      const { prepared, downloadZip } = pendingBatchGeneration;
      closeBatchConfirmDialog();
      void executeBatchGeneration(prepared, { downloadZip });
    });
  }
}
