const form = document.getElementById("cert-form");
const downloadBtn = document.getElementById("download");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
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

  ctx.fillStyle = "#1a4f8b";
  ctx.textAlign = "center";
  ctx.font = "bold 64px Georgia";
  ctx.fillText("CERTIFICADO", canvas.width / 2, 180);

  ctx.fillStyle = "#334";
  ctx.font = "32px 'Times New Roman'";
  ctx.fillText("Certificamos que", canvas.width / 2, 260);

  ctx.fillStyle = "#112031";
  ctx.font = "bold 56px 'Times New Roman'";
  ctx.fillText(nome, canvas.width / 2, 360);

  ctx.fillStyle = "#334";
  ctx.font = "30px 'Times New Roman'";
  ctx.fillText("concluiu com êxito o curso", canvas.width / 2, 430);

  ctx.fillStyle = "#112031";
  ctx.font = "italic 46px Georgia";
  ctx.fillText(curso, canvas.width / 2, 500);

  ctx.fillStyle = "#334";
  ctx.font = "28px 'Times New Roman'";
  ctx.fillText(`Data: ${formatDate(data)}`, canvas.width / 2, 570);

  ctx.beginPath();
  ctx.moveTo(180, 700);
  ctx.lineTo(480, 700);
  ctx.moveTo(720, 700);
  ctx.lineTo(1020, 700);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "22px Arial";
  ctx.fillStyle = "#444";
  ctx.fillText("Assinatura do Responsável", 330, 735);
  ctx.fillText("Instituição", 870, 735);
}

function setTodayDate() {
  const dateInput = document.getElementById("data");
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const curso = document.getElementById("curso").value.trim();
  const data = document.getElementById("data").value;

  if (!nome || !curso || !data) return;

  drawCertificate(nome, curso, data);
  downloadBtn.disabled = false;
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "certificado.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

setTodayDate();
