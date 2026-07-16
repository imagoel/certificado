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

async
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
      `Respostas do formulário "${form.titulo}" carregadas. Revise o certificado e clique em Gerar certificados ou Gerar e baixar ZIP.`,
      "success"
    );
  } catch (error) {
    setFormResponsesStatus(error.message || "Nao foi possivel carregar respostas no gerador.", "error");
  }
}

async
async function downloadSelectedFormQrCode() {
  const form = getSelectedCertificateForm();
  if (!form) return;
  await downloadFormQrCode(form, setFormResponsesStatus);
}

async
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

async
async function copySelectedFormLink() {
  const form = getSelectedCertificateForm();
  if (!form) return;
  await copyFormLink(form, setFormResponsesStatus);
}

async
async function copyFormLink(form, statusSetter = setCertificateFormStatus) {
  if (!form || !form.public_url) return;
  try {
    await navigator.clipboard.writeText(form.public_url);
    statusSetter("Link do formulário copiado.", "success");
  } catch (_error) {
    statusSetter(form.public_url, "info");
  }
}
function getFormExportExtraFields(form) {
  return Array.isArray(form && form.campos_extras)
    ? form.campos_extras.filter((field) => sanitizeText(field && field.nome))
    : [];
}
function buildFormResponsesExportRows(form, responses) {
  const extraFields = getFormExportExtraFields(form);
  const headers = [
    "Nome",
    "Email",
    "Curso",
    "Carga hor\u00e1ria",
    "Data",
    ...extraFields.map((field) => field.nome),
    "Respondido em",
    "Certificado",
  ];
  const rows = [headers];

  (Array.isArray(responses) ? responses : []).forEach((item) => {
    const extras = item.dados_extras || {};
    rows.push([
      item.nome || "",
      item.email || "",
      form.curso || "",
      Number(form.carga_h) || 0,
      formatDate(form.concluido),
      ...extraFields.map((field) => extras[field.nome] || ""),
      formatDateTime(item.criado_em),
      item.certificado_codigo || "",
    ]);
  });

  return rows;
}
function getFormResponsesColumnWidths(rows) {
  const headers = Array.isArray(rows && rows[0]) ? rows[0] : [];
  return headers.map((header, columnIndex) => {
    const maxLength = rows.reduce((max, row) => {
      const value = row && row[columnIndex] !== undefined && row[columnIndex] !== null
        ? String(row[columnIndex])
        : "";
      return Math.max(max, value.length);
    }, String(header || "").length);
    return { wch: Math.min(Math.max(maxLength + 2, 12), 42) };
  });
}
function downloadFormResponsesXlsx(form, responses) {
  if (!window.XLSX || !window.XLSX.utils) {
    throw new Error("Biblioteca de Excel indisponivel.");
  }

  const rows = buildFormResponsesExportRows(form, responses);
  const worksheet = window.XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = getFormResponsesColumnWidths(rows);
  worksheet["!autofilter"] = {
    ref: window.XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length - 1, 0), c: Math.max((rows[0] || []).length - 1, 0) },
    }),
  };

  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Respostas");
  const bytes = window.XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `${getFormResponsesExportFileBase(form)}.xlsx`);
}
function getFormResponsesExportFileBase(form) {
  const courseName = form && form.curso ? form.curso : "";
  const fallback = form && form.id ? `formulario_${form.id}` : "formulario_respostas";
  return `respostas-formulario-${sanitizeFileName(courseName, fallback)}`;
}

async
async function exportSelectedFormResponsesCsv() {
  const form = getSelectedCertificateForm();
  if (!form) return;
  try {
    if (window.XLSX && window.XLSX.utils) {
      downloadFormResponsesXlsx(form, formsState.responses);
      setFormResponsesStatus("Planilha Excel exportada.", "success");
      return;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/formularios/${form.id}/respostas.csv`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Nao foi possivel exportar CSV.");
    const blob = await response.blob();
    downloadBlob(blob, `${getFormResponsesExportFileBase(form)}.csv`);
  } catch (error) {
    setFormResponsesStatus(error.message || "Nao foi possivel exportar CSV.", "error");
  }
}

async
async function normalizeSelectedFormResponseNames() {
  const form = getSelectedCertificateForm();
  if (!form) return;
  const confirmed = await openConfirmActionDialog({
    title: "Padronizar nomes?",
    message: `Padronizar os nomes das respostas pendentes do formulário "${form.titulo || form.curso}"?`,
    summary:
      "Esta ação corrige maiúsculas/minúsculas apenas nas respostas que ainda não geraram certificado.",
    confirmLabel: "Padronizar nomes",
  });
  if (!confirmed) return;

  try {
    setFormResponsesStatus("Padronizando nomes...", "info");
    const response = await apiJsonRequest(`/api/formularios/${form.id}/respostas/padronizar-nomes`, {
      method: "POST",
      body: "{}",
    });
    await loadFormResponses(form.id);
    setFormResponsesStatus(response.message || "Nomes padronizados.", "success");
  } catch (error) {
    console.error(error);
    setFormResponsesStatus(error.message || "Nao foi possivel padronizar os nomes.", "error");
  }
}
