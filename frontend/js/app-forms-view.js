function setCertificateFormStatus(message, type = "info") {
  setStatusMessage(certificateFormStatus, message, type);
}

function setFormResponsesStatus(message, type = "info") {
  setStatusMessage(formResponsesStatus, message, type);
}

function getFormSecretariaById(secretariaId) {
  const id = Number(secretariaId);
  const secretarias = sessionState && Array.isArray(sessionState.secretarias)
    ? sessionState.secretarias
    : [];
  return secretarias.find((secretaria) => Number(secretaria.id) === id) || null;
}

function getSelectedCertificateForm() {
  const id = Number(formsState.selectedFormId);
  return formsState.items.find((item) => Number(item.id) === id) || null;
}

function populateCertificateFormSecretarias(selectedSecretariaId = "") {
  populateCertificateFormReplyEmails("", selectedSecretariaId);
}

function updateCertificateFormReplyEmailHint(secretaria, selectedValue = "") {
  if (!certificateFormReplyEmailHint) return;
  const replyEmails = secretaria && Array.isArray(secretaria.reply_emails)
    ? secretaria.reply_emails.filter((item) => item.ativo)
    : [];
  const defaultReplyEmail = replyEmails.find((item) => item.padrao) || replyEmails[0] || null;
  const selectedText =
    selectedValue === null || selectedValue === undefined ? "" : String(selectedValue);
  const selected =
    replyEmails.find((item) => String(item.id || "") === selectedText) ||
    (selectedText ? null : defaultReplyEmail);

  if (!selected) {
    certificateFormReplyEmailHint.textContent =
      "Cadastre um e-mail de resposta para esta secretaria antes de divulgar o formulário.";
    certificateFormReplyEmailHint.className = "hint status error";
    return;
  }

  const issuerLabel =
    typeof buildReplyEmailIssuerLabel === "function"
      ? buildReplyEmailIssuerLabel(secretaria, selected)
      : selected.nome || secretaria.sigla || "";
  const defaultHint = selected.padrao ? " padrão" : "";
  certificateFormReplyEmailHint.textContent =
    `Respostas irão para ${selected.email}${defaultHint}. ` +
    `No e-mail aparecerá: ${issuerLabel}.`;
  certificateFormReplyEmailHint.className = "hint";
}

function populateCertificateFormReplyEmails(selectedValue = "", secretariaId = "") {
  if (!certificateFormReplyEmailSelect) return;

  const selectedSecretariaId = secretariaId || (sessionState && sessionState.secretaria_ativa_id);
  const secretaria = getFormSecretariaById(selectedSecretariaId);
  certificateFormReplyEmailSelect.innerHTML = "";
  const replyEmails = secretaria && Array.isArray(secretaria.reply_emails)
    ? secretaria.reply_emails.filter((item) => item.ativo)
    : [];
  const defaultReplyEmail = replyEmails.find((item) => item.padrao) || null;

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = defaultReplyEmail
    ? `${defaultReplyEmail.email} (padrão da secretaria)`
    : "Usar e-mail padrão da secretaria";
  certificateFormReplyEmailSelect.appendChild(blank);

  replyEmails.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.padrao ? `${item.email} (padrão)` : item.email;
    option.selected = String(item.id) === String(selectedValue || "");
    certificateFormReplyEmailSelect.appendChild(option);
  });
  updateCertificateFormReplyEmailHint(secretaria, selectedValue);
}

function buildDefaultCertificateFormTitle(courseName) {
  const course = sanitizeText(courseName);
  return course ? `Inscrição para o curso ${course}` : "Inscrição para curso";
}

function syncFormsModeUi() {
  const isCreate = formsState.mode !== "manage";
  if (formsCreatePanel) formsCreatePanel.hidden = !isCreate;
  if (formsManagePanel) formsManagePanel.hidden = isCreate;
  if (formsRefreshBtn) formsRefreshBtn.hidden = isCreate;
  if (formsCreateModeBtn) {
    formsCreateModeBtn.classList.toggle("is-active", isCreate);
    formsCreateModeBtn.setAttribute("aria-pressed", isCreate ? "true" : "false");
  }
  if (formsManageModeBtn) {
    formsManageModeBtn.classList.toggle("is-active", !isCreate);
    formsManageModeBtn.setAttribute("aria-pressed", !isCreate ? "true" : "false");
  }
}

