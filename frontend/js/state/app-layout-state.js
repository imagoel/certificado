const MAX_CARGA_HORARIA = 2000;
const CERTIFICATE_CANVAS_WIDTH = 1200;
const DEFAULT_LOGO_LAYOUT = Object.freeze({
  x: 600,
  y: 95,
  maxW: 150,
  maxH: 95,
});
const DEFAULT_ASSINATURA_LAYOUT = Object.freeze({
  x: 330,
  y: 662,
  maxW: 230,
  maxH: 80,
  imageOffsetX: 0,
  imageOffsetY: 0,
  imageMaxW: 230,
  imageMaxH: 80,
});
const DEFAULT_ASSINATURA2_LAYOUT = Object.freeze({
  x: CERTIFICATE_CANVAS_WIDTH / 2,
  y: DEFAULT_ASSINATURA_LAYOUT.y,
  maxW: DEFAULT_ASSINATURA_LAYOUT.maxW,
  maxH: DEFAULT_ASSINATURA_LAYOUT.maxH,
});
const DEFAULT_ASSINATURA3_LAYOUT = Object.freeze({
  x: CERTIFICATE_CANVAS_WIDTH - DEFAULT_ASSINATURA_LAYOUT.x,
  y: DEFAULT_ASSINATURA_LAYOUT.y,
  maxW: DEFAULT_ASSINATURA_LAYOUT.maxW,
  maxH: DEFAULT_ASSINATURA_LAYOUT.maxH,
});
const DEFAULT_INSTITUICAO_LAYOUT = Object.freeze({
  x: CERTIFICATE_CANVAS_WIDTH - DEFAULT_ASSINATURA_LAYOUT.x,
  y: DEFAULT_ASSINATURA_LAYOUT.y,
  maxW: DEFAULT_ASSINATURA_LAYOUT.maxW,
  maxH: DEFAULT_ASSINATURA_LAYOUT.maxH,
});
const DEFAULT_SELO_LAYOUTS = Object.freeze({
  selo1: Object.freeze({ x: 410, y: 745, maxW: 80, maxH: 55 }),
  selo2: Object.freeze({ x: 520, y: 745, maxW: 80, maxH: 55 }),
  selo3: Object.freeze({ x: 640, y: 745, maxW: 80, maxH: 55 }),
  selo4: Object.freeze({ x: 760, y: 745, maxW: 80, maxH: 55 }),
});
const ASSINATURA_CONTROL_LIMITS = Object.freeze({
  xMin: 140,
  xMax: 520,
  yMin: 600,
  yMax: 720,
  sizeMin: 120,
  sizeMax: 360,
});
const INSTITUICAO_CONTROL_LIMITS = Object.freeze({
  xMin: CERTIFICATE_CANVAS_WIDTH - ASSINATURA_CONTROL_LIMITS.xMax,
  xMax: CERTIFICATE_CANVAS_WIDTH - ASSINATURA_CONTROL_LIMITS.xMin,
  yMin: ASSINATURA_CONTROL_LIMITS.yMin,
  yMax: ASSINATURA_CONTROL_LIMITS.yMax,
  sizeMin: ASSINATURA_CONTROL_LIMITS.sizeMin,
  sizeMax: ASSINATURA_CONTROL_LIMITS.sizeMax,
});
const EXTRA_ASSINATURA_CONTROL_LIMITS = Object.freeze({
  xMin: 140,
  xMax: 1060,
  yMin: 560,
  yMax: 760,
  sizeMin: ASSINATURA_CONTROL_LIMITS.sizeMin,
  sizeMax: ASSINATURA_CONTROL_LIMITS.sizeMax,
});
const SELO_CONTROL_LIMITS = Object.freeze({
  xMin: 80,
  xMax: 1120,
  yMin: 620,
  yMax: 805,
  sizeMin: 35,
  sizeMax: 180,
});
const QR_CONTROL_LIMITS = Object.freeze({
  xMin: 70,
  xMax: 1130,
  yMin: 70,
  yMax: 780,
  sizeMin: 60,
  sizeMax: 220,
});
const DEFAULT_QR_LAYOUT = Object.freeze({
  x: 160,
  y: 175,
  maxW: 120,
  maxH: 120,
});
const DEFAULT_ASSINATURA_LABEL = "Assinatura do Responsável";
const SELO_SLOT_KEYS = ["selo1", "selo2", "selo3", "selo4"];
const SIGNATURE_IMAGE_TARGETS = Object.freeze({
  assinaturaImage: "assinatura",
  assinatura2Image: "assinatura2",
  assinatura3Image: "assinatura3",
});
const PREVIEW_ADJUST_TARGET_KEYS = [
  "logo",
  "qr",
  "assinatura",
  "assinaturaImage",
  "assinatura2",
  "assinatura2Image",
  "assinatura3",
  "assinatura3Image",
  "instituicao",
  ...SELO_SLOT_KEYS,
];

const layout = {
  logo: { ...DEFAULT_LOGO_LAYOUT },
  assinatura: { ...DEFAULT_ASSINATURA_LAYOUT },
  assinatura2: { ...DEFAULT_ASSINATURA2_LAYOUT },
  assinatura3: { ...DEFAULT_ASSINATURA3_LAYOUT },
  instituicao: { ...DEFAULT_INSTITUICAO_LAYOUT },
  selo1: { ...DEFAULT_SELO_LAYOUTS.selo1 },
  selo2: { ...DEFAULT_SELO_LAYOUTS.selo2 },
  selo3: { ...DEFAULT_SELO_LAYOUTS.selo3 },
  selo4: { ...DEFAULT_SELO_LAYOUTS.selo4 },
  qr: { ...DEFAULT_QR_LAYOUT },
};

const qrImageCache = new Map();
const certificateAspectRatio = 1200 / 850;
const logoAspectRatio = 95 / 150;
const assinaturaAspectRatio = 80 / 230;
const instituicaoAspectRatio = 80 / 230;
const seloAspectRatio = 55 / 80;
