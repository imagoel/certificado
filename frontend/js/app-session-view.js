function setAuthenticatedView(authenticated) {
  if (loginShell) loginShell.hidden = authenticated;
  if (appContainer) appContainer.hidden = !authenticated;
  if (appShell) appShell.hidden = !authenticated;
}
function renderSession(session) {
  sessionState = session;
  setAuthenticatedView(true);
  setLoginStatus("", "info");

  if (sessionUser && session && session.usuario) {
    sessionUser.textContent = session.usuario.nome || session.usuario.username || "Usuário";
  }

  const secretarias = Array.isArray(session.secretarias) ? session.secretarias : [];
  const secretariaAtiva = secretarias.find(
    (secretaria) => secretaria.id === session.secretaria_ativa_id
  );
  if (sessionSecretaria) {
    sessionSecretaria.textContent = secretariaAtiva
      ? `Secretaria: ${secretariaAtiva.sigla} - ${secretariaAtiva.nome}`
      : "Nenhuma secretaria ativa selecionada.";
  }
  populateSecretariaOptions(secretariaSelect, secretarias, session.secretaria_ativa_id, false);
  populateCertificateReplyEmailOptions();
  if (canManageCertificateForms(session)) {
    populateCertificateFormSecretarias(session.secretaria_ativa_id || "");
  }
  if (secretariaWrap) secretariaWrap.hidden = secretarias.length <= 1;
  if (sessionSecretaria) sessionSecretaria.hidden = secretarias.length > 1;
  populateSecretariaOptions(
    certFilterSecretariaSelect,
    secretarias,
    certListState.filters.secretariaId,
    true
  );
  if (certFilterSecretariaWrap) {
    certFilterSecretariaWrap.hidden = secretarias.length <= 1;
  }
  populateSecretariaOptions(
    auditSecretariaSelect,
    secretarias,
    auditState.filters.secretariaId,
    true
  );
  if (auditSecretariaWrap) {
    auditSecretariaWrap.hidden = secretarias.length <= 1;
  }
  if (
    certFilterSecretariaSelect &&
    certListState.filters.secretariaId &&
    !Array.from(certFilterSecretariaSelect.options).some(
      (option) => option.value === String(certListState.filters.secretariaId)
    )
  ) {
    certListState.filters.secretariaId = "";
    certFilterSecretariaSelect.value = "";
  }

  syncAdminSectionVisibility(session);
  if (auditTab) {
    auditTab.hidden = !isAdminSession(session);
  }
  if (
    (!isAdminSession(session) && isAdminOnlySection(currentSection)) ||
    (currentSection === "admin" && !canManageVisualAssets(session)) ||
    (currentSection === "emails" && !canManageReplyEmails(session)) ||
    (currentSection === "forms" && !canManageCertificateForms(session))
  ) {
    switchSection("generator");
  }

  syncCertificateFilterInputsFromState();
  syncAuditFilterInputsFromState();
}
async function fetchSession() {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok || !payload || !payload.autenticado) {
    return null;
  }

  return payload;
}
async function refreshSession(message = "") {
  try {
    const session = await fetchSession();
    if (!session) {
      clearSessionUi(message);
      return null;
    }

    renderSession(session);
    await refreshProtectedData({ page: 1 });
    return session;
  } catch (error) {
    console.error(error);
    clearSessionUi("Nao foi possivel validar a sessao.");
    return null;
  }
}
async function handleUnauthorized(message = "Sua sessao expirou. Entre novamente.") {
  clearSessionUi(message);
}
