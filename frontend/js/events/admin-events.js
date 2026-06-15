function registerAdminEvents() {
  if (userRoleSelect) {
    userRoleSelect.addEventListener("change", () => {
      syncUserRoleUi();
    });
  }

  if (userFormResetBtn) {
    userFormResetBtn.addEventListener("click", () => {
      resetUserForm();
    });
  }

  if (userForm) {
    userForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isAdminSession()) return;

      const editingId = sanitizeText(userEditIdInput ? userEditIdInput.value : "");
      const payload = {
        nome: userNameInput ? userNameInput.value.trim() : "",
        username: userUsernameInput ? userUsernameInput.value.trim() : "",
        password: userPasswordInput ? userPasswordInput.value : "",
        papel: userRoleSelect ? userRoleSelect.value : "operador",
        ativo: userActiveInput ? userActiveInput.checked : true,
        secretaria_ids: getMultiSelectValues(userSecretariasSelect),
      };

      if (!payload.nome || !payload.username) {
        setUserFormStatus("Preencha nome e usuário.", "error");
        return;
      }
      if (!editingId && !payload.password) {
        setUserFormStatus("Informe uma senha para o novo usuário.", "error");
        return;
      }
      if (payload.papel !== "admin_global" && payload.secretaria_ids.length === 0) {
        setUserFormStatus("Selecione pelo menos uma secretaria para o operador.", "error");
        return;
      }

      try {
        setUserFormStatus("Salvando usuário...", "info");
        if (editingId) {
          const updatePayload = {
            nome: payload.nome,
            papel: payload.papel,
            ativo: payload.ativo,
            secretaria_ids: payload.secretaria_ids,
          };
          if (payload.password) {
            updatePayload.password = payload.password;
          }
          await apiJsonRequest(`/api/admin/usuarios/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify(updatePayload),
          });
        } else {
          await apiJsonRequest("/api/admin/usuarios", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        resetUserForm();
        setUserFormStatus("Usuário salvo com sucesso.", "success");
        await loadAdminData();
      } catch (error) {
        console.error(error);
        if (error && error.status === 401) {
          await handleUnauthorized();
          return;
        }
        setUserFormStatus(
          (error && error.message) || "Nao foi possivel salvar o usuario.",
          "error"
        );
      }
    });
  }

  if (secretariaFormResetBtn) {
    secretariaFormResetBtn.addEventListener("click", () => {
      resetSecretariaForm();
    });
  }

  if (secretariaReplyEmailInput) {
    secretariaReplyEmailInput.addEventListener("input", () => {
      if (typeof secretariaReplyEmailInput.setCustomValidity === "function") {
        secretariaReplyEmailInput.setCustomValidity("");
      }
    });
  }

  if (secretariaForm) {
    secretariaForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isAdminSession()) return;

      const editingId = sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "");
      const replyEmailResult = normalizeOptionalEmailResult(
        secretariaReplyEmailInput ? secretariaReplyEmailInput.value : ""
      );
      if (secretariaReplyEmailInput && typeof secretariaReplyEmailInput.setCustomValidity === "function") {
        secretariaReplyEmailInput.setCustomValidity("");
      }
      if (replyEmailResult.invalid) {
        const message = "Email de resposta invalido.";
        if (secretariaReplyEmailInput && typeof secretariaReplyEmailInput.setCustomValidity === "function") {
          secretariaReplyEmailInput.setCustomValidity(message);
          secretariaReplyEmailInput.reportValidity();
        }
        setSecretariaFormStatus(message, "error");
        return;
      }

      const payload = {
        sigla: secretariaSiglaInput ? secretariaSiglaInput.value.trim() : "",
        nome: secretariaNameInput ? secretariaNameInput.value.trim() : "",
        email_resposta: replyEmailResult.value,
        ativa: secretariaActiveInput ? secretariaActiveInput.checked : true,
      };

      if (!payload.sigla || !payload.nome) {
        setSecretariaFormStatus("Preencha sigla e nome da secretaria.", "error");
        return;
      }
      if (payload.ativa && !payload.email_resposta) {
        setSecretariaFormStatus("Preencha o email de resposta da secretaria.", "error");
        if (secretariaReplyEmailInput && typeof secretariaReplyEmailInput.reportValidity === "function") {
          secretariaReplyEmailInput.reportValidity();
        }
        return;
      }

      try {
        setSecretariaFormStatus("Salvando secretaria...", "info");
        if (editingId) {
          await apiJsonRequest(`/api/admin/secretarias/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        } else {
          await apiJsonRequest("/api/admin/secretarias", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        resetSecretariaForm();
        setSecretariaFormStatus("Secretaria salva com sucesso.", "success");
        await refreshSession();
        await loadAdminData();
      } catch (error) {
        console.error(error);
        if (error && error.status === 401) {
          await handleUnauthorized();
          return;
        }
        setSecretariaFormStatus(
          (error && error.message) || "Nao foi possivel salvar a secretaria.",
          "error"
        );
      }
    });
  }

  if (replyEmailFormResetBtn) {
    replyEmailFormResetBtn.addEventListener("click", () => {
      resetReplyEmailForm();
    });
  }

  if (replyEmailAddressInput) {
    replyEmailAddressInput.addEventListener("input", () => {
      if (typeof replyEmailAddressInput.setCustomValidity === "function") {
        replyEmailAddressInput.setCustomValidity("");
      }
    });
  }

  if (replyEmailForm) {
    replyEmailForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!isAdminSession()) return;

      const secretaria = getEditingSecretaria();
      if (!secretaria) {
        setReplyEmailFormStatus("Edite uma secretaria antes de cadastrar emails.", "error");
        return;
      }

      const editingId = sanitizeText(replyEmailEditIdInput ? replyEmailEditIdInput.value : "");
      const emailResult = normalizeOptionalEmailResult(
        replyEmailAddressInput ? replyEmailAddressInput.value : ""
      );
      if (replyEmailAddressInput && typeof replyEmailAddressInput.setCustomValidity === "function") {
        replyEmailAddressInput.setCustomValidity("");
      }
      if (emailResult.invalid || !emailResult.value) {
        const message = "Email de resposta invalido.";
        if (replyEmailAddressInput && typeof replyEmailAddressInput.setCustomValidity === "function") {
          replyEmailAddressInput.setCustomValidity(message);
          replyEmailAddressInput.reportValidity();
        }
        setReplyEmailFormStatus(message, "error");
        return;
      }

      const payload = {
        nome: replyEmailNameInput ? replyEmailNameInput.value.trim() : "",
        email: emailResult.value,
        ativo: replyEmailActiveInput ? replyEmailActiveInput.checked : true,
        padrao: replyEmailDefaultInput ? replyEmailDefaultInput.checked : false,
      };

      if (!payload.nome) {
        setReplyEmailFormStatus("Informe o nome do setor.", "error");
        return;
      }
      if (payload.padrao && !payload.ativo) {
        setReplyEmailFormStatus("Somente emails ativos podem ser padrao.", "error");
        return;
      }

      try {
        setReplyEmailFormStatus("Salvando email de resposta...", "info");
        if (editingId) {
          await apiJsonRequest(`/api/admin/secretaria-reply-emails/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        } else {
          await apiJsonRequest(`/api/admin/secretarias/${secretaria.id}/reply-emails`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        resetReplyEmailForm();
        setReplyEmailFormStatus("Email de resposta salvo com sucesso.", "success");
        await refreshSession();
        await loadAdminData();
      } catch (error) {
        console.error(error);
        if (error && error.status === 401) {
          await handleUnauthorized();
          return;
        }
        setReplyEmailFormStatus(
          (error && error.message) || "Nao foi possivel salvar o email de resposta.",
          "error"
        );
      }
    });
  }

  if (templateAdminResetBtn) {
    templateAdminResetBtn.addEventListener("click", () => {
      resetTemplateAdminForm();
    });
  }

  if (templateAdminForm) {
    templateAdminForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!canManageVisualAssets()) return;

      const editingId = sanitizeText(templateAdminEditIdInput ? templateAdminEditIdInput.value : "");
      const file = templateAdminFileInput && templateAdminFileInput.files
        ? templateAdminFileInput.files[0]
        : null;
      const payload = {
        secretariaId: templateAdminSecretariaSelect ? templateAdminSecretariaSelect.value : "",
        nome: templateAdminNameInput ? templateAdminNameInput.value.trim() : "",
        ativo: templateAdminActiveInput ? templateAdminActiveInput.checked : true,
        padrao: templateAdminDefaultInput ? templateAdminDefaultInput.checked : false,
        ocultarTituloCertificado: templateAdminHideTitleInput
          ? templateAdminHideTitleInput.checked
          : false,
        ordem: templateAdminOrderInput ? templateAdminOrderInput.value : "0",
      };

      if (!payload.secretariaId || !payload.nome) {
        setTemplateAdminStatus("Selecione a secretaria e informe o nome do molde.", "error");
        return;
      }
      if (!editingId && !file) {
        setTemplateAdminStatus("Envie o arquivo do molde para o cadastro inicial.", "error");
        return;
      }

      const formData = new FormData();
      formData.set("nome", payload.nome);
      formData.set("ativo", String(payload.ativo));
      formData.set("padrao", String(payload.padrao));
      formData.set(
        "ocultar_titulo_certificado",
        String(payload.ocultarTituloCertificado)
      );
      formData.set("ordem", String(payload.ordem || 0));
      if (file) {
        formData.set("arquivo", file, file.name);
      }

      try {
        setTemplateAdminStatus("Salvando molde...", "info");
        if (editingId) {
          await apiFormRequest(`/api/admin/templates/${editingId}`, formData, {
            method: "PATCH",
          });
        } else {
          formData.set("secretaria_id", payload.secretariaId);
          await apiFormRequest("/api/admin/templates", formData, {
            method: "POST",
          });
        }

        resetTemplateAdminForm();
        setTemplateAdminStatus("Molde salvo com sucesso.", "success");
        await loadAdminData();
        await loadAvailableTemplates();
      } catch (error) {
        console.error(error);
        if (error && error.status === 401) {
          await handleUnauthorized();
          return;
        }
        setTemplateAdminStatus(
          (error && error.message) || "Nao foi possivel salvar o molde.",
          "error"
        );
      }
    });
  }

  if (secretariaAssetResetBtn) {
    secretariaAssetResetBtn.addEventListener("click", () => {
      resetSecretariaAssetForm();
    });
  }

  if (secretariaAssetTypeSelect) {
    secretariaAssetTypeSelect.addEventListener("change", () => {
      syncSecretariaAssetTypeUi();
      setSecretariaAssetTypeFilter(secretariaAssetTypeSelect.value || "logo");
      renderSecretariaAssetsTable();
    });
  }

  if (secretariaAssetForm) {
    secretariaAssetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!canManageVisualAssets()) return;

      const editingId = sanitizeText(
        secretariaAssetEditIdInput ? secretariaAssetEditIdInput.value : ""
      );
      const file = secretariaAssetFileInput && secretariaAssetFileInput.files
        ? secretariaAssetFileInput.files[0]
        : null;
      const payload = {
        secretariaId: secretariaAssetSecretariaSelect ? secretariaAssetSecretariaSelect.value : "",
        tipo: secretariaAssetTypeSelect ? secretariaAssetTypeSelect.value : "logo",
        nome: secretariaAssetNameInput ? secretariaAssetNameInput.value.trim() : "",
        ativo: secretariaAssetActiveInput ? secretariaAssetActiveInput.checked : true,
        padrao: secretariaAssetDefaultInput ? secretariaAssetDefaultInput.checked : false,
        ordem: secretariaAssetOrderInput ? secretariaAssetOrderInput.value : "0",
      };

      if (!payload.secretariaId || !payload.nome || !payload.tipo) {
        setSecretariaAssetAdminStatus(
          "Selecione a secretaria, o tipo e informe o nome do item.",
          "error"
        );
        return;
      }
      if (!editingId && !file) {
        setSecretariaAssetAdminStatus(
          "Envie o arquivo da logo, assinatura ou instituição para o cadastro inicial.",
          "error"
        );
        return;
      }

      const formData = new FormData();
      formData.set("nome", payload.nome);
      formData.set("ativo", String(payload.ativo));
      formData.set("padrao", String(payload.padrao));
      formData.set("ordem", String(payload.ordem || 0));
      if (file) {
        formData.set("arquivo", file, file.name);
      }

      try {
        setSecretariaAssetAdminStatus(
          `Salvando ${getSecretariaAssetDisplayLabel(payload.tipo)}...`,
          "info"
        );
        if (editingId) {
          await apiFormRequest(`/api/admin/secretaria-assets/${editingId}`, formData, {
            method: "PATCH",
          });
        } else {
          formData.set("secretaria_id", payload.secretariaId);
          formData.set("tipo", payload.tipo);
          await apiFormRequest("/api/admin/secretaria-assets", formData, {
            method: "POST",
          });
        }

        resetSecretariaAssetForm();
        setSecretariaAssetAdminStatus("Item salvo com sucesso.", "success");
        await loadAdminData();
        await loadAvailableSecretariaAssets();
      } catch (error) {
        console.error(error);
        if (error && error.status === 401) {
          await handleUnauthorized();
          return;
        }
        setSecretariaAssetAdminStatus(
          (error && error.message) || "Nao foi possivel salvar o item.",
          "error"
        );
      }
    });
  }
}

async function deleteReplyEmail(replyEmail) {
  if (!replyEmail || !isAdminSession()) return;
  const label = `${replyEmail.nome || "Email"} <${replyEmail.email || "-"}>`;
  if (!window.confirm(`Excluir ${label}?`)) return;

  try {
    setReplyEmailFormStatus("Excluindo email de resposta...", "info");
    await apiJsonRequest(`/api/admin/secretaria-reply-emails/${replyEmail.id}`, {
      method: "DELETE",
    });
    resetReplyEmailForm();
    setReplyEmailFormStatus("Email de resposta excluido com sucesso.", "success");
    await refreshSession();
    await loadAdminData();
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setReplyEmailFormStatus(
      (error && error.message) || "Nao foi possivel excluir o email de resposta.",
      "error"
    );
  }
}
