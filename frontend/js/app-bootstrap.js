if (!form || !downloadBtn || !canvas || !ctx) {
  alert("Erro de inicialização. Recarregue com Ctrl+F5.");
} else {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isBatchRunning || isSingleGenerationRunning) return;
    if (!sessionState) {
      await handleUnauthorized();
      return;
    }

    const nomeInput = document.getElementById("nome");
    const cursoInput = document.getElementById("curso");
    const dataInput = document.getElementById("data");

    const nome = nomeInput ? nomeInput.value.trim() : "";
    const curso = cursoInput ? cursoInput.value.trim() : "";
    const data = dataInput ? dataInput.value : "";
    const cargaResult = getFormCargaHorariaResult();
    if (cargaResult.invalid) {
      setBatchStatus(
        `A carga horária deve estar entre 0 e ${MAX_CARGA_HORARIA} horas.`,
        "error"
      );
      return;
    }
    const cargaH = cargaResult.value ?? 0;

    if (!nome || !curso || !data) return;

    try {
      const textoLinha1 = textoLinha1Input ? textoLinha1Input.value.trim() : "";
      const textoLinha2 = textoLinha2Input ? textoLinha2Input.value.trim() : "";
      const prepared = {
        nome,
        curso,
        data,
        cargaH,
        linha1: textoLinha1 || defaultTextoLinha1,
        linha2: textoLinha2 || defaultTextoLinha2,
      };

      setBatchStatus("Verificando possíveis certificados já emitidos...", "info");
      const duplicates = await findPossibleDuplicateCertificates(prepared);
      if (duplicates.length) {
        setBatchStatus(
          `Encontramos ${duplicates.length} certificado(s) semelhante(s) já emitido(s).`,
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
      setBatchStatus(
        (error && error.message) || "Nao foi possivel verificar certificados semelhantes.",
        "error"
      );
    }
  });

  if (previewShowHotspotsInput) {
    previewShowHotspotsInput.addEventListener("change", syncPreviewHotspotToggle);
  }

  if (previewAdjustCloseBtn) {
    previewAdjustCloseBtn.addEventListener("click", clearPreviewAdjustTarget);
  }

  [
    previewAdjustLabelInput,
    previewAdjustXInput,
    previewAdjustYInput,
    previewAdjustSizeInput,
  ].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", applyPreviewAdjustPanelControls);
    input.addEventListener("change", commitPreviewAdjustPanelControls);
  });

  window.addEventListener("resize", () => {
    positionPreviewAdjustPanel();
  });

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

  if (logoXInput) logoXInput.addEventListener("input", applyLayoutFromControls);
  if (logoYInput) logoYInput.addEventListener("input", applyLayoutFromControls);
  if (logoSizeInput) logoSizeInput.addEventListener("input", applyLayoutFromControls);
  if (qrXInput) qrXInput.addEventListener("input", applyLayoutFromControls);
  if (qrYInput) qrYInput.addEventListener("input", applyLayoutFromControls);
  if (qrSizeInput) qrSizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaXInput) assinaturaXInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaYInput) assinaturaYInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaSizeInput) assinaturaSizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura2XInput) assinatura2XInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura2YInput) assinatura2YInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura2SizeInput) assinatura2SizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura3XInput) assinatura3XInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura3YInput) assinatura3YInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura3SizeInput) assinatura3SizeInput.addEventListener("input", applyLayoutFromControls);
  if (selo1XInput) selo1XInput.addEventListener("input", applyLayoutFromControls);
  if (selo1YInput) selo1YInput.addEventListener("input", applyLayoutFromControls);
  if (selo1SizeInput) selo1SizeInput.addEventListener("input", applyLayoutFromControls);
  if (selo2XInput) selo2XInput.addEventListener("input", applyLayoutFromControls);
  if (selo2YInput) selo2YInput.addEventListener("input", applyLayoutFromControls);
  if (selo2SizeInput) selo2SizeInput.addEventListener("input", applyLayoutFromControls);
  if (selo3XInput) selo3XInput.addEventListener("input", applyLayoutFromControls);
  if (selo3YInput) selo3YInput.addEventListener("input", applyLayoutFromControls);
  if (selo3SizeInput) selo3SizeInput.addEventListener("input", applyLayoutFromControls);
  if (selo4XInput) selo4XInput.addEventListener("input", applyLayoutFromControls);
  if (selo4YInput) selo4YInput.addEventListener("input", applyLayoutFromControls);
  if (selo4SizeInput) selo4SizeInput.addEventListener("input", applyLayoutFromControls);
  if (instituicaoXInput) instituicaoXInput.addEventListener("input", applyLayoutFromControls);
  if (instituicaoYInput) instituicaoYInput.addEventListener("input", applyLayoutFromControls);
  if (instituicaoSizeInput) instituicaoSizeInput.addEventListener("input", applyLayoutFromControls);

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
        lastData.linha1 = textoLinha1Input.value.trim() || defaultTextoLinha1;
      }
      void renderLastCertificate();
    });
  }

  if (textoLinha2Input) {
    textoLinha2Input.addEventListener("input", () => {
      if (isBatchRunning) return;
      if (lastData) {
        lastData.linha2 = textoLinha2Input.value.trim() || defaultTextoLinha2;
      }
      void renderLastCertificate();
    });
  }

  [nomeInput, cursoInput, dataInput, cargaHInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      if (isBatchRunning || lastData) return;
      void renderLastCertificate();
    });
  });

  if (planilhaInput) {
    planilhaInput.addEventListener("change", () => {
      closeBatchConfirmDialog();
      const file = planilhaInput.files && planilhaInput.files[0];
      if (!file) {
        setBatchStatus("", "info");
        resetBatchPreview();
        return;
      }
      resetBatchPreview();
      setBatchStatus(`Planilha selecionada: ${file.name}. Use Pré-visualizar antes de gerar.`, "info");
    });
  }



  if (batchPreviewBtn) {
    batchPreviewBtn.addEventListener("click", () => {
      void handleBatchPreview();
    });
  }

  if (batchGenerateBtn) {
    batchGenerateBtn.addEventListener("click", () => {
      void handleBatchGenerate();
    });
  }

  if (batchConfirmCancelBtn) {
    batchConfirmCancelBtn.addEventListener("click", () => {
      closeBatchConfirmDialog();
    });
  }

  if (batchConfirmDialog) {
    batchConfirmDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeBatchConfirmDialog();
    });
  }

  if (batchConfirmForm) {
    batchConfirmForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!pendingBatchGeneration) {
        setBatchConfirmStatus("Nenhum lote preparado para confirmação.", "error");
        return;
      }

      const prepared = pendingBatchGeneration;
      closeBatchConfirmDialog();
      void executeBatchGeneration(prepared);
    });
  }

  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${(lastData && lastData.codigo) || "certificado"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

sectionTabs.forEach((button) => {
  button.addEventListener("click", () => {
    const { section } = button.dataset;
    if (isAdminOnlySection(section) && !isAdminSession()) return;
    if (section === "admin" && !canManageVisualAssets()) return;
    switchSection(section || "generator");
    if (section === "certificates" && sessionState) {
      void loadCertificates(certListState.page || 1);
    }
    if (section === "audit" && sessionState && isAdminSession()) {
      void loadAuditEvents(auditState.page || 1);
    }
    if (section === "admin" && sessionState && canManageVisualAssets()) {
      void loadAdminData();
    }
  });
});

if (certListForm) {
  certListForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    readCertificateFiltersFromInputs();
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certFilterResetBtn) {
  certFilterResetBtn.addEventListener("click", async () => {
    resetCertificateFiltersState();
    certListState.page = 1;
    syncCertificateFilterInputsFromState();
    await loadCertificates(1);
  });
}

if (certQuickTodayBtn) {
  certQuickTodayBtn.addEventListener("click", async () => {
    const todayRange = getLastDaysRange(1);
    certListState.filters.emitidoDe = todayRange.start;
    certListState.filters.emitidoAte = todayRange.end;
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certQuickLast7Btn) {
  certQuickLast7Btn.addEventListener("click", async () => {
    const range = getLastDaysRange(7);
    certListState.filters.emitidoDe = range.start;
    certListState.filters.emitidoAte = range.end;
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certQuickActiveSecretariaBtn) {
  certQuickActiveSecretariaBtn.addEventListener("click", async () => {
    certListState.filters.secretariaId = sessionState && sessionState.secretaria_ativa_id
      ? String(sessionState.secretaria_ativa_id)
      : "";
    certListState.page = 1;
    await loadCertificates(1);
  });
}

if (certExportCsvBtn) {
  certExportCsvBtn.addEventListener("click", () => {
    void exportCertificateCsvReport();
  });
}

if (certPrevPageBtn) {
  certPrevPageBtn.addEventListener("click", () => {
    if (certListState.page > 1) {
      void loadCertificates(certListState.page - 1);
    }
  });
}

if (certNextPageBtn) {
  certNextPageBtn.addEventListener("click", () => {
    if (certListState.page < certListState.totalPages) {
      void loadCertificates(certListState.page + 1);
    }
  });
}

if (auditForm) {
  auditForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    readAuditFiltersFromInputs();
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditResetBtn) {
  auditResetBtn.addEventListener("click", async () => {
    resetAuditFiltersState();
    auditState.page = 1;
    syncAuditFilterInputsFromState();
    await loadAuditEvents(1);
  });
}

if (auditQuickTodayBtn) {
  auditQuickTodayBtn.addEventListener("click", async () => {
    const todayRange = getLastDaysRange(1);
    auditState.filters.criadoDe = todayRange.start;
    auditState.filters.criadoAte = todayRange.end;
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditQuickLast7Btn) {
  auditQuickLast7Btn.addEventListener("click", async () => {
    const range = getLastDaysRange(7);
    auditState.filters.criadoDe = range.start;
    auditState.filters.criadoAte = range.end;
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditQuickActiveSecretariaBtn) {
  auditQuickActiveSecretariaBtn.addEventListener("click", async () => {
    auditState.filters.secretariaId = sessionState && sessionState.secretaria_ativa_id
      ? String(sessionState.secretaria_ativa_id)
      : "";
    auditState.page = 1;
    await loadAuditEvents(1);
  });
}

if (auditExportCsvBtn) {
  auditExportCsvBtn.addEventListener("click", () => {
    void exportAuditCsvReport();
  });
}

if (auditPrintReportBtn) {
  auditPrintReportBtn.addEventListener("click", () => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      setAuditStatus("Permita pop-ups para abrir o relatório de impressão.", "error");
      return;
    }
    writeAuditReportLoading(reportWindow);
    void printAuditReport(reportWindow);
  });
}

if (auditPrevPageBtn) {
  auditPrevPageBtn.addEventListener("click", () => {
    if (auditState.page > 1) {
      void loadAuditEvents(auditState.page - 1);
    }
  });
}

if (auditNextPageBtn) {
  auditNextPageBtn.addEventListener("click", () => {
    if (auditState.page < auditState.totalPages) {
      void loadAuditEvents(auditState.page + 1);
    }
  });
}

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

if (secretariaForm) {
  secretariaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isAdminSession()) return;

    const editingId = sanitizeText(secretariaEditIdInput ? secretariaEditIdInput.value : "");
    const payload = {
      sigla: secretariaSiglaInput ? secretariaSiglaInput.value.trim() : "",
      nome: secretariaNameInput ? secretariaNameInput.value.trim() : "",
      ativa: secretariaActiveInput ? secretariaActiveInput.checked : true,
    };

    if (!payload.sigla || !payload.nome) {
      setSecretariaFormStatus("Preencha sigla e nome da secretaria.", "error");
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

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usernameInput = document.getElementById("login-username");
    const passwordInput = document.getElementById("login-password");
    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!username || !password) {
      setLoginStatus("Informe usuário e senha.", "error");
      return;
    }

    try {
      setLoginStatus("Entrando...", "info");
      const session = await apiJsonRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      renderSession(session);
      await refreshProtectedData({ page: 1 });
      switchSection("generator");
      if (passwordInput) passwordInput.value = "";
    } catch (error) {
      console.error(error);
      setLoginStatus(
        (error && error.message) || "Nao foi possivel fazer login.",
        "error"
      );
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await apiJsonRequest("/api/auth/logout", { method: "POST", body: "{}" });
    } catch (error) {
      console.error(error);
    } finally {
      clearSessionUi();
      setLoginStatus("Sessao encerrada.", "info");
    }
  });
}

if (secretariaSelect) {
  secretariaSelect.addEventListener("change", async () => {
    const secretariaId = Number(secretariaSelect.value);
    if (!secretariaId) return;

    try {
      const session = await apiJsonRequest("/api/auth/select-secretaria", {
        method: "POST",
        body: JSON.stringify({ secretaria_id: secretariaId }),
      });
      renderSession(session);
      certListState.page = 1;
      await refreshProtectedData({ page: 1 });
      await renderLastCertificate();
      setBatchStatus("Secretaria ativa atualizada.", "success");
      setCertListStatus("Lista atualizada para a nova secretaria ativa.", "success");
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      setBatchStatus(
        (error && error.message) || "Nao foi possivel trocar a secretaria.",
        "error"
      );
    }
  });
}

if (deleteCertCancelBtn) {
  deleteCertCancelBtn.addEventListener("click", () => {
    closeDeleteCertificateDialog();
  });
}

if (duplicateCertCancelBtn) {
  duplicateCertCancelBtn.addEventListener("click", () => {
    closeDuplicateCertificateDialog();
    setBatchStatus("Geração cancelada. Use um certificado existente ou ajuste os dados.", "info");
  });
}

if (duplicateCertViewExistingBtn) {
  duplicateCertViewExistingBtn.addEventListener("click", () => {
    if (!pendingDuplicateCertificate || !pendingDuplicateCertificate.duplicates.length) {
      setDuplicateCertStatus("Nenhum certificado existente disponível para abrir.", "error");
      return;
    }

    const [firstMatch] = pendingDuplicateCertificate.duplicates;
    const openTarget =
      firstMatch.arquivo_admin_url || firstMatch.arquivo_url || firstMatch.url_validacao || "";
    if (!openTarget) {
      setDuplicateCertStatus("O certificado existente não possui um arquivo para abrir.", "error");
      return;
    }

    window.open(openTarget, "_blank", "noopener,noreferrer");
    closeDuplicateCertificateDialog();
    setBatchStatus(
      `Abrindo o certificado existente ${firstMatch.codigo}. Gere um novo apenas se realmente precisar duplicar.`,
      "info"
    );
  });
}

if (duplicateCertDialog) {
  duplicateCertDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDuplicateCertificateDialog();
  });
}

if (duplicateCertForm) {
  duplicateCertForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!pendingDuplicateCertificate || isSingleGenerationRunning || isBatchRunning) {
      setDuplicateCertStatus("Nenhuma geração pendente para confirmar.", "error");
      return;
    }

    const prepared = pendingDuplicateCertificate.prepared;
    closeDuplicateCertificateDialog();
    await executeSingleCertificateGeneration(prepared);
  });
}

