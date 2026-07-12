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