function switchFormsMode(mode) {
  formsState.mode = mode === "manage" ? "manage" : "create";
  syncFormsModeUi();
  if (formsState.mode === "manage") {
    void loadCertificateForms();
  }
}

function getCertificateFormExtraFieldControls() {
  return [
    [
      certificateFormExtra1Input,
      certificateFormExtra1LabelInput,
      certificateFormExtra1TypeSelect,
      certificateFormExtra1OptionsInput,
      certificateFormExtra1RequiredInput,
    ],
    [
      certificateFormExtra2Input,
      certificateFormExtra2LabelInput,
      certificateFormExtra2TypeSelect,
      certificateFormExtra2OptionsInput,
      certificateFormExtra2RequiredInput,
    ],
    [
      certificateFormExtra3Input,
      certificateFormExtra3LabelInput,
      certificateFormExtra3TypeSelect,
      certificateFormExtra3OptionsInput,
      certificateFormExtra3RequiredInput,
    ],
  ];
}

function parseCertificateFormExtraOptions(value) {
  return String(value || "")
    .replace(/\r/g, "\n")
    .split(/\n|;/)
    .map((item) => sanitizeText(item))
    .filter(Boolean);
}

function syncCertificateFormExtraOptionsVisibility() {
  getCertificateFormExtraFieldControls().forEach(([, , typeSelect, optionsInput]) => {
    if (!optionsInput) return;
    optionsInput.hidden = sanitizeText(typeSelect ? typeSelect.value : "texto") !== "selecao";
  });
}

function getCertificateFormExtraFieldsPayload() {
  const fields = getCertificateFormExtraFieldControls();
  return fields
    .map(([input, labelInput, typeSelect, optionsInput, requiredInput]) => {
      const type = sanitizeText(typeSelect ? typeSelect.value : "texto") === "selecao" ? "selecao" : "texto";
      return {
        nome: sanitizeText(input ? input.value : ""),
        rotulo: sanitizeText(labelInput ? labelInput.value : ""),
        tipo: type,
        opcoes: type === "selecao" ? parseCertificateFormExtraOptions(optionsInput ? optionsInput.value : "") : [],
        obrigatorio: Boolean(requiredInput && requiredInput.checked),
      };
    })
    .filter((item) => item.nome);
}

function buildCertificateFormPayload() {
  const course = sanitizeText(certificateFormCourseInput ? certificateFormCourseInput.value : "");
  const title = buildDefaultCertificateFormTitle(course);
  const editingId = sanitizeText(certificateFormEditIdInput ? certificateFormEditIdInput.value : "");
  const currentForm = editingId
    ? formsState.items.find((item) => String(item.id) === String(editingId))
    : null;
  return {
    secretaria_id: null,
    titulo: title,
    curso: course,
    concluido: sanitizeText(certificateFormDateInput ? certificateFormDateInput.value : ""),
    carga_h: Number.parseInt(certificateFormHoursInput ? certificateFormHoursInput.value : "0", 10) || 0,
    reply_email_id:
      Number.parseInt(certificateFormReplyEmailSelect ? certificateFormReplyEmailSelect.value : "", 10) || null,
    ativo: currentForm ? Boolean(currentForm.ativo) : true,
    email_obrigatorio: true,
    campos_extras: getCertificateFormExtraFieldsPayload(),
  };
}

