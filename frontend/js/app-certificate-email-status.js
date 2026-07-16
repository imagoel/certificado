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

