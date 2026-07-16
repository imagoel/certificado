function setBatchButtonsDisabled(disabled) {
  const isEditing = Boolean(editingCertificate);
  syncBatchSourceUi();
  if (batchPreviewBtn) batchPreviewBtn.disabled = true;
  if (batchGenerateBtn) batchGenerateBtn.disabled = disabled || isEditing;
  syncGenerateSubmitButton();
}

function syncBatchSourceUi() {
  if (batchPreviewBtn) {
    batchPreviewBtn.hidden = true;
    batchPreviewBtn.title = "A previa e carregada automaticamente.";
  }
  if (batchGenerateBtn) {
    batchGenerateBtn.textContent = "Gerar e baixar ZIP";
    batchGenerateBtn.title =
      "Gera os certificados, salva os PNGs, tenta enviar os e-mails e baixa um ZIP.";
  }
}

function syncGenerateSubmitButton() {
  if (!generateSubmitBtn) return;
  const isEditing = Boolean(editingCertificate);
  const hasExternalBatch = Boolean(loadedExternalBatch);
  generateSubmitBtn.disabled =
    isBatchRunning || isSingleGenerationRunning || isCertificateEditSaving || isEditing;
  generateSubmitBtn.title = hasExternalBatch
    ? "Gera os certificados, salva os PNGs e tenta enviar os e-mails sem baixar ZIP."
    : "";
  generateSubmitBtn.textContent = isEditing
    ? "Em edicao"
    : hasExternalBatch
      ? "Gerar certificados"
      : isSingleGenerationRunning
        ? "Gerando..."
        : "Gerar Certificado";
}

function getBatchDefaults() {
  return {
    curso: (() => {
      const input = document.getElementById("curso");
      return input ? input.value : "";
    })(),
    data: (() => {
      const input = document.getElementById("data");
      return input ? input.value : "";
    })(),
    carga_h: (() => {
      const input = cargaHInput;
      return input ? input.value : "";
    })(),
    linha1: sanitizeText(textoLinha1Input ? textoLinha1Input.value : ""),
    linha2: sanitizeText(textoLinha2Input ? textoLinha2Input.value : ""),
  };
}

function resetBatchPreview() {
  loadedExternalBatch = null;
  syncBatchSourceUi();
  if (batchPreviewPanel) batchPreviewPanel.hidden = true;
  if (batchPreviewSummary) {
    batchPreviewSummary.textContent = "Selecione uma planilha para carregar a prÃ©via automaticamente.";
  }
  if (batchPreviewBody) {
    batchPreviewBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhuma prÃ©via carregada.</td>
      </tr>
    `;
  }
}

function resetBatchPreviewViewOnly() {
  syncBatchSourceUi();
  if (batchPreviewPanel) batchPreviewPanel.hidden = true;
  if (batchPreviewSummary) {
    batchPreviewSummary.textContent = "Selecione uma planilha para carregar a prÃ©via automaticamente.";
  }
  if (batchPreviewBody) {
    batchPreviewBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhuma prÃ©via carregada.</td>
      </tr>
    `;
  }
}

function loadExternalBatchIntoGenerator(prepared) {
  loadedExternalBatch = prepared;
  if (planilhaInput) planilhaInput.value = "";
  syncBatchSourceUi();
  renderBatchPreview(prepared);
  setBatchButtonsDisabled(false);
}

function renderBatchPreview(prepared) {
  if (!batchPreviewPanel || !batchPreviewSummary || !batchPreviewBody) return;

  batchPreviewPanel.hidden = false;

  const summaryParts = [
    `${prepared.fileName}: ${prepared.nonEmptyRows} linha(s) preenchida(s)`,
    `${prepared.certificates.length} vÃ¡lida(s)`,
  ];
  if (prepared.headerRowNumber) {
    summaryParts.push(`cabecalho detectado na linha ${prepared.headerRowNumber}`);
  }
  if (prepared.invalidRows.length) {
    summaryParts.push(`${prepared.invalidRows.length} ignorada(s)`);
  }
  if (prepared.skippedEmptyRows) {
    summaryParts.push(`${prepared.skippedEmptyRows} vazia(s) ignorada(s)`);
  }
  batchPreviewSummary.textContent = `${summaryParts.join(", ")}. Exibindo atÃ© 5 registro(s).`;

  batchPreviewBody.innerHTML = "";

  if (!prepared.previewItems.length) {
    batchPreviewBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhuma linha vÃ¡lida disponÃ­vel para prÃ©-visualizaÃ§Ã£o.</td>
      </tr>
    `;
    return;
  }

  prepared.previewItems.forEach((item) => {
    const row = document.createElement("tr");

    const lineCell = document.createElement("td");
    lineCell.textContent = String(item.rowNumber || "-");

    const nameCell = document.createElement("td");
    nameCell.textContent = item.nome || "-";

    const emailCell = document.createElement("td");
    emailCell.textContent = item.email || "-";

    const courseCell = document.createElement("td");
    courseCell.textContent = item.curso || "-";

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.data);

    const cargaCell = document.createElement("td");
    cargaCell.textContent = `${item.carga_h || 0}h`;

    const fileCell = document.createElement("td");
    fileCell.textContent = item.fileName || "-";

    row.append(lineCell, nameCell, emailCell, courseCell, dateCell, cargaCell, fileCell);
    batchPreviewBody.appendChild(row);
  });
}

