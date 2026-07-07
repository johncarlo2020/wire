const GAME_TIME_SECONDS = 20;
const WIN_PROGRESS = 0.985;
const END_TARGET_RADIUS_PX = 40;
const BOWL_TARGET = { x: 0.64, y: 0.94 };
const BOWL_TARGET_RADIUS_PX = 64;
const WIN_PROGRESS_GRACE = 0.05;
const BOWL_FINISH_ZONE = {
  left: 0.46,
  right: 0.86,
  top: 0.84,
  bottom: 1
};
const STAGE_COUNT = 5;
const PHASE_PORTIONS = [0.2, 0.12, 0.2, 0.2, 0.28];
const PHASE_THRESHOLDS = [];
let phaseTotal = 0;
for (const portion of PHASE_PORTIONS) {
  phaseTotal += portion;
  PHASE_THRESHOLDS.push(phaseTotal * WIN_PROGRESS);
}

const board = document.getElementById("board");
const mapImg = document.getElementById("map");
const trailCanvas = document.getElementById("trail");
const microLayer = document.getElementById("microLayer");
const microCtx = microLayer.getContext("2d");
const kibble = document.getElementById("kibble");
const timerEl = document.getElementById("timer");
const timerFillEl = document.getElementById("timerFill");
const landingScreen = document.getElementById("landingScreen");
const guideScreen = document.getElementById("guideScreen");
const endScreen = document.getElementById("endScreen");
const againScreen = document.getElementById("againScreen");
const landingBtn = document.getElementById("landingBtn");
const guideBtn = document.getElementById("guideBtn");
const endBtn = document.getElementById("endBtn");
const againBtn = document.getElementById("againBtn");
const countdownOverlay = document.getElementById("countdownOverlay");
const countdownText = document.getElementById("countdownText");
const overlay = document.getElementById("overlay");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");
const restartBtn = document.getElementById("restartBtn");
const startTag = document.getElementById("startTag");
const phaseToast = document.getElementById("phaseToast");
const stageCards = [
  document.getElementById("stageCard1"),
  document.getElementById("stageCard2"),
  document.getElementById("stageCard3"),
  document.getElementById("stageCard4"),
  document.getElementById("stageCard5")
];
const stageCardImages = [
  document.getElementById("stageCardImg1"),
  document.getElementById("stageCardImg2"),
  document.getElementById("stageCardImg3"),
  document.getElementById("stageCardImg4"),
  document.getElementById("stageCardImg5")
];

const stageCardImageAssets = [
  { empty: "assets/S1_2x/S1-Stage 1-Empty_2x.webp", fill: "assets/S1_2x/S1-Stage 1-Fill_2x.webp" },
  { empty: "assets/S2_2x/S2-Stage 2-Empty_2x.webp", fill: "assets/S2_2x/S2-Stage 2-Fill_2x.webp" },
  { empty: "assets/S3_2x/S3-Stage 3-Empty_2x.webp", fill: "assets/S3_2x/S3-Stage 3-Fill_2x.webp" },
  { empty: "assets/S4_2x/S4-Stage 4-Empty_2x.webp", fill: "assets/S4_2x/S4-Stage 4-Fill_2x.webp" },
  { empty: "assets/S5_2x/S5-Stage 5-Empty_2x.webp", fill: "assets/S5_2x/S5-Stage 5-Fill_2x.webp" }
];

const phases = [
  { threshold: PHASE_THRESHOLDS[0], label: "Stage 1 - Prebiotic Fibre", color: "#71d860", shown: false },
  { threshold: PHASE_THRESHOLDS[1], label: "Stage 2 - Good Bacteria", color: "#66c6e6", shown: false },
  { threshold: PHASE_THRESHOLDS[2], label: "Stage 3 - Producing SCFAs", color: "#f3bc3d", shown: false },
  { threshold: PHASE_THRESHOLDS[3], label: "Stage 4 - Improved Gut Wall", color: "#b79af7", shown: false },
  { threshold: PHASE_THRESHOLDS[4], label: "Stage 5 - Better Digestion", color: "#f4856d", shown: false }
];

const stageMicroAssets = [
  ["assets/S1_2x/S1-Micro 1_2x.webp", "assets/S1_2x/S1-Micro 2_2x.webp", "assets/S1_2x/S1-Micro 3_2x.webp", "assets/S1_2x/S1-Micro 4_2x.webp", "assets/S1_2x/S1-Micro 5_2x.webp"],
  ["assets/S2_2x/S2-Micro 1_2x.webp", "assets/S2_2x/S2-Micro 2_2x.webp", "assets/S2_2x/S2-Micro 3_2x.webp"],
  ["assets/S3_2x/S3-Micro 1_2x.webp", "assets/S3_2x/S3-Micro 2_2x.webp", "assets/S3_2x/S3-Micro 3_2x.webp"],
  ["assets/S4_2x/S4-Micro 1_2x.webp", "assets/S4_2x/S4-Micro 2_2x.webp", "assets/S4_2x/S4-Micro 3_2x.webp"],
  ["assets/S5_2x/S5-Micro 1_2x.webp", "assets/S5_2x/S5-Micro 2_2x.webp", "assets/S5_2x/S5-Micro 3_2x.webp"]
];

const MICRO_SPAWN_PER_SIDE = 1;
const MICRO_SAFE_RADIUS_MULTIPLIER = 1.3;

const allMicroAssets = stageMicroAssets.flatMap((assets, stageIndex) =>
  assets.map((src) => ({ src, stageIndex }))
);

const stagePreviewCounts = [11, 10, 9, 8, 8];

const APP_PHASE = {
  LANDING: "landing",
  GUIDE: "guide",
  GAME: "game",
  END: "end"
};
const GAME_START_COUNTDOWN_SECONDS = 3;

const phaseBgmAudio = new Audio("assets/audio/background sound (1).mp3");
const mainGameBgmAudio = new Audio("assets/audio/background sound (2).mp3");
phaseBgmAudio.loop = true;
mainGameBgmAudio.loop = true;
phaseBgmAudio.preload = "auto";
mainGameBgmAudio.preload = "auto";
phaseBgmAudio.volume = 0.55;
mainGameBgmAudio.volume = 0.55;

const trackPoints = [
  { x: 0.44, y: 0.14 },
  { x: 0.44, y: 0.24 },
  { x: 0.80, y: 0.24 },
  { x: 0.84, y: 0.28 },
  { x: 0.84, y: 0.36 },
  { x: 0.80, y: 0.40 },
  { x: 0.18, y: 0.40 },
  { x: 0.14, y: 0.44 },
  { x: 0.14, y: 0.51 },
  { x: 0.18, y: 0.55 },
  { x: 0.80, y: 0.55 },
  { x: 0.84, y: 0.59 },
  { x: 0.84, y: 0.66 },
  { x: 0.80, y: 0.70 },
  { x: 0.18, y: 0.70 },
  { x: 0.14, y: 0.74 },
  { x: 0.14, y: 0.80 },
  { x: 0.18, y: 0.84 },
  { x: 0.74, y: 0.84 },
  { x: 0.79, y: 0.88 },
  { x: 0.79, y: 0.94 },
  { x: 0.26, y: 0.94 },
  { x: 0.23, y: 0.98 },
  { x: 0.64, y: 0.98 }
];

