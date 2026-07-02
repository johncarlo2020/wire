const GAME_TIME_SECONDS = 20;

const board = document.getElementById("board");
const mapImg = document.getElementById("map");
const trailCanvas = document.getElementById("trail");
const microLayer = document.getElementById("microLayer");
const kibble = document.getElementById("kibble");
const timerEl = document.getElementById("timer");
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

const phases = [
  { threshold: 0.18, label: "Stage 1 - Prebiotic Fibre", color: "#71d860", shown: false },
  { threshold: 0.36, label: "Stage 2 - Good Bacteria", color: "#66c6e6", shown: false },
  { threshold: 0.54, label: "Stage 3 - Producing SCFAs", color: "#f3bc3d", shown: false },
  { threshold: 0.73, label: "Stage 4 - Improved Gut Wall", color: "#b79af7", shown: false },
  { threshold: 0.9, label: "Stage 5 - Better Digestion", color: "#f4856d", shown: false }
];

const stageMicroAssets = [
  ["assets/S1_2x/S1-Micro 1_2x.webp", "assets/S1_2x/S1-Micro 2_2x.webp", "assets/S1_2x/S1-Micro 3_2x.webp", "assets/S1_2x/S1-Micro 4_2x.webp", "assets/S1_2x/S1-Micro 5_2x.webp"],
  ["assets/S2_2x/S2-Micro 1_2x.webp", "assets/S2_2x/S2-Micro 2_2x.webp", "assets/S2_2x/S2-Micro 3_2x.webp"],
  ["assets/S3_2x/S3-Micro 1_2x.webp", "assets/S3_2x/S3-Micro 2_2x.webp", "assets/S3_2x/S3-Micro 3_2x.webp"],
  ["assets/S4_2x/S4-Micro 1_2x.webp", "assets/S4_2x/S4-Micro 2_2x.webp", "assets/S4_2x/S4-Micro 3_2x.webp"],
  ["assets/S5_2x/S5-Micro 1_2x.webp", "assets/S5_2x/S5-Micro 2_2x.webp", "assets/S5_2x/S5-Micro 3_2x.webp"]
];

const allMicroAssets = stageMicroAssets.flatMap((assets, stageIndex) =>
  assets.map((src) => ({ src, stageIndex }))
);

const stagePreviewCounts = [11, 10, 9, 8, 8];

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
  startedAt: 0,
  timerFrame: 0,
  secondsLeft: GAME_TIME_SECONDS,
  player: { x: trackPoints[0].x, y: trackPoints[0].y },
  playerRadiusPx: 14,
  laneRadiusPx: 38,
  progress: 0,
  totalTrackLength: 0,
  trackSegments: [],
  mapWidth: 0,
  mapHeight: 0,
  safeMask: null,
  trailPoints: [],
  activePhaseIndex: -1,
  dragOffset: { x: 0, y: 0 },
  microDecorations: [],
  microNextSpawnProgress: stageMicroAssets.map(() => 0)
};

const trailCtx = trailCanvas.getContext("2d");

