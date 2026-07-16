async function toggleCertificateFormActive(item) {
  if (!item) return;
  try {
    setCertificateFormStatus(
      item.ativo ? "Desativando formulario..." : "Ativando formulario...",
      "info"
    );
    await apiJsonRequest(`/api/formularios/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ ativo: !item.ativo }),
    });
    setCertificateFormStatus(
      item.ativo ? "Formulario desativado." : "Formulario ativado.",
      "success"
    );
    await loadCertificateForms();
  } catch (error) {
    console.error(error);
    setCertificateFormStatus(error.message || "Nao foi possivel alterar o status.", "error");
  }
}

async
async function deleteCertificateForm(item) {
  if (!item || !isAdminSession()) return;
  const confirmed = await openConfirmActionDialog({
    title: "Excluir formulário?",
    message: `Excluir o formulário "${item.titulo || item.curso || "selecionado"}"?`,
    summary:
      "As respostas coletadas por este formulário serão removidas. Certificados já gerados não serão apagados.",
    confirmLabel: "Excluir formulário",
    danger: true,
  });
  if (!confirmed) return;

  try {
    setCertificateFormStatus("Excluindo formulario...", "info");
    await apiJsonRequest(`/api/formularios/${item.id}`, {
      method: "DELETE",
      body: "{}",
    });
    if (String(formsState.selectedFormId) === String(item.id)) {
      formsState.selectedFormId = "";
      formsState.responses = [];
      renderFormResponsesPanel();
    }
    await loadCertificateForms();
    setCertificateFormStatus("Formulario excluido com sucesso.", "success");
  } catch (error) {
    console.error(error);
    setCertificateFormStatus(error.message || "Nao foi possivel excluir o formulario.", "error");
  }
}
async function loadCertificateForms() {
  if (!certificateFormListBody || !sessionState || !canManageCertificateForms()) return;
  formsState.isLoading = true;
  try {
    const items = await apiJsonRequest("/api/formularios");
    formsState.items = Array.isArray(items) ? items : [];
    renderCertificateFormsTable();
    if (formsState.selectedFormId) {
      const stillExists = formsState.items.some(
        (item) => String(item.id) === String(formsState.selectedFormId)
      );
      if (!stillExists) {
        formsState.selectedFormId = "";
        formsState.responses = [];
        renderFormResponsesPanel();
      }
    }
  } catch (error) {
    console.error(error);
    setCertificateFormStatus(error.message || "Nao foi possivel carregar formularios.", "error");
  } finally {
    formsState.isLoading = false;
  }
}
function renderCertificateFormsTable() {
  if (!certificateFormListBody) return;
  certificateFormListBody.innerHTML = "";

  if (!formsState.items.length) {
    certificateFormListBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Nenhum formulário cadastrado.</td>
      </tr>
    `;
    return;
  }

  formsState.items.forEach((item) => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    const title = document.createElement("strong");
    title.className = "admin-primary-title";
    title.textContent = item.titulo || "-";
    const meta = document.createElement("span");
    meta.className = "table-mobile-meta";
    meta.textContent = `${item.curso || "-"} | ${formatDate(item.concluido)} | ${item.carga_h || 0}h`;
    titleCell.append(title, meta);

    const secretariaCell = document.createElement("td");
    secretariaCell.textContent = item.secretaria_sigla || "-";

    const totalResponses = Number(item.respostas_total) || 0;
    const pendingResponses = Number(item.respostas_pendentes) || 0;
    const responsesCell = document.createElement("td");
    responsesCell.textContent =
      `${totalResponses} resposta${totalResponses === 1 ? "" : "s"} • ` +
      `${pendingResponses} aguardando certificado`;

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = item.ativo ? "badge success" : "badge warning";
    status.textContent = item.ativo ? "Ativo" : "Inativo";
    statusCell.appendChild(status);

    const actionsCell = document.createElement("td");
    actionsCell.className = "actions-cell";
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "inline-actions form-actions";

    const copyBtn = createInlineButton(
      "Copiar link",
      () => {
        void copyFormLink(item, setCertificateFormStatus);
      },
      "secondary-btn compact-action"
    );
    const qrBtn = createInlineButton(
      "QR Code",
      () => {
        void downloadFormQrCode(item, setCertificateFormStatus);
      },
      "secondary-btn compact-action"
    );
    const responsesBtn = createInlineButton(
      "Respostas",
      () => {
        void loadFormResponses(item.id);
      },
      "secondary-btn compact-action"
    );
    const editBtn = createInlineButton(
      "Editar",
      () => {
        fillCertificateFormForm(item);
      },
      "secondary-btn compact-action"
    );

    actionsWrap.append(copyBtn, qrBtn, responsesBtn, editBtn);
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
    menuContent.appendChild(
      createInlineButton(
        "Visualizar formulário",
        () => {
          menu.open = false;
          window.open(item.public_url, "_blank", "noopener,noreferrer");
        },
        "action-menu-item"
      )
    );
    menuContent.appendChild(
      createInlineButton(
        item.ativo ? "Desativar formulário" : "Ativar formulário",
        () => {
          menu.open = false;
          void toggleCertificateFormActive(item);
        },
        "action-menu-item"
      )
    );
    if (isAdminSession()) {
      menuContent.appendChild(
        createInlineButton(
          "Excluir formulário",
          () => {
            menu.open = false;
            void deleteCertificateForm(item);
          },
          "action-menu-item danger-action"
        )
      );
    }
    menu.append(summary, menuContent);
    actionsWrap.appendChild(menu);
    actionsCell.appendChild(actionsWrap);
    row.append(titleCell, secretariaCell, responsesCell, statusCell, actionsCell);
    certificateFormListBody.appendChild(row);
  });
}
