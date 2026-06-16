
function getFriendlyEmailError(errorMessage) {
  const message = sanitizeText(errorMessage);
  const normalized = message.toLowerCase();
  if (!message) return "Nao foi possivel enviar o e-mail.";
  if (normalized.includes("desativado")) return "Envio de e-mail desativado.";
  if (normalized.includes("secretaria sem email")) {
    return "Secretaria sem e-mail de resposta.";
  }
  if (normalized.includes("smtp") || normalized.includes("login")) {
    return "Configuracao de envio precisa ser verificada.";
  }
  if (normalized.includes("arquivo") || normalized.includes("png")) {
    return "PNG do certificado nao encontrado.";
  }
  return "Nao foi possivel enviar. Verifique o e-mail ou a configuracao de envio.";
}

function getCertificateEmailDeliveryState(item) {
  if (!item || !item.email) {
    return {
      label: "Nao enviado",
      className: "is-muted",
      title: "Nenhum e-mail cadastrado para este participante.",
    };
  }

  const replyTo = item.email_reply_to || item.reply_to_email || "";
  const details = [];
  if (item.email_tentativa_em) {
    details.push(`Ultima tentativa: ${formatDateTime(item.email_tentativa_em)}`);
  }
  if (replyTo) details.push(`Respostas para: ${replyTo}`);

  if (item.email_envio_status === "enviado") {
    if (item.email_enviado_em) {
      details.unshift(`Enviado em: ${formatDateTime(item.email_enviado_em)}`);
    }
    return {
      label: "Enviado",
      className: "is-sent",
      title: details.join("\n") || "E-mail enviado com sucesso.",
    };
  }

  if (item.email_envio_status === "falhou") {
    details.push(`Motivo: ${getFriendlyEmailError(item.email_erro)}`);
    return {
      label: "Falha no envio",
      className: "is-error",
      title: details.join("\n"),
    };
  }

  return {
    label: "Pendente",
    className: "is-pending",
    title: "E-mail cadastrado, mas ainda sem tentativa de envio.",
  };
}

function buildCertificateEmailStatusBadge(item) {
  const state = getCertificateEmailDeliveryState(item);
  const badge = document.createElement("span");
  badge.className = `cert-email-status-badge ${state.className}`;
  badge.textContent = state.label;
  badge.title = state.title;
  return badge;
}

function canResendCertificateEmail(item) {
  if (!item || certListState.trashMode) return false;
  return Boolean(
    item.email &&
      (item.arquivo_disponivel || item.arquivo_admin_url || item.arquivo_url)
  );
}

function resetActionMenuPosition(menu) {
  const menuContent = menu ? menu.querySelector(".action-menu-content") : null;
  if (!menuContent) return;
  menuContent.style.left = "";
  menuContent.style.top = "";
}

function positionActionMenu(menu) {
  const trigger = menu ? menu.querySelector(".action-menu-trigger") : null;
  const menuContent = menu ? menu.querySelector(".action-menu-content") : null;
  if (!menu || !menu.open || !trigger || !menuContent) return;

  const margin = 8;
  const triggerRect = trigger.getBoundingClientRect();
  const contentRect = menuContent.getBoundingClientRect();
  const left = Math.min(
    Math.max(margin, triggerRect.right - contentRect.width),
    window.innerWidth - contentRect.width - margin
  );
  const shouldOpenAbove = triggerRect.bottom + 6 + contentRect.height > window.innerHeight;
  const top = shouldOpenAbove
    ? Math.max(margin, triggerRect.top - contentRect.height - 6)
    : Math.min(
        triggerRect.bottom + 6,
        window.innerHeight - contentRect.height - margin
      );

  menuContent.style.left = `${left}px`;
  menuContent.style.top = `${top}px`;
}

function closeOpenActionMenus(exceptMenu = null) {
  document.querySelectorAll(".action-menu[open]").forEach((menu) => {
    if (menu !== exceptMenu) {
      menu.open = false;
      resetActionMenuPosition(menu);
    }
  });
}

