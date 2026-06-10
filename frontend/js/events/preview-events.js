function registerPreviewEvents() {
  if (previewShowHotspotsInput) {
    previewShowHotspotsInput.addEventListener("change", syncPreviewHotspotToggle);
  }

  if (previewAdjustCloseBtn) {
    previewAdjustCloseBtn.addEventListener("click", clearPreviewAdjustTarget);
  }

  if (previewResetLayoutBtn) {
    previewResetLayoutBtn.addEventListener("click", resetPreviewLayoutDefaults);
  }

  [
    previewAdjustLabelInput,
    previewAdjustXInput,
    previewAdjustYInput,
    previewAdjustSizeInput,
  ].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", applyPreviewAdjustPanelControls);
    input.addEventListener("change", commitPreviewAdjustPanelControls);
    input.addEventListener("blur", () => {
      window.requestAnimationFrame(() => {
        if (!isPreviewAdjustPanelControlActive()) {
          positionPreviewAdjustPanel({ force: true });
        }
      });
    });
  });

  window.addEventListener("resize", () => {
    positionPreviewAdjustPanel();
  });
}
function registerLayoutControlEvents() {
  if (logoXInput) logoXInput.addEventListener("input", applyLayoutFromControls);
  if (logoYInput) logoYInput.addEventListener("input", applyLayoutFromControls);
  if (logoSizeInput) logoSizeInput.addEventListener("input", applyLayoutFromControls);
  if (qrXInput) qrXInput.addEventListener("input", applyLayoutFromControls);
  if (qrYInput) qrYInput.addEventListener("input", applyLayoutFromControls);
  if (qrSizeInput) qrSizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaXInput) assinaturaXInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaYInput) assinaturaYInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaSizeInput) assinaturaSizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaImageXInput) assinaturaImageXInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaImageYInput) assinaturaImageYInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaImageSizeInput) {
    assinaturaImageSizeInput.addEventListener("input", applyLayoutFromControls);
  }
  if (assinatura2XInput) assinatura2XInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura2YInput) assinatura2YInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura2SizeInput) assinatura2SizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura2ImageXInput) assinatura2ImageXInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura2ImageYInput) assinatura2ImageYInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura2ImageSizeInput) {
    assinatura2ImageSizeInput.addEventListener("input", applyLayoutFromControls);
  }
  if (assinatura3XInput) assinatura3XInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura3YInput) assinatura3YInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura3SizeInput) assinatura3SizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura3ImageXInput) assinatura3ImageXInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura3ImageYInput) assinatura3ImageYInput.addEventListener("input", applyLayoutFromControls);
  if (assinatura3ImageSizeInput) {
    assinatura3ImageSizeInput.addEventListener("input", applyLayoutFromControls);
  }
  if (selo1XInput) selo1XInput.addEventListener("input", applyLayoutFromControls);
  if (selo1YInput) selo1YInput.addEventListener("input", applyLayoutFromControls);
  if (selo1SizeInput) selo1SizeInput.addEventListener("input", applyLayoutFromControls);
  if (selo2XInput) selo2XInput.addEventListener("input", applyLayoutFromControls);
  if (selo2YInput) selo2YInput.addEventListener("input", applyLayoutFromControls);
  if (selo2SizeInput) selo2SizeInput.addEventListener("input", applyLayoutFromControls);
  if (selo3XInput) selo3XInput.addEventListener("input", applyLayoutFromControls);
  if (selo3YInput) selo3YInput.addEventListener("input", applyLayoutFromControls);
  if (selo3SizeInput) selo3SizeInput.addEventListener("input", applyLayoutFromControls);
  if (selo4XInput) selo4XInput.addEventListener("input", applyLayoutFromControls);
  if (selo4YInput) selo4YInput.addEventListener("input", applyLayoutFromControls);
  if (selo4SizeInput) selo4SizeInput.addEventListener("input", applyLayoutFromControls);
  if (instituicaoXInput) instituicaoXInput.addEventListener("input", applyLayoutFromControls);
  if (instituicaoYInput) instituicaoYInput.addEventListener("input", applyLayoutFromControls);
  if (instituicaoSizeInput) instituicaoSizeInput.addEventListener("input", applyLayoutFromControls);
}
