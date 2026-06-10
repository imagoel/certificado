function registerDialogEvents() {
  if (deleteCertCancelBtn) {
    deleteCertCancelBtn.addEventListener("click", () => {
      closeDeleteCertificateDialog();
    });
  }

  if (duplicateCertCancelBtn) {
    duplicateCertCancelBtn.addEventListener("click", () => {
      closeDuplicateCertificateDialog();
      setBatchStatus("Geração cancelada. Use um certificado existente ou ajuste os dados.", "info");
    });
  }

  if (duplicateCertViewExistingBtn) {
    duplicateCertViewExistingBtn.addEventListener("click", () => {
      if (!pendingDuplicateCertificate || !pendingDuplicateCertificate.duplicates.length) {
        setDuplicateCertStatus("Nenhum certificado existente disponível para abrir.", "error");
        return;
      }

      const [firstMatch] = pendingDuplicateCertificate.duplicates;
      const openTarget =
        firstMatch.arquivo_admin_url || firstMatch.arquivo_url || firstMatch.url_validacao || "";
      if (!openTarget) {
        setDuplicateCertStatus("O certificado existente não possui um arquivo para abrir.", "error");
        return;
      }

      window.open(openTarget, "_blank", "noopener,noreferrer");
      closeDuplicateCertificateDialog();
      setBatchStatus(
        `Abrindo o certificado existente ${firstMatch.codigo}. Gere um novo apenas se realmente precisar duplicar.`,
        "info"
      );
    });
  }

  if (duplicateCertDialog) {
    duplicateCertDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDuplicateCertificateDialog();
    });
  }

  if (duplicateCertForm) {
    duplicateCertForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!pendingDuplicateCertificate || isSingleGenerationRunning || isBatchRunning) {
        setDuplicateCertStatus("Nenhuma geração pendente para confirmar.", "error");
        return;
      }

      const prepared = pendingDuplicateCertificate.prepared;
      closeDuplicateCertificateDialog();
      await executeSingleCertificateGeneration(prepared);
    });
  }

  if (deleteCertDialog) {
    deleteCertDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDeleteCertificateDialog();
    });
  }

  if (deleteCertForm) {
    deleteCertForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!pendingDeleteCertificate || !isAdminSession()) return;

      const codigo = sanitizeText(pendingDeleteCertificate.codigo).toUpperCase();
      const confirmacaoCodigo = sanitizeText(
        deleteCertConfirmCodeInput ? deleteCertConfirmCodeInput.value : ""
      ).toUpperCase();
      const password = deleteCertPasswordInput ? deleteCertPasswordInput.value : "";

      if (!codigo) {
        setDeleteCertStatus("Nenhum certificado selecionado para exclusao.", "error");
        return;
      }
      if (confirmacaoCodigo !== codigo) {
        setDeleteCertStatus("Digite o codigo exato do certificado para confirmar.", "error");
        return;
      }
      if (!password) {
        setDeleteCertStatus("Informe a senha do administrador.", "error");
        return;
      }

      try {
        setDeleteCertStatus(`Excluindo ${codigo}...`, "info");
        const payload = await apiJsonRequest(
          `/api/admin/certificados/${encodeURIComponent(codigo)}`,
          {
            method: "DELETE",
            body: JSON.stringify({
              password,
              confirmacao_codigo: confirmacaoCodigo,
            }),
          }
        );

        if (lastData && sanitizeText(lastData.codigo).toUpperCase() === codigo) {
          lastData = null;
          downloadBtn.disabled = true;
        }

        closeDeleteCertificateDialog();
        setCertListStatus(
          (payload && payload.message) || `Certificado ${codigo} excluido com sucesso.`,
          "success"
        );
        await loadCertificates(1);
        if (isAdminSession()) {
          await loadAuditEvents(1);
        }
      } catch (error) {
        console.error(error);
        if (error && error.status === 401) {
          if (error.message === "Senha do administrador invalida.") {
            setDeleteCertStatus(error.message, "error");
            if (deleteCertPasswordInput) deleteCertPasswordInput.value = "";
            return;
          }
          await handleUnauthorized();
          return;
        }
        setDeleteCertStatus(
          (error && error.message) || "Nao foi possivel excluir o certificado.",
          "error"
        );
      }
    });
  }
}
