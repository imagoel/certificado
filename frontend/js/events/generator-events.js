function registerGeneratorFormEvents() {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isBatchRunning || isSingleGenerationRunning) return;
    if (!sessionState) {
      await handleUnauthorized();
      return;
    }

    const nomeInput = document.getElementById("nome");
    const cursoInput = document.getElementById("curso");
    const dataInput = document.getElementById("data");

    const nome = nomeInput ? nomeInput.value.trim() : "";
    const curso = cursoInput ? cursoInput.value.trim() : "";
    const data = dataInput ? dataInput.value : "";
    const cargaResult = getFormCargaHorariaResult();
    if (cargaResult.invalid) {
      setBatchStatus(
        `A carga horária deve estar entre 0 e ${MAX_CARGA_HORARIA} horas.`,
        "error"
      );
      return;
    }
    const cargaH = cargaResult.value ?? 0;

    if (!nome || !curso || !data) return;

    try {
      const textoLinha1 = textoLinha1Input ? textoLinha1Input.value.trim() : "";
      const textoLinha2 = textoLinha2Input ? textoLinha2Input.value.trim() : "";
      const prepared = {
        nome,
        curso,
        data,
        cargaH,
        linha1: textoLinha1,
        linha2: textoLinha2,
      };

      setBatchStatus("Verificando possíveis certificados já emitidos...", "info");
      const duplicates = await findPossibleDuplicateCertificates(prepared);
      if (duplicates.length) {
        setBatchStatus(
          `Encontramos ${duplicates.length} certificado(s) semelhante(s) já emitido(s).`,
          "error"
        );
        openDuplicateCertificateDialog(prepared, duplicates);
        return;
      }

      await executeSingleCertificateGeneration(prepared);
    } catch (error) {
      console.error(error);
      if (error && error.status === 401) {
        await handleUnauthorized();
        return;
      }
      setBatchStatus(
        (error && error.message) || "Nao foi possivel verificar certificados semelhantes.",
        "error"
      );
    }
  });
}
function registerGeneratorInputEvents() {
  [assinaturaLabelInput, assinatura2LabelInput, assinatura3LabelInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      if (isBatchRunning) return;
      void renderLastCertificate();
    });
  });

  if (textoLinha1Input) {
    textoLinha1Input.addEventListener("input", () => {
      if (isBatchRunning) return;
      if (lastData) {
        lastData.linha1 = textoLinha1Input.value.trim();
      }
      void renderLastCertificate();
    });
  }

  if (textoLinha2Input) {
    textoLinha2Input.addEventListener("input", () => {
      if (isBatchRunning) return;
      if (lastData) {
        lastData.linha2 = textoLinha2Input.value.trim();
      }
      void renderLastCertificate();
    });
  }

  [nomeInput, cursoInput, dataInput, cargaHInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      if (isBatchRunning || lastData) return;
      void renderLastCertificate();
    });
  });
}
function registerDownloadEvents() {
  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${(lastData && lastData.codigo) || "certificado"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}
