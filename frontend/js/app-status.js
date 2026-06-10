function setLoginStatus(message, type = "info") {
  if (!loginStatus) return;

  if (!message) {
    loginStatus.textContent = "";
    loginStatus.className = "status";
    return;
  }

  loginStatus.textContent = message;
  loginStatus.className = `status ${type}`;
}

function setStatusMessage(element, message, type = "info") {
  if (!element) return;

  if (!message) {
    element.textContent = "";
    element.className = "status";
    return;
  }

  element.textContent = message;
  element.className = `status ${type}`;
}

function setTemplateSelectStatus(message, type = "info") {
  setStatusMessage(templateSelectStatus, message, type);
}

function setTemplateAdminStatus(message, type = "info") {
  setStatusMessage(templateAdminStatus, message, type);
}

function setLogoSelectStatus(message, type = "info") {
  setStatusMessage(logoSelectStatus, message, type);
}

function setAssinaturaSelectStatus(message, type = "info") {
  setStatusMessage(assinaturaSelectStatus, message, type);
}

function setAssinatura2SelectStatus(message, type = "info") {
  setStatusMessage(assinatura2SelectStatus, message, type);
}

function setAssinatura3SelectStatus(message, type = "info") {
  setStatusMessage(assinatura3SelectStatus, message, type);
}

function setSelo1SelectStatus(message, type = "info") {
  setStatusMessage(selo1SelectStatus, message, type);
}

function setSelo2SelectStatus(message, type = "info") {
  setStatusMessage(selo2SelectStatus, message, type);
}

function setSelo3SelectStatus(message, type = "info") {
  setStatusMessage(selo3SelectStatus, message, type);
}

function setSelo4SelectStatus(message, type = "info") {
  setStatusMessage(selo4SelectStatus, message, type);
}

function setInstituicaoSelectStatus(message, type = "info") {
  setStatusMessage(instituicaoSelectStatus, message, type);
}

function setLogoStatus(message, type = "info") {
  setStatusMessage(logoStatus, message, type);
}

function setAssinaturaStatus(message, type = "info") {
  setStatusMessage(assinaturaStatus, message, type);
}

function setAssinatura2Status(message, type = "info") {
  setStatusMessage(assinatura2Status, message, type);
}

function setAssinatura3Status(message, type = "info") {
  setStatusMessage(assinatura3Status, message, type);
}

function setSelo1Status(message, type = "info") {
  setStatusMessage(selo1Status, message, type);
}

function setSelo2Status(message, type = "info") {
  setStatusMessage(selo2Status, message, type);
}

function setSelo3Status(message, type = "info") {
  setStatusMessage(selo3Status, message, type);
}

function setSelo4Status(message, type = "info") {
  setStatusMessage(selo4Status, message, type);
}

function setInstituicaoStatus(message, type = "info") {
  setStatusMessage(instituicaoStatus, message, type);
}

function setSecretariaAssetAdminStatus(message, type = "info") {
  setStatusMessage(secretariaAssetStatus, message, type);
}
