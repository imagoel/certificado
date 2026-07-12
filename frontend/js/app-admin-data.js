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
    populateEmailSecretariaOptions();
    renderReplyEmailAdminPanel();
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
      } else {
        renderReplyEmailAdminPanel();
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

async function deleteUser(usuario) {
  if (!usuario || !isAdminSession()) return;

  const confirmed = await openConfirmActionDialog({
    title: "Excluir usuário?",
    message: `${usuario.nome || usuario.username} será removido do acesso ao sistema.`,
    summary: "Certificados já emitidos continuam no histórico, mas ficam sem vínculo com esse usuário.",
    confirmLabel: "Excluir usuário",
    danger: true,
  });
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

  const confirmed = await openConfirmActionDialog({
    title: "Excluir secretaria?",
    message: `${secretaria.sigla} - ${secretaria.nome} será removida do sistema.`,
    summary:
      "Isso remove moldes, itens visuais e vínculos de usuários. Se houver certificados emitidos, a exclusão será bloqueada.",
    confirmLabel: "Excluir secretaria",
    danger: true,
  });
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
