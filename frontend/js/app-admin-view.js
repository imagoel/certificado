
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

function setEmailSecretariaStatus(message, type = "info") {
  setStatusMessage(emailSecretariaStatus, message, type);
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

function setReplyEmailFormStatus(message, type = "info") {
  setStatusMessage(replyEmailFormStatus, message, type);
}

function getActiveSessionSecretaria() {
  if (!sessionState || !Array.isArray(sessionState.secretarias)) return null;
  return (
    sessionState.secretarias.find(
      (secretaria) => Number(secretaria.id) === Number(sessionState.secretaria_ativa_id)
    ) || null
  );
}

function getSecretariaReplyEmailOptions(secretaria, includeInactive = false) {
  if (!secretaria) return [];
  const items = Array.isArray(secretaria.reply_emails) ? [...secretaria.reply_emails] : [];
  if (!items.length && secretaria.email_resposta) {
    items.push({
      id: "",
      secretaria_id: secretaria.id,
      nome: "Email principal",
      email: secretaria.email_resposta,
      ativo: true,
      padrao: true,
      legado: true,
    });
  }
  return items
    .filter((item) => includeInactive || item.ativo)
    .sort((a, b) => {
      if (Boolean(a.padrao) !== Boolean(b.padrao)) return a.padrao ? -1 : 1;
      if (Boolean(a.ativo) !== Boolean(b.ativo)) return a.ativo ? -1 : 1;
      return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
    });
}

function isGenericReplyEmailName(name) {
  const normalized = sanitizeText(name).toLowerCase();
  return (
    !normalized ||
    ["email principal", "e-mail principal", "principal"].includes(normalized)
  );
}

function buildReplyEmailIssuerLabel(secretaria, replyEmail) {
  const sigla = sanitizeText(secretaria ? secretaria.sigla : "").toUpperCase();
  const secretariaNome = sanitizeText(secretaria ? secretaria.nome : "");
  const setorNome =
    replyEmail && !isGenericReplyEmailName(replyEmail.nome) ? sanitizeText(replyEmail.nome) : "";

  if (setorNome && secretariaNome) return `${setorNome} - ${secretariaNome}`;
  if (setorNome && sigla) return `${setorNome} - ${sigla}`;
  if (setorNome) return setorNome;
  if (sigla && secretariaNome) return `${sigla} - ${secretariaNome}`;
  return sigla || secretariaNome;
}

function populateCertificateReplyEmailOptions(selectedValue = "") {
  if (!replyEmailSelect) return;

  const secretaria = getActiveSessionSecretaria();
  const options = getSecretariaReplyEmailOptions(secretaria, false);
  const selectedText =
    selectedValue === null || selectedValue === undefined ? "" : String(selectedValue);
  replyEmailSelect.innerHTML = "";

  if (!options.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nenhum email de resposta cadastrado";
    replyEmailSelect.appendChild(option);
    replyEmailSelect.disabled = true;
    if (replyEmailStatus) {
      replyEmailStatus.textContent = secretaria
        ? "Cadastre um email de resposta para esta secretaria."
        : "Selecione uma secretaria para escolher o email de resposta.";
      replyEmailStatus.className = "status error";
    }
    return;
  }

  replyEmailSelect.disabled = false;
  const defaultOption = options.find((item) => item.padrao) || options[0];
  const selectedExists = options.some((item) => String(item.id || "") === selectedText);
  const valueToSelect = selectedExists ? selectedText : String(defaultOption.id || "");

  options.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id || "");
    option.textContent = item.email || "Email de resposta";
    option.selected = String(item.id || "") === valueToSelect;
    replyEmailSelect.appendChild(option);
  });

  const selected = options.find((item) => String(item.id || "") === valueToSelect);
  if (replyEmailStatus) {
    const issuerLabel = buildReplyEmailIssuerLabel(secretaria, selected);
    const defaultHint = selected && selected.padrao ? ", e-mail padrão da secretaria" : "";
    replyEmailStatus.textContent = selected
      ? `As respostas irão para ${selected.email}${defaultHint}. No e-mail aparecerá: ${issuerLabel}.`
      : "";
    replyEmailStatus.className = "status info";
  }
}

