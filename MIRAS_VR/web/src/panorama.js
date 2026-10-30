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
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';

  return new Promise((resolve, reject) => {
    let resolved = false;
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      video.removeEventListener('error', onError);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('loadedmetadata', onMetadata);
    };

    const onReady = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      const ratio = video.videoWidth / (video.videoHeight || 1);
      if (Math.abs(ratio - 2) > 0.01) {
        console.info(`[MIRAS] Video is ${video.videoWidth}x${video.videoHeight}; mapped as full 360x180.`);
      }
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      video.play().catch((e) => console.warn('[MIRAS] Autoplay blocked; press Play.', e));
      resolve({ texture, video });
    };

    const onMetadata = () => {
      if (video.videoWidth > 0 && video.readyState >= 1) {
        onReady();
      }
    };

    const onError = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      const code = video.error?.code;
      reject(new Error(code === 4 ? `Video not found or unsupported: ${url}` : `Video failed to load (code ${code}): ${url}`));
    };

    video.addEventListener('error', onError, { once: true });
    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('canplay', onReady, { once: true });
    video.addEventListener('loadedmetadata', onMetadata);
    video.addEventListener('progress', () => {
      if (video.duration && video.buffered.length) {
        onProgress?.(video.buffered.end(video.buffered.length - 1) / video.duration);
      }
    });

    if (video.readyState >= 2) {
      onReady();
      return;
    }

    timer = setTimeout(() => {
      if (!resolved) {
        console.warn(`[MIRAS] loadPanoramaVideo timer fallback triggered for ${url}`);
        onReady();
      }
    }, 4000);

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
