import * as THREE from 'three';

/**
 * Inward-facing equirectangular sphere.
 *
 * Orientation matches blender/setup_miras_vr.py: the panorama's horizontal
 * centre (u = 0.5) sits straight ahead at -Z, u = 0.75 at +X (right).
 * three's SphereGeometry puts u = 0.5 at -X once mirrored for inside viewing,
 * so the mesh is turned -90° about Y.
 */
export function createPanorama({ radius, widthSegments, heightSegments }) {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  geometry.scale(-1, 1, 1); // faces point inward, image reads left-to-right from inside

  // Unlit and not tone-mapped: the photo's colours reach the screen unchanged.
  const material = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'MIRAS_360_Sphere';
  mesh.rotation.y = -Math.PI / 2;
  mesh.renderOrder = -1;
  material.depthWrite = false; // a backdrop: anything added later always draws in front
  return mesh;
}

export const isVideoUrl = (url) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);

/**
 * 360° video as a texture. Starts muted so browsers allow autoplay; the caller
 * unmutes from a user gesture. Resolves once the first frame can be shown.
 */
export function loadPanoramaVideo(url, onProgress) {
  const video = document.createElement('video');
  video.src = url;
  video.loop = true;
  video.muted = true;
  video.playsInline = true; // no native fullscreen takeover on iOS / Quest
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';

  return new Promise((resolve, reject) => {
    const onError = () => {
      const code = video.error?.code;
      // MEDIA_ERR_SRC_NOT_SUPPORTED is also what a missing file (HTML 404 page) produces.
      reject(new Error(code === 4 ? `Video not found or unsupported: ${url}` : `Video failed to load (code ${code}): ${url}`));
    };
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('progress', () => {
      if (video.duration && video.buffered.length) onProgress?.(video.buffered.end(video.buffered.length - 1) / video.duration);
    });
    video.addEventListener('loadeddata', () => {
      video.removeEventListener('error', onError);
      const ratio = video.videoWidth / video.videoHeight;
      if (Math.abs(ratio - 2) > 0.01) {
        console.info(`[MIRAS] Video is ${video.videoWidth}x${video.videoHeight}; mapped as full 360x180 (as in Blender).`);
      }
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      video.play().catch((e) => console.warn('[MIRAS] Autoplay blocked; press Play.', e));
      resolve({ texture, video });
    }, { once: true });
    video.load();
  });
}

/** Fetch with progress so the loading indicator can show a percentage. */
export async function loadPanoramaTexture(url, renderer, onProgress) {
  const res = await fetch(url);
  // Dev servers answer unknown paths with index.html, so an HTML reply also means "missing".
  if (!res.ok || (res.headers.get('content-type') || '').includes('text/html')) {
    throw new Error(`Panorama not found: ${url}`);
  }

  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress?.(received / total);
  }

  const blob = new Blob(chunks, { type: res.headers.get('content-type') || 'image/png' });
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY' });
  } catch {
    throw new Error(`Panorama could not be decoded: ${url}`);
  }
  if (Math.abs(bitmap.width / bitmap.height - 2) > 0.01) {
    console.warn(`[MIRAS] Panorama is ${bitmap.width}x${bitmap.height}; expected 2:1 equirectangular.`);
  }

  const texture = new THREE.Texture(bitmap);
  texture.flipY = false; // already flipped while decoding (ImageBitmap ignores flipY)
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural 2:1 equirectangular heritage panorama texture.
 * Ensures the 360 viewer, hotspot gaze, and WebXR work instantly even before external media files are downloaded.
 */
export function createProceduralPanoramaTexture(viewId, viewName) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Atmospheric sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
  if (viewId === 'pichola_lake') {
    skyGrad.addColorStop(0, '#102A45');
    skyGrad.addColorStop(0.6, '#385F7D');
    skyGrad.addColorStop(1, '#D49B72');
  } else if (viewId === 'moti_magri') {
    skyGrad.addColorStop(0, '#1C3144');
    skyGrad.addColorStop(0.5, '#40627C');
    skyGrad.addColorStop(1, '#E0A96D');
  } else if (viewId === 'karni_mata') {
    skyGrad.addColorStop(0, '#2D1B36');
    skyGrad.addColorStop(0.6, '#683B5E');
    skyGrad.addColorStop(1, '#EBB071');
  } else {
    // City Palace sunset
    skyGrad.addColorStop(0, '#16233B');
    skyGrad.addColorStop(0.5, '#4F4259');
    skyGrad.addColorStop(1, '#E69C66');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 2048, 512);

  // Ground / Courtyard gradient
  const groundGrad = ctx.createLinearGradient(0, 512, 0, 1024);
  if (viewId === 'pichola_lake') {
    groundGrad.addColorStop(0, '#2C495E');
    groundGrad.addColorStop(0.3, '#1B3245');
    groundGrad.addColorStop(1, '#0D1A24');
  } else {
    groundGrad.addColorStop(0, '#8A6A4E');
    groundGrad.addColorStop(0.3, '#543D2E');
    groundGrad.addColorStop(1, '#2E1E14');
  }
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 512, 2048, 512);

  // Aravalli Hills Horizon silhouette
  ctx.fillStyle = '#2A2633';
  ctx.beginPath();
  ctx.moveTo(0, 512);
  for (let x = 0; x <= 2048; x += 32) {
    const y = 490 + Math.sin(x * 0.008) * 22 + Math.cos(x * 0.02) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(2048, 512);
  ctx.closePath();
  ctx.fill();

  // Architectural palace silhouettes & jharokha chhatris along horizon
  ctx.fillStyle = '#1D1A24';
  for (let x = 80; x < 2000; x += 220) {
    ctx.fillRect(x, 430, 90, 82);
    ctx.beginPath();
    ctx.arc(x + 45, 430, 32, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#3D3540';
    ctx.fillRect(x + 15, 450, 12, 62);
    ctx.fillRect(x + 63, 450, 12, 62);
    ctx.fillStyle = '#1D1A24';
  }

  // Courtyard paved grid lines
  ctx.strokeStyle = 'rgba(255, 235, 200, 0.07)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 2048; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 512);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 512; y <= 1024; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }

  // Horizon title & coordinate indicators
  ctx.fillStyle = 'rgba(255, 246, 234, 0.85)';
  ctx.font = '22px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`[ ${viewName} · 360° Equirectangular Heritage Horizon ]`, 1024, 465);
  ctx.font = '15px Mukta, sans-serif';
  ctx.fillText('Look around or drag to inspect architectural compounds and hotspots', 1024, 492);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}