function getSelectedReplyEmailId() {
  const rawValue = sanitizeText(replyEmailSelect ? replyEmailSelect.value : "");
  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function getSelectedEmailSecretariaId() {
  const selected = sanitizeText(emailSecretariaSelect ? emailSecretariaSelect.value : "");
  if (selected) return selected;
  if (adminState.selectedEmailSecretariaId) return String(adminState.selectedEmailSecretariaId);
  const active = getActiveSessionSecretaria();
  return active ? String(active.id) : "";
}

function getEditingSecretaria() {
  const secretariaId = getSelectedEmailSecretariaId();
  if (!secretariaId) return null;
  return (
    adminState.secretarias.find((secretaria) => String(secretaria.id) === secretariaId) || null
  );
}

function populateEmailSecretariaOptions() {
  if (!emailSecretariaSelect) return;

  const secretarias = Array.isArray(adminState.secretarias) ? adminState.secretarias : [];
  const activeSecretariaId =
    sessionState && sessionState.secretaria_ativa_id
      ? String(sessionState.secretaria_ativa_id)
      : "";
  const selectedId = getSelectedEmailSecretariaId() || activeSecretariaId;
  const selectedExists = secretarias.some((secretaria) => String(secretaria.id) === selectedId);
  const valueToSelect = selectedExists
    ? selectedId
    : secretarias.length
      ? String(secretarias[0].id)
      : "";

  emailSecretariaSelect.innerHTML = "";
  secretarias.forEach((secretaria) => {
    const option = document.createElement("option");
    option.value = String(secretaria.id);
    option.textContent = `${secretaria.sigla} - ${secretaria.nome}`;
    option.selected = String(secretaria.id) === valueToSelect;
    emailSecretariaSelect.appendChild(option);
  });

  adminState.selectedEmailSecretariaId = valueToSelect;
  emailSecretariaSelect.disabled = secretarias.length <= 1;
  if (!secretarias.length) {
    setEmailSecretariaStatus("Nenhuma secretaria disponivel para configurar e-mails.", "error");
  }
}

function syncReplyEmailFormState() {
  const editing = Boolean(sanitizeText(replyEmailEditIdInput ? replyEmailEditIdInput.value : ""));
  if (replyEmailSubmitBtn) {
    replyEmailSubmitBtn.textContent = editing ? "Atualizar Email" : "Salvar Email";
  }
}

function resetReplyEmailForm() {
  if (replyEmailForm) replyEmailForm.reset();
  if (replyEmailEditIdInput) replyEmailEditIdInput.value = "";
  if (replyEmailActiveInput) replyEmailActiveInput.checked = true;
  if (replyEmailDefaultInput) replyEmailDefaultInput.checked = false;
  if (replyEmailAddressInput && typeof replyEmailAddressInput.setCustomValidity === "function") {
    replyEmailAddressInput.setCustomValidity("");
  }
  syncReplyEmailFormState();
  setReplyEmailFormStatus("", "info");
}

function fillReplyEmailForm(replyEmail) {
  if (!replyEmail) return;
  if (replyEmailEditIdInput) replyEmailEditIdInput.value = String(replyEmail.id || "");
  if (replyEmailNameInput) replyEmailNameInput.value = replyEmail.nome || "";
  if (replyEmailAddressInput) replyEmailAddressInput.value = replyEmail.email || "";
  if (replyEmailActiveInput) replyEmailActiveInput.checked = Boolean(replyEmail.ativo);
  if (replyEmailDefaultInput) replyEmailDefaultInput.checked = Boolean(replyEmail.padrao);
  syncReplyEmailFormState();
  setReplyEmailFormStatus(`Editando email ${replyEmail.nome}.`, "info");
}

function renderReplyEmailAdminPanel() {
  if (!replyEmailAdminPanel || !replyEmailListBody) return;

  const secretaria = getEditingSecretaria();
  replyEmailAdminPanel.hidden = !secretaria;
  if (!secretaria) {
    if (replyEmailAdminSummary) {
      replyEmailAdminSummary.textContent =
        "Escolha uma secretaria para gerenciar os e-mails de resposta.";
    }
    replyEmailListBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Selecione uma secretaria.</td>
      </tr>
    `;
    setEmailSecretariaStatus("Nenhuma secretaria disponivel para configurar e-mails.", "error");
    return;
  }

  if (replyEmailAdminSummary) {
    replyEmailAdminSummary.textContent =
      `${secretaria.sigla}: cadastre os enderecos que recebem respostas e o texto exibido no rodape do e-mail.`;
  }
  setEmailSecretariaStatus(
    `O participante vera "Emitido por" conforme o nome exibido cadastrado nesta tela.`,
    "info"
  );

  const items = getSecretariaReplyEmailOptions(secretaria, true).filter((item) => !item.legado);
  if (!items.length) {
    replyEmailListBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Nenhum email de resposta cadastrado.</td>
      </tr>
    `;
    return;
  }

  replyEmailListBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const issuerLabel = buildReplyEmailIssuerLabel(secretaria, item);
    const title = document.createElement("strong");
    title.className = "admin-primary-title";
    title.textContent = issuerLabel || item.nome || "-";
    const meta = document.createElement("span");
    meta.className = "admin-muted-meta";
    meta.textContent = 'Texto exibido no campo "Emitido por"';
    nameCell.append(title, meta);

    const emailCell = document.createElement("td");
    const emailText = document.createElement("span");
    emailText.className = "admin-muted-meta reply-email-address";
    emailText.textContent = item.email || "-";
    emailCell.appendChild(emailText);

    const statusCell = document.createElement("td");
    const statusWrap = document.createElement("div");
    statusWrap.className = "reply-email-status-stack";
    statusWrap.appendChild(buildStatusPill(Boolean(item.ativo)));
    if (item.padrao) {
      statusWrap.appendChild(buildStatusPill(true, "Padrao", "Opcional"));
    }
    statusCell.appendChild(statusWrap);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(createInlineButton("Editar", () => fillReplyEmailForm(item)));
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          void deleteReplyEmail(item);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(nameCell, emailCell, statusCell, actionsCell);
    replyEmailListBody.appendChild(row);
  });
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
  if (secretariaAssetTypeSelect) {
    secretariaAssetTypeSelect.value = adminUiState.assetTypeFilter || "logo";
  }
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
  switchAdminModule("users");
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
  switchAdminModule("secretarias");
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
  switchAdminModule("templates");
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
  switchAdminModule("assets");
  setSecretariaAssetTypeFilter(asset.tipo || "logo");
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
