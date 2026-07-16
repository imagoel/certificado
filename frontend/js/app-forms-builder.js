function populateCertificateFormSecretarias(selectedSecretariaId = "") {
  populateCertificateFormReplyEmails("", selectedSecretariaId);
}
function updateCertificateFormReplyEmailHint(secretaria, selectedValue = "") {
  if (!certificateFormReplyEmailHint) return;
  const replyEmails = secretaria && Array.isArray(secretaria.reply_emails)
    ? secretaria.reply_emails.filter((item) => item.ativo)
    : [];
  const defaultReplyEmail = replyEmails.find((item) => item.padrao) || replyEmails[0] || null;
  const selectedText =
    selectedValue === null || selectedValue === undefined ? "" : String(selectedValue);
  const selected =
    replyEmails.find((item) => String(item.id || "") === selectedText) ||
    (selectedText ? null : defaultReplyEmail);

  if (!selected) {
    certificateFormReplyEmailHint.textContent =
      "Cadastre um e-mail de resposta para esta secretaria antes de divulgar o formulário.";
    certificateFormReplyEmailHint.className = "hint status error";
    return;
  }

  const issuerLabel =
    typeof buildReplyEmailIssuerLabel === "function"
      ? buildReplyEmailIssuerLabel(secretaria, selected)
      : selected.nome || secretaria.sigla || "";
  const defaultHint = selected.padrao ? " padrão" : "";
  certificateFormReplyEmailHint.textContent =
    `Respostas irão para ${selected.email}${defaultHint}. ` +
    `No e-mail aparecerá: ${issuerLabel}.`;
  certificateFormReplyEmailHint.className = "hint";
}
function populateCertificateFormReplyEmails(selectedValue = "", secretariaId = "") {
  if (!certificateFormReplyEmailSelect) return;

  const selectedSecretariaId = secretariaId || (sessionState && sessionState.secretaria_ativa_id);
  const secretaria = getFormSecretariaById(selectedSecretariaId);
  certificateFormReplyEmailSelect.innerHTML = "";
  const replyEmails = secretaria && Array.isArray(secretaria.reply_emails)
    ? secretaria.reply_emails.filter((item) => item.ativo)
    : [];
  const defaultReplyEmail = replyEmails.find((item) => item.padrao) || null;

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = defaultReplyEmail
    ? `${defaultReplyEmail.email} (padrão da secretaria)`
    : "Usar e-mail padrão da secretaria";
  certificateFormReplyEmailSelect.appendChild(blank);

  replyEmails.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.padrao ? `${item.email} (padrão)` : item.email;
    option.selected = String(item.id) === String(selectedValue || "");
    certificateFormReplyEmailSelect.appendChild(option);
  });
  updateCertificateFormReplyEmailHint(secretaria, selectedValue);
}
function buildDefaultCertificateFormTitle(courseName) {
  const course = sanitizeText(courseName);
  return course ? `Inscrição para o curso ${course}` : "Inscrição para curso";
}
function getCertificateFormExtraFieldControls() {
  return [
    [
      certificateFormExtra1Input,
      certificateFormExtra1LabelInput,
      certificateFormExtra1TypeSelect,
      certificateFormExtra1OptionsInput,
      certificateFormExtra1RequiredInput,
    ],
    [
      certificateFormExtra2Input,
      certificateFormExtra2LabelInput,
      certificateFormExtra2TypeSelect,
      certificateFormExtra2OptionsInput,
      certificateFormExtra2RequiredInput,
    ],
    [
      certificateFormExtra3Input,
      certificateFormExtra3LabelInput,
      certificateFormExtra3TypeSelect,
      certificateFormExtra3OptionsInput,
      certificateFormExtra3RequiredInput,
    ],
  ];
}
function parseCertificateFormExtraOptions(value) {
  return String(value || "")
    .replace(/\r/g, "\n")
    .split(/\n|;/)
    .map((item) => sanitizeText(item))
    .filter(Boolean);
}
function syncCertificateFormExtraOptionsVisibility() {
  getCertificateFormExtraFieldControls().forEach(([, , typeSelect, optionsInput]) => {
    if (!optionsInput) return;
    optionsInput.hidden = sanitizeText(typeSelect ? typeSelect.value : "texto") !== "selecao";
  });
}
function getCertificateFormExtraFieldsPayload() {
  const fields = getCertificateFormExtraFieldControls();
  return fields
    .map(([input, labelInput, typeSelect, optionsInput, requiredInput]) => {
      const type = sanitizeText(typeSelect ? typeSelect.value : "texto") === "selecao" ? "selecao" : "texto";
      return {
        nome: sanitizeText(input ? input.value : ""),
        rotulo: sanitizeText(labelInput ? labelInput.value : ""),
        tipo: type,
        opcoes: type === "selecao" ? parseCertificateFormExtraOptions(optionsInput ? optionsInput.value : "") : [],
        obrigatorio: Boolean(requiredInput && requiredInput.checked),
      };
    })
    .filter((item) => item.nome);
}
function buildCertificateFormPayload() {
  const course = sanitizeText(certificateFormCourseInput ? certificateFormCourseInput.value : "");
  const title = buildDefaultCertificateFormTitle(course);
  const editingId = sanitizeText(certificateFormEditIdInput ? certificateFormEditIdInput.value : "");
  const currentForm = editingId
    ? formsState.items.find((item) => String(item.id) === String(editingId))
    : null;
  return {
    secretaria_id: null,
    titulo: title,
    curso: course,
    concluido: sanitizeText(certificateFormDateInput ? certificateFormDateInput.value : ""),
    carga_h: Number.parseInt(certificateFormHoursInput ? certificateFormHoursInput.value : "0", 10) || 0,
    reply_email_id:
      Number.parseInt(certificateFormReplyEmailSelect ? certificateFormReplyEmailSelect.value : "", 10) || null,
    ativo: currentForm ? Boolean(currentForm.ativo) : true,
    email_obrigatorio: true,
    campos_extras: getCertificateFormExtraFieldsPayload(),
  };
}

