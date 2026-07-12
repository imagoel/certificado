function renderAuditRows(items) {
  if (!auditListBody) return;

  if (!items.length) {
    auditListBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Nenhum evento de auditoria encontrado.</td>
      </tr>
    `;
    return;
  }

  auditListBody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    const whenCell = document.createElement("td");
    whenCell.textContent = formatDateTime(item.criado_em);

    const eventCell = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = "code-chip";
    chip.textContent = item.evento || "-";
    eventCell.appendChild(chip);

    const userCell = document.createElement("td");
    userCell.textContent = item.usuario_username || item.usuario_nome || "-";

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const certCell = document.createElement("td");
    certCell.textContent = item.certificado_codigo || "-";

    const detailsCell = document.createElement("td");
    detailsCell.textContent = item.descricao || "-";

    row.append(whenCell, eventCell, userCell, secretariaCell, certCell, detailsCell);
    auditListBody.appendChild(row);
  });
}

function setAuditReportButtonsBusy(busy) {
  if (auditExportCsvBtn) auditExportCsvBtn.disabled = busy;
  if (auditPrintReportBtn) auditPrintReportBtn.disabled = busy;
}
