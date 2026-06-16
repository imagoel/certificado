
function canvasToPngBlob() {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error("Canvas não disponível."));
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Não foi possível converter o certificado para PNG."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
}

function buildIgnoredRowsSummary(invalidRows, limit = 5) {
  if (!Array.isArray(invalidRows) || !invalidRows.length) return "";

  const preview = invalidRows.slice(0, limit).join(", ");
  const suffix = invalidRows.length > limit ? ", ..." : "";
  return `${invalidRows.length} linha(s) serao ignorada(s): ${preview}${suffix}.`;
}

function setBatchButtonsDisabled(disabled) {
  const isEditing = Boolean(editingCertificate);
  if (batchPreviewBtn) batchPreviewBtn.disabled = disabled || isEditing;
  if (batchGenerateBtn) batchGenerateBtn.disabled = disabled || isEditing;
  syncGenerateSubmitButton();
}

function syncGenerateSubmitButton() {
  if (!generateSubmitBtn) return;
  const isEditing = Boolean(editingCertificate);
  generateSubmitBtn.disabled =
    isBatchRunning || isSingleGenerationRunning || isCertificateEditSaving || isEditing;
  generateSubmitBtn.textContent = isEditing
    ? "Em edicao"
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
  if (batchPreviewPanel) batchPreviewPanel.hidden = true;
  if (batchPreviewSummary) {
    batchPreviewSummary.textContent = "Selecione uma planilha e clique em Pré-visualizar.";
  }
  if (batchPreviewBody) {
    batchPreviewBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhuma prévia carregada.</td>
      </tr>
    `;
  }
}

function renderBatchPreview(prepared) {
  if (!batchPreviewPanel || !batchPreviewSummary || !batchPreviewBody) return;

  batchPreviewPanel.hidden = false;

  const summaryParts = [
    `${prepared.fileName}: ${prepared.nonEmptyRows} linha(s) preenchida(s)`,
    `${prepared.certificates.length} válida(s)`,
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
  batchPreviewSummary.textContent = `${summaryParts.join(", ")}. Exibindo até 5 registro(s).`;

  batchPreviewBody.innerHTML = "";

  if (!prepared.previewItems.length) {
    batchPreviewBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhuma linha válida disponível para pré-visualização.</td>
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

async function prepareBatchCertificates(file) {
  const isCsvFile = (file.name || "").toLowerCase().endsWith(".csv");
  if (!isCsvFile && !window.XLSX) {
    throw new Error("Falha: biblioteca de planilha não carregou.");
  }

  const rawRows = await readSpreadsheetRows(file);
  if (!rawRows.length) {
    throw new Error("A planilha está vazia.");
  }

  const batchDefaults = getBatchDefaults();
  const defaultCargaResult = normalizeCargaHorariaResult(batchDefaults.carga_h);
  if (defaultCargaResult.invalid) {
    throw new Error(
      `A carga horária do formulário deve estar entre 0 e ${MAX_CARGA_HORARIA} horas.`
    );
  }
  const certificates = [];
  const invalidRows = [];
  const headerInfo = detectSpreadsheetHeaderRow(rawRows);
  const dataStartIndex = headerInfo.index >= 0 ? headerInfo.index + 1 : 0;
  const headers = headerInfo.headers;
  let nonEmptyRows = 0;
  let skippedEmptyRows = 0;

  for (let index = dataStartIndex; index < rawRows.length; index += 1) {
    const rowEntry = rawRows[index];
    const rowValues = getSpreadsheetRowValues(rowEntry);
    const rowNumber = getSpreadsheetRowNumber(rowEntry, index);
    if (isRowEmpty(rowValues)) {
      skippedEmptyRows += 1;
      continue;
    }

    nonEmptyRows += 1;
    const row = buildRowObject(headers, rowValues);
    const item = mapRowToCertificate(row, rowNumber, batchDefaults, {
      allowSingleCellFallback: headerInfo.index < 0,
    });
    if (item.error) {
      invalidRows.push(item.error);
      continue;
    }
    certificates.push(item);
  }

  return {
    fileName: file.name || "planilha",
    certificates,
    invalidRows,
    ignoredRows: invalidRows,
    nonEmptyRows,
    skippedEmptyRows,
    headerRowNumber: headerInfo.rowNumber,
    previewItems: certificates.slice(0, 5),
  };
}

async function openBatchConfirmDialog(prepared) {
  const total = prepared.certificates.length;
  const ignoredCount = prepared.invalidRows.length;
  const moldeInfo = assets.template
    ? " O molde temporario carregado no formulario tambem sera aplicado em todos os certificados deste lote."
    : savedTemplate
      ? ` O modelo ${savedTemplate.nome} da secretaria ativa tambem sera aplicado neste lote.`
      : "";
  const ignoredInfo = ignoredCount
    ? ` ${ignoredCount} linha(s) com problema serao ignorada(s).`
    : "";
  const summary = `${total} certificado(s) serao gerado(s), terao os PNGs salvos no servidor e um arquivo ZIP sera baixado neste navegador.${ignoredInfo}${moldeInfo}`;

  if (
    !batchConfirmDialog ||
    !batchConfirmForm ||
    typeof batchConfirmDialog.showModal !== "function"
  ) {
    const confirmed = await openConfirmActionDialog({
      title: "Gerar lote?",
      message: `Confirme a geração do lote da planilha ${prepared.fileName}.`,
      summary,
      confirmLabel: "Gerar lote",
    });
    if (confirmed) {
      void executeBatchGeneration(prepared);
    }
    return;
  }

  pendingBatchGeneration = prepared;

  if (batchConfirmMessage) {
    batchConfirmMessage.textContent = `Confirme a geração do lote da planilha ${prepared.fileName}.`;
  }
  if (batchConfirmSummary) {
    batchConfirmSummary.textContent = summary;
  }
  setBatchConfirmStatus("", "info");
  if (batchConfirmDialog.open) {
    batchConfirmDialog.close();
  }
  batchConfirmDialog.showModal();
}

async function executeBatchGeneration(prepared) {
  if (!prepared || !Array.isArray(prepared.certificates) || !prepared.certificates.length) {
    setBatchStatus("Nenhum lote preparado para geração.", "error");
    return;
  }

  if (!window.JSZip) {
    setBatchStatus("Falha: biblioteca ZIP não carregou.", "error");
    return;
  }

  isBatchRunning = true;
  setBatchButtonsDisabled(true);
  const previousLastData = lastData ? { ...lastData } : null;
  let unresolvedCertificates = new Map();

  try {
    const certificates = prepared.certificates.map((item) => ({ ...item }));
    const failedUploads = [];
    const successfulCertificates = [];
    const discardedCertificates = [];
    const batchRenderSnapshot = buildLayoutPresetPayload();

    setBatchStatus("Registrando lote no backend...", "info");
    const registered = await registerBatchCertificates(certificates);
    if (!Array.isArray(registered) || registered.length !== certificates.length) {
      throw new Error(
        "A API retornou quantidade inesperada de certificados. Tente novamente."
      );
    }

    certificates.forEach((cert, index) => {
      cert.codigo = sanitizeText(registered[index].codigo).toUpperCase();
      cert.qrText = sanitizeText(registered[index].url_validacao);
    });
    unresolvedCertificates = new Map(
      certificates.map((cert) => [sanitizeText(cert.codigo).toUpperCase(), cert])
    );

    const zip = new window.JSZip();

    for (let index = 0; index < certificates.length; index += 1) {
      const cert = certificates[index];
      setBatchStatus(`Gerando ${index + 1}/${certificates.length}: ${cert.nome}`, "info");

      await drawCertificate(
        cert.nome,
        cert.curso,
        cert.data,
        cert.linha1,
        cert.linha2,
        cert.qrText,
        cert.codigo,
        cert.carga_h || 0
      );

      const pngBlob = await canvasToPngBlob();
      try {
        ensureCertificatePngWithinLimit(pngBlob, cert.codigo);
      } catch (error) {
        const cleanupResult = await tryDiscardPendingCertificate(cert.codigo);
        failedUploads.push({
          codigo: cert.codigo,
          nome: cert.nome,
          message: error && error.message ? error.message : "PNG acima do limite permitido.",
          discarded: cleanupResult.discarded,
          cleanupMessage: cleanupResult.message,
        });
        if (cleanupResult.discarded) {
          discardedCertificates.push(cert);
          unresolvedCertificates.delete(cert.codigo);
        }
        continue;
      }

      setBatchStatus(
        `Salvando ${index + 1}/${certificates.length} no servidor: ${cert.nome}`,
        "info"
      );
      try {
        await uploadCertificateImage(cert.codigo, pngBlob, cert.fileName, {
          renderSnapshot: batchRenderSnapshot,
        });
        zip.file(cert.fileName, pngBlob);
        successfulCertificates.push(cert);
        unresolvedCertificates.delete(cert.codigo);
      } catch (error) {
        if (error && error.status === 401) {
          throw error;
        }
        console.error(error);
        const cleanupResult = await tryDiscardPendingCertificate(cert.codigo);
        failedUploads.push({
          codigo: cert.codigo,
          nome: cert.nome,
          message: error && error.message ? error.message : "Falha no upload do PNG.",
          discarded: cleanupResult.discarded,
          cleanupMessage: cleanupResult.message,
        });
        if (cleanupResult.discarded) {
          discardedCertificates.push(cert);
          unresolvedCertificates.delete(cert.codigo);
        }
      }
    }

    if (unresolvedCertificates.size) {
      const cleanupSummary = await cleanupPendingCertificates(
        Array.from(unresolvedCertificates.values())
      );
      cleanupSummary.discarded.forEach(({ cert, message }) => {
        const previousIndex = failedUploads.findIndex((item) => item.codigo === cert.codigo);
        if (previousIndex >= 0) {
          failedUploads.splice(previousIndex, 1);
        }
        discardedCertificates.push(cert);
        failedUploads.push({
          codigo: cert.codigo,
          nome: cert.nome,
          message: "PNG nao foi concluido durante a geracao do lote.",
          discarded: true,
          cleanupMessage: message,
        });
        unresolvedCertificates.delete(cert.codigo);
      });
      cleanupSummary.failed.forEach(({ cert, message }) => {
        const previousIndex = failedUploads.findIndex((item) => item.codigo === cert.codigo);
        if (previousIndex >= 0) {
          failedUploads.splice(previousIndex, 1);
        }
        failedUploads.push({
          codigo: cert.codigo,
          nome: cert.nome,
          message: "PNG nao foi concluido durante a geracao do lote.",
          discarded: false,
          cleanupMessage: message,
        });
      });
    }

    if (successfulCertificates.length) {
      setBatchStatus("Compactando certificados em ZIP...", "info");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipName = `certificados_lote_${buildTimestamp()}.zip`;
      downloadBlob(zipBlob, zipName);
    }

    if (!previousLastData && successfulCertificates.length) {
      const lastGenerated = successfulCertificates[successfulCertificates.length - 1];
      lastData = {
        nome: lastGenerated.nome,
        curso: lastGenerated.curso,
        email: lastGenerated.email || "",
        data: lastGenerated.data,
        cargaH: lastGenerated.carga_h || 0,
        codigo: lastGenerated.codigo,
        linha1: lastGenerated.linha1,
        linha2: lastGenerated.linha2,
        qrText: lastGenerated.qrText,
      };
      downloadBtn.disabled = false;
    }

    const ignoredCount = prepared.invalidRows.length;
    const ignoredSummary = buildIgnoredRowsSummary(prepared.invalidRows);
    if (failedUploads.length) {
      const preview = failedUploads
        .slice(0, 3)
        .map((item) => {
          const detail = item.discarded
            ? "descartado automaticamente"
            : summarizePngFailure(item.message);
          return `${item.codigo} (${detail})`;
        })
        .join(", ");
      const suffix = failedUploads.length > 3 ? ", ..." : "";
      const unresolvedCount = failedUploads.filter((item) => !item.discarded).length;
      const ignoredPreview = ignoredCount ? ` ${ignoredSummary}` : "";
      setBatchStatus(
        `Lote concluido com ressalvas: ${successfulCertificates.length} certificado(s) foram concluido(s) e incluidos no ZIP. ${discardedCertificates.length} certificado(s) foram descartado(s) automaticamente apos falha no PNG.${unresolvedCount ? ` ${unresolvedCount} pendente(s) nao puderam ser descartado(s) automaticamente.` : ""} Verifique: ${preview}${suffix}.${ignoredPreview}`,
        "error"
      );
    } else {
      const ignoredPreview = ignoredCount ? ` ${ignoredSummary}` : "";
      setBatchStatus(
        `Lote concluido: ${successfulCertificates.length} certificado(s) foram gerado(s), salvos no servidor e incluidos no ZIP com sucesso.${ignoredPreview}`,
        "success"
      );
    }
    await loadCertificates(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setBatchStatus(error.message || "Falha ao gerar lote.", "error");
  } finally {
    if (previousLastData) {
      lastData = previousLastData;
      await renderLastCertificate();
    }

    setBatchButtonsDisabled(false);
    isBatchRunning = false;
  }
}

async function handleBatchPreview() {
  if (!planilhaInput) return;
  if (isBatchRunning) return;
  if (editingCertificate) {
    setBatchStatus("Finalize ou cancele a edicao antes de usar o lote.", "info");
    return;
  }
  if (!sessionState) {
    await handleUnauthorized();
    return;
  }

  const cargaError = getFormCargaHorariaError();
  if (cargaError) {
    setBatchStatus(cargaError, "error");
    resetBatchPreview();
    if (cargaHInput && typeof cargaHInput.reportValidity === "function") {
      cargaHInput.reportValidity();
    }
    return;
  }

  const file = planilhaInput.files && planilhaInput.files[0];
  if (!file) {
    setBatchStatus("Selecione uma planilha antes de pré-visualizar.", "error");
    resetBatchPreview();
    return;
  }

  try {
    setBatchStatus("Lendo planilha para pré-visualização...", "info");
    const prepared = await prepareBatchCertificates(file);
    renderBatchPreview(prepared);
    if (prepared.invalidRows.length) {
      const ignoredSummary = buildIgnoredRowsSummary(prepared.invalidRows);
      setBatchStatus(
        `Previa pronta: ${prepared.certificates.length} linha(s) valida(s). ${ignoredSummary}`,
        prepared.certificates.length ? "info" : "error"
      );
      return;
    }
    setBatchStatus(
      `Prévia pronta: ${prepared.certificates.length} certificado(s) válido(s) em ${prepared.fileName}.`,
      "success"
    );
  } catch (error) {
    console.error(error);
    setBatchStatus(error.message || "Falha ao pré-visualizar a planilha.", "error");
    resetBatchPreview();
  }
}

async function handleBatchGenerate() {
  if (!planilhaInput || !batchGenerateBtn) return;
  if (isBatchRunning) return;
  if (editingCertificate) {
    setBatchStatus("Finalize ou cancele a edicao antes de gerar lote.", "info");
    return;
  }
  if (!sessionState) {
    await handleUnauthorized();
    return;
  }

  const cargaError = getFormCargaHorariaError();
  if (cargaError) {
    setBatchStatus(cargaError, "error");
    resetBatchPreview();
    if (cargaHInput && typeof cargaHInput.reportValidity === "function") {
      cargaHInput.reportValidity();
    }
    return;
  }

  const file = planilhaInput.files && planilhaInput.files[0];
  if (!file) {
    setBatchStatus("Selecione uma planilha antes de gerar o lote.", "error");
    resetBatchPreview();
    return;
  }

  try {
    setBatchStatus("Validando planilha antes da geração...", "info");
    if (!window.JSZip) {
      throw new Error("Falha: biblioteca ZIP não carregou.");
    }
    const prepared = await prepareBatchCertificates(file);
    renderBatchPreview(prepared);

    if (!prepared.certificates.length) {
      throw new Error("Nenhuma linha valida encontrada para gerar certificados.");
    }

    if (prepared.invalidRows.length) {
      const ignoredSummary = buildIgnoredRowsSummary(prepared.invalidRows);
      setBatchStatus(
        `Lote validado: ${prepared.certificates.length} certificado(s) pronto(s) para geracao. ${ignoredSummary}`,
        "info"
      );
    } else {
      setBatchStatus(
        `Lote validado: ${prepared.certificates.length} certificado(s) pronto(s) para confirmacao.`,
        "info"
      );
    }
    await openBatchConfirmDialog(prepared);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setBatchStatus(error.message || "Falha ao validar o lote.", "error");
  }
}
