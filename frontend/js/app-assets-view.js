
async function applySavedTemplateSelection(templateId, options = {}) {
  const { silentStatus = false } = options;
  const normalizedId = templateId ? String(templateId) : "";
  templateCatalogState.selectedId = normalizedId;
  if (templateSelect) {
    templateSelect.value = normalizedId;
  }
  if (!assets.template) {
    setTemplateStatus("", "info");
  }

  if (!normalizedId) {
    savedTemplate = null;
    savedTemplateImage = null;
    if (!silentStatus) {
      setTemplateSelectStatus("", "info");
    }
    await renderLastCertificate();
    return;
  }

  const template = templateCatalogState.items.find(
    (item) => String(item.id) === normalizedId
  );
  if (!template) {
    savedTemplate = null;
    savedTemplateImage = null;
    templateCatalogState.selectedId = "";
    if (templateSelect) templateSelect.value = "";
    if (!silentStatus) {
      setTemplateSelectStatus("O modelo selecionado nao esta mais disponivel.", "error");
    }
    await renderLastCertificate();
    return;
  }

  try {
    if (!silentStatus) {
      setTemplateSelectStatus(`Carregando modelo ${template.nome}...`, "info");
    }
    const response = await fetch(template.arquivo_url, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = new Error(`Falha ao carregar o molde (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    const blob = await response.blob();
    savedTemplateImage = await loadImageFromBlob(blob);
    savedTemplate = template;
    if (!silentStatus) {
      const suffix = assets.template
        ? " O molde temporário local continua sobrescrevendo esta seleção na prévia."
        : "";
      setTemplateSelectStatus(`Modelo ${template.nome} pronto para uso.${suffix}`, "success");
    }
    await renderLastCertificate();
  } catch (error) {
    console.error(error);
    savedTemplate = null;
    savedTemplateImage = null;
    if (!silentStatus) {
      let message =
        (error && error.message) || "Nao foi possivel carregar o modelo selecionado.";
      if (error && error.status === 404) {
        message =
          "O arquivo do molde cadastrado nao foi encontrado no servidor. Reenvie o molde na administracao.";
      }
      setTemplateSelectStatus(
        message,
        "error"
      );
    }
  }
}

async function loadAvailableTemplates() {
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    templateCatalogState.items = [];
    templateCatalogState.selectedId = "";
    savedTemplate = null;
    savedTemplateImage = null;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) populateTemplateOptions(templateSelect, [], "", true);
    setTemplateSelectStatus("", "info");
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/templates${buildQueryString({ secretaria_id: sessionState.secretaria_ativa_id })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    templateCatalogState.items = items;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) {
      populateTemplateOptions(templateSelect, items, templateCatalogState.selectedId, true);
    }

    const currentSelected = items.find(
      (item) => String(item.id) === String(templateCatalogState.selectedId || "")
    );
    const defaultTemplate = items.find((item) => item.padrao) || items[0] || null;
    const nextTemplateId = currentSelected
      ? String(currentSelected.id)
      : defaultTemplate
        ? String(defaultTemplate.id)
        : "";

    await applySavedTemplateSelection(nextTemplateId, { silentStatus: false });
  } catch (error) {
    console.error(error);
    templateCatalogState.items = [];
    templateCatalogState.selectedId = "";
    savedTemplate = null;
    savedTemplateImage = null;
    if (templateLibraryWrap) templateLibraryWrap.hidden = false;
    if (templateSelect) populateTemplateOptions(templateSelect, [], "", true);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setTemplateSelectStatus(
      (error && error.message) || "Nao foi possivel carregar os modelos da secretaria.",
      "error"
    );
  }
}

async function applySavedSecretariaAssetSelection(type, assetId, options = {}) {
  const { silentStatus = false } = options;
  const ui = getSecretariaAssetUi(type);
  const catalog = getSecretariaAssetCatalog(type);
  const normalizedId = assetId ? String(assetId) : "";
  catalog.selectedId = normalizedId;
  if (ui.select) {
    ui.select.value = normalizedId;
  }
  if (!assets[type]) {
    ui.setManualStatus("", "info");
  }

  if (!normalizedId) {
    setSavedSecretariaAsset(type, null, null);
    if (!silentStatus) {
      ui.setSelectStatus("", "info");
    }
    await renderLastCertificate();
    return;
  }

  const asset = catalog.items.find((item) => String(item.id) === normalizedId);
  if (!asset) {
    setSavedSecretariaAsset(type, null, null);
    catalog.selectedId = "";
    if (ui.select) ui.select.value = "";
    if (!silentStatus) {
      ui.setSelectStatus(`A ${ui.label} selecionada não está mais disponível.`, "error");
    }
    await renderLastCertificate();
    return;
  }

  try {
    if (!silentStatus) {
      ui.setSelectStatus(`Carregando ${ui.label} ${asset.nome}...`, "info");
    }
    const response = await fetch(asset.arquivo_url, {
      credentials: "include",
    });
    if (!response.ok) {
      const error = new Error(`Falha ao carregar a ${ui.label} (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    const blob = await response.blob();
    const image = await loadImageFromBlob(blob);
    setSavedSecretariaAsset(type, asset, image);
    if (!silentStatus) {
      const manualOverride = assets[type]
        ? ` A ${ui.label} temporária local continua sobrescrevendo esta seleção na prévia.`
        : "";
      ui.setSelectStatus(
        `${ui.label.charAt(0).toUpperCase() + ui.label.slice(1)} ${asset.nome} pronta para uso.${manualOverride}`,
        "success"
      );
    }
    await renderLastCertificate();
  } catch (error) {
    console.error(error);
    setSavedSecretariaAsset(type, null, null);
    if (!silentStatus) {
      let message = (error && error.message) || `Não foi possível carregar a ${ui.label} selecionada.`;
      if (error && error.status === 404) {
        message = ui.missingFileMessage;
      }
      ui.setSelectStatus(message, "error");
    }
    await renderLastCertificate();
  }
}

async function loadAvailableSecretariaAssetType(type) {
  const ui = getSecretariaAssetUi(type);
  const catalog = getSecretariaAssetCatalog(type);
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    catalog.items = [];
    catalog.selectedId = "";
    setSavedSecretariaAsset(type, null, null);
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, [], "", true);
    if (type === "assinatura") {
      syncExtraSignatureCatalogs([], {
        statusMessage: "",
      });
    }
    ui.setSelectStatus("", "info");
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/secretaria-assets${buildQueryString({
        tipo: type,
        secretaria_id: sessionState.secretaria_ativa_id,
      })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    catalog.items = items;
    if (type === "assinatura") {
      syncExtraSignatureCatalogs(items);
    }
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, items, catalog.selectedId, true);

    const currentSelected = items.find(
      (item) => String(item.id) === String(catalog.selectedId || "")
    );
    const defaultItem = items.find((item) => item.padrao) || items[0] || null;
    const nextAssetId = currentSelected
      ? String(currentSelected.id)
      : defaultItem
        ? String(defaultItem.id)
        : "";
    await applySavedSecretariaAssetSelection(type, nextAssetId, { silentStatus: false });
  } catch (error) {
    console.error(error);
    catalog.items = [];
    catalog.selectedId = "";
    setSavedSecretariaAsset(type, null, null);
    if (ui.wrap) ui.wrap.hidden = false;
    populateSecretariaAssetOptions(type, [], "", true);
    if (type === "assinatura") {
      syncExtraSignatureCatalogs([], {
        statusMessage: "Nao foi possivel carregar as assinaturas extras da secretaria.",
        statusType: "error",
      });
    }
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    ui.setSelectStatus(
      (error && error.message) || `Não foi possível carregar as ${ui.pluralLabel} da secretaria.`,
      "error"
    );
  }
}

async function loadAvailableSeloAssets() {
  const catalog = getSecretariaAssetCatalog("selo");
  if (!sessionState || !sessionState.secretaria_ativa_id) {
    catalog.items = [];
    catalog.selectedId = "";
    syncSeloCatalogs([], {
      statusMessage: "",
    });
    return;
  }

  try {
    const payload = await apiJsonRequest(
      `/api/secretaria-assets${buildQueryString({
        tipo: "selo",
        secretaria_id: sessionState.secretaria_ativa_id,
      })}`
    );
    const items = Array.isArray(payload) ? payload : [];
    catalog.items = items;
    syncSeloCatalogs(items);

    await Promise.all(
      SELO_SLOT_KEYS.map((type) => {
        const slotCatalog = getSecretariaAssetCatalog(type);
        if (!slotCatalog.selectedId) return Promise.resolve();
        return applySavedSecretariaAssetSelection(type, slotCatalog.selectedId, {
          silentStatus: true,
        });
      })
    );
  } catch (error) {
    console.error(error);
    catalog.items = [];
    catalog.selectedId = "";
    syncSeloCatalogs([], {
      statusMessage: "Nao foi possivel carregar os selos da secretaria.",
      statusType: "error",
    });
    if (error && error.status === 401) {
      await handleUnauthorized();
    }
  }
}

async function loadAvailableSecretariaAssets() {
  await loadAvailableSecretariaAssetType("logo");
  await loadAvailableSecretariaAssetType("assinatura");
  await loadAvailableSecretariaAssetType("instituicao");
  await loadAvailableSeloAssets();
}

async function deleteTemplate(template) {
  if (!template) return;

  try {
    const payload = await apiJsonRequest(`/api/admin/templates/${template.id}`, {
      method: "DELETE",
      body: "{}",
    });
    setTemplateAdminStatus(
      (payload && payload.message) || `Molde ${template.nome} excluido com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAvailableTemplates();
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
      setTemplateAdminStatus(
        (error && error.message) || "Nao foi possivel excluir o molde.",
        "error"
      );
    }
  }

async function deleteSecretariaAsset(asset) {
  if (!asset) return;

  try {
    const payload = await apiJsonRequest(`/api/admin/secretaria-assets/${asset.id}`, {
      method: "DELETE",
      body: "{}",
    });
    setSecretariaAssetAdminStatus(
      (payload && payload.message)
        || `${capitalizeLabel(getSecretariaAssetDisplayLabel(asset.tipo))} ${asset.nome} excluída com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAvailableSecretariaAssets();
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setSecretariaAssetAdminStatus(
      (error && error.message) || "Nao foi possivel excluir o item.",
      "error"
    );
  }
}