const state = {
  playing: false,
  dragging: false,
  ended: false,
  warningActive: false,
  onPath: false,
  appPhase: APP_PHASE.LANDING,
  controlsEnabled: false,
  countdownIntervalId: 0,
  audioUnlocked: false,
  targetBgm: "phase",
  startedAt: 0,
  timerFrame: 0,
  secondsLeft: GAME_TIME_SECONDS,
  player: { x: trackPoints[0].x, y: trackPoints[0].y },
  playerRadiusPx: 14,
  laneRadiusPx: 38,
  progress: 0,
  totalTrackLength: 0,
  trackSegments: [],
  totalProgressLength: 0,
  progressSegments: [],
  mapWidth: 0,
  mapHeight: 0,
  safeMask: null,
  trailPoints: [],
  activePhaseIndex: -1,
  dragOffset: { x: 0, y: 0 },
  microDecorations: [],
  microNextSpawnProgress: stageMicroAssets.map(() => 0),
  centerPathPoints: []
};

const trailCtx = trailCanvas.getContext("2d");

function formatTime(seconds) {
  const clamped = Math.max(0, Math.ceil(seconds));
  return `00:${String(clamped).padStart(2, "0")}`;
}

function updateTimerUI(secondsLeft) {
  timerEl.textContent = formatTime(secondsLeft);
  const ratio = Math.max(0, Math.min(1, 1 - (secondsLeft / GAME_TIME_SECONDS)));
  timerFillEl.style.transform = `scaleX(${ratio})`;
}

function getCountdownAudioContext() {
  if (!window.__countdownAudioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      window.__countdownAudioContext = new Ctx();
    }
  }
  return window.__countdownAudioContext || null;
}

function playCountdownCue(stepValue) {
  const ctx = getCountdownAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const accent = stepValue <= 1;

  osc.type = "sine";
  osc.frequency.setValueAtTime(accent ? 900 : 680, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (accent ? 0.22 : 0.18));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + (accent ? 0.24 : 0.2));
}

function playPhaseChangeCue(phaseIndex) {
  const ctx = getCountdownAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const base = 520 + phaseIndex * 80;

  const oscA = ctx.createOscillator();
  const gainA = ctx.createGain();
  oscA.type = "triangle";
  oscA.frequency.setValueAtTime(base, now);
  gainA.gain.setValueAtTime(0.0001, now);
  gainA.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
  gainA.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  oscA.connect(gainA);
  gainA.connect(ctx.destination);
  oscA.start(now);
  oscA.stop(now + 0.13);

  const oscB = ctx.createOscillator();
  const gainB = ctx.createGain();
  oscB.type = "sine";
  oscB.frequency.setValueAtTime(base * 1.25, now + 0.08);
  gainB.gain.setValueAtTime(0.0001, now + 0.08);
  gainB.gain.exponentialRampToValueAtTime(0.08, now + 0.095);
  gainB.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  oscB.connect(gainB);
  gainB.connect(ctx.destination);
  oscB.start(now + 0.08);
  oscB.stop(now + 0.21);
}

function applyBackgroundAudio() {
  const activeAudio = state.targetBgm === "game" ? mainGameBgmAudio : phaseBgmAudio;
  const inactiveAudio = state.targetBgm === "game" ? phaseBgmAudio : mainGameBgmAudio;

  inactiveAudio.pause();

  if (!state.audioUnlocked) {
    return;
  }

  if (activeAudio.paused) {
    activeAudio.currentTime = 0;
    activeAudio.play().catch(() => {});
  }
}

function setBackgroundAudio(mode) {
  state.targetBgm = mode;
  applyBackgroundAudio();
}

function unlockAudioIfNeeded() {
  if (state.audioUnlocked) {
    return;
  }

  state.audioUnlocked = true;
  const ctx = getCountdownAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  applyBackgroundAudio();
}

function hidePhaseScreens() {
  landingScreen.classList.add("hidden");
  guideScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  againScreen.classList.add("hidden");
}

function clearGameStartCountdown() {
  if (state.countdownIntervalId) {
    clearInterval(state.countdownIntervalId);
    state.countdownIntervalId = 0;
  }
  countdownOverlay.classList.add("hidden");
}

function showLandingPhase() {
  clearGameStartCountdown();
  stopTimer();
  state.playing = false;
  state.dragging = false;
  state.warningActive = false;
  state.appPhase = APP_PHASE.LANDING;
  state.controlsEnabled = false;
  kibble.classList.remove("dragging");
  overlay.classList.add("hidden");
  hidePhaseScreens();
  landingScreen.classList.remove("hidden");
  setBackgroundAudio("phase");
}

function showGuidePhase() {
  clearGameStartCountdown();
  state.appPhase = APP_PHASE.GUIDE;
  state.controlsEnabled = false;
  overlay.classList.add("hidden");
  hidePhaseScreens();
  guideScreen.classList.remove("hidden");
  setBackgroundAudio("phase");
}

function showEndPhase() {
  clearGameStartCountdown();
  state.appPhase = APP_PHASE.END;
  state.controlsEnabled = false;
  overlay.classList.add("hidden");
  hidePhaseScreens();
  endScreen.classList.remove("hidden");
  setBackgroundAudio("phase");
}

function showAgainPhase() {
  clearGameStartCountdown();
  state.appPhase = APP_PHASE.END;
  state.controlsEnabled = false;
  overlay.classList.add("hidden");
  hidePhaseScreens();
  againScreen.classList.remove("hidden");
  setBackgroundAudio("phase");
}

function startGameStartCountdown() {
  clearGameStartCountdown();
  state.controlsEnabled = false;
  setBackgroundAudio("phase");

  let countdownValue = GAME_START_COUNTDOWN_SECONDS;
  countdownText.textContent = String(countdownValue);
  countdownOverlay.classList.remove("hidden");
  playCountdownCue(countdownValue);

  state.countdownIntervalId = setInterval(() => {
    countdownValue -= 1;

    if (countdownValue <= 0) {
      playCountdownCue(0);
      clearGameStartCountdown();
      state.controlsEnabled = true;
      beginPlay();
      return;
    }

    countdownText.textContent = String(countdownValue);
    playCountdownCue(countdownValue);
  }, 1000);
}

function startGamePhaseFromGuide() {
  hidePhaseScreens();
  state.appPhase = APP_PHASE.GAME;
  resetGame();
  startGameStartCountdown();
}

function setPlayerPosition(ratioX, ratioY) {
  state.player.x = Math.max(0, Math.min(1, ratioX));
  state.player.y = Math.max(0, Math.min(1, ratioY));
  kibble.style.left = `${state.player.x * 100}%`;
  kibble.style.top = `${state.player.y * 100}%`;
}

