function getSelectedOptionText(select, fallback = "Todos") {
  if (!select) return fallback;
  const selected = select.selectedOptions && select.selectedOptions[0];
  return sanitizeText(selected ? selected.textContent : "") || fallback;
}

function setCertificateReportButtonBusy(busy) {
  if (certExportCsvBtn) certExportCsvBtn.disabled = busy;
}

function getCertificateReportQueryParams(page, perPage) {
  return {
    pagina: page,
    por_pagina: perPage,
    busca: certListState.filters.busca,
    secretaria_id: certListState.filters.secretariaId,
    concluido_de: certListState.filters.concluidoDe,
    concluido_ate: certListState.filters.concluidoAte,
    emitido_de: certListState.filters.emitidoDe,
    emitido_ate: certListState.filters.emitidoAte,
    lixeira: certListState.trashMode ? "true" : "",
  };
}

function getCertificateReportFilters() {
  const concluidoStart = sanitizeText(certListState.filters.concluidoDe);
  const concluidoEnd = sanitizeText(certListState.filters.concluidoAte);
  const emitidoStart = sanitizeText(certListState.filters.emitidoDe);
  const emitidoEnd = sanitizeText(certListState.filters.emitidoAte);
  const periodLabel = (start, end) =>
    start && end
      ? `${formatDate(start)} a ${formatDate(end)}`
      : start
        ? `A partir de ${formatDate(start)}`
        : end
          ? `Até ${formatDate(end)}`
          : "Todos";

  return [
    { label: "Modo", value: certListState.trashMode ? "Lixeira" : "Ativos" },
    { label: "Busca", value: sanitizeText(certListState.filters.busca) || "Todas" },
    { label: "Secretaria", value: getSelectedOptionText(certFilterSecretariaSelect, "Todas") },
    { label: "Conclusão", value: periodLabel(concluidoStart, concluidoEnd) },
    { label: "Emissão", value: periodLabel(emitidoStart, emitidoEnd) },
  ];
}

async function fetchCertificateReportItems() {
  readCertificateFiltersFromInputs();
  updateCertificateQuickFilterButtons();

  const perPage = 100;
  let page = 1;
  let totalPages = 1;
  let total = 0;
  const items = [];

  do {
    const payload = await apiJsonRequest(
      `/api/certificados${buildQueryString(getCertificateReportQueryParams(page, perPage))}`
    );
    const pageItems = Array.isArray(payload.itens) ? payload.itens : [];
    items.push(...pageItems);
    total = payload.total || items.length;
    totalPages = payload.paginas || 1;
    page += 1;
  } while (page <= totalPages);

  return {
    items,
    total,
    filters: getCertificateReportFilters(),
    generatedAt: new Date(),
  };
}

function getCertificateReportRow(item) {
  return [
    item.codigo || "-",
    item.nome || "-",
    item.cpf || "-",
    item.email || "-",
    item.curso || "-",
    String(item.carga_h || 0),
    formatDate(item.concluido),
    formatDateTime(item.emitido_em),
    item.emitido_por_username || "-",
    item.secretaria_sigla || "-",
    item.secretaria_nome || "-",
    item.url_validacao || "-",
  ];
}

function buildCertificateCsvReport(report) {
  const headers = [
    "Código",
    "Participante",
    "CPF",
    "Email",
    "Curso",
    "Carga horária",
    "Data de conclusão",
    "Emitido em",
    "Emitido por",
    "Secretaria",
    "Nome da secretaria",
    "URL de validação",
  ];
  const rows = report.items.map(getCertificateReportRow);

  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\r\n")}`;
}

async function exportCertificateCsvReport() {
  if (!sessionState) return;
  setCertificateReportButtonBusy(true);
  setCertListStatus("Gerando relatório CSV dos certificados...", "info");

  try {
    const report = await fetchCertificateReportItems();
    const csv = buildCertificateCsvReport(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `relatorio-certificados-${buildTimestamp()}.csv`);
    setCertListStatus(`Relatório CSV gerado com ${report.total} certificado(s).`, "info");
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setCertListStatus((error && error.message) || "Não foi possível gerar o relatório.", "error");
  } finally {
    setCertificateReportButtonBusy(false);
  }
}

