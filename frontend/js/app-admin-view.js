
function scrollAdminFormIntoView(form) {
  if (!form || typeof form.scrollIntoView !== "function") return;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncUserRoleUi() {
  if (!userRoleSelect || !userSecretariasSelect) return;

  const isAdmin = userRoleSelect.value === "admin_global";
  userSecretariasSelect.disabled = isAdmin;
  if (isAdmin) {
    setMultiSelectValues(userSecretariasSelect, []);
  }
  renderUserSecretariasChecklist();
}

function syncUserFormState() {
  const isEditing = Boolean(sanitizeText(userEditIdInput ? userEditIdInput.value : ""));
  if (userForm) {
    userForm.classList.toggle("is-editing", isEditing);
  }
  if (userSubmitBtn) {
    userSubmitBtn.textContent = isEditing ? "Atualizar Usuário" : "Salvar Usuário";
  }
  syncUserRoleUi();
}

function syncSecretariaFormState() {
  const isEditing = Boolean(
    sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "")
  );
  if (secretariaForm) {
    secretariaForm.classList.toggle("is-editing", isEditing);
  }
  if (secretariaSubmitBtn) {
    secretariaSubmitBtn.textContent = isEditing
      ? "Atualizar Secretaria"
      : "Salvar Secretaria";
  }
}

function resetUserForm() {
  if (userForm) userForm.reset();
  if (userEditIdInput) userEditIdInput.value = "";
  if (userActiveInput) userActiveInput.checked = true;
  if (userRoleSelect) userRoleSelect.value = "operador";
  if (userUsernameInput) userUsernameInput.disabled = false;
  if (userPasswordInput) {
    userPasswordInput.value = "";
    userPasswordInput.placeholder = "Obrigatória no cadastro";
  }
  setMultiSelectValues(userSecretariasSelect, []);
  syncUserFormState();
  setUserFormStatus("", "info");
}

function resetSecretariaForm() {
  if (secretariaForm) secretariaForm.reset();
  if (secretariaEditIdInput) secretariaEditIdInput.value = "";
  if (secretariaActiveInput) secretariaActiveInput.checked = true;
  syncSecretariaFormState();
  setSecretariaFormStatus("", "info");
}

function syncTemplateAdminFormState() {
  const editing = Boolean(
    sanitizeText(templateAdminEditIdInput ? templateAdminEditIdInput.value : "")
  );
  if (templateAdminSubmitBtn) {
    templateAdminSubmitBtn.textContent = editing ? "Atualizar Molde" : "Salvar Molde";
  }
  if (templateAdminSecretariaSelect) {
    templateAdminSecretariaSelect.disabled = editing;
  }
  if (templateAdminFileInput) {
    templateAdminFileInput.required = !editing;
  }
}

function resetTemplateAdminForm() {
  if (templateAdminForm) templateAdminForm.reset();
  if (templateAdminEditIdInput) templateAdminEditIdInput.value = "";
  if (templateAdminActiveInput) templateAdminActiveInput.checked = true;
  if (templateAdminDefaultInput) templateAdminDefaultInput.checked = false;
  if (templateAdminHideTitleInput) templateAdminHideTitleInput.checked = false;
  if (templateAdminOrderInput) templateAdminOrderInput.value = "0";
  syncTemplateAdminFormState();
  setTemplateAdminStatus("", "info");
}

function syncSecretariaAssetFormState() {
  const editing = Boolean(
    sanitizeText(secretariaAssetEditIdInput ? secretariaAssetEditIdInput.value : "")
  );
  if (secretariaAssetForm) {
    secretariaAssetForm.classList.toggle("is-editing", editing);
  }
  if (secretariaAssetSubmitBtn) {
    secretariaAssetSubmitBtn.textContent = editing ? "Atualizar Item" : "Salvar Item";
  }
  if (secretariaAssetSecretariaSelect) {
    secretariaAssetSecretariaSelect.disabled = editing;
  }
  if (secretariaAssetTypeSelect) {
    secretariaAssetTypeSelect.disabled = editing;
  }
  if (secretariaAssetFileInput) {
    secretariaAssetFileInput.required = !editing;
  }
  syncSecretariaAssetTypeUi();
}

function syncSecretariaAssetTypeUi() {
  const tipo = sanitizeText(
    secretariaAssetTypeSelect ? secretariaAssetTypeSelect.value : "logo"
  ).toLowerCase();
  let nameLabel = "Nome da logo";
  let placeholder = "Ex.: Logo institucional principal";
  if (tipo === "assinatura") {
    nameLabel = "Nome da assinatura";
    placeholder = "Ex.: Assinatura oficial da secretaria";
  } else if (tipo === "instituicao") {
    nameLabel = "Nome da instituição";
    placeholder = "Ex.: Instituição oficial ou marca institucional";
  } else if (tipo === "selo") {
    nameLabel = "Nome do selo";
    placeholder = "Ex.: Selo, icone ou marca parceira";
  }
  if (secretariaAssetNameLabel) {
    secretariaAssetNameLabel.textContent = nameLabel;
  }
  if (secretariaAssetNameInput) {
    secretariaAssetNameInput.placeholder = placeholder;
  }
}

