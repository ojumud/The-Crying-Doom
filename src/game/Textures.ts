import * as THREE from 'three';

export interface ProceduralTexturePack {
  woodFloor: THREE.CanvasTexture;
  wallpaperLiving: THREE.CanvasTexture;
  wallpaperBedroom: THREE.CanvasTexture;
  concrete: THREE.CanvasTexture;
  siding: THREE.CanvasTexture;
  gravel: THREE.CanvasTexture;
  rug: THREE.CanvasTexture;
  clockFace: THREE.CanvasTexture;
  familyPhoto: THREE.CanvasTexture;
  crtScreen: THREE.CanvasTexture;
  basementMarkings: THREE.CanvasTexture;
  plasterCeiling: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finishTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
  srgb = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTexturePack {
  const aniso = Math.min(8, Math.max(1, maxAnisotropy));

  // 1. Aged Wood Floorboards
  const [woodCanvas, wCtx] = makeCanvas(512, 512);
  wCtx.fillStyle = '#2c1e14';
  wCtx.fillRect(0, 0, 512, 512);
  const plankCount = 8;
  const plankH = 512 / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const tone = 30 + ((i * 19) % 18);
    wCtx.fillStyle = `rgb(${tone + 18}, ${tone + 4}, ${tone - 6})`;
    wCtx.fillRect(0, y + 2, 512, plankH - 3);
    // Grain streaks
    for (let g = 0; g < 18; g++) {
      wCtx.strokeStyle = `rgba(12, 7, 4, ${0.12 + Math.random() * 0.16})`;
      wCtx.lineWidth = 1 + Math.random() * 1.5;
      const gy = y + 4 + Math.random() * (plankH - 8);
      wCtx.beginPath();
      wCtx.moveTo(0, gy);
      wCtx.bezierCurveTo(170, gy + (Math.random() - 0.5) * 6, 340, gy + (Math.random() - 0.5) * 6, 512, gy);
      wCtx.stroke();
    }
    // Plank joint
    const jointX = ((i * 173 + 90) % 420) + 40;
    wCtx.fillStyle = '#0e0805';
    wCtx.fillRect(jointX, y, 3, plankH);
    // Dust grime patches
    wCtx.fillStyle = 'rgba(20, 18, 16, 0.22)';
    wCtx.fillRect((i * 97) % 360, y + 4, 120, plankH - 8);
  }
  const woodFloor = finishTexture(woodCanvas, aniso, 4, 4);

