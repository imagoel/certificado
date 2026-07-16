function clearCertificateSelection() {
  if (certListState.selectedCodes) {
    certListState.selectedCodes.clear();
  }
  syncCertificateBulkSelectionUi();
}

function getCertificateSelectionCheckboxes() {
  if (!certListBody) return [];
  return Array.from(certListBody.querySelectorAll(".cert-row-select"));
}

function syncCertificateBulkSelectionUi() {
  const canSelect = isAdminSession() && !certListState.trashMode;
  const selectedCount = certListState.selectedCodes ? certListState.selectedCodes.size : 0;
  const selectHeader = certSelectAllInput ? certSelectAllInput.closest("th") : null;
  const visibleCheckboxes = getCertificateSelectionCheckboxes();
  const checkedVisibleCount = visibleCheckboxes.filter((checkbox) => checkbox.checked).length;

  if (selectHeader) selectHeader.hidden = !canSelect;
  if (certSelectAllInput) {
    certSelectAllInput.disabled = !canSelect || !visibleCheckboxes.length;
    certSelectAllInput.checked =
      canSelect && visibleCheckboxes.length > 0 && checkedVisibleCount === visibleCheckboxes.length;
    certSelectAllInput.indeterminate =
      canSelect && checkedVisibleCount > 0 && checkedVisibleCount < visibleCheckboxes.length;
  }

  if (certBulkTrashBtn) {
    certBulkTrashBtn.hidden = !canSelect || selectedCount < 1;
    certBulkTrashBtn.disabled = !canSelect || selectedCount < 1;
    certBulkTrashBtn.textContent =
      selectedCount > 1 ? `Mover selecionados (${selectedCount})` : "Mover selecionado";
  }
}

function renderCertificateRows(items) {
  if (!certListBody) return;
  const trashMode = Boolean(certListState.trashMode);
  const canSelect = isAdminSession() && !trashMode;

  if (!items.length) {
    certListBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">${
          trashMode
            ? "Nenhum certificado na lixeira."
            : "Nenhum certificado encontrado com os filtros atuais."
        }</td>
      </tr>
    `;
    syncCertificateBulkSelectionUi();
    return;
  }

  certListBody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    const selectCell = document.createElement("td");
    selectCell.className = "cert-col-select";
    selectCell.hidden = !canSelect;
    if (canSelect) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "cert-row-select";
      checkbox.value = item.codigo || "";
      checkbox.setAttribute("aria-label", `Selecionar certificado ${item.codigo || ""}`);
      checkbox.checked = certListState.selectedCodes.has(item.codigo);
      checkbox.addEventListener("change", () => {
        const code = sanitizeText(checkbox.value).toUpperCase();
        if (!code) return;
        if (checkbox.checked) {
          certListState.selectedCodes.add(code);
        } else {
          certListState.selectedCodes.delete(code);
        }
        syncCertificateBulkSelectionUi();
      });
      selectCell.appendChild(checkbox);
    }

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
      selectCell,
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
  syncCertificateBulkSelectionUi();
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