function resizeTrailCanvas() {
  const rect = board.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  trailCanvas.width = Math.max(1, Math.round(rect.width * dpr));
  trailCanvas.height = Math.max(1, Math.round(rect.height * dpr));
  trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clearTrail() {
  const width = trailCanvas.width;
  const height = trailCanvas.height;
  trailCtx.clearRect(0, 0, width, height);
  state.trailPoints = [];
}

function drawMaskDebug() {
  const existing = document.getElementById("maskDebug");
  if (existing) existing.remove();

  if (!state.safeMask || !state.mapWidth || !state.mapHeight) return;

  // Off-screen canvas at natural image resolution
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = state.mapWidth;
  maskCanvas.height = state.mapHeight;
  const maskCtx = maskCanvas.getContext("2d");
  const imageData = maskCtx.createImageData(state.mapWidth, state.mapHeight);
  const d = imageData.data;

  for (let i = 0; i < state.safeMask.length; i++) {
    const base = i * 4;
    if (state.safeMask[i] === 1) {
      d[base]     = 0;    // R
      d[base + 1] = 210;  // G
      d[base + 2] = 0;    // B
      d[base + 3] = 140;  // A — semi-transparent green
    }
  }

  maskCtx.putImageData(imageData, 0, 0);

  // Also draw the computed centerline on top (red)
  if (state.centerPathPoints.length >= 2) {
    maskCtx.strokeStyle = "red";
    maskCtx.lineWidth = 3;
    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";
    maskCtx.beginPath();
    maskCtx.moveTo(
      state.centerPathPoints[0].x * (state.mapWidth - 1),
      state.centerPathPoints[0].y * (state.mapHeight - 1)
    );
    for (let i = 1; i < state.centerPathPoints.length; i++) {
      maskCtx.lineTo(
        state.centerPathPoints[i].x * (state.mapWidth - 1),
        state.centerPathPoints[i].y * (state.mapHeight - 1)
      );
    }
    maskCtx.stroke();
  }

  // Overlay canvas scaled to fill the board display area
  const overlay = document.createElement("canvas");
  overlay.id = "maskDebug";
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "999";

  const rect = board.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  overlay.width = Math.round(rect.width * dpr);
  overlay.height = Math.round(rect.height * dpr);

  const overlayCtx = overlay.getContext("2d");
  overlayCtx.scale(dpr, dpr);
  overlayCtx.drawImage(maskCanvas, 0, 0, rect.width, rect.height);

  board.appendChild(overlay);
}

function buildCenterPathPoints() {
  state.centerPathPoints = [];

  if (!state.safeMask || !state.mapWidth || !state.mapHeight || !state.trackSegments.length) {
    return;
  }

  const sampleCount = 300;

  for (let i = 0; i <= sampleCount; i++) {
    const progress = i / sampleCount;
    const { point, tangent } = getPointAndTangentAtProgress(progress);

    // Normal direction perpendicular to the path
    const nx = -tangent.y;
    const ny = tangent.x;

    const centerMapX = Math.round(point.x * (state.mapWidth - 1));
    const centerMapY = Math.round(point.y * (state.mapHeight - 1));

    // If the trackPoint itself is outside the mask, fall back to it as-is
    if (isMaskSafeAt(centerMapX, centerMapY) !== true) {
      state.centerPathPoints.push({ x: point.x, y: point.y });
      continue;
    }

    const maxProbe = Math.round(Math.min(state.mapWidth, state.mapHeight) * 0.12);

    // Find how far the lane extends in the +normal direction
    let posExtent = 0;
    for (let d = 1; d <= maxProbe; d++) {
      const sx = Math.round(centerMapX + nx * d);
      const sy = Math.round(centerMapY + ny * d);
      if (isMaskSafeAt(sx, sy) === true) {
        posExtent = d;
      } else {
        break;
      }
    }

    // Find how far the lane extends in the -normal direction
    let negExtent = 0;
    for (let d = 1; d <= maxProbe; d++) {
      const sx = Math.round(centerMapX - nx * d);
      const sy = Math.round(centerMapY - ny * d);
      if (isMaskSafeAt(sx, sy) === true) {
        negExtent = d;
      } else {
        break;
      }
    }

    // True centre is the midpoint of the lane cross-section
    const midOffset = (posExtent - negExtent) / 2;
    const trueCenterMapX = centerMapX + nx * midOffset;
    const trueCenterMapY = centerMapY + ny * midOffset;

    state.centerPathPoints.push({
      x: trueCenterMapX / (state.mapWidth - 1),
      y: trueCenterMapY / (state.mapHeight - 1)
    });
  }

  if (state.centerPathPoints.length >= 2) {
    const progressMetrics = buildSegmentsFromPoints(state.centerPathPoints);
    state.progressSegments = progressMetrics.segments;
    state.totalProgressLength = progressMetrics.totalLength;
  }
}

function drawCenterPath() {
  const rect = board.getBoundingClientRect();

  // Use mask-derived centre points when available, fall back to trackPoints
  const basePts = state.centerPathPoints.length >= 2 ? state.centerPathPoints : trackPoints;
  if (basePts.length < 2) return;

  const px = x => x * rect.width;
  const py = y => y * rect.height;

  // Extend visual start upward to cover the intestine opening above the player start
  const pts = [{ x: basePts[0].x, y: 0.04 }, ...basePts];

  // Fixed corner-rounding radius. The line stays on the exact centre for straight
  // segments and only arcs a tiny amount at each bend — prevents the midpoint-bezier
  // from cutting inside U-turns or making a rogue loop at the bottom.
  const r = 0.025;

  trailCtx.save();
  trailCtx.lineCap = "round";
  trailCtx.lineJoin = "round";
  trailCtx.lineWidth = 5;
  trailCtx.strokeStyle = "#000";
  trailCtx.beginPath();
  trailCtx.moveTo(px(pts[0].x), py(pts[0].y));

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const d1x = curr.x - prev.x;
    const d1y = curr.y - prev.y;
    const len1 = Math.hypot(d1x, d1y) || 1;

    const d2x = next.x - curr.x;
    const d2y = next.y - curr.y;
    const len2 = Math.hypot(d2x, d2y) || 1;

    // Cap radius so it never exceeds half of either adjacent segment
    const rad = Math.min(r, len1 / 2, len2 / 2);

    // Point just before the corner along the incoming segment
    const t1x = curr.x - (d1x / len1) * rad;
    const t1y = curr.y - (d1y / len1) * rad;

    // Point just after the corner along the outgoing segment
    const t2x = curr.x + (d2x / len2) * rad;
    const t2y = curr.y + (d2y / len2) * rad;

    trailCtx.lineTo(px(t1x), py(t1y));
    trailCtx.quadraticCurveTo(px(curr.x), py(curr.y), px(t2x), py(t2y));
  }

  trailCtx.lineTo(px(pts[pts.length - 1].x), py(pts[pts.length - 1].y));
  trailCtx.stroke();
  trailCtx.restore();
}

function drawTrail() {
  const rect = board.getBoundingClientRect();
  trailCtx.clearRect(0, 0, rect.width, rect.height);

  if (state.trailPoints.length < 2) {
    return;
  }

  trailCtx.lineCap = "round";
  trailCtx.lineJoin = "round";
  trailCtx.lineWidth = Math.max(3, Math.round(rect.width * 0.013));

  for (let i = 1; i < state.trailPoints.length; i += 1) {
    const prev = state.trailPoints[i - 1];
    const curr = state.trailPoints[i];
    const phaseIndex = Math.max(prev.phaseIndex ?? 0, curr.phaseIndex ?? 0, 0) % phases.length;
    trailCtx.strokeStyle = phases[phaseIndex].color;
    trailCtx.beginPath();
    trailCtx.moveTo(prev.x * rect.width, prev.y * rect.height);
    trailCtx.lineTo(curr.x * rect.width, curr.y * rect.height);
    trailCtx.stroke();
  }
}

function appendTrailPoint(x, y, phaseIndex) {
  const last = state.trailPoints[state.trailPoints.length - 1];
  if (last) {
    const dx = x - last.x;
    const dy = y - last.y;
    if (Math.hypot(dx, dy) < 0.002) {
      return;
    }
  }

  state.trailPoints.push({ x, y, phaseIndex });
  drawTrail();
}

function pointerToBoardRatio(event) {
  const rect = board.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height
  };
}

function buildSegmentsFromPoints(points) {
  const segments = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, length, startDistance: totalLength });
    totalLength += length;
  }

  return { segments, totalLength };
}

