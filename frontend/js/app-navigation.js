function isAdminSession(session = sessionState) {
  return Boolean(session && session.usuario && session.usuario.papel === "admin_global");
}

function canManageVisualAssets(session = sessionState) {
  return Boolean(session && Array.isArray(session.secretarias) && session.secretarias.length > 0);
}

function canManageReplyEmails(session = sessionState) {
  return Boolean(session && Array.isArray(session.secretarias) && session.secretarias.length > 0);
}

function canManageCertificateForms(session = sessionState) {
  return Boolean(session && Array.isArray(session.secretarias) && session.secretarias.length > 0);
}

function isAdminOnlySection(sectionName) {
  return sectionName === "audit";
}

function getAvailableAdminModules(session = sessionState) {
  const modules = [];
  if (isAdminSession(session)) {
    modules.push("users", "secretarias");
  }
  if (canManageVisualAssets(session)) {
    modules.push("templates", "assets");
  }
  return modules;
}

function getDefaultAdminModule(session = sessionState) {
  const [firstModule] = getAvailableAdminModules(session);
  return firstModule || "users";
}

function syncAdminAssetTypeFilterButtons() {
  adminAssetFilterBtns.forEach((button) => {
    const isActive = button.dataset.adminAssetFilter === adminUiState.assetTypeFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function setSecretariaAssetTypeFilter(type, options = {}) {
  const { syncForm = false } = options;
  const normalizedType = ["logo", "assinatura", "instituicao", "selo"].includes(type)
    ? type
    : "logo";
  adminUiState.assetTypeFilter = normalizedType;
  syncAdminAssetTypeFilterButtons();
  if (
    syncForm &&
    secretariaAssetTypeSelect &&
    !secretariaAssetTypeSelect.disabled &&
    secretariaAssetTypeSelect.value !== normalizedType
  ) {
    secretariaAssetTypeSelect.value = normalizedType;
    syncSecretariaAssetTypeUi();
  }
}

function syncAdminModuleUi(session = sessionState) {
  const availableModules = getAvailableAdminModules(session);
  if (!availableModules.length) return;

  if (!availableModules.includes(adminUiState.module)) {
    adminUiState.module = getDefaultAdminModule(session);
  }

  const modulePanels = {
    users: userAdminPanel,
    secretarias: secretariaAdminPanel,
    templates: templateManagementPanel,
    assets: visualAssetManagementPanel,
  };

  Object.entries(modulePanels).forEach(([moduleName, panel]) => {
    if (!panel) return;
    panel.hidden = !availableModules.includes(moduleName) || adminUiState.module !== moduleName;
  });

  adminModuleTabs.forEach((button) => {
    const moduleName = button.dataset.adminModuleTab || "";
    const isVisible = availableModules.includes(moduleName);
    const isActive = isVisible && moduleName === adminUiState.module;
    button.hidden = !isVisible;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  syncAdminAssetTypeFilterButtons();
}

function switchAdminModule(moduleName) {
  const availableModules = getAvailableAdminModules();
  if (!availableModules.length) return;
  adminUiState.module = availableModules.includes(moduleName)
    ? moduleName
    : getDefaultAdminModule();
  syncAdminModuleUi();
}

function syncAdminSectionVisibility(session = sessionState) {
  const admin = isAdminSession(session);
  const canManageAssets = canManageVisualAssets(session);
  const canManageEmails = canManageReplyEmails(session);
  const canManageForms = canManageCertificateForms(session);
  if (formsTab) {
    formsTab.hidden = !canManageForms;
  }
  if (emailsTab) {
    emailsTab.hidden = !canManageEmails;
  }
  if (adminTab) {
    adminTab.hidden = !canManageAssets;
    adminTab.textContent = admin ? "Administração" : "Moldes e marcas";
  }
  syncAdminModuleUi(session);
}

function switchSection(sectionName) {
  let targetSection = viewSections[sectionName] ? sectionName : "generator";
  if (targetSection === "emails" && !canManageReplyEmails()) {
    targetSection = "generator";
  }
  if (targetSection === "forms" && !canManageCertificateForms()) {
    targetSection = "generator";
  }
  currentSection = targetSection;

  Object.entries(viewSections).forEach(([name, element]) => {
    if (!element) return;
    element.hidden = name !== currentSection;
  });

  sectionTabs.forEach((button) => {
    const isActive = button.dataset.section === currentSection;
    button.classList.toggle("is-active", isActive);
  });

  if (currentSection === "admin") {
    syncAdminModuleUi();
  }
}

function populateSecretariaOptions(select, secretarias, selectedValue = "", includeAll = false) {
  if (!select) return;

  const selectedText = selectedValue === null || selectedValue === undefined
    ? ""
    : String(selectedValue);
  select.innerHTML = "";

  if (includeAll) {
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Todas";
    if (!selectedText) {
      allOption.selected = true;
    }
    select.appendChild(allOption);
  }

  (Array.isArray(secretarias) ? secretarias : []).forEach((secretaria) => {
    const option = document.createElement("option");
    option.value = String(secretaria.id);
    option.textContent = `${secretaria.sigla} - ${secretaria.nome}`;
    option.selected = String(secretaria.id) === selectedText;
    select.appendChild(option);
  });

  if (select && select.id === "user-secretarias") {
    renderUserSecretariasChecklist();
  }
}

function populateTemplateOptions(select, templates, selectedValue = "", includeBlank = true) {
  if (!select) return;

  const selectedText = selectedValue === null || selectedValue === undefined
    ? ""
    : String(selectedValue);
  select.innerHTML = "";

  if (includeBlank) {
    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = "Usar fundo padrão";
    if (!selectedText) {
      blankOption.selected = true;
    }
    select.appendChild(blankOption);
  }

  (Array.isArray(templates) ? templates : []).forEach((template) => {
    const option = document.createElement("option");
    option.value = String(template.id);
    const labels = [];
    if (template.padrao) labels.push("padrão");
    if (template.ocultar_titulo_certificado) labels.push("título no molde");
    option.textContent = labels.length
      ? `${template.nome} (${labels.join(", ")})`
      : template.nome;
    option.selected = String(template.id) === selectedText;
    select.appendChild(option);
  });
}

function populateSecretariaAssetOptions(type, items, selectedValue = "", includeBlank = true) {
  const ui = getSecretariaAssetUi(type);
  const select = ui.select;
  if (!select) return;

  const selectedText =
    selectedValue === null || selectedValue === undefined ? "" : String(selectedValue);
  select.innerHTML = "";

  if (includeBlank) {
    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = ui.blankLabel;
    if (!selectedText) {
      blankOption.selected = true;
    }
    select.appendChild(blankOption);
  }

  (Array.isArray(items) ? items : []).forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.padrao ? `${item.nome} (padrão)` : item.nome;
    option.selected = String(item.id) === selectedText;
    select.appendChild(option);
  });
}

function syncExtraSignatureCatalogs(items = [], options = {}) {
  const availableItems = Array.isArray(items) ? items : [];
  const { statusMessage = "", statusType = "info" } = options;

  ["assinatura2", "assinatura3"].forEach((type) => {
    const catalog = getSecretariaAssetCatalog(type);
    const ui = getSecretariaAssetUi(type);
    catalog.items = availableItems;

    const selectedExists = availableItems.some(
      (item) => String(item.id) === String(catalog.selectedId || "")
    );
    if (!selectedExists) {
      catalog.selectedId = "";
      setSavedSecretariaAsset(type, null, null);
    }

    populateSecretariaAssetOptions(type, availableItems, catalog.selectedId, true);
    if (ui.wrap) ui.wrap.hidden = false;
    ui.setSelectStatus(statusMessage || "", statusMessage ? statusType : "info");
  });
}

function syncSeloCatalogs(items = [], options = {}) {
  const availableItems = Array.isArray(items) ? items : [];
  const { statusMessage = "", statusType = "info" } = options;

  SELO_SLOT_KEYS.forEach((type) => {
    const catalog = getSecretariaAssetCatalog(type);
    const ui = getSecretariaAssetUi(type);
    catalog.items = availableItems;

    const selectedExists = availableItems.some(
      (item) => String(item.id) === String(catalog.selectedId || "")
    );
    if (!selectedExists) {
      catalog.selectedId = "";
      setSavedSecretariaAsset(type, null, null);
    }

    populateSecretariaAssetOptions(type, availableItems, catalog.selectedId, true);
    if (ui.wrap) ui.wrap.hidden = false;
    ui.setSelectStatus(statusMessage || "", statusMessage ? statusType : "info");
  });
}

function getMultiSelectValues(select) {
  if (!select) return [];
  return Array.from(select.selectedOptions).map((option) => Number(option.value));
}

function setMultiSelectValues(select, values = []) {
  if (!select) return;
  const selected = new Set((values || []).map((value) => Number(value)));
  Array.from(select.options).forEach((option) => {
    option.selected = selected.has(Number(option.value));
  });

  if (select && select.id === "user-secretarias") {
    renderUserSecretariasChecklist();
  }
}

function renderUserSecretariasChecklist() {
  if (!userSecretariasChecklist || !userSecretariasSelect) return;

  const options = Array.from(userSecretariasSelect.options);
  const disabled = Boolean(userSecretariasSelect.disabled);
  userSecretariasChecklist.innerHTML = "";
  userSecretariasSelect.hidden = true;

  if (disabled) {
    const info = document.createElement("p");
    info.className = "checkbox-list-empty";
    info.textContent =
      "Admin global acessa todas as secretarias. Os vinculos sao limpos automaticamente ao salvar.";
    userSecretariasChecklist.appendChild(info);
    return;
  }

  if (!options.length) {
    const empty = document.createElement("p");
    empty.className = "checkbox-list-empty";
    empty.textContent = "Cadastre secretarias para vinculá-las aos operadores.";
    userSecretariasChecklist.appendChild(empty);
    return;
  }

  options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "checkbox-list-item";
    if (disabled) {
      label.classList.add("is-disabled");
    }

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = option.value;
    input.checked = option.selected;
    input.disabled = disabled;
    input.addEventListener("change", () => {
      option.selected = input.checked;
    });

    const text = document.createElement("span");
    text.textContent = option.textContent || "";

    label.append(input, text);
    userSecretariasChecklist.append(label);
  });
}