function resetSecretariaAssetForm() {
  if (secretariaAssetForm) secretariaAssetForm.reset();
  if (secretariaAssetEditIdInput) secretariaAssetEditIdInput.value = "";
  if (secretariaAssetActiveInput) secretariaAssetActiveInput.checked = true;
  if (secretariaAssetDefaultInput) secretariaAssetDefaultInput.checked = false;
  if (secretariaAssetOrderInput) secretariaAssetOrderInput.value = "0";
  syncSecretariaAssetFormState();
  setSecretariaAssetAdminStatus("", "info");
}

function buildStatusPill(active, activeLabel = "Ativo", inactiveLabel = "Inativo") {
  const span = document.createElement("span");
  span.className = `status-pill ${active ? "ok" : "warn"}`;
  span.textContent = active ? activeLabel : inactiveLabel;
  return span;
}

function fillUserForm(usuario) {
  if (!usuario) return;
  if (userEditIdInput) userEditIdInput.value = String(usuario.id);
  if (userNameInput) userNameInput.value = usuario.nome || "";
  if (userUsernameInput) {
    userUsernameInput.value = usuario.username || "";
    userUsernameInput.disabled = true;
  }
  if (userPasswordInput) {
    userPasswordInput.value = "";
    userPasswordInput.placeholder = "Preencha somente para trocar a senha";
  }
  if (userRoleSelect) userRoleSelect.value = usuario.papel || "operador";
  if (userActiveInput) userActiveInput.checked = Boolean(usuario.ativo);
  setMultiSelectValues(
    userSecretariasSelect,
    (usuario.secretarias || []).map((secretaria) => secretaria.id)
  );
  syncUserFormState();
  setUserFormStatus(`Editando usuário ${usuario.username}.`, "info");
  scrollAdminFormIntoView(userForm);
}

function fillSecretariaForm(secretaria) {
  if (!secretaria) return;
  if (secretariaEditIdInput) secretariaEditIdInput.value = String(secretaria.id);
  if (secretariaSiglaInput) secretariaSiglaInput.value = secretaria.sigla || "";
  if (secretariaNameInput) secretariaNameInput.value = secretaria.nome || "";
  if (secretariaActiveInput) secretariaActiveInput.checked = Boolean(secretaria.ativa);
  syncSecretariaFormState();
  setSecretariaFormStatus(`Editando secretaria ${secretaria.sigla}.`, "info");
  scrollAdminFormIntoView(secretariaForm);
}

function fillTemplateAdminForm(template) {
  if (!template) return;
  if (templateAdminEditIdInput) templateAdminEditIdInput.value = String(template.id);
  if (templateAdminSecretariaSelect) {
    templateAdminSecretariaSelect.value = String(template.secretaria_id || "");
  }
  if (templateAdminNameInput) templateAdminNameInput.value = template.nome || "";
  if (templateAdminActiveInput) templateAdminActiveInput.checked = Boolean(template.ativo);
  if (templateAdminDefaultInput) templateAdminDefaultInput.checked = Boolean(template.padrao);
  if (templateAdminHideTitleInput) {
    templateAdminHideTitleInput.checked = Boolean(template.ocultar_titulo_certificado);
  }
  if (templateAdminOrderInput) templateAdminOrderInput.value = String(template.ordem || 0);
  if (templateAdminFileInput) templateAdminFileInput.value = "";
  syncTemplateAdminFormState();
  setTemplateAdminStatus(
    `Editando molde ${template.nome}. Envie um novo arquivo somente se quiser substituí-lo.`,
    "info"
  );
  scrollAdminFormIntoView(templateAdminForm);
}

function fillSecretariaAssetForm(asset) {
  if (!asset) return;
  if (secretariaAssetEditIdInput) secretariaAssetEditIdInput.value = String(asset.id);
  if (secretariaAssetSecretariaSelect) {
    secretariaAssetSecretariaSelect.value = String(asset.secretaria_id || "");
  }
  if (secretariaAssetTypeSelect) {
    secretariaAssetTypeSelect.value = asset.tipo || "logo";
  }
  if (secretariaAssetNameInput) secretariaAssetNameInput.value = asset.nome || "";
  if (secretariaAssetActiveInput) secretariaAssetActiveInput.checked = Boolean(asset.ativo);
  if (secretariaAssetDefaultInput) secretariaAssetDefaultInput.checked = Boolean(asset.padrao);
  if (secretariaAssetOrderInput) secretariaAssetOrderInput.value = String(asset.ordem || 0);
  if (secretariaAssetFileInput) secretariaAssetFileInput.value = "";
  syncSecretariaAssetFormState();
  setSecretariaAssetAdminStatus(
    `Editando ${getSecretariaAssetDisplayLabel(asset.tipo)} ${asset.nome}. Envie um novo arquivo somente se quiser substituí-lo.`,
    "info"
  );
  scrollAdminFormIntoView(secretariaAssetForm);
}
