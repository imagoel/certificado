const form = document.getElementById("cert-form");
const downloadBtn = document.getElementById("download");
const logoInput = document.getElementById("logo");
const assinaturaInput = document.getElementById("assinatura");
const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const logoXInput = document.getElementById("logoX");
const logoYInput = document.getElementById("logoY");
const logoSizeInput = document.getElementById("logoSize");
const assinaturaXInput = document.getElementById("assinaturaX");
const assinaturaYInput = document.getElementById("assinaturaY");
const assinaturaSizeInput = document.getElementById("assinaturaSize");

const textoLinha1Input = document.getElementById("textoLinha1");
const textoLinha2Input = document.getElementById("textoLinha2");

const logoXVal = document.getElementById("logoXVal");
const logoYVal = document.getElementById("logoYVal");
const logoSizeVal = document.getElementById("logoSizeVal");
const assinaturaXVal = document.getElementById("assinaturaXVal");
const assinaturaYVal = document.getElementById("assinaturaYVal");
const assinaturaSizeVal = document.getElementById("assinaturaSizeVal");

const defaultTextoLinha1 = "Certificamos que";
const defaultTextoLinha2 = "concluiu com êxito o curso";

const assets = {
  logo: null,
  assinatura: null,
};

const layout = {
  logo: { x: 600, y: 95, maxW: 150, maxH: 95 },
  assinatura: { x: 330, y: 662, maxW: 230, maxH: 80 },
};

let lastData = null;

function formatDate(dateStr) {
  if (!dateStr || !dateStr.includes("-")) return dateStr || "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function setTodayDate() {
  const dateInput = document.getElementById("data");
  if (!dateInput) return;
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const today = new Date(now.getTime() - offsetMs).toISOString().split("T")[0];
  dateInput.value = today;
}

function buildFont(style, weight, size, family) {
  return `${style} ${weight} ${size}px ${family}`.replace(/\s+/g, " ").trim();
}

function sanitizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function measureTextWithFont(text, style, weight, size, family) {
  if (!ctx) return 0;
  ctx.font = buildFont(style, weight, size, family);
  return ctx.measureText(text).width;
}

function fitTextToWidth(text, options = {}) {
  const {
    style = "normal",
    weight = "normal",
    family = "sans-serif",
    startSize = 24,
    minSize = 14,
    maxWidth = 0,
  } = options;

  const normalized = sanitizeText(text);
  if (!normalized) return { text: "", size: startSize };

  let size = startSize;
  while (
    size > minSize &&
    measureTextWithFont(normalized, style, weight, size, family) > maxWidth
  ) {
    size -= 1;
  }

  if (measureTextWithFont(normalized, style, weight, size, family) <= maxWidth) {
    return { text: normalized, size };
  }

  let trimmed = normalized;
  while (
    trimmed.length > 0 &&
    measureTextWithFont(`${trimmed}...`, style, weight, size, family) > maxWidth
  ) {
    trimmed = trimmed.slice(0, -1);
  }

  return { text: trimmed ? `${trimmed}...` : "...", size };
}

function drawAdaptiveCenteredText(text, x, y, options = {}) {
  if (!ctx) return;
  const fitted = fitTextToWidth(text, options);
  ctx.font = buildFont(
    options.style || "normal",
    options.weight || "normal",
    fitted.size,
    options.family || "sans-serif"
  );
  ctx.fillText(fitted.text, x, y);
}

function fitRect(srcW, srcH, maxW, maxH) {
  const ratio = Math.min(maxW / srcW, maxH / srcH);
  return {
    width: srcW * ratio,
    height: srcH * ratio,
  };
}

function drawCenteredImage(image, x, y, maxW, maxH) {
  if (!ctx || !image) return;
  const size = fitRect(image.width, image.height, maxW, maxH);
  const drawX = x - size.width / 2;
  const drawY = y - size.height / 2;
  ctx.drawImage(image, drawX, drawY, size.width, size.height);
}

function updateControlLabels() {
  if (logoXVal) logoXVal.textContent = layout.logo.x;
  if (logoYVal) logoYVal.textContent = layout.logo.y;
  if (logoSizeVal) logoSizeVal.textContent = layout.logo.maxW;
  if (assinaturaXVal) assinaturaXVal.textContent = layout.assinatura.x;
  if (assinaturaYVal) assinaturaYVal.textContent = layout.assinatura.y;
  if (assinaturaSizeVal) assinaturaSizeVal.textContent = layout.assinatura.maxW;
}