function buildTrackMetrics() {
  const trackMetrics = buildSegmentsFromPoints(trackPoints);
  state.trackSegments = trackMetrics.segments;
  state.totalTrackLength = trackMetrics.totalLength;

  // Fallback progress path until mask-derived centre points are computed.
  state.progressSegments = trackMetrics.segments;
  state.totalProgressLength = trackMetrics.totalLength;
}

function getPointAndTangentAtProgress(progress) {
  if (!state.trackSegments.length) {
    return { point: { x: trackPoints[0].x, y: trackPoints[0].y }, tangent: { x: 1, y: 0 } };
  }

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const targetDistance = state.totalTrackLength * clampedProgress;

  for (const segment of state.trackSegments) {
    if (targetDistance > segment.startDistance + segment.length && segment !== state.trackSegments[state.trackSegments.length - 1]) {
      continue;
    }

    const segmentProgress = segment.length > 0 ? (targetDistance - segment.startDistance) / segment.length : 0;
    const t = Math.max(0, Math.min(1, segmentProgress));
    const point = {
      x: segment.a.x + (segment.b.x - segment.a.x) * t,
      y: segment.a.y + (segment.b.y - segment.a.y) * t
    };

    const tangent = {
      x: segment.b.x - segment.a.x,
      y: segment.b.y - segment.a.y
    };
    const tangentLength = Math.hypot(tangent.x, tangent.y) || 1;
    tangent.x /= tangentLength;
    tangent.y /= tangentLength;

    return { point, tangent };
  }

  const last = state.trackSegments[state.trackSegments.length - 1];
  const tangent = {
    x: last.b.x - last.a.x,
    y: last.b.y - last.a.y
  };
  const tangentLength = Math.hypot(tangent.x, tangent.y) || 1;
  tangent.x /= tangentLength;
  tangent.y /= tangentLength;

  return { point: { x: last.b.x, y: last.b.y }, tangent };
}

// Returns the mask-derived visual centre point and tangent at the given progress.
// Falls back to the trackPoints-based version if center points aren't built yet.
function getCenterPointAndTangentAtProgress(progress) {
  if (!state.centerPathPoints || state.centerPathPoints.length < 2) {
    return getPointAndTangentAtProgress(progress);
  }

  const clamped = Math.max(0, Math.min(1, progress));
  const lastIdx = state.centerPathPoints.length - 1;
  const idx = Math.round(clamped * lastIdx);
  const point = state.centerPathPoints[idx];

  // Tangent from neighbouring sampled points
  const prevIdx = Math.max(0, idx - 1);
  const nextIdx = Math.min(lastIdx, idx + 1);
  const prev = state.centerPathPoints[prevIdx];
  const next = state.centerPathPoints[nextIdx];
  const tx = next.x - prev.x;
  const ty = next.y - prev.y;
  const tLen = Math.hypot(tx, ty) || 1;

  return { point, tangent: { x: tx / tLen, y: ty / tLen } };
}

function getStageProgressRange(stageIndex) {
  const start = stageIndex === 0 ? 0 : phases[stageIndex - 1].threshold;
  const end = stageIndex < phases.length - 1 ? phases[stageIndex].threshold : WIN_PROGRESS;
  return { start, end };
}

function buildPreviewEntries() {
  const entries = [];

  for (let stageIndex = 0; stageIndex < stageMicroAssets.length; stageIndex += 1) {
    const assets = stageMicroAssets[stageIndex];
    const targetCount = Math.max(stagePreviewCounts[stageIndex] || assets.length, assets.length);

    for (let itemIndex = 0; itemIndex < targetCount; itemIndex += 1) {
      entries.push({
        src: assets[itemIndex % assets.length],
        stageIndex,
        itemIndex,
        itemCount: targetCount
      });
    }
  }

  return entries;
}

function buildIntestineBorderPreviewPositions(entries) {
  if (!entries || entries.length === 0) {
    return [];
  }

  const positions = [];
  const pairCount = Math.ceil(entries.length / 2);
  const startProgress = 0.08;
  const endProgress = 0.95;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const pairIndex = Math.floor(i / 2);
    const sideSign = i % 2 === 0 ? -1 : 1;
    const progressStep = pairCount > 1 ? pairIndex / (pairCount - 1) : 0.5;
    const progress = startProgress + progressStep * (endProgress - startProgress);
    const { point, tangent } = getCenterPointAndTangentAtProgress(progress);

    let x = point.x;
    let y = point.y;

    if (state.safeMask && state.mapWidth > 0 && state.mapHeight > 0) {
      const centerX = Math.round(point.x * (state.mapWidth - 1));
      const centerY = Math.round(point.y * (state.mapHeight - 1));

      const normal = { x: -tangent.y, y: tangent.x };
      const normalLength = Math.hypot(normal.x, normal.y) || 1;
      const nx = (normal.x / normalLength) * sideSign;
      const ny = (normal.y / normalLength) * sideSign;

      let maxSafe = 0;
      const maxProbe = Math.max(24, Math.round(Math.min(state.mapWidth, state.mapHeight) * 0.06));

      for (let d = 1; d <= maxProbe; d += 1) {
        const sampleX = Math.round(centerX + nx * d);
        const sampleY = Math.round(centerY + ny * d);
        const safe = isMaskSafeAt(sampleX, sampleY);

        if (safe !== true) {
          break;
        }

        maxSafe = d;
      }

      const insetPx = maxSafe > 2 ? Math.max(1, Math.round(maxSafe * 0.72)) : 0;
      const mapX = centerX + nx * insetPx;
      const mapY = centerY + ny * insetPx;

      let candidateX = Math.max(0, Math.min(state.mapWidth - 1, Math.round(mapX)));
      let candidateY = Math.max(0, Math.min(state.mapHeight - 1, Math.round(mapY)));

      // Keep every preview micro inside the detected intestine lane by backing off toward center.
      if (!isMaskSafeAt(candidateX, candidateY)) {
        for (let t = 0.9; t >= 0; t -= 0.1) {
          const testX = Math.round(centerX + (candidateX - centerX) * t);
          const testY = Math.round(centerY + (candidateY - centerY) * t);
          if (isMaskSafeAt(testX, testY)) {
            candidateX = testX;
            candidateY = testY;
            break;
          }
        }
      }

      x = candidateX / Math.max(1, state.mapWidth - 1);
      y = candidateY / Math.max(1, state.mapHeight - 1);
    }

    positions.push({ x, y, tangent, stageIndex: entry.stageIndex });
  }

  return positions;
}

function getEdgeAnchor() {
  const edge = Math.floor(Math.random() * 4);
  const inset = 0.08 + Math.random() * 0.04;
  const travel = inset + Math.random() * (1 - inset * 2);

  if (edge === 0) {
    return { x: inset, y: travel, rotation: Math.random() * 16 - 8 };
  }

  if (edge === 1) {
    return { x: 1 - inset, y: travel, rotation: Math.random() * 16 - 8 };
  }

  if (edge === 2) {
    return { x: travel, y: inset, rotation: Math.random() * 16 - 8 };
  }

  return { x: travel, y: 1 - inset, rotation: Math.random() * 16 - 8 };
}

// ---------------------------------------------------------------------------
// Canvas micro-item system — all rendering in JS, no DOM img elements
// ---------------------------------------------------------------------------

const imageCache = new Map();

function loadMicroImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const img = new Image();
  img.onload = () => drawMicroDecorations();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

