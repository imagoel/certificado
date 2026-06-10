function capitalizeLabel(label) {
  const text = sanitizeText(label);
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getSecretariaAssetCatalog(type) {
  return secretariaAssetCatalogState[type] || { items: [], selectedId: "" };
}

function isSeloSlot(type) {
  return SELO_SLOT_KEYS.includes(type);
}

function getSeloSlotNumber(type) {
  const index = SELO_SLOT_KEYS.indexOf(type);
  return index >= 0 ? index + 1 : 0;
}

function getSeloSlotUiParts(type) {
  if (type === "selo1") {
    return {
      select: selo1Select,
      removeBtn: selo1RemoveBtn,
      setSelectStatus: setSelo1SelectStatus,
      setManualStatus: setSelo1Status,
    };
  }
  if (type === "selo2") {
    return {
      select: selo2Select,
      removeBtn: selo2RemoveBtn,
      setSelectStatus: setSelo2SelectStatus,
      setManualStatus: setSelo2Status,
    };
  }
  if (type === "selo3") {
    return {
      select: selo3Select,
      removeBtn: selo3RemoveBtn,
      setSelectStatus: setSelo3SelectStatus,
      setManualStatus: setSelo3Status,
    };
  }
  return {
    select: selo4Select,
    removeBtn: selo4RemoveBtn,
    setSelectStatus: setSelo4SelectStatus,
    setManualStatus: setSelo4Status,
  };
}

function getSavedSecretariaAsset(type) {
  if (type === "logo") return savedLogo;
  if (type === "assinatura") return savedAssinatura;
  if (type === "assinatura2") return savedAssinatura2;
  if (type === "assinatura3") return savedAssinatura3;
  if (type === "instituicao") return savedInstituicao;
  if (type === "selo1") return savedSelo1;
  if (type === "selo2") return savedSelo2;
  if (type === "selo3") return savedSelo3;
  if (type === "selo4") return savedSelo4;
  return null;
}

function getSavedSecretariaAssetImage(type) {
  if (type === "logo") return savedLogoImage;
  if (type === "assinatura") return savedAssinaturaImage;
  if (type === "assinatura2") return savedAssinatura2Image;
  if (type === "assinatura3") return savedAssinatura3Image;
  if (type === "instituicao") return savedInstituicaoImage;
  if (type === "selo1") return savedSelo1Image;
  if (type === "selo2") return savedSelo2Image;
  if (type === "selo3") return savedSelo3Image;
  if (type === "selo4") return savedSelo4Image;
  return null;
}

function setSavedSecretariaAsset(type, asset, image) {
  if (type === "logo") {
    savedLogo = asset;
    savedLogoImage = image;
    return;
  }
  if (type === "assinatura") {
    savedAssinatura = asset;
    savedAssinaturaImage = image;
    return;
  }
  if (type === "assinatura2") {
    savedAssinatura2 = asset;
    savedAssinatura2Image = image;
    return;
  }
  if (type === "assinatura3") {
    savedAssinatura3 = asset;
    savedAssinatura3Image = image;
    return;
  }
  if (type === "instituicao") {
    savedInstituicao = asset;
    savedInstituicaoImage = image;
    return;
  }
  if (type === "selo1") {
    savedSelo1 = asset;
    savedSelo1Image = image;
    return;
  }
  if (type === "selo2") {
    savedSelo2 = asset;
    savedSelo2Image = image;
    return;
  }
  if (type === "selo3") {
    savedSelo3 = asset;
    savedSelo3Image = image;
    return;
  }
  if (type === "selo4") {
    savedSelo4 = asset;
    savedSelo4Image = image;
  }
}

function getSecretariaAssetUi(type) {
  if (isSeloSlot(type)) {
    const slotNumber = getSeloSlotNumber(type);
    const slotUi = getSeloSlotUiParts(type);
    return {
      label: `selo ${slotNumber}`,
      pluralLabel: "selos",
      wrap: selosExtrasWrap,
      select: slotUi.select,
      removeBtn: slotUi.removeBtn,
      setSelectStatus: slotUi.setSelectStatus,
      setManualStatus: slotUi.setManualStatus,
      blankLabel: `Nao usar selo ${slotNumber}`,
      missingFileMessage:
        "O arquivo do selo cadastrado nao foi encontrado no servidor. Reenvie o selo na administracao.",
    };
  }
  if (type === "logo") {
    return {
      label: "logo",
      pluralLabel: "logos",
      wrap: logoLibraryWrap,
      select: logoSelect,
      removeBtn: logoRemoveBtn,
      setSelectStatus: setLogoSelectStatus,
      setManualStatus: setLogoStatus,
      blankLabel: "Não usar logo cadastrada",
      missingFileMessage:
        "O arquivo da logo cadastrada não foi encontrado no servidor. Reenvie a logo na administração.",
    };
  }
  if (type === "assinatura") {
    return {
      label: "assinatura",
      pluralLabel: "assinaturas",
      wrap: assinaturaLibraryWrap,
      select: assinaturaSelect,
      removeBtn: assinaturaRemoveBtn,
      setSelectStatus: setAssinaturaSelectStatus,
      setManualStatus: setAssinaturaStatus,
      blankLabel: "Não usar assinatura cadastrada",
      missingFileMessage:
        "O arquivo da assinatura cadastrada não foi encontrado no servidor. Reenvie a assinatura na administração.",
    };
  }
  if (type === "assinatura2") {
    return {
      label: "assinatura 2",
      pluralLabel: "assinaturas",
      wrap: assinaturasExtrasWrap,
      select: assinatura2Select,
      removeBtn: assinatura2RemoveBtn,
      setSelectStatus: setAssinatura2SelectStatus,
      setManualStatus: setAssinatura2Status,
      blankLabel: "Nao usar assinatura 2",
      missingFileMessage:
        "O arquivo da assinatura cadastrada nao foi encontrado no servidor. Reenvie a assinatura na administracao.",
    };
  }
  if (type === "assinatura3") {
    return {
      label: "assinatura 3",
      pluralLabel: "assinaturas",
      wrap: assinaturasExtrasWrap,
      select: assinatura3Select,
      removeBtn: assinatura3RemoveBtn,
      setSelectStatus: setAssinatura3SelectStatus,
      setManualStatus: setAssinatura3Status,
      blankLabel: "Nao usar assinatura 3",
      missingFileMessage:
        "O arquivo da assinatura cadastrada nao foi encontrado no servidor. Reenvie a assinatura na administracao.",
    };
  }
  if (type === "instituicao") {
    return {
      label: "instituição",
      pluralLabel: "instituições",
      wrap: instituicaoLibraryWrap,
      select: instituicaoSelect,
      removeBtn: instituicaoRemoveBtn,
      setSelectStatus: setInstituicaoSelectStatus,
      setManualStatus: setInstituicaoStatus,
      blankLabel: "Não usar instituição cadastrada",
      missingFileMessage:
        "O arquivo da instituição cadastrada não foi encontrado no servidor. Reenvie a instituição na administração.",
    };
  }
  if (type === "selo") {
    return {
      label: "selo",
      pluralLabel: "selos",
      wrap: selosExtrasWrap,
      select: null,
      removeBtn: null,
      setSelectStatus: () => undefined,
      setManualStatus: () => undefined,
      blankLabel: "Nao usar selo",
      missingFileMessage:
        "O arquivo do selo cadastrado nao foi encontrado no servidor. Reenvie o selo na administracao.",
    };
  }
  return getSecretariaAssetUi("logo");
}

function getSecretariaAssetDisplayLabel(type, capitalize = false) {
  const label = getSecretariaAssetUi(type).label || "asset";
  return capitalize ? capitalizeLabel(label) : label;
}

function getActiveTemplateImage() {
  return assets.template || savedTemplateImage;
}

function shouldDrawCertificateTitle() {
  if (assets.template) {
    return !(templateHideTitleInput && templateHideTitleInput.checked);
  }
  if (savedTemplateImage && savedTemplate) {
    return !Boolean(savedTemplate.ocultar_titulo_certificado);
  }
  return true;
}

function getActiveLogoImage() {
  return assets.logo || savedLogoImage;
}

function getActiveAssinaturaImage() {
  return assets.assinatura || savedAssinaturaImage;
}

function getActiveSignatureImage(slotKey) {
  if (slotKey === "assinatura2") return assets.assinatura2 || savedAssinatura2Image;
  if (slotKey === "assinatura3") return assets.assinatura3 || savedAssinatura3Image;
  return getActiveAssinaturaImage();
}

function getActiveSeloImage(slotKey) {
  if (!isSeloSlot(slotKey)) return null;
  return assets[slotKey] || getSavedSecretariaAssetImage(slotKey);
}

function getSignatureLabel(slotKey) {
  return getSignatureLabelLines(slotKey).join("\n");
}

function getSignatureLabelLines(slotKey) {
  let rawText = "";
  if (slotKey === "assinatura2") {
    rawText = assinatura2LabelInput ? assinatura2LabelInput.value : "";
  } else if (slotKey === "assinatura3") {
    rawText = assinatura3LabelInput ? assinatura3LabelInput.value : "";
  } else {
    rawText = assinaturaLabelInput ? assinaturaLabelInput.value : DEFAULT_ASSINATURA_LABEL;
  }

  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => sanitizeText(line))
    .filter(Boolean)
    .slice(0, 3);

  if (slotKey === "assinatura" && !lines.length) {
    return [DEFAULT_ASSINATURA_LABEL];
  }
  return lines;
}

function isSignatureSlotActive(slotKey) {
  if (slotKey === "assinatura") return true;
  return Boolean(getActiveSignatureImage(slotKey) || getSignatureLabel(slotKey));
}

function getActiveInstituicaoImage() {
  return assets.instituicao || savedInstituicaoImage;
}

function shouldDrawInstitutionBlock() {
  return !isSignatureSlotActive("assinatura2") && !isSignatureSlotActive("assinatura3");
}

function isInstitutionSlotActive() {
  return shouldDrawInstitutionBlock() && Boolean(getActiveInstituicaoImage());
}