function positionOpenActionMenus() {
  document.querySelectorAll(".action-menu[open]").forEach((menu) => {
    positionActionMenu(menu);
  });
}

document.addEventListener("click", (event) => {
  if (event.target && event.target.closest && event.target.closest(".action-menu")) return;
  closeOpenActionMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeOpenActionMenus();
});

window.addEventListener("resize", positionOpenActionMenus);
window.addEventListener("scroll", positionOpenActionMenus, true);

function renderCertificateRows(items) {
  if (!certListBody) return;
  const trashMode = Boolean(certListState.trashMode);

  if (!items.length) {
    certListBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">${
          trashMode
            ? "Nenhum certificado na lixeira."
            : "Nenhum certificado encontrado com os filtros atuais."
        }</td>
      </tr>
    `;
    return;
  }

  certListBody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    const codeCell = document.createElement("td");
    codeCell.className = "cert-col-code";
    const codeChip = document.createElement("span");
    codeChip.className = "code-chip";
    codeChip.textContent = item.codigo || "-";
    codeCell.appendChild(codeChip);

    const nameCell = document.createElement("td");
    nameCell.className = "cert-name-cell";

    const nameTitle = document.createElement("strong");
    nameTitle.className = "cert-name-title";
    nameTitle.textContent = item.nome || "-";

    const nameMeta = document.createElement("div");
    nameMeta.className = "table-mobile-meta";
    const mobileMeta = [
      `Secretaria: ${item.secretaria_sigla || "-"}`,
      `Conclusão: ${formatDate(item.concluido)}`,
      `Emitido em: ${formatDateTime(item.emitido_em)}`,
      `Emitido por: ${item.emitido_por_username || "-"}`,
    ];
    if (item.email) {
      mobileMeta.unshift(`Email: ${item.email}`);
    }
    mobileMeta.unshift(`E-mail: ${getCertificateEmailDeliveryState(item).label}`);
    if (trashMode) {
      mobileMeta.push(
        `Excluido em: ${formatDateTime(item.excluido_em)}`,
        `Expira em: ${formatDateTime(item.exclusao_expira_em)}`,
        `Excluido por: ${item.excluido_por_username || "-"}`
      );
    }
    mobileMeta.forEach((text) => {
      const metaLine = document.createElement("span");
      metaLine.className = "table-mobile-meta-item";
      metaLine.textContent = text;
      nameMeta.appendChild(metaLine);
    });

    const emailMeta = document.createElement("span");
    emailMeta.className = "cert-email-meta";
    emailMeta.textContent = item.email || "";

    if (trashMode) {
      const trashMeta = document.createElement("span");
      trashMeta.className = "cert-trash-meta";
      trashMeta.textContent =
        `Na lixeira desde ${formatDateTime(item.excluido_em)}. ` +
        `Expira em ${formatDateTime(item.exclusao_expira_em)}.`;
      nameCell.append(nameTitle);
      if (item.email) nameCell.appendChild(emailMeta);
      nameCell.append(trashMeta, nameMeta);
    } else {
      nameCell.append(nameTitle);
      if (item.email) nameCell.appendChild(emailMeta);
      nameCell.appendChild(nameMeta);
    }

    const courseCell = document.createElement("td");
    courseCell.className = "cert-col-course";
    courseCell.textContent = item.curso || "-";

    const secretariaCell = document.createElement("td");
    secretariaCell.className = "cert-col-secondary";
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const concluidoCell = document.createElement("td");
    concluidoCell.className = "cert-col-secondary";
    concluidoCell.textContent = formatDate(item.concluido);

    const emittedCell = document.createElement("td");
    emittedCell.className = "cert-col-secondary";
    emittedCell.textContent = formatDateTime(item.emitido_em);

    const emittedByCell = document.createElement("td");
    emittedByCell.className = "cert-col-secondary";
    emittedByCell.textContent = item.emitido_por_username || "-";

    const emailStatusCell = document.createElement("td");
    emailStatusCell.className = "cert-col-email-status";
    emailStatusCell.appendChild(buildCertificateEmailStatusBadge(item));

    const actionsCell = document.createElement("td");
    actionsCell.className = "cert-col-actions";
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions cert-actions";

    if (trashMode) {
      const pngButton = createIconButton("Abrir PNG interno", "download", () => {
        if (item.arquivo_admin_url) {
          window.open(item.arquivo_admin_url, "_blank", "noopener,noreferrer");
        }
      });
      pngButton.disabled = !item.arquivo_admin_url;
      actionsWrap.appendChild(pngButton);
      actionsWrap.appendChild(
        createInlineButton("Restaurar", () => {
          void restoreCertificate(item);
        })
      );
    } else {
      actionsWrap.appendChild(
        createIconButton("Validar certificado", "eye", () => {
          window.open(item.url_validacao, "_blank", "noopener,noreferrer");
        })
      );

      const pngButton = createIconButton("Abrir PNG", "download", () => {
        if (item.arquivo_admin_url || item.arquivo_url) {
          window.open(
            item.arquivo_admin_url || item.arquivo_url,
            "_blank",
            "noopener,noreferrer"
          );
        }
      });
      pngButton.disabled = !(item.arquivo_admin_url || item.arquivo_url);
      actionsWrap.appendChild(pngButton);
    }

    const canResendEmail = canResendCertificateEmail(item);
    if (!trashMode && (isAdminSession() || canResendEmail)) {
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

      if (canResendEmail) {
        const resendButton = createInlineButton(
          "Reenviar e-mail",
          () => {
            menu.open = false;
            openResendEmailDialog(item);
          },
          "action-menu-item"
        );
        menuContent.appendChild(resendButton);
      }

      if (isAdminSession()) {
        const editButton = createInlineButton(
          "Editar",
          () => {
            menu.open = false;
            void openCertificateEditMode(item);
          },
          "action-menu-item"
        );
        const deleteButton = createInlineButton(
          "Mover para lixeira",
          () => {
            menu.open = false;
            openDeleteCertificateDialog(item);
          },
          "action-menu-item danger-action"
        );
        menuContent.appendChild(editButton);
        menuContent.appendChild(deleteButton);
      }

      menu.append(summary, menuContent);
      actionsWrap.appendChild(menu);
    }

    actionsCell.appendChild(actionsWrap);

    row.append(
      codeCell,
      nameCell,
      courseCell,
      secretariaCell,
      concluidoCell,
      emittedCell,
      emittedByCell,
      emailStatusCell,
      actionsCell
    );

    certListBody.appendChild(row);
  });
}

async function resendCertificateEmail(item) {
  if (!item || !item.codigo || !canResendCertificateEmail(item)) return;

  try {
    setCertListStatus(`Reenviando e-mail do certificado ${item.codigo}...`, "info");
    const payload = await apiJsonRequest(
      `/api/certificados/${encodeURIComponent(item.codigo)}/reenviar-email`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
    await loadCertificates(certListState.page || 1);
    if (isAdminSession()) {
      await loadAuditEvents(1);
    }

    if (payload && payload.email_envio_status === "enviado") {
      setCertListStatus(`E-mail do certificado ${item.codigo} enviado com sucesso.`, "success");
    } else {
      setCertListStatus(
        `Tentativa registrada para ${item.codigo}, mas o e-mail nao foi enviado.`,
        "error"
      );
    }
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setCertListStatus(
      (error && error.message) || "Nao foi possivel reenviar o e-mail.",
      "error"
    );
  }
}

async function restoreCertificate(item) {
  if (!item || !item.codigo || !isAdminSession()) return;

  const confirmed = await openConfirmActionDialog({
    title: "Restaurar certificado?",
    message: `O certificado de ${item.nome || "participante selecionado"} voltará para a lista ativa.`,
    summary: "O link de validação voltará a funcionar após a restauração.",
    confirmLabel: "Restaurar certificado",
  });
  if (!confirmed) return;

  try {
    setCertListStatus(`Restaurando ${item.codigo}...`, "info");
    const payload = await apiJsonRequest(
      `/api/admin/certificados/${encodeURIComponent(item.codigo)}/restaurar`,
      { method: "POST" }
    );
    const currentPage = certListState.page || 1;
    const remainingTotal = Math.max(0, (certListState.total || 0) - 1);
    const maxPageAfterRestore = Math.max(
      1,
      Math.ceil(remainingTotal / certListState.perPage)
    );

    setCertListStatus(
      (payload && payload.message) || `Certificado ${item.codigo} restaurado com sucesso.`,
      "success"
    );
    await loadCertificates(Math.min(currentPage, maxPageAfterRestore));
    await loadAuditEvents(1);
  } catch (error) {
    console.error(error);
    if (error && error.status === 401) {
      await handleUnauthorized();
      return;
    }
    setCertListStatus(
      (error && error.message) || "Nao foi possivel restaurar o certificado.",
      "error"
    );
  }
}

function renderUsersTable() {
  if (!userListBody) return;

  if (!adminState.users.length) {
    userListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhum usuário cadastrado.</td>
      </tr>
    `;
    return;
  }

  userListBody.innerHTML = "";

  adminState.users.forEach((usuario) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = usuario.nome || "-";

    const usernameCell = document.createElement("td");
    usernameCell.textContent = usuario.username || "-";

    const roleCell = document.createElement("td");
    roleCell.textContent = usuario.papel || "-";

    const secretariasCell = document.createElement("td");
    secretariasCell.textContent = (usuario.secretarias || []).length
      ? usuario.secretarias.map((secretaria) => secretaria.sigla).join(", ")
      : "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(usuario.ativo));

    const loginCell = document.createElement("td");
    loginCell.textContent = formatDateTime(usuario.ultimo_login_em);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillUserForm(usuario);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          void deleteUser(usuario);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(
      nameCell,
      usernameCell,
      roleCell,
      secretariasCell,
      statusCell,
      loginCell,
      actionsCell
    );
    userListBody.appendChild(row);
  });
}

