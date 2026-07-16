async function discardPendingCertificate(codigo) {
  const certCode = sanitizeText(codigo).toUpperCase();
  if (!certCode) {
    throw new Error("Codigo do certificado ausente para descarte do pendente.");
  }

  try {
    return await apiJsonRequest(`/api/certificados/${encodeURIComponent(certCode)}/pendente`, {
      method: "DELETE",
    });
  } catch (error) {
    if (!error.operation) {
      error.operation = "pending_discard";
      error.codigo = certCode;
    }
    throw error;
  }
}
async function tryDiscardPendingCertificate(codigo) {
  const certCode = sanitizeText(codigo).toUpperCase();
  if (!certCode) {
    return {
      attempted: false,
      discarded: false,
      message: "Codigo ausente para descarte do pendente.",
    };
  }

  try {
    const payload = await discardPendingCertificate(certCode);
    return {
      attempted: true,
      discarded: true,
      payload,
      message:
        (payload && payload.message) ||
        `Certificado pendente ${certCode} descartado automaticamente.`,
    };
  } catch (error) {
    if (error && error.status === 404) {
      return {
        attempted: true,
        discarded: true,
        message: `O certificado pendente ${certCode} ja nao estava mais disponivel para descarte.`,
      };
    }

    return {
      attempted: true,
      discarded: false,
      error,
      message:
        (error && error.message) ||
        `Nao foi possivel descartar automaticamente o certificado pendente ${certCode}.`,
    };
  }
}
async function cleanupPendingCertificates(certificates) {
  const discarded = [];
  const failed = [];

  for (const cert of certificates || []) {
    if (!cert || !sanitizeText(cert.codigo)) continue;

    const result = await tryDiscardPendingCertificate(cert.codigo);
    if (result.discarded) {
      discarded.push({
        cert,
        message: result.message,
      });
      continue;
    }

    failed.push({
      cert,
      message: result.message,
      error: result.error || null,
    });
  }

  return { discarded, failed };
}