async
async function saveCertificateForm() {
  if (!certificateFormForm) return;
  const editingId = sanitizeText(certificateFormEditIdInput ? certificateFormEditIdInput.value : "");
  const payload = buildCertificateFormPayload();
  const submitBtn = certificateFormForm.querySelector('button[type="submit"]');

  try {
    if (submitBtn) submitBtn.disabled = true;
    setCertificateFormStatus(editingId ? "Atualizando formulario..." : "Salvando formulario...", "info");
    await apiJsonRequest(editingId ? `/api/formularios/${editingId}` : "/api/formularios", {
      method: editingId ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    setCertificateFormStatus(
      editingId ? "Formulario atualizado com sucesso." : "Formulario criado com sucesso.",
      "success"
    );
    resetCertificateForm();
    await loadCertificateForms();
    switchFormsMode("manage");
  } catch (error) {
    console.error(error);
    setCertificateFormStatus(error.message || "Nao foi possivel salvar o formulario.", "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async
function resetCertificateForm() {
  if (certificateFormForm) certificateFormForm.reset();
  if (certificateFormEditIdInput) certificateFormEditIdInput.value = "";
  if (certificateFormHoursInput) certificateFormHoursInput.value = "0";
  if (certificateFormDateInput) certificateFormDateInput.value = toDateInputValue(new Date());
  syncCertificateFormExtraOptionsVisibility();
  populateCertificateFormSecretarias();
  setCertificateFormStatus("", "info");
}
function fillCertificateFormForm(item) {
  if (!item) return;
  if (certificateFormEditIdInput) certificateFormEditIdInput.value = item.id;
  switchFormsMode("create");
  if (certificateFormCourseInput) certificateFormCourseInput.value = item.curso || "";
  if (certificateFormDateInput) certificateFormDateInput.value = item.concluido || "";
  if (certificateFormHoursInput) certificateFormHoursInput.value = String(item.carga_h || 0);
  if (certificateFormReplyEmailSelect) {
    populateCertificateFormReplyEmails(item.reply_email_id || "", item.secretaria_id || "");
  }

  const extras = Array.isArray(item.campos_extras) ? item.campos_extras : [];
  getCertificateFormExtraFieldControls().forEach((
    [input, labelInput, typeSelect, optionsInput, requiredInput],
    index
  ) => {
    const extra = extras[index] || {};
    if (input) input.value = extra.nome || "";
    if (labelInput) labelInput.value = extra.rotulo || "";
    if (typeSelect) typeSelect.value = extra.tipo === "selecao" ? "selecao" : "texto";
    if (optionsInput) {
      const options = Array.isArray(extra.opcoes) ? extra.opcoes : [];
      optionsInput.value = options.join("\n");
    }
    if (requiredInput) requiredInput.checked = Boolean(extra.obrigatorio);
  });
  syncCertificateFormExtraOptionsVisibility();
  setCertificateFormStatus(`Editando ${item.titulo}.`, "info");
}

async