function renderSecretariasTable() {
  if (!secretariaListBody) return;

  if (!adminState.secretarias.length) {
    secretariaListBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">Nenhuma secretaria cadastrada.</td>
      </tr>
    `;
    return;
  }

  secretariaListBody.innerHTML = "";

  adminState.secretarias.forEach((secretaria) => {
    const row = document.createElement("tr");

    const siglaCell = document.createElement("td");
    siglaCell.textContent = secretaria.sigla || "-";

    const nomeCell = document.createElement("td");
    const nomeTitle = document.createElement("strong");
    nomeTitle.className = "admin-primary-title";
    nomeTitle.textContent = secretaria.nome || "-";
    nomeCell.appendChild(nomeTitle);

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(secretaria.ativa));

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillSecretariaForm(secretaria);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        () => {
          void deleteSecretaria(secretaria);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(siglaCell, nomeCell, statusCell, actionsCell);
    secretariaListBody.appendChild(row);
  });
}

function renderTemplatesTable() {
  if (!templateAdminListBody) return;

  if (!adminState.templates.length) {
    templateAdminListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhum molde cadastrado até o momento.</td>
      </tr>
    `;
    return;
  }

  templateAdminListBody.innerHTML = "";

  adminState.templates.forEach((template) => {
    const row = document.createElement("tr");

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = template.secretaria_sigla || "-";

    const nomeCell = document.createElement("td");
    nomeCell.textContent = template.nome || "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(template.ativo));

    const defaultCell = document.createElement("td");
    defaultCell.appendChild(buildStatusPill(template.padrao, "Padrão", "Opcional"));

    const titleCell = document.createElement("td");
    titleCell.appendChild(
      buildStatusPill(
        template.ocultar_titulo_certificado,
        "No molde",
        "Gerado"
      )
    );

    const orderCell = document.createElement("td");
    orderCell.textContent = String(template.ordem || 0);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Abrir", () => {
        window.open(template.arquivo_url, "_blank", "noopener,noreferrer");
      })
    );
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillTemplateAdminForm(template);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        async () => {
          const confirmado = await openConfirmActionDialog({
            title: "Excluir molde?",
            message: `O molde ${template.nome} será removido da secretaria ${template.secretaria_sigla}.`,
            summary: "Esta ação remove o molde cadastrado e não altera certificados já emitidos.",
            confirmLabel: "Excluir molde",
            danger: true,
          });
          if (!confirmado) return;
          void deleteTemplate(template);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(
      secretariaCell,
      nomeCell,
      statusCell,
      defaultCell,
      titleCell,
      orderCell,
      actionsCell
    );
    templateAdminListBody.appendChild(row);
  });
}