function preloadMicroAssets() {
  allMicroAssets.forEach(({ src }) => loadMicroImage(src));
}

function resizeMicroCanvas() {
  const rect = board.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  microLayer.width = Math.round(rect.width * dpr);
  microLayer.height = Math.round(rect.height * dpr);
  microCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Returns true if all 4 rotated corners of the image land inside the safe mask.
// halfW / halfH are in mask-pixel units.
function areCornersSafe(ratioX, ratioY, halfW, halfH, rotDeg) {
  if (!state.safeMask || !state.mapWidth || !state.mapHeight) return true;
  const cx = ratioX * (state.mapWidth - 1);
  const cy = ratioY * (state.mapHeight - 1);
  const rad = rotDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners = [[-halfW, -halfH], [halfW, -halfH], [halfW, halfH], [-halfW, halfH]];
  for (const [ox, oy] of corners) {
    const mx = Math.round(cx + ox * cos - oy * sin);
    const my = Math.round(cy + ox * sin + oy * cos);
    if (isMaskSafeAt(mx, my) !== true) return false;
  }
  return true;
}

// Tries rotating by increasing offsets until all corners fit inside the mask.
function findSafeRotation(ratioX, ratioY, halfW, halfH, preferredRot) {
  if (areCornersSafe(ratioX, ratioY, halfW, halfH, preferredRot)) return preferredRot;
  const offsets = [45, -45, 90, -90, 135, -135, 180];
  for (const offset of offsets) {
    if (areCornersSafe(ratioX, ratioY, halfW, halfH, preferredRot + offset)) {
      return preferredRot + offset;
    }
  }
  return preferredRot;
}

// ---------------------------------------------------------------------------
// Grow-on-reveal animation
// ---------------------------------------------------------------------------

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

let microAnimFrame = 0;

function animateMicroDecorations(timestamp) {
  const animDuration = 420;
  let anyAnimating = false;

  for (const dec of state.microDecorations) {
    if (!dec.revealed || dec.animProgress >= 1) continue;
    if (!dec.animStartTime) dec.animStartTime = timestamp;
    dec.animProgress = Math.min(1, (timestamp - dec.animStartTime) / animDuration);
    anyAnimating = true;
  }

  drawMicroDecorations();

  if (anyAnimating) {
    microAnimFrame = requestAnimationFrame(animateMicroDecorations);
  } else {
    microAnimFrame = 0;
  }
}

function startMicroAnimation() {
  if (!microAnimFrame) {
    microAnimFrame = requestAnimationFrame(animateMicroDecorations);
  }
}

function revealMicroDecorations(progress) {
  let newReveals = false;
  for (const dec of state.microDecorations) {
    if (!dec.revealed && progress >= dec.trackProgress) {
      dec.revealed = true;
      dec.animStartTime = null;
      dec.animProgress = 0;
      dec.safeRotation = undefined; // force recompute at current display size
      newReveals = true;
    }
  }
  if (newReveals) startMicroAnimation();
}

// Draws all micro decorations onto the microLayer canvas.
function drawMicroDecorations() {
  const rect = board.getBoundingClientRect();
  microCtx.clearRect(0, 0, rect.width, rect.height);

  // Mirror CSS: clamp(22px, 3.4vw, 40px)
  const baseSize = Math.max(22, Math.min(40, rect.width * 0.034));

  for (const decoration of state.microDecorations) {
    if (!decoration.revealed) continue;
    const img = imageCache.get(decoration.src);
    if (!img || !img.complete || !img.naturalWidth) continue;

    // Compute and cache safeRotation once at full size so it never changes mid-animation
    if (decoration.safeRotation === undefined) {
      const fullW = baseSize * (decoration.scale || 1);
      const fullH = (img.naturalHeight / img.naturalWidth) * fullW;
      const halfWFull = (fullW / 2 / rect.width) * (state.mapWidth - 1);
      const halfHFull = (fullH / 2 / rect.height) * (state.mapHeight - 1);
      decoration.safeRotation = findSafeRotation(
        decoration.x, decoration.y, halfWFull, halfHFull, decoration.rotation
      );
    }
    const safeRot = decoration.safeRotation;

    const animScale = easeOutBack(Math.max(0, decoration.animProgress || 0));
    const w = baseSize * (decoration.scale || 1) * animScale;
    const h = (img.naturalHeight / img.naturalWidth) * w;

    // Use full-size half-dims for the clip guard (safeRot already based on full size)
    const halfWMask = (baseSize * (decoration.scale || 1) / 2 / rect.width) * (state.mapWidth - 1);
    const halfHMask = (baseSize * (decoration.scale || 1) * (img.naturalHeight / img.naturalWidth) / 2 / rect.height) * (state.mapHeight - 1);

    // Skip items whose body still clips outside the mask after rotation adjustment
    if (state.safeMask && !areCornersSafe(decoration.x, decoration.y, halfWMask, halfHMask, safeRot)) {
      continue;
    }

    const cx = decoration.x * rect.width;
    const cy = decoration.y * rect.height;
    microCtx.save();
    microCtx.translate(cx, cy);
    microCtx.rotate(safeRot * Math.PI / 180);
    microCtx.drawImage(img, -w / 2, -h / 2, w, h);
    microCtx.restore();
  }
}

function clearMicroDecorations() {
  if (microAnimFrame) { cancelAnimationFrame(microAnimFrame); microAnimFrame = 0; }
  state.microDecorations = [];
  state.microNextSpawnProgress = stageMicroAssets.map((_, stageIndex) => getStageProgressRange(stageIndex).start);
  const rect = board.getBoundingClientRect();
  microCtx.clearRect(0, 0, rect.width, rect.height);
}

function renderAllMicroPreview() {
  clearMicroDecorations();

  const entries = buildPreviewEntries();
  const positions = buildIntestineBorderPreviewPositions(entries);
  const stageScale = [1.12, 1.06, 0.72, 1.14, 1.14];

  for (let i = 0; i < entries.length; i += 1) {
    const micro = entries[i];
    const anchor = positions[i];

    const tangentAngle = Math.atan2(anchor.tangent.y, anchor.tangent.x) * (180 / Math.PI);
    // For S3: align with path axis, normalised to [-90, 90] so items are never upside-down
    const s3Rot = (() => { let a = tangentAngle % 180; if (a > 90) a -= 180; else if (a < -90) a += 180; return a; })();
    const rotation = micro.stageIndex === 2
      ? s3Rot
      : tangentAngle + ((i % 2 === 0 ? -1 : 1) * (4 + ((i + micro.stageIndex) % 3) * 2));
    const scaleWave = 0.92 + ((i + micro.stageIndex) % 4) * 0.06;
    const scale = (stageScale[micro.stageIndex] || 1) * scaleWave;

    state.microDecorations.push({
      src: micro.src,
      stageIndex: micro.stageIndex,
      x: anchor.x,
      y: anchor.y,
      scale,
      rotation,
      trackProgress: 0,
      revealed: false,
      animProgress: 0,
      animStartTime: null
    });
  }

  drawMicroDecorations();
}

function spawnMicroDecoration(stageIndex) {
  const assets = stageMicroAssets[stageIndex];
  if (!assets || assets.length === 0) {
    return;
  }

  const spawnProgress = state.microNextSpawnProgress[stageIndex];
  const { point, tangent } = getCenterPointAndTangentAtProgress(spawnProgress);
  const tangentAngle = Math.atan2(tangent.y, tangent.x) * (180 / Math.PI);
  const stageScale = [1.08, 1.02, 0.72, 1.08, 1.08];
  const laneOffsets = [0.042, 0.028];

  // Estimate the item half-size in mask pixels so the bounds check
  // guarantees the full item body fits inside the green mask, not just its centre.
  const boardW = board.clientWidth || 600;
  const estimatedBase = Math.max(22, Math.min(40, boardW * 0.034));
  const maxItemScale = 1.12 * 1.09; // largest stageScale × largest scaleWave
  const halfMaskEst = Math.round(
    (estimatedBase * maxItemScale / 2 / boardW) * Math.max(state.mapWidth - 1, 1)
  );

  // True perpendicular to the path tangent — works correctly at curves and corners
  const sideVectors = [
    { x: -tangent.y, y: tangent.x },
    { x: tangent.y, y: -tangent.x }
  ];

  for (let sideIndex = 0; sideIndex < sideVectors.length; sideIndex += 1) {
    const side = sideVectors[sideIndex];
    const sideSign = sideIndex === 0 ? -1 : 1;
    for (let bandIndex = 0; bandIndex < MICRO_SPAWN_PER_SIDE; bandIndex += 1) {
      const nx = side.x;
      const ny = side.y;

      let safePosition = null;
      const desiredOffset = laneOffsets[Math.min(bandIndex, laneOffsets.length - 1)];
      const shrinkSteps = [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.1, 0];

      for (const shrink of shrinkSteps) {
        const testX = Math.max(0, Math.min(1, point.x + nx * desiredOffset * shrink));
        const testY = Math.max(0, Math.min(1, point.y + ny * desiredOffset * shrink));
        const cx = Math.round(testX * (state.mapWidth - 1));
        const cy = Math.round(testY * (state.mapHeight - 1));
        const h = halfMaskEst;
        // Check centre + 4 cardinal points at estimated item half-size
        if (
          isMaskSafeAt(cx,     cy    ) === true &&
          isMaskSafeAt(cx + h, cy    ) === true &&
          isMaskSafeAt(cx - h, cy    ) === true &&
          isMaskSafeAt(cx,     cy + h) === true &&
          isMaskSafeAt(cx,     cy - h) === true
        ) {
          safePosition = { x: testX, y: testY };
          break;
        }
      }

      if (!safePosition) {
        continue;
      }

      const assetIndex = state.microDecorations.length % assets.length;
      // For S3: align with path axis, normalised to [-90, 90] so items are never upside-down
      const s3Rot = (() => { let a = tangentAngle % 180; if (a > 90) a -= 180; else if (a < -90) a += 180; return a; })();
      const rotation = stageIndex === 2
        ? s3Rot
        : tangentAngle + sideSign * (8 + bandIndex * 3);
      const scaleWave = 0.94 + (state.microDecorations.length % 3) * 0.05;
      const scale = (stageScale[stageIndex] || 1) * scaleWave;

      state.microDecorations.push({
        src: assets[assetIndex],
        stageIndex,
        x: safePosition.x,
        y: safePosition.y,
        rotation,
        scale,
        trackProgress: spawnProgress,
        revealed: false,
        animProgress: 0,
        animStartTime: null
      });
    }
  }

  drawMicroDecorations();
}

function syncMicroSpawns(progress) {
  for (let stageIndex = 0; stageIndex < stageMicroAssets.length; stageIndex += 1) {
    const range = getStageProgressRange(stageIndex);
    const assets = stageMicroAssets[stageIndex];

    if (progress < range.start) {
      continue;
    }

    if (state.microNextSpawnProgress[stageIndex] < range.start) {
      state.microNextSpawnProgress[stageIndex] = range.start;
    }

    const spawnStep = Math.max(
      0.008,
      (range.end - range.start) / Math.max(3, assets.length * [3, 3, 7, 3, 3][stageIndex])
    );

    while (progress >= state.microNextSpawnProgress[stageIndex] && state.microNextSpawnProgress[stageIndex] < range.end) {
      spawnMicroDecoration(stageIndex);
      state.microNextSpawnProgress[stageIndex] += spawnStep;
    }
  }
}

function ensureSafeMicroPosition(x, y, anchorX, anchorY, radiusMultiplier = MICRO_SAFE_RADIUS_MULTIPLIER) {
  const direct = evaluateSafetyAtPosition(x, y, radiusMultiplier);
  if (direct.safe) {
    return { x, y };
  }

  for (let t = 0.9; t >= 0.2; t -= 0.1) {
    const testX = anchorX + (x - anchorX) * t;
    const testY = anchorY + (y - anchorY) * t;
    if (evaluateSafetyAtPosition(testX, testY, radiusMultiplier).safe) {
      return { x: testX, y: testY };
    }
  }

  return null;
}

function positionMicroDecorations() {
  drawMicroDecorations();
}

function closestPointProgress(point, boardWidth, boardHeight) {
  const segments = state.progressSegments.length ? state.progressSegments : state.trackSegments;
  const totalLength = state.totalProgressLength > 0 ? state.totalProgressLength : state.totalTrackLength;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestProgress = 0;
  let bestSegmentIndex = 0;

  for (let index = 0; index < segments.length; index += 1) {
    const seg = segments[index];
    const ax = seg.a.x * boardWidth;
    const ay = seg.a.y * boardHeight;
    const bx = seg.b.x * boardWidth;
    const by = seg.b.y * boardHeight;

    const vx = bx - ax;
    const vy = by - ay;
    const wx = point.x - ax;
    const wy = point.y - ay;
    const vv = vx * vx + vy * vy;
    const t = vv > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / vv)) : 0;

    const px = ax + t * vx;
    const py = ay + t * vy;
    const dist = Math.hypot(point.x - px, point.y - py);

    if (dist < bestDistance) {
      bestDistance = dist;
      const along = seg.startDistance + seg.length * t;
      bestProgress = totalLength > 0 ? along / totalLength : 0;
      bestSegmentIndex = index;
    }
  }

  return { distance: bestDistance, progress: bestProgress, segmentIndex: bestSegmentIndex };
}