function formatTime(seconds) {
  const clamped = Math.max(0, Math.ceil(seconds));
  return `00:${String(clamped).padStart(2, "0")}`;
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

function buildTrackMetrics() {
  state.trackSegments = [];
  state.totalTrackLength = 0;

  for (let i = 0; i < trackPoints.length - 1; i += 1) {
    const a = trackPoints[i];
    const b = trackPoints[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    state.trackSegments.push({ a, b, length, startDistance: state.totalTrackLength });
    state.totalTrackLength += length;
  }
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

function getStageProgressRange(stageIndex) {
  const start = stageIndex === 0 ? 0 : phases[stageIndex - 1].threshold;
  const end = stageIndex < phases.length - 1 ? phases[stageIndex].threshold : 0.985;
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
    const { point, tangent } = getPointAndTangentAtProgress(progress);

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

function clearMicroDecorations() {
  state.microDecorations = [];
  state.microNextSpawnProgress = stageMicroAssets.map((_, stageIndex) => getStageProgressRange(stageIndex).start);
  microLayer.innerHTML = "";
}

function renderAllMicroPreview() {
  clearMicroDecorations();

  const entries = buildPreviewEntries();
  const positions = buildIntestineBorderPreviewPositions(entries);
  const stageScale = [1.12, 1.06, 1.18, 1.14, 1.14];

  for (let i = 0; i < entries.length; i += 1) {
    const micro = entries[i];
    const anchor = positions[i];
    const element = document.createElement("img");

    element.src = micro.src;
    element.alt = "";
    element.className = "micro-item";

    const tangentAngle = Math.atan2(anchor.tangent.y, anchor.tangent.x) * (180 / Math.PI);
    const rotation = tangentAngle + ((i % 2 === 0 ? -1 : 1) * (4 + ((i + micro.stageIndex) % 3) * 2));
    const scaleWave = 0.92 + ((i + micro.stageIndex) % 4) * 0.06;
    const scale = (stageScale[micro.stageIndex] || 1) * scaleWave;
    const decoration = {
      stageIndex: micro.stageIndex,
      x: anchor.x,
      y: anchor.y,
      scale,
      rotation,
      element
    };

    microLayer.appendChild(element);
    state.microDecorations.push(decoration);

    element.style.left = `${anchor.x * 100}%`;
    element.style.top = `${anchor.y * 100}%`;
    element.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
  }

  positionMicroDecorations();
}

function spawnMicroDecoration(stageIndex) {
  const assets = stageMicroAssets[stageIndex];
  if (!assets || assets.length === 0) {
    return;
  }

  const spawnProgress = state.microNextSpawnProgress[stageIndex];
  const sideSign = state.microDecorations.length % 2 === 0 ? -1 : 1;
  const { point, tangent } = getPointAndTangentAtProgress(spawnProgress);
  const normal = { x: -tangent.y, y: tangent.x };
  const normalLength = Math.hypot(normal.x, normal.y) || 1;
  const nx = (normal.x / normalLength) * sideSign;
  const ny = (normal.y / normalLength) * sideSign;

  let x = point.x;
  let y = point.y;

  if (state.safeMask && state.mapWidth > 0 && state.mapHeight > 0) {
    const centerX = Math.round(point.x * (state.mapWidth - 1));
    const centerY = Math.round(point.y * (state.mapHeight - 1));

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
    let candidateX = Math.max(0, Math.min(state.mapWidth - 1, Math.round(centerX + nx * insetPx)));
    let candidateY = Math.max(0, Math.min(state.mapHeight - 1, Math.round(centerY + ny * insetPx)));

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
  } else {
    x = Math.max(0, Math.min(1, point.x + nx * 0.035));
    y = Math.max(0, Math.min(1, point.y + ny * 0.035));
  }

  const assetIndex = state.microDecorations.length % assets.length;
  const element = document.createElement("img");

  element.src = assets[assetIndex];
  element.alt = "";
  element.className = "micro-item";

  const tangentAngle = Math.atan2(tangent.y, tangent.x) * (180 / Math.PI);
  const rotation = tangentAngle + sideSign * 8;
  const stageScale = [1.08, 1.02, 1.12, 1.08, 1.08];
  const scaleWave = 0.94 + (state.microDecorations.length % 3) * 0.05;
  const scale = (stageScale[stageIndex] || 1) * scaleWave;

  const decoration = {
    stageIndex,
    x,
    y,
    rotation,
    scale,
    element
  };

  microLayer.appendChild(element);
  state.microDecorations.push(decoration);

  element.style.left = `${x * 100}%`;
  element.style.top = `${y * 100}%`;
  element.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
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

    const spawnStep = Math.max(0.012, (range.end - range.start) / Math.max(3, assets.length * 3));

    while (progress >= state.microNextSpawnProgress[stageIndex] && state.microNextSpawnProgress[stageIndex] < range.end) {
      spawnMicroDecoration(stageIndex);
      state.microNextSpawnProgress[stageIndex] += spawnStep;
    }
  }
}

function positionMicroDecorations() {
  const edgePadding = 18 / Math.max(1, Math.min(board.clientWidth, board.clientHeight));

  for (const decoration of state.microDecorations) {
    const padding = 0.5 / Math.max(1, Math.min(board.clientWidth, board.clientHeight));
    const clampedX = Math.max(padding, Math.min(1 - padding, decoration.x));
    const clampedY = Math.max(padding, Math.min(1 - padding, decoration.y));

    decoration.element.style.left = `${clampedX * 100}%`;
    decoration.element.style.top = `${clampedY * 100}%`;
    decoration.element.style.transform = `translate(-50%, -50%) rotate(${decoration.rotation}deg) scale(${decoration.scale || 1})`;

    if (clampedX < edgePadding || clampedX > 1 - edgePadding || clampedY < edgePadding || clampedY > 1 - edgePadding) {
      decoration.element.style.opacity = "0.85";
    } else {
      decoration.element.style.opacity = "1";
    }
  }
}

function closestPointProgress(point, boardWidth, boardHeight) {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestProgress = 0;
  let bestSegmentIndex = 0;

  for (let index = 0; index < state.trackSegments.length; index += 1) {
    const seg = state.trackSegments[index];
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
      bestProgress = state.totalTrackLength > 0 ? along / state.totalTrackLength : 0;
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

function isSafePosition(ratioX, ratioY) {
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
    Math.round((kibble.clientWidth * 0.22 * state.mapWidth) / Math.max(1, boardWidth))
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

function getPhaseIndex(progress) {
  let phaseIndex = 0;
  for (let i = 0; i < phases.length; i += 1) {
    if (progress >= phases[i].threshold) {
      phaseIndex = i;
    }
  }
  return phaseIndex;
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
  for (let i = 0; i < phases.length; i += 1) {
    if (!phases[i].shown && progress >= phases[i].threshold) {
      phases[i].shown = true;
      stageCards[i].classList.remove("hidden");
      showPhaseToast(i);
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
    timerEl.textContent = formatTime(state.secondsLeft);

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
    stageCards[i].classList.add("hidden");
  }
  phaseToast.classList.add("hidden");
}

function endGame(won, title, message) {
  state.playing = false;
  state.dragging = false;
  state.ended = true;
  kibble.classList.remove("dragging");
  stopTimer();

  dialogTitle.textContent = won ? "You Win!" : title;
  dialogText.textContent = won
    ? `Completed with ${Math.max(0, Math.ceil(state.secondsLeft))}s left.`
    : message;

  overlay.classList.remove("hidden");
}

function movePlayer(ratioX, ratioY) {
  const clampedX = Math.max(0, Math.min(1, ratioX));
  const clampedY = Math.max(0, Math.min(1, ratioY));
  const status = isSafePosition(clampedX, clampedY);

  if (!status.safe) {
    endGame(false, "Game Over", "You touched the border.");
    return;
  }

  setPlayerPosition(clampedX, clampedY);
  state.progress = Math.max(state.progress, status.progress);
  const phaseIndex = getPhaseIndex(state.progress);
  appendTrailPoint(clampedX, clampedY, phaseIndex);
  checkPhaseUnlock(state.progress);
  syncMicroSpawns(state.progress);
  state.activePhaseIndex = getPhaseIndex(state.progress);

  if (state.progress >= 0.985) {
    endGame(true, "", "");
  }
}

function resetGame() {
  overlay.classList.add("hidden");
  state.playing = false;
  state.dragging = false;
  state.ended = false;
  state.secondsLeft = GAME_TIME_SECONDS;
  state.progress = 0;
  state.activePhaseIndex = 0;
  timerEl.textContent = formatTime(state.secondsLeft);
  resetPhases();
  setPlayerPosition(trackPoints[0].x, trackPoints[0].y);
  clearTrail();
  appendTrailPoint(trackPoints[0].x, trackPoints[0].y, 0);
  clearMicroDecorations();
  startTag.classList.remove("hidden");
}

function beginPlay() {
  if (state.playing) {
    return;
  }

  state.playing = true;
  state.ended = false;
  state.startedAt = performance.now();
  startTag.classList.add("hidden");
  runTimer();
}

kibble.addEventListener("pointerdown", (event) => {
  if (state.ended) {
    return;
  }

  event.preventDefault();
  const pointer = pointerToBoardRatio(event);
  state.dragOffset.x = state.player.x - pointer.x;
  state.dragOffset.y = state.player.y - pointer.y;
  kibble.setPointerCapture(event.pointerId);
  state.dragging = true;
  kibble.classList.add("dragging");
  beginPlay();
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

restartBtn.addEventListener("click", resetGame);

window.addEventListener("resize", () => {
  resizeTrailCanvas();
  drawTrail();
  positionMicroDecorations();
});

mapImg.addEventListener("load", () => {
  resizeTrailCanvas();
  buildSafeMask();
  buildTrackMetrics();
  resetGame();
});

buildTrackMetrics();
if (mapImg.complete) {
  resizeTrailCanvas();
  buildSafeMask();
  buildTrackMetrics();
  resetGame();
}
