function getApiBaseUrl() {
  const fromWindow = sanitizeText(window.CERT_API_BASE_URL || "");
  if (fromWindow) return fromWindow.replace(/\/+$/, "");
  const { hostname, port, protocol, origin } = window.location;
  if (port === "29180") {
    return origin.replace(/\/+$/, "");
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:29180`;
  }
  return origin.replace(/\/+$/, "");
}

function getPreviewQrText() {
  return `${window.location.origin.replace(/\/+$/, "")}/validar/ABC-2026-00000`;
}

function getCertificateUploadMaxBytes() {
  const fromSession = Number.parseInt(
    sessionState &&
      sessionState.configuracoes &&
      sessionState.configuracoes.certificados_max_upload_bytes,
    10
  );
  if (Number.isFinite(fromSession) && fromSession > 0) {
    return fromSession;
  }
  return DEFAULT_CERTIFICATE_UPLOAD_MAX_BYTES;
}

function ensureCertificatePngWithinLimit(pngBlob, codigo = "") {
  if (!pngBlob) {
    throw new Error("PNG do certificado ausente para validacao.");
  }

  const maxBytes = getCertificateUploadMaxBytes();
  if (pngBlob.size <= maxBytes) {
    return;
  }

  const codeLabel = sanitizeText(codigo).toUpperCase();
  const certLabel = codeLabel ? ` do certificado ${codeLabel}` : "";
  const error = new Error(
    `O PNG final${certLabel} ficou com ${formatFileSize(pngBlob.size)} e excede o limite configurado de ${formatFileSize(maxBytes)}. Isso costuma acontecer quando molde, logo, assinatura ou instituicao estao muito pesados. Use imagens mais leves ou peca ao administrador para ajustar o limite do sistema.`
  );
  error.operation = "png_size";
  error.codigo = codeLabel;
  error.maxBytes = maxBytes;
  error.actualBytes = pngBlob.size;
  throw error;
}

function summarizePngFailure(errorMessage) {
  const message = sanitizeText(errorMessage).toLowerCase();
  if (!message) return "falha no upload";
  if (message.includes("excede o limite") || message.includes("muito pesado")) {
    return "png acima do limite";
  }
  if (message.includes("nao foi salvo no servidor")) {
    return "nao salvo no servidor";
  }
  return "falha no upload";
}

async function apiJsonRequest(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      (payload && (payload.detail || payload.message)) ||
        `Falha na API de certificados (HTTP ${response.status}).`
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function apiFormRequest(path, formData, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...options,
    body: formData,
    headers: {
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      (payload && (payload.detail || payload.message)) ||
        `Falha na API de certificados (HTTP ${response.status}).`
    );
    error.status = response.status;
    throw error;
  }

  return payload;
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const text = sanitizeText(value);
    if (!text && typeof value !== "number") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