function buildSafeMask() {
  const mapWidth = mapImg.naturalWidth;
  const mapHeight = mapImg.naturalHeight;

  if (!mapWidth || !mapHeight) {
    state.safeMask = null;
    return;
  }

  state.mapWidth = mapWidth;
  state.mapHeight = mapHeight;

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = mapWidth;
  maskCanvas.height = mapHeight;
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  maskCtx.drawImage(mapImg, 0, 0, mapWidth, mapHeight);

  const imageData = maskCtx.getImageData(0, 0, mapWidth, mapHeight).data;
  const total = mapWidth * mapHeight;
  const safeMask = new Uint8Array(total);
  const visited = new Uint8Array(total);
  const queue = new Uint32Array(total);

  const sx = Math.max(0, Math.min(mapWidth - 1, Math.round(trackPoints[0].x * (mapWidth - 1))));
  const sy = Math.max(0, Math.min(mapHeight - 1, Math.round(trackPoints[0].y * (mapHeight - 1))));
  const startIdx = sy * mapWidth + sx;
  const startDataIdx = startIdx * 4;

  const sr = imageData[startDataIdx];
  const sg = imageData[startDataIdx + 1];
  const sb = imageData[startDataIdx + 2];

  const isLaneColor = (r, g, b, a) => {
    if (a < 20) {
      return false;
    }
    return (
      r - g >= 60 &&
      r - b >= 60 &&
      Math.abs(r - sr) <= 42 &&
      Math.abs(g - sg) <= 36 &&
      Math.abs(b - sb) <= 36
    );
  };

  let head = 0;
  let tail = 0;
  queue[tail++] = startIdx;
  visited[startIdx] = 1;

  while (head < tail) {
    const idx = queue[head++];
    const dataIdx = idx * 4;
    const r = imageData[dataIdx];
    const g = imageData[dataIdx + 1];
    const b = imageData[dataIdx + 2];
    const a = imageData[dataIdx + 3];

    if (!isLaneColor(r, g, b, a)) {
      continue;
    }

    safeMask[idx] = 1;

    const x = idx % mapWidth;
    const y = Math.floor(idx / mapWidth);

    if (x > 0) {
      const left = idx - 1;
      if (!visited[left]) {
        visited[left] = 1;
        queue[tail++] = left;
      }
    }
    if (x < mapWidth - 1) {
      const right = idx + 1;
      if (!visited[right]) {
        visited[right] = 1;
        queue[tail++] = right;
      }
    }
    if (y > 0) {
      const up = idx - mapWidth;
      if (!visited[up]) {
        visited[up] = 1;
        queue[tail++] = up;
      }
    }
    if (y < mapHeight - 1) {
      const down = idx + mapWidth;
      if (!visited[down]) {
        visited[down] = 1;
        queue[tail++] = down;
      }
    }
  }

  state.safeMask = safeMask;
}