if (deleteCertDialog) {
  deleteCertDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDeleteCertificateDialog();
  });
}

if (deleteCertForm) {
  deleteCertForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!pendingDeleteCertificate || !isAdminSession()) return;

    const codigo = sanitizeText(pendingDeleteCertificate.codigo).toUpperCase();
    const confirmacaoCodigo = sanitizeText(
      deleteCertConfirmCodeInput ? deleteCertConfirmCodeInput.value : ""
    ).toUpperCase();
    const password = deleteCertPasswordInput ? deleteCertPasswordInput.value : "";

    if (!codigo) {
      setDeleteCertStatus("Nenhum certificado selecionado para exclusao.", "error");
      return;
    }
    if (confirmacaoCodigo !== codigo) {
      setDeleteCertStatus("Digite o codigo exato do certificado para confirmar.", "error");
      return;
    }
    if (!password) {
      setDeleteCertStatus("Informe a senha do administrador.", "error");
      return;
    }

    try {
      setDeleteCertStatus(`Excluindo ${codigo}...`, "info");
      const payload = await apiJsonRequest(
        `/api/admin/certificados/${encodeURIComponent(codigo)}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            password,
            confirmacao_codigo: confirmacaoCodigo,
          }),
        }
      );

      if (lastData && sanitizeText(lastData.codigo).toUpperCase() === codigo) {
        lastData = null;
        downloadBtn.disabled = true;
      }

      closeDeleteCertificateDialog();
      setCertListStatus(
        (payload && payload.message) || `Certificado ${codigo} excluido com sucesso.`,
        "success"
      );
      await loadCertificates(1);
      if (isAdminSession()) {
        await loadAuditEvents(1);
      }
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        if (error.message === "Senha do administrador invalida.") {
          setDeleteCertStatus(error.message, "error");
          if (deleteCertPasswordInput) deleteCertPasswordInput.value = "";
          return;
        }
        await handleUnauthorized();
        return;
      }
      setDeleteCertStatus(
        (error && error.message) || "Nao foi possivel excluir o certificado.",
        "error"
      );
    }
  });
}

setTodayDate();
syncUserFormState();
syncSecretariaFormState();
syncTemplateAdminFormState();
syncSecretariaAssetFormState();
syncGenerateSubmitButton();
syncAdvancedAssetControls();
updateControlLabels();
syncTemplateControls();
syncPreviewHotspotToggle();
syncAdvancedControlVisibility();
setTemplateStatus("", "info");
setLogoStatus("", "info");
setAssinaturaStatus("", "info");
setSelo1Status("", "info");
setSelo2Status("", "info");
setSelo3Status("", "info");
setSelo4Status("", "info");
setInstituicaoStatus("", "info");
void renderLastCertificate();
void refreshSession();
