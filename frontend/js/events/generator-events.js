function registerGeneratorFormEvents() {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isBatchRunning || isSingleGenerationRunning) return;
    if (!sessionState) {
      await handleUnauthorized();
      return;
    }
    if (editingCertificate) {
      setBatchStatus("Use Salvar alteracoes para concluir a edicao atual.", "info");
      return;
    }
    if (loadedExternalBatch) {
      await handleBatchGenerate({ downloadZip: false });
      return;
    }

    try {
      const prepared = getCertificateFormPrepared();

      setBatchStatus("Verificando possiveis certificados ja emitidos...", "info");
      const duplicates = await findPossibleDuplicateCertificates(prepared);
      if (duplicates.length) {
        setBatchStatus(
          `Encontramos ${duplicates.length} certificado(s) semelhante(s) ja emitido(s).`,
          "error"
        );
        openDuplicateCertificateDialog(prepared, duplicates);
        return;
      }

      await executeSingleCertificateGeneration(prepared);
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      if (error && error.field === "email" && emailInput && typeof emailInput.reportValidity === "function") {
        emailInput.reportValidity();
      }
      setBatchStatus(
        (error && error.message) || "Nao foi possivel verificar certificados semelhantes.",
        "error"
      );
    }
  });

  if (certificateEditSaveBtn) {
    certificateEditSaveBtn.addEventListener("click", () => {
      openCertificateEditConfirmDialog();
    });
  }

  if (certificateEditCancelBtn) {
    certificateEditCancelBtn.addEventListener("click", () => {
      cancelCertificateEditMode();
    });
  }
}

function registerGeneratorInputEvents() {
  [assinaturaLabelInput, assinatura2LabelInput, assinatura3LabelInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      if (isBatchRunning) return;
      void renderLastCertificate();
    });
  });

  if (textoLinha1Input) {
    textoLinha1Input.addEventListener("input", () => {
      if (isBatchRunning) return;
      if (lastData) {
        lastData.linha1 = textoLinha1Input.value.trim();
      }
      void renderLastCertificate();
    });
  }

  if (textoLinha2Input) {
    textoLinha2Input.addEventListener("input", () => {
      if (isBatchRunning) return;
      if (lastData) {
        lastData.linha2 = textoLinha2Input.value.trim();
      }
      void renderLastCertificate();
    });
  }

  [nomeInput, cursoInput, emailInput, dataInput, cargaHInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      if (input === emailInput && typeof input.setCustomValidity === "function") {
        input.setCustomValidity("");
      }
      if (editingCertificate && lastData) {
        syncEditingCertificateLastDataFromForm();
        void renderLastCertificate();
        return;
      }
      if (isBatchRunning || lastData) return;
      void renderLastCertificate();
    });
  });
}

function registerDownloadEvents() {
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${(lastData && lastData.codigo) || "certificado"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}