function isMaskSafeAt(mapX, mapY) {
  if (!state.safeMask) {
    return true;
  }

  if (mapX < 0 || mapY < 0 || mapX >= state.mapWidth || mapY >= state.mapHeight) {
    return null;
  }

  const idx = mapY * state.mapWidth + mapX;
  return state.safeMask[idx] === 1;
}

function evaluateSafetyAtPosition(ratioX, ratioY, radiusMultiplier = 1) {
  const boardWidth = board.clientWidth;
  const boardHeight = board.clientHeight;
  const point = {
    x: ratioX * boardWidth,
    y: ratioY * boardHeight
  };

  const result = closestPointProgress(point, boardWidth, boardHeight);

  const mapX = Math.round(ratioX * (state.mapWidth - 1));
  const mapY = Math.round(ratioY * (state.mapHeight - 1));
  const kibbleRadiusMapPx = Math.max(
    2,
    Math.round((kibble.clientWidth * 0.22 * state.mapWidth * radiusMultiplier) / Math.max(1, boardWidth))
  );

  const sampleOffsets = [
    [0, 0],
    [kibbleRadiusMapPx, 0],
    [-kibbleRadiusMapPx, 0],
    [0, kibbleRadiusMapPx],
    [0, -kibbleRadiusMapPx],
    [Math.round(kibbleRadiusMapPx * 0.7), Math.round(kibbleRadiusMapPx * 0.7)],
    [Math.round(-kibbleRadiusMapPx * 0.7), Math.round(kibbleRadiusMapPx * 0.7)],
    [Math.round(kibbleRadiusMapPx * 0.7), Math.round(-kibbleRadiusMapPx * 0.7)],
    [Math.round(-kibbleRadiusMapPx * 0.7), Math.round(-kibbleRadiusMapPx * 0.7)]
  ];

  let maskSafe = true;
  let validSamples = 0;
  for (const [ox, oy] of sampleOffsets) {
    const sample = isMaskSafeAt(mapX + ox, mapY + oy);
    if (sample === null) {
      continue;
    }

    validSamples += 1;
    if (!sample) {
      maskSafe = false;
      break;
    }
  }

  if (validSamples === 0) {
    maskSafe = false;
  }

  return {
    safe: maskSafe,
    progress: result.progress,
    segmentIndex: result.segmentIndex
  };
}

function isSafePosition(ratioX, ratioY) {
  return evaluateSafetyAtPosition(ratioX, ratioY, 1);
}

function getPhaseIndex(progress) {
  const clamped = Math.max(0, Math.min(WIN_PROGRESS, progress));
  for (let i = 0; i < phases.length; i += 1) {
    if (clamped < phases[i].threshold) {
      return i;
    }
  }
  return phases.length - 1;
}

function triggerCardConfetti(cardIndex) {
  const img = stageCardImages[cardIndex];
  const imgRect = img.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;pointer-events:none;z-index:20;";
  canvas.style.left = (imgRect.left - boardRect.left) + "px";
  canvas.style.top = (imgRect.top - boardRect.top) + "px";
  canvas.width = Math.round(imgRect.width);
  canvas.height = Math.round(imgRect.height);
  canvas.style.width = imgRect.width + "px";
  canvas.style.height = imgRect.height + "px";
  board.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#f694c1", "#ff9a3c", "#ffffff"];
  const w = canvas.width;
  const h = canvas.height;

  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * w,
    y: -Math.random() * h * 0.25,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 2.5 + 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    w: Math.random() * 7 + 4,
    h: Math.random() * 4 + 2,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.18
  }));

  const start = performance.now();
  const DURATION = 1800;

  function animateConfetti(now) {
    const elapsed = now - start;
    if (elapsed > DURATION) { canvas.remove(); return; }
    ctx.clearRect(0, 0, w, h);
    const fade = elapsed < DURATION * 0.55 ? 1 : Math.max(0, 1 - (elapsed - DURATION * 0.55) / (DURATION * 0.45));
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.rot += p.rotV;
      if (p.x < -p.w) p.x = w + p.w;
      if (p.x > w + p.w) p.x = -p.w;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    requestAnimationFrame(animateConfetti);
  }
  requestAnimationFrame(animateConfetti);
}

function showPhaseToast(phaseIndex) {
  const phase = phases[phaseIndex];
  phaseToast.textContent = phase.label;
  phaseToast.style.borderColor = phase.color;
  phaseToast.style.boxShadow = `0 0 0 3px ${phase.color}33`;
  phaseToast.classList.remove("hidden");
  setTimeout(() => {
    phaseToast.classList.add("hidden");
  }, 1700);
}

function checkPhaseUnlock(progress) {
  const activePhaseIndex = getPhaseIndex(progress);
  for (let i = 0; i < phases.length; i += 1) {
    if (!phases[i].shown && i <= activePhaseIndex) {
      phases[i].shown = true;
      stageCardImages[i].src = stageCardImageAssets[i].fill;
      triggerCardConfetti(i);
      if (i === activePhaseIndex) {
        playPhaseChangeCue(i);
        showPhaseToast(i);
      }
    }
  }
}

function stopTimer() {
  if (state.timerFrame) {
    cancelAnimationFrame(state.timerFrame);
    state.timerFrame = 0;
  }
}

function runTimer() {
  stopTimer();
  const tick = () => {
    if (!state.playing || state.ended) {
      return;
    }

    const elapsed = (performance.now() - state.startedAt) / 1000;
    state.secondsLeft = GAME_TIME_SECONDS - elapsed;
    updateTimerUI(state.secondsLeft);

    if (state.secondsLeft <= 0) {
      endGame(false, "Time up!", "You ran out of time.");
      return;
    }

    state.timerFrame = requestAnimationFrame(tick);
  };

  state.timerFrame = requestAnimationFrame(tick);
}

function resetPhases() {
  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    phase.shown = false;
    stageCardImages[i].src = stageCardImageAssets[i].empty;
  }
  phaseToast.classList.add("hidden");
}

function endGame(won, title, message) {
  state.playing = false;
  state.dragging = false;
  state.ended = true;
  state.warningActive = false;
  state.controlsEnabled = false;
  kibble.classList.remove("dragging");
  stopTimer();

  if (won) {
    showEndPhase();
    return;
  }

  showAgainPhase();
}

