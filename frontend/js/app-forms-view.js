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

function populateCertificateFormSecretarias(selectedValue = "") {
  const secretarias = sessionState && Array.isArray(sessionState.secretarias)
    ? sessionState.secretarias
    : [];
  populateSecretariaOptions(certificateFormSecretariaSelect, secretarias, selectedValue, false);
  if (!selectedValue && certificateFormSecretariaSelect && secretarias.length) {
    const activeId = sessionState ? sessionState.secretaria_ativa_id : "";
    certificateFormSecretariaSelect.value = String(activeId || secretarias[0].id);
  }
  populateCertificateFormReplyEmails();
}

function populateCertificateFormReplyEmails(selectedValue = "") {
  if (!certificateFormReplyEmailSelect) return;

  const secretaria = getFormSecretariaById(certificateFormSecretariaSelect.value);
  certificateFormReplyEmailSelect.innerHTML = "";

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Usar e-mail padrão da secretaria";
  certificateFormReplyEmailSelect.appendChild(blank);

  const replyEmails = secretaria && Array.isArray(secretaria.reply_emails)
    ? secretaria.reply_emails.filter((item) => item.ativo)
    : [];
  replyEmails.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.padrao ? `${item.email} (padrão)` : item.email;
    option.selected = String(item.id) === String(selectedValue || "");
    certificateFormReplyEmailSelect.appendChild(option);
  });
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
  return sanitizeText(value)
    .split(/\r?\n|;/)
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
  return {
    secretaria_id: Number(certificateFormSecretariaSelect ? certificateFormSecretariaSelect.value : 0) || null,
    titulo: sanitizeText(certificateFormTitleInput ? certificateFormTitleInput.value : ""),
    curso: sanitizeText(certificateFormCourseInput ? certificateFormCourseInput.value : ""),
    concluido: sanitizeText(certificateFormDateInput ? certificateFormDateInput.value : ""),
    carga_h: Number.parseInt(certificateFormHoursInput ? certificateFormHoursInput.value : "0", 10) || 0,
    reply_email_id:
      Number.parseInt(certificateFormReplyEmailSelect ? certificateFormReplyEmailSelect.value : "", 10) || null,
    ativo: Boolean(certificateFormActiveInput && certificateFormActiveInput.checked),
    email_obrigatorio: Boolean(
      certificateFormEmailRequiredInput && certificateFormEmailRequiredInput.checked
    ),
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

function resetCertificateForm() {
  if (certificateFormForm) certificateFormForm.reset();
  if (certificateFormEditIdInput) certificateFormEditIdInput.value = "";
  if (certificateFormActiveInput) certificateFormActiveInput.checked = true;
  if (certificateFormHoursInput) certificateFormHoursInput.value = "0";
  if (certificateFormDateInput) certificateFormDateInput.value = toDateInputValue(new Date());
  syncCertificateFormExtraOptionsVisibility();
  populateCertificateFormSecretarias();
  setCertificateFormStatus("", "info");
}

function fillCertificateFormForm(item) {
  if (!item) return;
  if (certificateFormEditIdInput) certificateFormEditIdInput.value = item.id;
  populateCertificateFormSecretarias(item.secretaria_id);
  if (certificateFormTitleInput) certificateFormTitleInput.value = item.titulo || "";
  if (certificateFormCourseInput) certificateFormCourseInput.value = item.curso || "";
  if (certificateFormDateInput) certificateFormDateInput.value = item.concluido || "";
  if (certificateFormHoursInput) certificateFormHoursInput.value = String(item.carga_h || 0);
  if (certificateFormReplyEmailSelect) {
    populateCertificateFormReplyEmails(item.reply_email_id || "");
  }
  if (certificateFormEmailRequiredInput) {
    certificateFormEmailRequiredInput.checked = Boolean(item.email_obrigatorio);
  }
  if (certificateFormActiveInput) certificateFormActiveInput.checked = Boolean(item.ativo);

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

    const responsesCell = document.createElement("td");
    responsesCell.textContent = `${item.respostas_total || 0} total / ${item.respostas_pendentes || 0} pendente(s)`;

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = item.ativo ? "badge success" : "badge warning";
    status.textContent = item.ativo ? "Ativo" : "Inativo";
    statusCell.appendChild(status);

    const actionsCell = document.createElement("td");
    actionsCell.className = "actions-cell";

    const responsesBtn = document.createElement("button");
    responsesBtn.type = "button";
    responsesBtn.className = "secondary-btn compact-action";
    responsesBtn.textContent = "Respostas";
    responsesBtn.addEventListener("click", () => {
      void loadFormResponses(item.id);
    });

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "secondary-btn compact-action";
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => {
      fillCertificateFormForm(item);
    });

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "secondary-btn compact-action";
    toggleBtn.textContent = item.ativo ? "Desativar" : "Ativar";
    toggleBtn.addEventListener("click", () => {
      void toggleCertificateFormActive(item);
    });

    actionsCell.append(responsesBtn, editBtn, toggleBtn);
    row.append(titleCell, secretariaCell, responsesCell, statusCell, actionsCell);
    certificateFormListBody.appendChild(row);
  });
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
        <td colspan="3" class="empty-state">Nenhuma resposta recebida ainda.</td>
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

    const certCell = document.createElement("td");
    certCell.textContent = item.certificado_codigo || "Pendente";

    row.append(personCell, createdCell, certCell);
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
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/qrcode?texto=${encodeURIComponent(form.public_url)}`,
      { credentials: "include" }
    );
    if (!response.ok) throw new Error("Nao foi possivel gerar QR Code.");
    const blob = await response.blob();
    downloadBlob(blob, `qr-formulario-${form.id}.png`);
  } catch (error) {
    setFormResponsesStatus(error.message || "Nao foi possivel baixar o QR Code.", "error");
  }
}

async function copySelectedFormLink() {
  const form = getSelectedCertificateForm();
  if (!form) return;
  try {
    await navigator.clipboard.writeText(form.public_url);
    setFormResponsesStatus("Link copiado.", "success");
  } catch (_error) {
    setFormResponsesStatus(form.public_url, "info");
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
