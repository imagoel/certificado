function registerGeneratorAssetEvents() {
  if (logoInput) {
    logoInput.addEventListener("change", () => {
      void handleAssetChange(logoInput, "logo");
    });
  }

  if (logoSelect) {
    logoSelect.addEventListener("change", () => {
      void applySavedSecretariaAssetSelection("logo", logoSelect.value);
    });
  }

  if (logoRemoveBtn) {
    logoRemoveBtn.addEventListener("click", () => {
      assets.logo = null;
      if (logoInput) logoInput.value = "";
      syncTemplateControls();
      const message = savedLogo
        ? `Logo temporária removida. O preview voltou a usar a logo ${savedLogo.nome}.`
        : "Logo temporária removida. O preview voltou a usar a configuração padrão da tela.";
      setLogoStatus(message, "info");
      void renderLastCertificate();
    });
  }

  if (templateInput) {
    templateInput.addEventListener("change", () => {
      void handleAssetChange(templateInput, "template", { trim: false });
    });
  }

  if (templateHideTitleInput) {
    templateHideTitleInput.addEventListener("change", () => {
      void renderLastCertificate();
    });
  }

  if (templateSelect) {
    templateSelect.addEventListener("change", () => {
      void applySavedTemplateSelection(templateSelect.value);
    });
  }

  if (templateRemoveBtn) {
    templateRemoveBtn.addEventListener("click", () => {
      assets.template = null;
      if (templateInput) templateInput.value = "";
      if (templateHideTitleInput) templateHideTitleInput.checked = false;
      syncTemplateControls();
      const message = savedTemplate
        ? `Molde temporário removido. O preview voltou a usar o modelo ${savedTemplate.nome}.`
        : "Molde temporário removido. O preview voltou a usar o fundo padrão do certificado.";
      setTemplateStatus(message, "info");
      void renderLastCertificate();
    });
  }

  if (assinaturaInput) {
    assinaturaInput.addEventListener("change", () => {
      void handleAssetChange(assinaturaInput, "assinatura");
    });
  }

  if (assinaturaSelect) {
    assinaturaSelect.addEventListener("change", () => {
      void applySavedSecretariaAssetSelection("assinatura", assinaturaSelect.value);
    });
  }

  if (assinaturaRemoveBtn) {
    assinaturaRemoveBtn.addEventListener("click", () => {
      assets.assinatura = null;
      if (assinaturaInput) assinaturaInput.value = "";
      syncTemplateControls();
      const message = savedAssinatura
        ? `Assinatura temporária removida. O preview voltou a usar a assinatura ${savedAssinatura.nome}.`
        : "Assinatura temporária removida. O preview voltou a usar a configuração padrão da tela.";
      setAssinaturaStatus(message, "info");
      void renderLastCertificate();
    });
  }

  if (assinatura2Input) {
    assinatura2Input.addEventListener("change", () => {
      void handleAssetChange(assinatura2Input, "assinatura2");
    });
  }

  if (assinatura2Select) {
    assinatura2Select.addEventListener("change", () => {
      void applySavedSecretariaAssetSelection("assinatura2", assinatura2Select.value);
    });
  }

  if (assinatura2RemoveBtn) {
    assinatura2RemoveBtn.addEventListener("click", () => {
      assets.assinatura2 = null;
      if (assinatura2Input) assinatura2Input.value = "";
      syncTemplateControls();
      const message = savedAssinatura2
        ? `Assinatura 2 temporaria removida. O preview voltou a usar a assinatura ${savedAssinatura2.nome}.`
        : "Assinatura 2 temporaria removida.";
      setAssinatura2Status(message, "info");
      void renderLastCertificate();
    });
  }

  if (assinatura3Input) {
    assinatura3Input.addEventListener("change", () => {
      void handleAssetChange(assinatura3Input, "assinatura3");
    });
  }

  if (assinatura3Select) {
    assinatura3Select.addEventListener("change", () => {
      void applySavedSecretariaAssetSelection("assinatura3", assinatura3Select.value);
    });
  }

  if (assinatura3RemoveBtn) {
    assinatura3RemoveBtn.addEventListener("click", () => {
      assets.assinatura3 = null;
      if (assinatura3Input) assinatura3Input.value = "";
      syncTemplateControls();
      const message = savedAssinatura3
        ? `Assinatura 3 temporaria removida. O preview voltou a usar a assinatura ${savedAssinatura3.nome}.`
        : "Assinatura 3 temporaria removida.";
      setAssinatura3Status(message, "info");
      void renderLastCertificate();
    });
  }

  if (instituicaoInput) {
    instituicaoInput.addEventListener("change", () => {
      void handleAssetChange(instituicaoInput, "instituicao");
    });
  }

  if (instituicaoSelect) {
    instituicaoSelect.addEventListener("change", () => {
      void applySavedSecretariaAssetSelection("instituicao", instituicaoSelect.value);
    });
  }

  if (instituicaoRemoveBtn) {
    instituicaoRemoveBtn.addEventListener("click", () => {
      assets.instituicao = null;
      if (instituicaoInput) instituicaoInput.value = "";
      syncTemplateControls();
      const message = savedInstituicao
        ? `Instituição temporária removida. O preview voltou a usar a instituição ${savedInstituicao.nome}.`
        : "Instituição temporária removida. O preview voltou a usar a configuração padrão da tela.";
      setInstituicaoStatus(message, "info");
      void renderLastCertificate();
    });
  }

  [
    ["selo1", selo1Input, selo1Select],
    ["selo2", selo2Input, selo2Select],
    ["selo3", selo3Input, selo3Select],
    ["selo4", selo4Input, selo4Select],
  ].forEach(([slotKey, input, select]) => {
    const ui = getSecretariaAssetUi(slotKey);

    if (input) {
      input.addEventListener("change", () => {
        void handleAssetChange(input, slotKey);
      });
    }

    if (select) {
      select.addEventListener("change", () => {
        void applySavedSecretariaAssetSelection(slotKey, select.value);
      });
    }

    if (ui.removeBtn) {
      ui.removeBtn.addEventListener("click", () => {
        assets[slotKey] = null;
        if (input) input.value = "";
        syncTemplateControls();
        const savedAsset = getSavedSecretariaAsset(slotKey);
        const message = savedAsset
          ? `${capitalizeLabel(ui.label)} temporario removido. O preview voltou a usar o selo ${savedAsset.nome}.`
          : `${capitalizeLabel(ui.label)} temporario removido.`;
        ui.setManualStatus(message, "info");
        void renderLastCertificate();
      });
    }
  });
}
