async function loadCertificates(page = certListState.page) {
  if (!sessionState) return;

  certListState.page = page;
  syncCertificateFilterInputsFromState();
  const trashMode = Boolean(certListState.trashMode);
  setCertListStatus(
    trashMode ? "Carregando certificados na lixeira..." : "Carregando certificados...",
    "info"
  );

  try {
    const payload = await apiJsonRequest(
      `/api/certificados${buildQueryString({
        pagina: certListState.page,
        por_pagina: certListState.perPage,
        lixeira: trashMode ? "true" : "",
        busca: certListState.filters.busca,
        secretaria_id: certListState.filters.secretariaId,
        concluido_de: certListState.filters.concluidoDe,
        concluido_ate: certListState.filters.concluidoAte,
        emitido_de: certListState.filters.emitidoDe,
        emitido_ate: certListState.filters.emitidoAte,
      })}`
    );

    certListState.total = payload.total || 0;
    certListState.totalPages = payload.paginas || 1;
    renderCertificateRows(payload.itens || []);

    if (certListSummary) {
      certListSummary.textContent = trashMode
        ? `${certListState.total} certificado(s) na lixeira`
        : `${certListState.total} certificado(s) encontrado(s)`;
    }
    if (certPageIndicator) {
      certPageIndicator.textContent = `Página ${payload.pagina} de ${payload.paginas}`;
    }
    if (certPrevPageBtn) certPrevPageBtn.disabled = payload.pagina <= 1;
    if (certNextPageBtn) certNextPageBtn.disabled = payload.pagina >= payload.paginas;
    setCertListStatus("", "info");
  } catch (error) {
    console.error(error);
    if (unresolvedCertificates.size) {
      await cleanupPendingCertificates(Array.from(unresolvedCertificates.values()));
    }
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setCertListStatus(
      (error && error.message) || "Nao foi possivel carregar os certificados.",
      "error"
    );
  }
}

async function loadAuditEvents(page = auditState.page) {
  if (!sessionState || !isAdminSession()) return;

  auditState.page = page;
  syncAuditFilterInputsFromState();
  setAuditStatus("Carregando auditoria...", "info");

  try {
    const payload = await apiJsonRequest(
      `/api/admin/auditoria${buildQueryString({
        pagina: auditState.page,
        por_pagina: auditState.perPage,
        busca: auditState.filters.busca,
        evento: auditState.filters.evento,
        secretaria_id: auditState.filters.secretariaId,
        criado_de: auditState.filters.criadoDe,
        criado_ate: auditState.filters.criadoAte,
      })}`
    );

    auditState.total = payload.total || 0;
    auditState.totalPages = payload.paginas || 1;
    renderAuditRows(payload.itens || []);
    if (auditSummary) {
      auditSummary.textContent = `${auditState.total} evento(s)`;
    }
    if (auditPageIndicator) {
      auditPageIndicator.textContent = `Página ${payload.pagina} de ${payload.paginas}`;
    }
    if (auditPrevPageBtn) auditPrevPageBtn.disabled = payload.pagina <= 1;
    if (auditNextPageBtn) auditNextPageBtn.disabled = payload.pagina >= payload.paginas;
    setAuditStatus("", "info");
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    if (error && error.status === 403) {
      if (auditListBody) {
        auditListBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">A auditoria é restrita ao administrador.</td>
          </tr>
        `;
      }
      if (auditTab) auditTab.hidden = true;
      if (currentSection === "audit") switchSection("generator");
      return;
    }
    setAuditStatus(
      (error && error.message) || "Nao foi possivel carregar a auditoria.",
      "error"
    );
  }
}
