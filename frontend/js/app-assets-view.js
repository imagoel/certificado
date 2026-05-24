
async function loadCertificates(page = certListState.page) {
  if (!sessionState) return;

  certListState.page = page;
  syncCertificateFilterInputsFromState();
  setCertListStatus("Carregando certificados...", "info");

  try {
    const payload = await apiJsonRequest(
      `/api/certificados${buildQueryString({
        pagina: certListState.page,
        por_pagina: certListState.perPage,
        busca: certListState.filters.busca,
        secretaria_id: certListState.filters.secretariaId,
        concluido_de: certListState.filters.concluidoDe,
        concluido_ate: certListState.filters.concluidoAte,
        emitido_de: certListState.filters.emitidoDe,
        emitido_ate: certListState.filters.emitidoAte,
      })}`
    );

    certListState.total = payload.total || 0;
    certListState.totalPages = payload.paginas || 1;
    renderCertificateRows(payload.itens || []);

    if (certListSummary) {
      certListSummary.textContent = `${certListState.total} certificado(s) encontrado(s)`;
    }
    if (certPageIndicator) {
      certPageIndicator.textContent = `Página ${payload.pagina} de ${payload.paginas}`;
    }
    if (certPrevPageBtn) certPrevPageBtn.disabled = payload.pagina <= 1;
    if (certNextPageBtn) certNextPageBtn.disabled = payload.pagina >= payload.paginas;
    setCertListStatus("", "info");
  } catch (error) {
    console.error(error);
    if (unresolvedCertificates.size) {
      await cleanupPendingCertificates(Array.from(unresolvedCertificates.values()));
    }
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setCertListStatus(
      (error && error.message) || "Nao foi possivel carregar os certificados.",
      "error"
    );
  }
}