async function saveCertificateForm() {
  if (!certificateFormForm) return;
  const editingId = sanitizeText(certificateFormEditIdInput ? certificateFormEditIdInput.value : "");
  const payload = buildCertificateFormPayload();
  const submitBtn = certificateFormForm.querySelector('button[type="submit"]');

  try {
    if (submitBtn) submitBtn.disabled = true;
    setCertificateFormStatus(editingId ? "Atualizando formulario..." : "Salvando formulario...", "info");
    await apiJsonRequest(editingId ? `/api/formularios/${editingId}` : "/api/formularios", {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    setCertificateFormStatus(
      editingId ? "Formulario atualizado com sucesso." : "Formulario criado com sucesso.",
      "success"
    );
    resetCertificateForm();
    await loadCertificateForms();
    switchFormsMode("manage");
  } catch (error) {
    console.error(error);
    setCertificateFormStatus(error.message || "Nao foi possivel salvar o formulario.", "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function toggleCertificateFormActive(item) {
  if (!item) return;
  try {
    setCertificateFormStatus(
      item.ativo ? "Desativando formulario..." : "Ativando formulario...",
      "info"
    );
    await apiJsonRequest(`/api/formularios/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ ativo: !item.ativo }),
    });
    setCertificateFormStatus(
      item.ativo ? "Formulario desativado." : "Formulario ativado.",
      "success"
    );
    await loadCertificateForms();
  } catch (error) {
    console.error(error);
    setCertificateFormStatus(error.message || "Nao foi possivel alterar o status.", "error");
  }
}

async function deleteCertificateForm(item) {
  if (!item || !isAdminSession()) return;
  const confirmed = await openConfirmActionDialog({
    title: "Excluir formulário?",
    message: `Excluir o formulário "${item.titulo || item.curso || "selecionado"}"?`,
    summary:
      "As respostas coletadas por este formulário serão removidas. Certificados já gerados não serão apagados.",
    confirmLabel: "Excluir formulário",
    danger: true,
  });
  if (!confirmed) return;

  try {
    setCertificateFormStatus("Excluindo formulario...", "info");
    await apiJsonRequest(`/api/formularios/${item.id}`, {
      method: "DELETE",
      body: "{}",
    });
    if (String(formsState.selectedFormId) === String(item.id)) {
      formsState.selectedFormId = "";
      formsState.responses = [];
      renderFormResponsesPanel();
    }
    await loadCertificateForms();
    setCertificateFormStatus("Formulario excluido com sucesso.", "success");
  } catch (error) {
    console.error(error);
    setCertificateFormStatus(error.message || "Nao foi possivel excluir o formulario.", "error");
  }
}

function resetCertificateForm() {
  if (certificateFormForm) certificateFormForm.reset();
  if (certificateFormEditIdInput) certificateFormEditIdInput.value = "";
  if (certificateFormHoursInput) certificateFormHoursInput.value = "0";
  if (certificateFormDateInput) certificateFormDateInput.value = toDateInputValue(new Date());
  syncCertificateFormExtraOptionsVisibility();
  populateCertificateFormSecretarias();
  setCertificateFormStatus("", "info");
}

function fillCertificateFormForm(item) {
  if (!item) return;
  if (certificateFormEditIdInput) certificateFormEditIdInput.value = item.id;
  switchFormsMode("create");
  if (certificateFormCourseInput) certificateFormCourseInput.value = item.curso || "";
  if (certificateFormDateInput) certificateFormDateInput.value = item.concluido || "";
  if (certificateFormHoursInput) certificateFormHoursInput.value = String(item.carga_h || 0);
  if (certificateFormReplyEmailSelect) {
    populateCertificateFormReplyEmails(item.reply_email_id || "", item.secretaria_id || "");
  }

  const extras = Array.isArray(item.campos_extras) ? item.campos_extras : [];
  getCertificateFormExtraFieldControls().forEach((
    [input, labelInput, typeSelect, optionsInput, requiredInput],
    index
  ) => {
    const extra = extras[index] || {};
    if (input) input.value = extra.nome || "";
    if (labelInput) labelInput.value = extra.rotulo || "";
    if (typeSelect) typeSelect.value = extra.tipo === "selecao" ? "selecao" : "texto";
    if (optionsInput) {
      const options = Array.isArray(extra.opcoes) ? extra.opcoes : [];
      optionsInput.value = options.join("\n");
    }
    if (requiredInput) requiredInput.checked = Boolean(extra.obrigatorio);
  });
  syncCertificateFormExtraOptionsVisibility();
  setCertificateFormStatus(`Editando ${item.titulo}.`, "info");
}

async function loadCertificateForms() {
  if (!certificateFormListBody || !sessionState || !canManageCertificateForms()) return;
  formsState.isLoading = true;
  try {
    const items = await apiJsonRequest("/api/formularios");
    formsState.items = Array.isArray(items) ? items : [];
    renderCertificateFormsTable();
    if (formsState.selectedFormId) {
      const stillExists = formsState.items.some(
        (item) => String(item.id) === String(formsState.selectedFormId)
      );
      if (!stillExists) {
        formsState.selectedFormId = "";
        formsState.responses = [];
        renderFormResponsesPanel();
      }
    }
  } catch (error) {
    console.error(error);
    setCertificateFormStatus(error.message || "Nao foi possivel carregar formularios.", "error");
  } finally {
    formsState.isLoading = false;
  }
}

function renderCertificateFormsTable() {
  if (!certificateFormListBody) return;
  certificateFormListBody.innerHTML = "";

  if (!formsState.items.length) {
    certificateFormListBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Nenhum formulário cadastrado.</td>
      </tr>
    `;
    return;
  }

  formsState.items.forEach((item) => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    const title = document.createElement("strong");
    title.className = "admin-primary-title";
    title.textContent = item.titulo || "-";
    const meta = document.createElement("span");
    meta.className = "table-mobile-meta";
    meta.textContent = `${item.curso || "-"} | ${formatDate(item.concluido)} | ${item.carga_h || 0}h`;
    titleCell.append(title, meta);

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const totalResponses = Number(item.respostas_total) || 0;
    const pendingResponses = Number(item.respostas_pendentes) || 0;
    const responsesCell = document.createElement("td");
    responsesCell.textContent =
      `${totalResponses} resposta${totalResponses === 1 ? "" : "s"} • ` +
      `${pendingResponses} aguardando certificado`;

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = item.ativo ? "badge success" : "badge warning";
    status.textContent = item.ativo ? "Ativo" : "Inativo";
    statusCell.appendChild(status);

    const actionsCell = document.createElement("td");
    actionsCell.className = "actions-cell";
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions form-actions";

    const copyBtn = createInlineButton(
      "Copiar link",
      () => {
        void copyFormLink(item, setCertificateFormStatus);
      },
      "secondary-btn compact-action"
    );
    const qrBtn = createInlineButton(
      "QR Code",
      () => {
        void downloadFormQrCode(item, setCertificateFormStatus);
      },
      "secondary-btn compact-action"
    );
    const responsesBtn = createInlineButton(
      "Respostas",
      () => {
        void loadFormResponses(item.id);
      },
      "secondary-btn compact-action"
    );
    const editBtn = createInlineButton(
      "Editar",
      () => {
        fillCertificateFormForm(item);
      },
      "secondary-btn compact-action"
    );

    actionsWrap.append(copyBtn, qrBtn, responsesBtn, editBtn);
    const menu = document.createElement("details");
    menu.className = "action-menu";
    menu.addEventListener("toggle", () => {
      if (menu.open) {
        closeOpenActionMenus(menu);
        window.requestAnimationFrame(() => {
          positionActionMenu(menu);
        });
      } else {
        resetActionMenuPosition(menu);
      }
    });

    const summary = document.createElement("summary");
    summary.className = "icon-btn action-menu-trigger";
    summary.title = "Mais ações";
    summary.setAttribute("aria-label", "Mais ações");
    summary.appendChild(createIconSvg("more"));

    const menuContent = document.createElement("div");
    menuContent.className = "action-menu-content";
    menuContent.appendChild(
      createInlineButton(
        "Visualizar formulário",
        () => {
          menu.open = false;
          window.open(item.public_url, "_blank", "noopener,noreferrer");
        },
        "action-menu-item"
      )
    );
    menuContent.appendChild(
      createInlineButton(
        item.ativo ? "Desativar formulário" : "Ativar formulário",
        () => {
          menu.open = false;
          void toggleCertificateFormActive(item);
        },
        "action-menu-item"
      )
    );
    if (isAdminSession()) {
      menuContent.appendChild(
        createInlineButton(
          "Excluir formulário",
          () => {
            menu.open = false;
            void deleteCertificateForm(item);
          },
          "action-menu-item danger-action"
        )
      );
    }
    menu.append(summary, menuContent);
    actionsWrap.appendChild(menu);
    actionsCell.appendChild(actionsWrap);
    row.append(titleCell, secretariaCell, responsesCell, statusCell, actionsCell);
    certificateFormListBody.appendChild(row);
  });
}

function buildFormConfirmationStatusBadge(item) {
  const status = item ? item.email_confirmacao_status : null;
  const badge = document.createElement("span");
  badge.className = "cert-email-status-badge is-pending";
  badge.textContent = "Pendente";

  const details = [];
  if (item && item.email_confirmacao_reply_to) {
    details.push(`Responder para: ${item.email_confirmacao_reply_to}`);
  }
  if (status === "enviado") {
    badge.className = "cert-email-status-badge is-sent";
    badge.textContent = "Enviado";
    if (item.email_confirmacao_em) {
      details.unshift(`Enviado em: ${formatDateTime(item.email_confirmacao_em)}`);
    }
  } else if (status === "falhou") {
    badge.className = "cert-email-status-badge is-error";
    badge.textContent = "Falha";
    if (item.email_confirmacao_erro) {
      details.push(`Motivo: ${item.email_confirmacao_erro}`);
    }
  } else {
    details.push("Aguardando tentativa de envio da confirmação.");
  }

  badge.title = details.filter(Boolean).join("\n");
  return badge;
}

async function loadFormResponses(formId) {
  const form = formsState.items.find((item) => Number(item.id) === Number(formId));
  if (!form) return;
  formsState.selectedFormId = String(form.id);
  setFormResponsesStatus("Carregando respostas...", "info");
  try {
    const responses = await apiJsonRequest(`/api/formularios/${form.id}/respostas`);
    formsState.responses = Array.isArray(responses) ? responses : [];
    renderFormResponsesPanel();
    setFormResponsesStatus("", "info");
  } catch (error) {
    console.error(error);
    setFormResponsesStatus(error.message || "Nao foi possivel carregar respostas.", "error");
  }
}

function renderFormResponsesPanel() {
  if (!formResponsesPanel || !formResponsesListBody) return;
  const form = getSelectedCertificateForm();
  formResponsesPanel.hidden = !form;
  formResponsesListBody.innerHTML = "";
  if (!form) return;

  if (formResponsesTitle) formResponsesTitle.textContent = `Respostas: ${form.titulo}`;
  const pending = formsState.responses.filter((item) => !item.certificado_codigo).length;
  if (formResponsesSummary) {
    formResponsesSummary.textContent =
      `${formsState.responses.length} resposta(s), ${pending} pendente(s) para gerar certificado.`;
  }

  if (!formsState.responses.length) {
    formResponsesListBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Nenhuma resposta recebida ainda.</td>
      </tr>
    `;
    return;
  }

  formsState.responses.forEach((item) => {
    const row = document.createElement("tr");

    const personCell = document.createElement("td");
    const name = document.createElement("strong");
    name.className = "admin-primary-title";
    name.textContent = item.nome || "-";
    const meta = document.createElement("span");
    meta.className = "table-mobile-meta";
    const extras = item.dados_extras || {};
    const extraText = Object.entries(extras)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
    meta.textContent = [item.email || "", extraText].filter(Boolean).join(" | ") || "-";
    personCell.append(name, meta);

    const createdCell = document.createElement("td");
    createdCell.textContent = formatDateTime(item.criado_em);

    const emailStatusCell = document.createElement("td");
    emailStatusCell.appendChild(buildFormConfirmationStatusBadge(item));

    const certCell = document.createElement("td");
    certCell.textContent = item.certificado_codigo || "Pendente";

    row.append(personCell, createdCell, emailStatusCell, certCell);
    formResponsesListBody.appendChild(row);
  });
}

function buildPreparedBatchFromFormResponses() {
  const form = getSelectedCertificateForm();
  if (!form) throw new Error("Selecione um formulário.");
  const pendingResponses = formsState.responses.filter((item) => !item.certificado_codigo);
  if (!pendingResponses.length) {
    throw new Error("Este formulário não possui respostas pendentes para gerar.");
  }
  const batchLimit = Number.parseInt(
    sessionState &&
      sessionState.configuracoes &&
      sessionState.configuracoes.certificados_max_batch_items,
    10
  ) || 800;
  if (pendingResponses.length > batchLimit) {
    throw new Error(
      `Este formulario possui ${pendingResponses.length} resposta(s) pendente(s), mas o limite atual do lote e ${batchLimit}. Gere em partes ou ajuste CERTIFICADOS_MAX_BATCH_ITEMS.`
    );
  }
  return {
    fileName: `Formulário: ${form.titulo}`,
    certificates: pendingResponses.map((item, index) => ({
      rowNumber: index + 1,
      nome: item.nome,
      email: item.email || "",
      curso: form.curso,
      data: form.concluido,
      codigo: "",
      carga_h: Number(form.carga_h) || 0,
      linha1: sanitizeText(textoLinha1Input ? textoLinha1Input.value : ""),
      linha2: sanitizeText(textoLinha2Input ? textoLinha2Input.value : ""),
      fileName: `${sanitizeFileName(item.nome, `formulario_${item.id}`)}.png`,
      replyEmailId: form.reply_email_id || "",
      formularioRespostaId: item.id,
    })),
    invalidRows: [],
    ignoredRows: [],
    nonEmptyRows: pendingResponses.length,
    skippedEmptyRows: 0,
    headerRowNumber: null,
    previewItems: [],
  };
}

function loadSelectedFormResponsesIntoGenerator() {
  try {
    const form = getSelectedCertificateForm();
    const prepared = buildPreparedBatchFromFormResponses();
    prepared.previewItems = prepared.certificates.slice(0, 5);
    if (cursoInput) cursoInput.value = form.curso || "";
    if (dataInput) dataInput.value = form.concluido || "";
    if (cargaHInput) cargaHInput.value = String(form.carga_h || 0);
    if (form.reply_email_id && replyEmailSelect) {
      populateCertificateReplyEmailOptions(String(form.reply_email_id));
      replyEmailSelect.value = String(form.reply_email_id);
    }
    loadExternalBatchIntoGenerator(prepared);
    switchSection("generator");
    setBatchStatus(
      `Respostas do formulário "${form.titulo}" carregadas. Revise o certificado e clique em Gerar Lote (ZIP).`,
      "success"
    );
  } catch (error) {
    setFormResponsesStatus(error.message || "Nao foi possivel carregar respostas no gerador.", "error");
  }
}

async function downloadSelectedFormQrCode() {
  const form = getSelectedCertificateForm();
  if (!form) return;
  await downloadFormQrCode(form, setFormResponsesStatus);
}

async function downloadFormQrCode(form, statusSetter = setCertificateFormStatus) {
  if (!form || !form.public_url) return;
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/qrcode?texto=${encodeURIComponent(form.public_url)}`,
      { credentials: "include" }
    );
    if (!response.ok) throw new Error("Nao foi possivel gerar QR Code.");
    const blob = await response.blob();
    downloadBlob(blob, `qr-formulario-${form.id}.png`);
  } catch (error) {
    statusSetter(error.message || "Nao foi possivel baixar o QR Code.", "error");
  }
}

async function copySelectedFormLink() {
  const form = getSelectedCertificateForm();
  if (!form) return;
  await copyFormLink(form, setFormResponsesStatus);
}

async function copyFormLink(form, statusSetter = setCertificateFormStatus) {
  if (!form || !form.public_url) return;
  try {
    await navigator.clipboard.writeText(form.public_url);
    statusSetter("Link do formulário copiado.", "success");
  } catch (_error) {
    statusSetter(form.public_url, "info");
  }
}

async function exportSelectedFormResponsesCsv() {
  const form = getSelectedCertificateForm();
  if (!form) return;
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/formularios/${form.id}/respostas.csv`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Nao foi possivel exportar CSV.");
    const blob = await response.blob();
    downloadBlob(blob, `respostas-formulario-${form.id}-${buildTimestamp()}.csv`);
  } catch (error) {
    setFormResponsesStatus(error.message || "Nao foi possivel exportar CSV.", "error");
  }
}