function applyLayoutFromControls() {
  if (logoXInput) layout.logo.x = Number(logoXInput.value);
  if (logoYInput) layout.logo.y = Number(logoYInput.value);
  if (logoSizeInput) layout.logo.maxW = Number(logoSizeInput.value);
  if (assinaturaXInput) layout.assinatura.x = Number(assinaturaXInput.value);
  if (assinaturaYInput) layout.assinatura.y = Number(assinaturaYInput.value);
  if (assinaturaSizeInput) layout.assinatura.maxW = Number(assinaturaSizeInput.value);

  updateControlLabels();
  renderLastCertificate();
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function drawCertificate(nome, curso, data, linha1, linha2) {
  if (!ctx || !canvas) {
    throw new Error("Canvas não disponível.");
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#1a4f8b";
  ctx.lineWidth = 16;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.strokeStyle = "#d9b14c";
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);

  if (assets.logo) {
    drawCenteredImage(
      assets.logo,
      layout.logo.x,
      layout.logo.y,
      layout.logo.maxW,
      layout.logo.maxH
    );
  }

  ctx.fillStyle = "#1a4f8b";
  ctx.textAlign = "center";
  ctx.font = "bold 64px Georgia";
  const centerX = canvas.width / 2;
  const maxTextWidth = canvas.width - 220;
  ctx.fillText("CERTIFICADO", centerX, 190);

  ctx.fillStyle = "#334";
  drawAdaptiveCenteredText(linha1, centerX, 270, {
    family: "'Times New Roman'",
    startSize: 32,
    minSize: 20,
    maxWidth: maxTextWidth,
  });

  ctx.fillStyle = "#112031";
  drawAdaptiveCenteredText(nome, centerX, 370, {
    family: "'Times New Roman'",
    weight: "bold",
    startSize: 56,
    minSize: 30,
    maxWidth: maxTextWidth,
  });

  ctx.fillStyle = "#334";
  drawAdaptiveCenteredText(linha2, centerX, 440, {
    family: "'Times New Roman'",
    startSize: 30,
    minSize: 18,
    maxWidth: maxTextWidth,
  });

  ctx.fillStyle = "#112031";
  drawAdaptiveCenteredText(curso, centerX, 510, {
    family: "Georgia",
    style: "italic",
    startSize: 46,
    minSize: 24,
    maxWidth: maxTextWidth,
  });

  ctx.fillStyle = "#334";
  drawAdaptiveCenteredText(`Data: ${formatDate(data)}`, centerX, 580, {
    family: "'Times New Roman'",
    startSize: 28,
    minSize: 20,
    maxWidth: maxTextWidth,
  });

  ctx.beginPath();
  ctx.moveTo(180, 700);
  ctx.lineTo(480, 700);
  ctx.moveTo(720, 700);
  ctx.lineTo(1020, 700);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (assets.assinatura) {
    drawCenteredImage(
      assets.assinatura,
      layout.assinatura.x,
      layout.assinatura.y,
      layout.assinatura.maxW,
      layout.assinatura.maxH
    );
  }

  ctx.font = "22px Arial";
  ctx.fillStyle = "#444";
  ctx.fillText("Assinatura do Responsável", 330, 735);
  ctx.fillText("Instituição", 870, 735);
}

function renderLastCertificate() {
  if (!lastData) return;
  drawCertificate(
    lastData.nome,
    lastData.curso,
    lastData.data,
    lastData.linha1,
    lastData.linha2
  );
}

async function handleAssetChange(input, key) {
  if (!input) return;
  const file = input.files[0];

  if (!file) {
    assets[key] = null;
    renderLastCertificate();
    return;
  }

  try {
    assets[key] = await loadImage(file);
    renderLastCertificate();
  } catch (error) {
    alert(error.message);
    input.value = "";
    assets[key] = null;
  }
}

if (!form || !downloadBtn || !canvas || !ctx) {
  alert("Erro de inicialização. Recarregue com Ctrl+F5.");
} else {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nomeInput = document.getElementById("nome");
    const cursoInput = document.getElementById("curso");
    const dataInput = document.getElementById("data");

    const nome = nomeInput ? nomeInput.value.trim() : "";
    const curso = cursoInput ? cursoInput.value.trim() : "";
    const data = dataInput ? dataInput.value : "";

    if (!nome || !curso || !data) return;

    try {
      const textoLinha1 = textoLinha1Input ? textoLinha1Input.value.trim() : "";
      const textoLinha2 = textoLinha2Input ? textoLinha2Input.value.trim() : "";
      const linha1 = textoLinha1 || defaultTextoLinha1;
      const linha2 = textoLinha2 || defaultTextoLinha2;

      lastData = { nome, curso, data, linha1, linha2 };
      drawCertificate(nome, curso, data, linha1, linha2);
      downloadBtn.disabled = false;
    } catch (error) {
      console.error(error);
      alert("Falha ao gerar o certificado. Recarregue a página e tente novamente.");
    }
  });

  if (logoInput) {
    logoInput.addEventListener("change", () => {
      handleAssetChange(logoInput, "logo");
    });
  }

  if (assinaturaInput) {
    assinaturaInput.addEventListener("change", () => {
      handleAssetChange(assinaturaInput, "assinatura");
    });
  }

  if (logoXInput) logoXInput.addEventListener("input", applyLayoutFromControls);
  if (logoYInput) logoYInput.addEventListener("input", applyLayoutFromControls);
  if (logoSizeInput) logoSizeInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaXInput) assinaturaXInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaYInput) assinaturaYInput.addEventListener("input", applyLayoutFromControls);
  if (assinaturaSizeInput) assinaturaSizeInput.addEventListener("input", applyLayoutFromControls);

  if (textoLinha1Input) {
    textoLinha1Input.addEventListener("input", () => {
      if (!lastData) return;
      lastData.linha1 = textoLinha1Input.value.trim() || defaultTextoLinha1;
      renderLastCertificate();
    });
  }

  if (textoLinha2Input) {
    textoLinha2Input.addEventListener("input", () => {
      if (!lastData) return;
      lastData.linha2 = textoLinha2Input.value.trim() || defaultTextoLinha2;
      renderLastCertificate();
    });
  }

  downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "certificado.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

setTodayDate();
updateControlLabels();