async function loadAuditEvents(page = auditState.page) {
  if (!sessionState || !isAdminSession()) return;

  auditState.page = page;
  syncAuditFilterInputsFromState();
  setAuditStatus("Carregando auditoria...", "info");

  try {
    const payload = await apiJsonRequest(
      `/api/admin/auditoria${buildQueryString({
        pagina: auditState.page,
        por_pagina: auditState.perPage,
        busca: auditState.filters.busca,
        evento: auditState.filters.evento,
        secretaria_id: auditState.filters.secretariaId,
        criado_de: auditState.filters.criadoDe,
        criado_ate: auditState.filters.criadoAte,
      })}`
    );

    auditState.total = payload.total || 0;
    auditState.totalPages = payload.paginas || 1;
    renderAuditRows(payload.itens || []);
    if (auditSummary) {
      auditSummary.textContent = `${auditState.total} evento(s)`;
    }
    if (auditPageIndicator) {
      auditPageIndicator.textContent = `Página ${payload.pagina} de ${payload.paginas}`;
    }
    if (auditPrevPageBtn) auditPrevPageBtn.disabled = payload.pagina <= 1;
    if (auditNextPageBtn) auditNextPageBtn.disabled = payload.pagina >= payload.paginas;
    setAuditStatus("", "info");
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    if (error && error.status === 403) {
      if (auditListBody) {
        auditListBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">A auditoria é restrita ao administrador.</td>
          </tr>
        `;
      }
      if (auditTab) auditTab.hidden = true;
      if (currentSection === "audit") switchSection("generator");
      return;
    }
    setAuditStatus(
      (error && error.message) || "Nao foi possivel carregar a auditoria.",
      "error"
    );
  }
}

async function loadAdminData() {
  if (!sessionState || !canManageVisualAssets()) return;

  try {
    syncAdminSectionVisibility();
    const admin = isAdminSession();
    const editingUserId = sanitizeText(userEditIdInput ? userEditIdInput.value : "");
    const editingSecretariaId = sanitizeText(
      secretariaEditIdInput ? secretariaEditIdInput.value : ""
    );
    const editingTemplateId = sanitizeText(
      templateAdminEditIdInput ? templateAdminEditIdInput.value : ""
    );
    const editingSecretariaAssetId = sanitizeText(
      secretariaAssetEditIdInput ? secretariaAssetEditIdInput.value : ""
    );
    const requests = [
      apiJsonRequest("/api/admin/templates"),
      apiJsonRequest("/api/admin/secretaria-assets"),
    ];
    if (admin) {
      requests.unshift(apiJsonRequest("/api/admin/secretarias"), apiJsonRequest("/api/admin/usuarios"));
    }
    const payloads = await Promise.all(requests);
    const manageableSecretarias = admin ? payloads[0] : (sessionState.secretarias || []);
    const templates = admin ? payloads[2] : payloads[0];
    const secretariaAssets = admin ? payloads[3] : payloads[1];

    adminState.secretarias = Array.isArray(manageableSecretarias) ? manageableSecretarias : [];
    adminState.users = admin && Array.isArray(payloads[1]) ? payloads[1] : [];
    adminState.templates = Array.isArray(templates) ? templates : [];
    adminState.secretariaAssets = Array.isArray(secretariaAssets) ? secretariaAssets : [];
    if (admin) {
      populateSecretariaOptions(
        userSecretariasSelect,
        adminState.secretarias.filter((secretaria) => secretaria.ativa),
        "",
        false
      );
    }
    populateSecretariaOptions(
      templateAdminSecretariaSelect,
      adminState.secretarias,
      templateAdminSecretariaSelect ? templateAdminSecretariaSelect.value : "",
      false
    );
    populateSecretariaOptions(
      secretariaAssetSecretariaSelect,
      adminState.secretarias,
      secretariaAssetSecretariaSelect ? secretariaAssetSecretariaSelect.value : "",
      false
    );
    if (admin) {
      populateSecretariaOptions(
        auditSecretariaSelect,
        adminState.secretarias,
        auditState.filters.secretariaId,
        true
      );
      renderUserSecretariasChecklist();
      renderSecretariasTable();
      renderUsersTable();
    }
    renderTemplatesTable();
    renderSecretariaAssetsTable();

    if (admin && editingUserId) {
      const currentUser = adminState.users.find((usuario) => String(usuario.id) === editingUserId);
      if (currentUser) {
        fillUserForm(currentUser);
      }
    }

    if (admin && editingSecretariaId) {
      const currentSecretaria = adminState.secretarias.find(
        (secretaria) => String(secretaria.id) === editingSecretariaId
      );
      if (currentSecretaria) {
        fillSecretariaForm(currentSecretaria);
      }
    }

    if (editingTemplateId) {
      const currentTemplate = adminState.templates.find(
        (template) => String(template.id) === editingTemplateId
      );
      if (currentTemplate) {
        fillTemplateAdminForm(currentTemplate);
      }
    }

    if (editingSecretariaAssetId) {
      const currentAsset = adminState.secretariaAssets.find(
        (asset) => String(asset.id) === editingSecretariaAssetId
      );
      if (currentAsset) {
        fillSecretariaAssetForm(currentAsset);
      }
    }

    if (admin) {
      await loadAuditEvents(auditState.page || 1);
    }
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    if (error && error.status === 403) {
      if (!canManageVisualAssets()) {
        if (adminTab) adminTab.hidden = true;
      }
      if (!isAdminSession() && auditTab) auditTab.hidden = true;
      if (isAdminOnlySection(currentSection)) switchSection("generator");
      return;
    }
    setUserFormStatus(
      (error && error.message) || "Nao foi possivel carregar os usuarios.",
      "error"
    );
    setSecretariaFormStatus(
      (error && error.message) || "Nao foi possivel carregar as secretarias.",
      "error"
    );
    setTemplateAdminStatus(
      (error && error.message) || "Nao foi possivel carregar os moldes.",
      "error"
    );
    setSecretariaAssetAdminStatus(
      (error && error.message) || "Nao foi possivel carregar logos, assinaturas e instituicoes.",
      "error"
    );
  }
}

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
      const fallbackMessage = templateCatalogState.items.length
        ? ""
        : "A secretaria ativa ainda não tem moldes cadastrados. Você pode usar um arquivo temporário nesta emissão.";
      setTemplateSelectStatus(fallbackMessage, "info");
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
    setTemplateSelectStatus(
      "Selecione uma secretaria para usar um molde cadastrado ou enviar um arquivo temporário.",
      "info"
    );
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
      const fallbackMessage = catalog.items.length
        ? ""
        : `A secretaria ativa ainda não tem ${ui.pluralLabel} cadastradas. Você pode usar uma ${ui.label} temporária nesta emissão.`;
      ui.setSelectStatus(fallbackMessage, "info");
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
        statusMessage:
          "Selecione uma secretaria para usar assinaturas extras cadastradas ou enviar arquivos temporarios.",
      });
    }
    ui.setSelectStatus(
      `Selecione uma secretaria para usar ${ui.pluralLabel} cadastradas ou enviar um arquivo temporário.`,
      "info"
    );
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
      statusMessage:
        "Selecione uma secretaria para usar selos cadastrados ou enviar arquivos temporarios.",
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

async function deleteUser(usuario) {
  if (!usuario || !isAdminSession()) return;

  const confirmed = window.confirm(
    `Excluir o usuário ${usuario.username}? Os certificados já emitidos continuarão no histórico, mas ficarão sem vínculo com esse usuário.`
  );
  if (!confirmed) return;

  try {
    setUserFormStatus(`Excluindo usuário ${usuario.username}...`, "info");
    const payload = await apiJsonRequest(`/api/admin/usuarios/${usuario.id}`, {
      method: "DELETE",
      body: "{}",
    });
    if (sanitizeText(userEditIdInput ? userEditIdInput.value : "") === String(usuario.id)) {
      resetUserForm();
    }
    setUserFormStatus(
      (payload && payload.message) || `Usuário ${usuario.username} excluído com sucesso.`,
      "success"
    );
    await loadAdminData();
    await loadAuditEvents(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setUserFormStatus(
      (error && error.message) || "Nao foi possivel excluir o usuario.",
      "error"
    );
  }
}

async function deleteSecretaria(secretaria) {
  if (!secretaria || !isAdminSession()) return;

  const confirmed = window.confirm(
    `Excluir a secretaria ${secretaria.sigla}? Isso removerá os moldes dela e desvinculará os usuários. Se houver certificados emitidos, a exclusão será bloqueada.`
  );
  if (!confirmed) return;

  try {
    setSecretariaFormStatus(`Excluindo secretaria ${secretaria.sigla}...`, "info");
    const payload = await apiJsonRequest(`/api/admin/secretarias/${secretaria.id}`, {
      method: "DELETE",
      body: "{}",
    });
    if (
      sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "") ===
      String(secretaria.id)
    ) {
      resetSecretariaForm();
    }
    setSecretariaFormStatus(
      (payload && payload.message) || `Secretaria ${secretaria.sigla} excluída com sucesso.`,
      "success"
    );
    await refreshSession();
    await loadAdminData();
    await loadAvailableTemplates();
    await loadAuditEvents(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setSecretariaFormStatus(
      (error && error.message) || "Nao foi possivel excluir a secretaria.",
      "error"
    );
  }
}
