if (!form || !downloadBtn || !canvas || !ctx) {
  alert("Erro de inicialização. Recarregue com Ctrl+F5.");
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
