const form = document.getElementById("cert-form");
const downloadBtn = document.getElementById("download");
const logoInput = document.getElementById("logo");
const assinaturaInput = document.getElementById("assinatura");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const logoXInput = document.getElementById("logoX");
const logoYInput = document.getElementById("logoY");
const logoSizeInput = document.getElementById("logoSize");
const assinaturaXInput = document.getElementById("assinaturaX");
const assinaturaYInput = document.getElementById("assinaturaY");
const assinaturaSizeInput = document.getElementById("assinaturaSize");

const logoXVal = document.getElementById("logoXVal");
const logoYVal = document.getElementById("logoYVal");
const logoSizeVal = document.getElementById("logoSizeVal");
const assinaturaXVal = document.getElementById("assinaturaXVal");
const assinaturaYVal = document.getElementById("assinaturaYVal");
const assinaturaSizeVal = document.getElementById("assinaturaSizeVal");

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
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function setTodayDate() {
  const dateInput = document.getElementById("data");
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
}

function fitRect(srcW, srcH, maxW, maxH) {
  const ratio = Math.min(maxW / srcW, maxH / srcH);
  return {
    width: srcW * ratio,
    height: srcH * ratio,
  };
}

function drawCenteredImage(image, x, y, maxW, maxH) {
  const size = fitRect(image.width, image.height, maxW, maxH);
  const drawX = x - size.width / 2;
  const drawY = y - size.height / 2;
  ctx.drawImage(image, drawX, drawY, size.width, size.height);
}

function updateControlLabels() {
  logoXVal.textContent = layout.logo.x;
  logoYVal.textContent = layout.logo.y;
  logoSizeVal.textContent = layout.logo.maxW;
  assinaturaXVal.textContent = layout.assinatura.x;
  assinaturaYVal.textContent = layout.assinatura.y;
  assinaturaSizeVal.textContent = layout.assinatura.maxW;
}

function applyLayoutFromControls() {
  layout.logo.x = Number(logoXInput.value);
  layout.logo.y = Number(logoYInput.value);
  layout.logo.maxW = Number(logoSizeInput.value);

  layout.assinatura.x = Number(assinaturaXInput.value);
  layout.assinatura.y = Number(assinaturaYInput.value);
  layout.assinatura.maxW = Number(assinaturaSizeInput.value);

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

function drawCertificate(nome, curso, data) {
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
  ctx.fillText("CERTIFICADO", canvas.width / 2, 190);

  ctx.fillStyle = "#334";
  ctx.font = "32px 'Times New Roman'";
  ctx.fillText("Certificamos que", canvas.width / 2, 270);

  ctx.fillStyle = "#112031";
  ctx.font = "bold 56px 'Times New Roman'";
  ctx.fillText(nome, canvas.width / 2, 370);

  ctx.fillStyle = "#334";
  ctx.font = "30px 'Times New Roman'";
  ctx.fillText("concluiu com êxito o curso", canvas.width / 2, 440);

  ctx.fillStyle = "#112031";
  ctx.font = "italic 46px Georgia";
  ctx.fillText(curso, canvas.width / 2, 510);

  ctx.fillStyle = "#334";
  ctx.font = "28px 'Times New Roman'";
  ctx.fillText(`Data: ${formatDate(data)}`, canvas.width / 2, 580);

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
  drawCertificate(lastData.nome, lastData.curso, lastData.data);
}

async function handleAssetChange(input, key) {
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

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const curso = document.getElementById("curso").value.trim();
  const data = document.getElementById("data").value;

  if (!nome || !curso || !data) return;

  lastData = { nome, curso, data };
  drawCertificate(nome, curso, data);
  downloadBtn.disabled = false;
});

logoInput.addEventListener("change", () => {
  handleAssetChange(logoInput, "logo");
});

assinaturaInput.addEventListener("change", () => {
  handleAssetChange(assinaturaInput, "assinatura");
});

logoXInput.addEventListener("input", applyLayoutFromControls);
logoYInput.addEventListener("input", applyLayoutFromControls);
logoSizeInput.addEventListener("input", applyLayoutFromControls);
assinaturaXInput.addEventListener("input", applyLayoutFromControls);
assinaturaYInput.addEventListener("input", applyLayoutFromControls);
assinaturaSizeInput.addEventListener("input", applyLayoutFromControls);

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "certificado.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

setTodayDate();
updateControlLabels();