function showBorderWarning() {
  if (state.warningActive || state.ended) {
    return;
  }

  state.warningActive = true;
  state.dragging = false;
  kibble.classList.remove("dragging");
  kibble.classList.remove("shake");
  void kibble.offsetWidth; // force reflow to restart animation
  kibble.classList.add("shake");
  kibble.addEventListener("animationend", () => {
    kibble.classList.remove("shake");
    state.warningActive = false;
  }, { once: true });
}

function movePlayer(ratioX, ratioY) {
  if (state.warningActive || state.ended || state.appPhase !== APP_PHASE.GAME) {
    return;
  }

  const clampedX = Math.max(0, Math.min(1, ratioX));
  const clampedY = Math.max(0, Math.min(1, ratioY));

  // Let players win when they clearly reach the finish target, even if lane-edge
  // sampling is noisy at the final corner.
  const endPoint = trackPoints[trackPoints.length - 1];
  const boardW = Math.max(1, board.clientWidth);
  const boardH = Math.max(1, board.clientHeight);
  const dx = (clampedX - endPoint.x) * boardW;
  const dy = (clampedY - endPoint.y) * boardH;
  const nearEndTarget = Math.hypot(dx, dy) <= END_TARGET_RADIUS_PX;
  const bowlDx = (clampedX - BOWL_TARGET.x) * boardW;
  const bowlDy = (clampedY - BOWL_TARGET.y) * boardH;
  const insideBowlTarget = Math.hypot(bowlDx, bowlDy) <= BOWL_TARGET_RADIUS_PX;
  const insideBowlFinishZone =
    clampedX >= BOWL_FINISH_ZONE.left &&
    clampedX <= BOWL_FINISH_ZONE.right &&
    clampedY >= BOWL_FINISH_ZONE.top &&
    clampedY <= BOWL_FINISH_ZONE.bottom;
  const projected = closestPointProgress({ x: clampedX * boardW, y: clampedY * boardH }, boardW, boardH);
  const nearFinishProgress = projected.progress >= (WIN_PROGRESS - WIN_PROGRESS_GRACE);

  if (insideBowlTarget || insideBowlFinishZone || nearEndTarget || nearFinishProgress) {
    setPlayerPosition(clampedX, clampedY);
    state.progress = WIN_PROGRESS;
    checkPhaseUnlock(state.progress);
    revealMicroDecorations(state.progress);
    endGame(true, "", "");
    return;
  }

  const status = isSafePosition(clampedX, clampedY);

  if (!status.safe) {
    if (state.playing && state.onPath) {
      showBorderWarning();
    }
    return;
  }

  state.onPath = true;

  setPlayerPosition(clampedX, clampedY);
  state.progress = Math.max(state.progress, status.progress);
  const phaseIndex = getPhaseIndex(state.progress);
  appendTrailPoint(clampedX, clampedY, phaseIndex);
  checkPhaseUnlock(state.progress);
  revealMicroDecorations(state.progress);
  state.activePhaseIndex = getPhaseIndex(state.progress);

  if (state.progress >= WIN_PROGRESS) {
    endGame(true, "", "");
  }
}

function resetGame() {
  clearGameStartCountdown();
  hidePhaseScreens();
  overlay.classList.add("hidden");
  state.playing = false;
  state.dragging = false;
  state.ended = false;
  state.warningActive = false;
  state.controlsEnabled = false;
  state.secondsLeft = GAME_TIME_SECONDS;
  state.progress = 0;
  state.activePhaseIndex = 0;
  state.onPath = false;
  restartBtn.textContent = "Play Again";
  updateTimerUI(state.secondsLeft);
  resetPhases();
  const boardH = board.offsetHeight || 1;
  setPlayerPosition(trackPoints[0].x, 0.10);
  clearTrail();
  appendTrailPoint(trackPoints[0].x, trackPoints[0].y, 0);
  clearMicroDecorations();
  syncMicroSpawns(1.0);
  startTag.classList.remove("hidden");
}

function beginPlay() {
  if (state.playing || state.appPhase !== APP_PHASE.GAME || !state.controlsEnabled) {
    return;
  }

  setBackgroundAudio("game");
  state.playing = true;
  state.ended = false;
  state.startedAt = performance.now();
  checkPhaseUnlock(state.progress);
  startTag.classList.add("hidden");
  runTimer();
}

kibble.addEventListener("pointerdown", (event) => {
  if (state.ended || state.warningActive || state.appPhase !== APP_PHASE.GAME || !state.controlsEnabled) {
    return;
  }

  event.preventDefault();
  const pointer = pointerToBoardRatio(event);
  state.dragOffset.x = state.player.x - pointer.x;
  state.dragOffset.y = state.player.y - pointer.y;
  kibble.setPointerCapture(event.pointerId);
  state.dragging = true;
  kibble.classList.add("dragging");
});

kibble.addEventListener("pointermove", (event) => {
  if (!state.dragging || state.ended) {
    return;
  }

  event.preventDefault();
  const { x, y } = pointerToBoardRatio(event);
  movePlayer(x + state.dragOffset.x, y + state.dragOffset.y);
});

function stopDragging(event) {
  if (event && kibble.hasPointerCapture(event.pointerId)) {
    kibble.releasePointerCapture(event.pointerId);
  }
  state.dragging = false;
  kibble.classList.remove("dragging");
}

kibble.addEventListener("pointerup", stopDragging);
kibble.addEventListener("pointercancel", stopDragging);

restartBtn.addEventListener("click", () => {
  unlockAudioIfNeeded();
  if (state.warningActive && !state.ended) {
    state.warningActive = false;
    overlay.classList.add("hidden");
    restartBtn.textContent = "Play Again";
    return;
  }
  resetGame();
  if (state.appPhase === APP_PHASE.GAME) {
    startGameStartCountdown();
  }
});

landingScreen.addEventListener("click", () => {
  unlockAudioIfNeeded();
  showGuidePhase();
});
landingBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  unlockAudioIfNeeded();
  showGuidePhase();
});
guideScreen.addEventListener("click", () => {
  unlockAudioIfNeeded();
  startGamePhaseFromGuide();
});
guideBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  unlockAudioIfNeeded();
  startGamePhaseFromGuide();
});
endScreen.addEventListener("click", () => {
  unlockAudioIfNeeded();
  showLandingPhase();
});
endBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  unlockAudioIfNeeded();
  showLandingPhase();
});
againBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  unlockAudioIfNeeded();
  showLandingPhase();
});
againScreen.addEventListener("click", () => {
  unlockAudioIfNeeded();
  showLandingPhase();
});

kibble.addEventListener("pointerdown", () => {
  unlockAudioIfNeeded();
});

window.addEventListener("resize", () => {
  resizeTrailCanvas();
  resizeMicroCanvas();
  drawTrail();
  drawMicroDecorations();
});

mapImg.addEventListener("load", () => {
  resizeTrailCanvas();
  resizeMicroCanvas();
  preloadMicroAssets();
  buildSafeMask();
  buildTrackMetrics();
  buildCenterPathPoints();
  resetGame();
  showLandingPhase();
});

buildTrackMetrics();
if (mapImg.complete) {
  resizeTrailCanvas();
  resizeMicroCanvas();
  preloadMicroAssets();
  buildSafeMask();
  buildTrackMetrics();
  buildCenterPathPoints();
  resetGame();
  showLandingPhase();
}