function renderSecretariaAssetsTable() {
  if (!secretariaAssetListBody) return;

  const filteredAssets = adminState.secretariaAssets.filter(
    (asset) => asset.tipo === adminUiState.assetTypeFilter
  );

  if (!filteredAssets.length) {
    const emptyMessages = {
      logo: "Nenhuma logo cadastrada ate o momento.",
      assinatura: "Nenhuma assinatura cadastrada ate o momento.",
      instituicao: "Nenhuma instituicao cadastrada ate o momento.",
      selo: "Nenhum selo cadastrado ate o momento.",
    };
    secretariaAssetListBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">${emptyMessages[adminUiState.assetTypeFilter] || emptyMessages.logo}</td>
      </tr>
    `;
    return;
  }

  secretariaAssetListBody.innerHTML = "";

  filteredAssets.forEach((asset) => {
    const row = document.createElement("tr");

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = asset.secretaria_sigla || "-";

    const tipoCell = document.createElement("td");
    const tipoPill = document.createElement("span");
    tipoPill.className = "asset-type-pill";
    tipoPill.textContent = getSecretariaAssetDisplayLabel(asset.tipo, true) || "-";
    tipoCell.appendChild(tipoPill);

    const nomeCell = document.createElement("td");
    nomeCell.textContent = asset.nome || "-";

    const statusCell = document.createElement("td");
    statusCell.appendChild(buildStatusPill(asset.ativo));

    const defaultCell = document.createElement("td");
    defaultCell.appendChild(buildStatusPill(asset.padrao, "Padrão", "Opcional"));

    const orderCell = document.createElement("td");
    orderCell.textContent = String(asset.ordem || 0);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions";
    actionsWrap.appendChild(
      createInlineButton("Abrir", () => {
        window.open(asset.arquivo_url, "_blank", "noopener,noreferrer");
      })
    );
    actionsWrap.appendChild(
      createInlineButton("Editar", () => {
        fillSecretariaAssetForm(asset);
        switchSection("admin");
      })
    );
    actionsWrap.appendChild(
      createInlineButton(
        "Excluir",
        async () => {
          const confirmado = await openConfirmActionDialog({
            title: "Excluir item visual?",
            message: `${capitalizeLabel(getSecretariaAssetDisplayLabel(asset.tipo))} ${asset.nome} será removida da secretaria ${asset.secretaria_sigla}.`,
            summary: "Esta ação remove o item cadastrado e não altera certificados já emitidos.",
            confirmLabel: "Excluir item",
            danger: true,
          });
          if (!confirmado) return;
          await deleteSecretariaAsset(asset);
        },
        "danger-btn"
      )
    );
    actionsCell.appendChild(actionsWrap);

    row.append(secretariaCell, tipoCell, nomeCell, statusCell, defaultCell, orderCell, actionsCell);
    secretariaAssetListBody.appendChild(row);
  });
}

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
