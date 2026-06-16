function registerDialogEvents() {
  if (confirmActionCancelBtn) {
    confirmActionCancelBtn.addEventListener("click", () => {
      resolveConfirmAction(false);
    });
  }

  if (deleteCertCancelBtn) {
    deleteCertCancelBtn.addEventListener("click", () => {
      closeDeleteCertificateDialog();
    });
  }

  if (resendEmailCancelBtn) {
    resendEmailCancelBtn.addEventListener("click", () => {
      closeResendEmailDialog();
    });
  }

  if (clearTrashCancelBtn) {
    clearTrashCancelBtn.addEventListener("click", () => {
      closeClearTrashDialog();
    });
  }

  if (editCertCancelBtn) {
    editCertCancelBtn.addEventListener("click", () => {
      closeCertificateEditDialog();
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

  if (confirmActionDialog) {
    confirmActionDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      resolveConfirmAction(false);
    });
  }

  if (confirmActionForm) {
    confirmActionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      resolveConfirmAction(true);
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

  if (resendEmailDialog) {
    resendEmailDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeResendEmailDialog();
    });
  }

  if (clearTrashDialog) {
    clearTrashDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeClearTrashDialog();
    });
  }

  if (editCertDialog) {
    editCertDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeCertificateEditDialog();
    });
  }

  if (deleteCertForm) {
    deleteCertForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isAdminSession()) return;

      const selectedItems = pendingDeleteCertificates.length
        ? pendingDeleteCertificates
        : pendingDeleteCertificate
          ? [pendingDeleteCertificate]
          : [];
      const codigos = selectedItems
        .map((item) => sanitizeText(item.codigo).toUpperCase())
        .filter(Boolean);
      const password = deleteCertPasswordInput ? deleteCertPasswordInput.value : "";

      if (!codigos.length) {
        setDeleteCertStatus("Nenhum certificado selecionado para exclusao.", "error");
        return;
      }
      if (!password) {
        setDeleteCertStatus("Informe a senha do administrador.", "error");
        return;
      }

      try {
        const isBulkDelete = codigos.length > 1;
        setDeleteCertStatus(
          isBulkDelete
            ? `Movendo ${codigos.length} certificados para a lixeira...`
            : `Movendo ${codigos[0]} para a lixeira...`,
          "info"
        );
        const payload = isBulkDelete
          ? await apiJsonRequest("/api/admin/certificados", {
              method: "DELETE",
              body: JSON.stringify({ password, codigos }),
            })
          : await apiJsonRequest(
              `/api/admin/certificados/${encodeURIComponent(codigos[0])}`,
              {
                method: "DELETE",
                body: JSON.stringify({ password }),
              }
            );

        if (lastData && codigos.includes(sanitizeText(lastData.codigo).toUpperCase())) {
          lastData = null;
          downloadBtn.disabled = true;
        }

        const currentCertPage = certListState.page || 1;
        const remainingCertTotal = Math.max(0, (certListState.total || 0) - codigos.length);
        const maxPageAfterDelete = Math.max(
          1,
          Math.ceil(remainingCertTotal / certListState.perPage)
        );
        const nextCertPage = Math.min(currentCertPage, maxPageAfterDelete);

        closeDeleteCertificateDialog();
        clearCertificateSelection();
        setCertListStatus(
          (payload && payload.message) ||
            (codigos.length > 1
              ? `${codigos.length} certificados movidos para a lixeira.`
              : `Certificado ${codigos[0]} movido para a lixeira.`),
          "success"
        );
        await loadCertificates(nextCertPage);
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

  if (resendEmailForm) {
    resendEmailForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!pendingResendCertificate || !canResendCertificateEmail(pendingResendCertificate)) {
        setResendEmailStatus("Nenhum certificado disponível para reenvio.", "error");
        return;
      }

      const item = pendingResendCertificate;
      closeResendEmailDialog();
      await resendCertificateEmail(item);
    });
  }

  if (editCertForm) {
    editCertForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!pendingCertificateEditConfirmation || !editingCertificate || !isAdminSession()) {
        setEditCertStatus("Nenhuma edicao pendente para confirmar.", "error");
        return;
      }

      const codigo = sanitizeText(editingCertificate.codigo).toUpperCase();
      const confirmacaoCodigo = sanitizeText(
        editCertConfirmCodeInput ? editCertConfirmCodeInput.value : ""
      ).toUpperCase();
      const password = editCertPasswordInput ? editCertPasswordInput.value : "";

      if (confirmacaoCodigo !== codigo) {
        setEditCertStatus("Digite o codigo exato do certificado para confirmar.", "error");
        return;
      }
      if (!password) {
        setEditCertStatus("Informe a senha do administrador.", "error");
        return;
      }

      await saveCertificateEdit(pendingCertificateEditConfirmation, password, confirmacaoCodigo);
    });
  }

  if (clearTrashForm) {
    clearTrashForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isAdminSession()) return;

      const confirmacao = sanitizeText(
        clearTrashConfirmationInput ? clearTrashConfirmationInput.value : ""
      ).toUpperCase();
      const password = clearTrashPasswordInput ? clearTrashPasswordInput.value : "";

      if (confirmacao !== "LIMPAR LIXEIRA") {
        setClearTrashStatus("Digite LIMPAR LIXEIRA para confirmar.", "error");
        return;
      }
      if (!password) {
        setClearTrashStatus("Informe a senha do administrador.", "error");
        return;
      }

      try {
        setClearTrashStatus("Limpando lixeira...", "info");
        const payload = await apiJsonRequest("/api/admin/certificados/lixeira", {
          method: "DELETE",
          body: JSON.stringify({ password, confirmacao }),
        });
        closeClearTrashDialog();
        certListState.trashMode = true;
        syncCertificateTrashModeUi();
        setCertListStatus(
          (payload && payload.message) || "Lixeira limpa com sucesso.",
          "success"
        );
        await loadCertificates(1);
        await loadAuditEvents(1);
      } catch (error) {
        console.error(error);
        if (error && error.status === 401) {
          if (error.message === "Senha do administrador invalida.") {
            setClearTrashStatus(error.message, "error");
            if (clearTrashPasswordInput) clearTrashPasswordInput.value = "";
            return;
          }
          await handleUnauthorized();
          return;
        }
        setClearTrashStatus(
          (error && error.message) || "Nao foi possivel limpar a lixeira.",
          "error"
        );
      }
    });
  }
}
