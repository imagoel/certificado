
function getAuditReportFilters() {
  const periodStart = sanitizeText(auditState.filters.criadoDe);
  const periodEnd = sanitizeText(auditState.filters.criadoAte);
  const period =
    periodStart && periodEnd
      ? `${formatDate(periodStart)} a ${formatDate(periodEnd)}`
      : periodStart
        ? `A partir de ${formatDate(periodStart)}`
        : periodEnd
          ? `Até ${formatDate(periodEnd)}`
          : "Todos";

  return [
    { label: "Busca", value: sanitizeText(auditState.filters.busca) || "Todas" },
    { label: "Evento", value: getSelectedOptionText(auditEventSelect, "Todos") },
    { label: "Secretaria", value: getSelectedOptionText(auditSecretariaSelect, "Todas") },
    { label: "Período", value: period },
  ];
}

function getAuditReportQueryParams(page, perPage) {
  return {
    pagina: page,
    por_pagina: perPage,
    busca: auditState.filters.busca,
    evento: auditState.filters.evento,
    secretaria_id: auditState.filters.secretariaId,
    criado_de: auditState.filters.criadoDe,
    criado_ate: auditState.filters.criadoAte,
  };
}

async function fetchAuditReportEvents() {
  readAuditFiltersFromInputs();
  updateAuditQuickFilterButtons();

  const perPage = 100;
  let page = 1;
  let totalPages = 1;
  let total = 0;
  const items = [];

  do {
    const payload = await apiJsonRequest(
      `/api/admin/auditoria${buildQueryString(getAuditReportQueryParams(page, perPage))}`
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
    filters: getAuditReportFilters(),
    generatedAt: new Date(),
  };
}

function getAuditReportRow(item) {
  return [
    formatDateTime(item.criado_em),
    item.evento || "-",
    item.usuario_username || item.usuario_nome || "-",
    item.secretaria_sigla || "-",
    item.certificado_codigo || "-",
    item.entidade_tipo || "-",
    item.descricao || "-",
  ];
}

function escapeCsvCell(value) {
  const text = String(value === null || value === undefined ? "" : value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildAuditCsvReport(report) {
  const headers = ["Quando", "Evento", "Usuário", "Secretaria", "Certificado", "Entidade", "Detalhes"];
  const rows = report.items.map(getAuditReportRow);
  const metaRows = [
    ["Relatório de auditoria"],
    ["Gerado em", formatDateTime(report.generatedAt.toISOString())],
    ["Total de eventos", String(report.total)],
    ...report.filters.map((filter) => [filter.label, filter.value]),
    [],
  ];

  return `\uFEFF${[...metaRows, headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\r\n")}`;
}

function escapeHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAuditPrintReportHtml(report) {
  const filtersHtml = report.filters
    .map(
      (filter) => `
        <div class="filter-item">
          <span>${escapeHtml(filter.label)}</span>
          <strong>${escapeHtml(filter.value)}</strong>
        </div>
      `
    )
    .join("");

  const rowsHtml = report.items.length
    ? report.items
        .map((item) => {
          const row = getAuditReportRow(item);
          return `
            <tr>
              ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="7" class="empty">Nenhum evento encontrado.</td></tr>';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de auditoria</title>
  <style>
    body { margin: 28px; color: #112031; font-family: Arial, sans-serif; }
    header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #1a4f8b; padding-bottom: 14px; margin-bottom: 18px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    p { margin: 0; color: #526781; }
    .total { align-self: flex-start; padding: 8px 12px; border-radius: 8px; background: #eef5ff; color: #1a4f8b; font-weight: 700; white-space: nowrap; }
    .filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 18px; }
    .filter-item { border: 1px solid #d9e3ef; border-radius: 8px; padding: 8px 10px; }
    .filter-item span { display: block; color: #5a6b7b; font-size: 12px; }
    .filter-item strong { display: block; margin-top: 2px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #d9e3ef; padding: 8px 7px; text-align: left; vertical-align: top; }
    th { background: #f7fbff; color: #1a4f8b; }
    .empty { text-align: center; color: #5a6b7b; padding: 18px; }
    @media print {
      body { margin: 16mm; }
      header { break-inside: avoid; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Relatório de auditoria</h1>
      <p>Gerado em ${escapeHtml(formatDateTime(report.generatedAt.toISOString()))}</p>
    </div>
    <div class="total">${escapeHtml(String(report.total))} evento(s)</div>
  </header>
  <section class="filters">${filtersHtml}</section>
  <table>
    <thead>
      <tr>
        <th>Quando</th>
        <th>Evento</th>
        <th>Usuário</th>
        <th>Secretaria</th>
        <th>Certificado</th>
        <th>Entidade</th>
        <th>Detalhes</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <script>
    window.addEventListener("load", () => setTimeout(() => window.print(), 250));
  </script>
</body>
</html>`;
}

function writeAuditReportLoading(reportWindow) {
  if (!reportWindow) return;
  reportWindow.document.open();
  reportWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head><meta charset="UTF-8" /><title>Gerando relatório</title></head>
      <body style="font-family: Arial, sans-serif; padding: 28px;">Gerando relatório de auditoria...</body>
    </html>
  `);
  reportWindow.document.close();
}

async function exportAuditCsvReport() {
  if (!sessionState || !isAdminSession()) return;
  setAuditReportButtonsBusy(true);
  setAuditStatus("Gerando relatório CSV da auditoria...", "info");

  try {
    const report = await fetchAuditReportEvents();
    const csv = buildAuditCsvReport(report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `relatorio-auditoria-${buildTimestamp()}.csv`);
    setAuditStatus(`Relatório CSV gerado com ${report.total} evento(s).`, "info");
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setAuditStatus((error && error.message) || "Não foi possível gerar o relatório.", "error");
  } finally {
    setAuditReportButtonsBusy(false);
  }
}

async function printAuditReport(reportWindow) {
  if (!sessionState || !isAdminSession()) return;
  setAuditReportButtonsBusy(true);
  setAuditStatus("Gerando relatório para impressão...", "info");

  try {
    const report = await fetchAuditReportEvents();
    reportWindow.document.open();
    reportWindow.document.write(buildAuditPrintReportHtml(report));
    reportWindow.document.close();
    reportWindow.focus();
    setAuditStatus(`Relatório para impressão gerado com ${report.total} evento(s).`, "info");
  } catch (error) {
    console.error(error);
    if (reportWindow && !reportWindow.closed) {
      reportWindow.close();
    }
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setAuditStatus((error && error.message) || "Não foi possível gerar o relatório.", "error");
  } finally {
    setAuditReportButtonsBusy(false);
  }
}