  // 2. Living Room Damaged Wallpaper
  const [wallLCanvas, wlCtx] = makeCanvas(512, 512);
  wlCtx.fillStyle = '#332e26';
  wlCtx.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 32) {
    wlCtx.fillStyle = x % 64 === 0 ? 'rgba(22, 19, 15, 0.35)' : 'rgba(62, 56, 44, 0.25)';
    wlCtx.fillRect(x, 0, 16, 512);
  }
  // Subtle Victorian diamond motif
  wlCtx.strokeStyle = 'rgba(85, 76, 58, 0.28)';
  wlCtx.lineWidth = 1.5;
  for (let y = 16; y < 512; y += 48) {
    for (let x = 16; x < 512; x += 48) {
      wlCtx.beginPath();
      wlCtx.moveTo(x, y - 12);
      wlCtx.lineTo(x + 10, y);
      wlCtx.lineTo(x, y + 12);
      wlCtx.lineTo(x - 10, y);
      wlCtx.closePath();
      wlCtx.stroke();
    }
  }
  // Peeling water stains
  for (let s = 0; s < 14; s++) {
    const grad = wlCtx.createRadialGradient(
      Math.random() * 512,
      Math.random() * 512,
      8,
      Math.random() * 512,
      Math.random() * 512,
      80
    );
    grad.addColorStop(0, 'rgba(14, 11, 8, 0.48)');
    grad.addColorStop(1, 'rgba(14, 11, 8, 0)');
    wlCtx.fillStyle = grad;
    wlCtx.fillRect(0, 0, 512, 512);
  }
  const wallpaperLiving = finishTexture(wallLCanvas, aniso, 3, 2);

  // 3. Bedroom Cold Faded Wallpaper
  const [wallBCanvas, wbCtx] = makeCanvas(512, 512);
  wbCtx.fillStyle = '#252b30';
  wbCtx.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 28) {
    wbCtx.fillStyle = x % 56 === 0 ? 'rgba(15, 20, 26, 0.35)' : 'rgba(48, 56, 66, 0.2)';
    wbCtx.fillRect(x, 0, 14, 512);
  }
  for (let s = 0; s < 12; s++) {
    wbCtx.fillStyle = 'rgba(10, 12, 16, 0.32)';
    wbCtx.beginPath();
    wbCtx.arc(Math.random() * 512, Math.random() * 512, 24 + Math.random() * 45, 0, Math.PI * 2);
    wbCtx.fill();
  }
  const wallpaperBedroom = finishTexture(wallBCanvas, aniso, 3, 2);

  // 4. Damp Basement Concrete
  const [concCanvas, cCtx] = makeCanvas(512, 512);
  cCtx.fillStyle = '#2b2d2e';
  cCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) {
    const v = 25 + Math.floor(Math.random() * 35);
    cCtx.fillStyle = `rgba(${v},${v + 2},${v + 3},0.35)`;
    cCtx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }
  // Moisture streaks & cracks
  for (let k = 0; k < 10; k++) {
    cCtx.strokeStyle = 'rgba(10, 12, 13, 0.55)';
    cCtx.lineWidth = 1.5;
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    cCtx.beginPath();
    cCtx.moveTo(cx, cy);
    for (let seg = 0; seg < 6; seg++) {
      cx += (Math.random() - 0.5) * 60;
      cy += Math.random() * 50;
      cCtx.lineTo(cx, cy);
    }
    cCtx.stroke();
  }
  const concrete = finishTexture(concCanvas, aniso, 3, 2);

  // 5. Exterior Clapboard Siding
  const [sidCanvas, sCtx] = makeCanvas(512, 512);
  sCtx.fillStyle = '#1b1d20';
  sCtx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) {
    sCtx.fillStyle = '#24272b';
    sCtx.fillRect(0, y, 512, 28);
    sCtx.fillStyle = '#0d0e10';
    sCtx.fillRect(0, y + 28, 512, 4);
  }
  const siding = finishTexture(sidCanvas, aniso, 4, 3);

  // 6. Night Gravel / Dirt Ground
  const [gravCanvas, gCtx] = makeCanvas(512, 512);
  gCtx.fillStyle = '#141714';
  gCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5500; i++) {
    const v = 16 + Math.floor(Math.random() * 28);
    gCtx.fillStyle = `rgb(${v},${v + 3},${v})`;
    gCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const gravel = finishTexture(gravCanvas, aniso, 10, 10);

  // 7. Dusty Victorian Rug
  const [rugCanvas, rCtx] = makeCanvas(512, 512);
  rCtx.fillStyle = '#38191a';
  rCtx.fillRect(0, 0, 512, 512);
  rCtx.strokeStyle = '#63432b';
  rCtx.lineWidth = 18;
  rCtx.strokeRect(24, 24, 464, 464);
  rCtx.strokeStyle = '#221011';
  rCtx.lineWidth = 6;
  rCtx.strokeRect(52, 52, 408, 408);
  for (let i = 0; i < 1600; i++) {
    rCtx.fillStyle = `rgba(30,25,22,${Math.random() * 0.28})`;
    rCtx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
  }
  const rug = finishTexture(rugCanvas, aniso, 1, 1);

  // 8. Stopped Wall Clock Face (10:15)
  const [clkCanvas, clCtx] = makeCanvas(512, 512);
  clCtx.fillStyle = '#d4cbb8';
  clCtx.beginPath();
  clCtx.arc(256, 256, 246, 0, Math.PI * 2);
  clCtx.fill();
  // Aged stain ring
  const clkGrad = clCtx.createRadialGradient(256, 256, 80, 256, 256, 246);
  clkGrad.addColorStop(0, 'rgba(90, 72, 45, 0.05)');
  clkGrad.addColorStop(1, 'rgba(55, 42, 24, 0.45)');
  clCtx.fillStyle = clkGrad;
  clCtx.fillRect(0, 0, 512, 512);

  clCtx.strokeStyle = '#241b12';
  clCtx.lineWidth = 10;
  clCtx.beginPath();
  clCtx.arc(256, 256, 232, 0, Math.PI * 2);
  clCtx.stroke();

  const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  clCtx.fillStyle = '#1b140d';
  clCtx.font = 'bold 34px Georgia, serif';
  clCtx.textAlign = 'center';
  clCtx.textBaseline = 'middle';
  numerals.forEach((num, idx) => {
    const ang = (idx / 12) * Math.PI * 2 - Math.PI / 2;
    clCtx.fillText(num, 256 + Math.cos(ang) * 185, 256 + Math.sin(ang) * 185);
  });

  // 10:15 Hands (Hour at 10.25 -> -90 + 307.5 deg, Minute at 3 -> 0 deg)
  const hourAngle = ((10 + 15 / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const minAngle = (15 / 60) * Math.PI * 2 - Math.PI / 2;

  clCtx.strokeStyle = '#140e09';
  clCtx.lineCap = 'round';
  clCtx.lineWidth = 14;
  clCtx.beginPath();
  clCtx.moveTo(256, 256);
  clCtx.lineTo(256 + Math.cos(hourAngle) * 112, 256 + Math.sin(hourAngle) * 112);
  clCtx.stroke();

  clCtx.lineWidth = 9;
  clCtx.beginPath();
  clCtx.moveTo(256, 256);
  clCtx.lineTo(256 + Math.cos(minAngle) * 165, 256 + Math.sin(minAngle) * 165);
  clCtx.stroke();

  clCtx.fillStyle = '#3b2916';
  clCtx.beginPath();
  clCtx.arc(256, 256, 14, 0, Math.PI * 2);
  clCtx.fill();

  const clockFace = finishTexture(clkCanvas, aniso, 1, 1);

  // 9. Family Photograph (with scratched face)
  const [phCanvas, pCtx] = makeCanvas(512, 384);
  pCtx.fillStyle = '#c8bca6';
  pCtx.fillRect(0, 0, 512, 384);
  pCtx.fillStyle = '#383026';
  pCtx.fillRect(24, 24, 464, 336);
  // House silhouette in bg
  pCtx.fillStyle = '#252019';
  pCtx.fillRect(150, 80, 210, 170);
  pCtx.beginPath();
  pCtx.moveTo(135, 80);
  pCtx.lineTo(256, 30);
  pCtx.lineTo(375, 80);
  pCtx.closePath();
  pCtx.fill();
  // 3 figures
  const figXs = [190, 256, 322];
  figXs.forEach((fx, idx) => {
    pCtx.fillStyle = '#8b7a62';
    pCtx.fillRect(fx - 18, 200, 36, 110);
    pCtx.beginPath();
    pCtx.arc(fx, 180, 18, 0, Math.PI * 2);
    pCtx.fill();
    if (idx === 1) {
      // Scratched out face
      pCtx.strokeStyle = '#120f0c';
      pCtx.lineWidth = 4;
      for (let s = 0; s < 14; s++) {
        pCtx.beginPath();
        pCtx.moveTo(fx - 22 + Math.random() * 44, 158 + Math.random() * 44);
        pCtx.lineTo(fx - 22 + Math.random() * 44, 158 + Math.random() * 44);
        pCtx.stroke();
      }
    }
  });
  const familyPhoto = finishTexture(phCanvas, aniso, 1, 1);

  // 10. CRT Static Screen
  const [crtCanvas, crtCtx] = makeCanvas(256, 256);
  for (let y = 0; y < 256; y += 2) {
    for (let x = 0; x < 256; x += 2) {
      const v = Math.floor(Math.random() * 75);
      crtCtx.fillStyle = `rgb(${v},${v + 4},${v + 8})`;
      crtCtx.fillRect(x, y, 2, 2);
    }
  }
  const crtScreen = finishTexture(crtCanvas, aniso, 1, 1);

  // 11. Strange Basement Chalk Markings + Tri-Moon Hint
  const [mkCanvas, mCtx] = makeCanvas(512, 512);
  mCtx.clearRect(0, 0, 512, 512);
  mCtx.strokeStyle = 'rgba(205, 198, 182, 0.55)';
  mCtx.lineWidth = 5;
  mCtx.beginPath();
  mCtx.arc(256, 256, 170, 0, Math.PI * 2);
  mCtx.stroke();
  mCtx.beginPath();
  mCtx.arc(256, 256, 120, 0.3, Math.PI * 1.7);
  mCtx.stroke();
  // Tally marks
  for (let t = 0; t < 3; t++) {
    mCtx.beginPath();
    mCtx.moveTo(220 + t * 35, 220);
    mCtx.lineTo(220 + t * 35, 292);
    mCtx.stroke();
  }
  const basementMarkings = finishTexture(mkCanvas, aniso, 1, 1);

  // 12. Plaster Ceiling
  const [ceilCanvas, ceCtx] = makeCanvas(512, 512);
  ceCtx.fillStyle = '#2a2824';
  ceCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    ceCtx.fillStyle = 'rgba(15, 13, 10, 0.32)';
    ceCtx.beginPath();
    ceCtx.arc(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 55, 0, Math.PI * 2);
    ceCtx.fill();
  }
  const plasterCeiling = finishTexture(ceilCanvas, aniso, 4, 4);

  return {
    woodFloor,
    wallpaperLiving,
    wallpaperBedroom,
    concrete,
    siding,
    gravel,
    rug,
    clockFace,
    familyPhoto,
    crtScreen,
    basementMarkings,
    plasterCeiling,
    dispose: () => {
      woodFloor.dispose();
      wallpaperLiving.dispose();
      wallpaperBedroom.dispose();
      concrete.dispose();
      siding.dispose();
      gravel.dispose();
      rug.dispose();
      clockFace.dispose();
      familyPhoto.dispose();
      crtScreen.dispose();
      basementMarkings.dispose();
      plasterCeiling.dispose();
    },
  };
}
