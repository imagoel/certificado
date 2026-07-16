async function prepareBatchCertificates(file) {
  const isCsvFile = (file.name || "").toLowerCase().endsWith(".csv");
  if (!isCsvFile && !window.XLSX) {
    throw new Error("Falha: biblioteca de planilha nÃ£o carregou.");
  }

  const rawRows = await readSpreadsheetRows(file);
  if (!rawRows.length) {
    throw new Error("A planilha estÃ¡ vazia.");
  }

  const batchDefaults = getBatchDefaults();
  const defaultCargaResult = normalizeCargaHorariaResult(batchDefaults.carga_h);
  if (defaultCargaResult.invalid) {
    throw new Error(
      `A carga horÃ¡ria do formulÃ¡rio deve estar entre 0 e ${MAX_CARGA_HORARIA} horas.`
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
    source: "file",
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

async function openBatchConfirmDialog(prepared, options = {}) {
  const downloadZip = options.downloadZip !== false;
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
  const zipInfo = downloadZip ? " e um arquivo ZIP sera baixado neste navegador" : "";
  const summary = `${total} certificado(s) serao gerado(s), terao os PNGs salvos no servidor, o envio por e-mail sera tentado quando houver e-mail cadastrado${zipInfo}.${ignoredInfo}${moldeInfo}`;

  if (
    !batchConfirmDialog ||
    !batchConfirmForm ||
    typeof batchConfirmDialog.showModal !== "function"
  ) {
    const confirmed = await openConfirmActionDialog({
      title: "Gerar lote?",
      message: `Confirme a geraÃ§Ã£o do lote da planilha ${prepared.fileName}.`,
      summary,
      confirmLabel: "Gerar lote",
    });
    if (confirmed) {
      void executeBatchGeneration(prepared, { downloadZip });
    }
    return;
  }

  pendingBatchGeneration = { prepared, downloadZip };

  if (batchConfirmMessage) {
    batchConfirmMessage.textContent = `Confirme a geraÃ§Ã£o do lote da planilha ${prepared.fileName}.`;
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

async function executeBatchGeneration(prepared, options = {}) {
  const downloadZip = options.downloadZip !== false;
  if (!prepared || !Array.isArray(prepared.certificates) || !prepared.certificates.length) {
    setBatchStatus("Nenhum lote preparado para geraÃ§Ã£o.", "error");
    return;
  }

  if (downloadZip && !window.JSZip) {
    setBatchStatus("Falha: biblioteca ZIP nÃ£o carregou.", "error");
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

    const zip = downloadZip ? new window.JSZip() : null;

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
        if (zip) {
          zip.file(cert.fileName, pngBlob);
        }
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

    if (downloadZip && successfulCertificates.length && zip) {
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
      const zipFailureLabel = downloadZip ? " e incluidos no ZIP" : "";
      setBatchStatus(
        `Lote concluido com ressalvas: ${successfulCertificates.length} certificado(s) foram concluido(s)${zipFailureLabel}. ${discardedCertificates.length} certificado(s) foram descartado(s) automaticamente apos falha no PNG.${unresolvedCount ? ` ${unresolvedCount} pendente(s) nao puderam ser descartado(s) automaticamente.` : ""} Verifique: ${preview}${suffix}.${ignoredPreview}`,
        "error"
      );
    } else {
      const ignoredPreview = ignoredCount ? ` ${ignoredSummary}` : "";
      const zipSuccessLabel = downloadZip ? " e incluidos no ZIP" : "";
      setBatchStatus(
        `Lote concluido: ${successfulCertificates.length} certificado(s) foram gerado(s), salvos no servidor${zipSuccessLabel} com sucesso.${ignoredPreview}`,
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
    resetBatchPreviewViewOnly();
    if (cargaHInput && typeof cargaHInput.reportValidity === "function") {
      cargaHInput.reportValidity();
    }
    return;
  }

  if (loadedExternalBatch) {
    renderBatchPreview(loadedExternalBatch);
    setBatchStatus(
      `PrÃ©via pronta: ${loadedExternalBatch.certificates.length} certificado(s) carregado(s).`,
      "success"
    );
    return;
  }

  const file = planilhaInput.files && planilhaInput.files[0];
  if (!file) {
    setBatchStatus("Selecione uma planilha para carregar a prÃ©via.", "error");
    resetBatchPreviewViewOnly();
    return;
  }

  try {
    setBatchStatus("Lendo planilha para pre-visualizacao...", "info");
    const prepared = await prepareBatchCertificates(file);
    loadedExternalBatch = prepared;
    syncBatchSourceUi();
    syncGenerateSubmitButton();
    renderBatchPreview(prepared);
    if (prepared.invalidRows.length) {
      const ignoredSummary = buildIgnoredRowsSummary(prepared.invalidRows);
      setBatchStatus(
        `PrÃ©via pronta: ${prepared.certificates.length} linha(s) vÃ¡lida(s). ${ignoredSummary}`,
        prepared.certificates.length ? "info" : "error"
      );
      return;
    }
    setBatchStatus(
      `PrÃ©via pronta: ${prepared.certificates.length} certificado(s) vÃ¡lido(s) em ${prepared.fileName}.`,
      "success"
    );
  } catch (error) {
    console.error(error);
    setBatchStatus(error.message || "Falha ao carregar a prÃ©via da planilha.", "error");
    resetBatchPreviewViewOnly();
  }
}

async function handleBatchGenerate(options = {}) {
  const downloadZip = options.downloadZip !== false;
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
    resetBatchPreviewViewOnly();
    if (cargaHInput && typeof cargaHInput.reportValidity === "function") {
      cargaHInput.reportValidity();
    }
    return;
  }

  const file = planilhaInput.files && planilhaInput.files[0];
  if (!loadedExternalBatch && !file) {
    setBatchStatus("Selecione uma planilha ou carregue respostas de um formulario antes de gerar o lote.", "error");
    resetBatchPreviewViewOnly();
    return;
  }

  try {
    setBatchStatus("Validando lote antes da geracao...", "info");
    if (downloadZip && !window.JSZip) {
      throw new Error("Falha: biblioteca ZIP nao carregou.");
    }
    const prepared = loadedExternalBatch || await prepareBatchCertificates(file);
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
    await openBatchConfirmDialog(prepared, { downloadZip });
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setBatchStatus(error.message || "Falha ao validar o lote.", "error");
  }
}
