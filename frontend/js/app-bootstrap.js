function showStartupErrorMessage(message) {
  console.error(message);
  if (!document.body) return;

  const warning = document.createElement("div");
  warning.className = "status error";
  warning.setAttribute("role", "alert");
  warning.textContent = message;
  document.body.prepend(warning);
}

if (!form || !downloadBtn || !canvas || !ctx) {
  showStartupErrorMessage("Erro de inicialização. Recarregue com Ctrl+F5.");
} else {
  registerGeneratorFormEvents();
  registerPreviewEvents();
  registerGeneratorAssetEvents();
  registerLayoutControlEvents();
  registerGeneratorInputEvents();
  registerBatchEvents();
  registerDownloadEvents();
}

registerSectionEvents();
registerListingEvents();
registerAdminEvents();
registerSessionEvents();
registerDialogEvents();
initializeApp();
