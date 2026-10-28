/**
 * MIRAS · 3D Donald Trump Heritage Companion Guide
 * Real-time companion that stands in front of the user on the right side,
 * follows the user's view direction as they look around in 360/VR,
 * and actively narrates verified historical site stories.
 * Strict Zero Emojis.
 */
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const ACCENT = '#e0893a';
const BUBBLE_FADE_MS = 400;

export class TrumpCompanionGuide {
  constructor(scene, camera, renderer, { url, onFinished }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.url = url || 'assets/models/trump_tour_guide.stl';
    this.onFinished = onFinished;

    this.root = new THREE.Group();
    this.root.name = 'TRUMP_COMPANION_GUIDE';
    scene.add(this.root);

    // Character Group
    this.characterGroup = new THREE.Group();
    this.root.add(this.characterGroup);
    this.model = null;

    // Dedicated lighting for the companion so he is always lit and clearly visible
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    keyLight.position.set(-1.0, 2.0, 2.0);
    const rimLight = new THREE.DirectionalLight(0xddeeff, 1.2);
    rimLight.position.set(1.5, 1.5, -1.0);
    const fillLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.characterGroup.add(keyLight, rimLight, fillLight);

    // Floating Story Speech Bubble (placed near his upper shoulder)
    this.bubble = new StorySpeechBubble();
    this.characterGroup.add(this.bubble.mesh);
    this.bubble.mesh.position.set(-0.7, 1.6, 0.1);

    this.hotspot = null;
    this.state = 'idle'; // idle | speaking | fading
    this.shownAt = 0;
    this.duration = 9000;

    // Follow math vectors
    this._headPos = new THREE.Vector3();
    this._headQuat = new THREE.Quaternion();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._targetPos = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this._first = true;
  }

  async load() {
    try {
      const loader = new STLLoader();
      const geometry = await loader.loadAsync(this.url);

      // Rotate so Z-up becomes Y-up
      geometry.rotateX(-Math.PI / 2);
      // Ensure front of face points towards +Z (facing user)
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();

      // Center horizontally on X and Z, and place feet at Y = 0
      const bb = geometry.boundingBox;
      const centerX = (bb.max.x + bb.min.x) / 2;
      const centerZ = (bb.max.z + bb.min.z) / 2;
      geometry.translate(-centerX, -bb.min.y, -centerZ);

      // Colorize the STL model with the official Indian Attire turnaround palette
      applyTrumpIndianAttireColors(geometry);

      // Material: Full vertex-colored realistic PBR shading
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.44,
        metalness: 0.08,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = 'Trump_Tour_Guide_Mesh';
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      this.model = new THREE.Group();
      this.model.add(mesh);
      this.characterGroup.add(this.model);

      console.info('[MIRAS] Donald Trump Tour Guide 3D companion loaded and positioned.');
      return true;
    } catch (err) {
      console.warn('[MIRAS] Failed to load Trump STL model:', err);
      return false;
    }
  }

  get active() {
    return this.state === 'speaking';
  }

  /**
   * Narrate a site story and display the floating speech plaque
   * @param {Object} hotspot
   * @param {number} now
   */
  show(hotspot, now) {
    this.hotspot = hotspot;
    this.shownAt = now;
    this.duration = hotspot.duration || 9000;
    this.state = 'speaking';

    this.bubble.draw(hotspot);
    this.bubble.show();

    // Voice Narration
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const narrationText = hotspot.voiceText || `${hotspot.title}. ${hotspot.caption}`;
      const utterance = new SpeechSynthesisUtterance(narrationText);
      utterance.rate = 1.02;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Dismiss current story and silence speech
   */
  dismiss() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.state === 'speaking') {
      this.state = 'fading';
      this.bubble.hide();
      setTimeout(() => {
        this.state = 'idle';
        if (this.hotspot) {
          const finished = this.hotspot;
          this.hotspot = null;
          this.onFinished?.(finished, performance.now());
        }
      }, BUBBLE_FADE_MS);
    }
  }

  /**
   * Called every frame in the render loop.
   * Keeps Donald Trump standing in front on the right side of the user as they look around,
   * facing the user directly, with conversational and breathing animations.
   */
  update(dt, now) {
    const vr = this.renderer.xr.isPresenting;
    const head = vr ? this.renderer.xr.getCamera() : this.camera;

    head.getWorldPosition(this._headPos);
    head.getWorldQuaternion(this._headQuat);

    // Calculate forward direction in the horizontal plane (ignore pitch so Trump stands upright)
    head.getWorldDirection(this._forward);
    this._forward.y = 0;
    if (this._forward.lengthSq() < 0.001) this._forward.set(0, 0, -1);
    this._forward.normalize();

    // Right vector (perpendicular to forward)
    this._right.crossVectors(this._forward, this._up).normalize();

    // Target position: ~2.3m forward and ~0.95m to the user's right side
    this._targetPos
      .copy(this._headPos)
      .addScaledVector(this._forward, 2.3)
      .addScaledVector(this._right, 0.95);

    // Ground position: slightly below eye level (approx. feet on courtyard ground)
    this._targetPos.y = this._headPos.y - 1.25;

    // Smooth follow interpolation (spring/lerp damping)
    if (this._first) {
      this.characterGroup.position.copy(this._targetPos);
      this._first = false;
    } else {
      const followSpeed = Math.min(1, dt * 4.2);
      this.characterGroup.position.lerp(this._targetPos, followSpeed);
    }

    // Always turn smoothly to look at the user/camera
    const eyeLevelTarget = new THREE.Vector3(
      this._headPos.x,
      this.characterGroup.position.y,
      this._headPos.z
    );
    this.characterGroup.lookAt(eyeLevelTarget);

    // Subtle conversational breathing and speaking animation
    if (this.model) {
      if (this.state === 'speaking') {
        // Conversational head nods and expressive gesturing while telling stories
        const talkTime = (now - this.shownAt) * 0.0035;
        this.model.rotation.y = Math.sin(talkTime * 1.8) * 0.06;
        this.model.rotation.z = Math.cos(talkTime * 2.2) * 0.025;
        this.model.position.y = Math.sin(talkTime * 3.5) * 0.012;
      } else {
        // Natural idle breathing
        const idleTime = now * 0.0015;
        this.model.rotation.y = Math.sin(idleTime * 0.8) * 0.02;
        this.model.rotation.z = 0;
        this.model.position.y = Math.sin(idleTime * 1.2) * 0.008;
      }
    }

    // Auto-dismiss story after duration
    if (this.state === 'speaking' && now - this.shownAt >= this.duration) {
      this.dismiss();
    }
  }
}

/**
 * 3D Floating Speech Plaque placed beside the tour guide
 */
class StorySpeechBubble {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 420;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;

    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.55), this.material);
    this.mesh.renderOrder = 25;
    this.mesh.visible = false;
  }

  show() {
    this.mesh.visible = true;
    this.material.opacity = 1;
  }

  hide() {
    this.material.opacity = 0;
    this.mesh.visible = false;
  }

  draw({ title, caption }) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const pad = 44;
    const maxTextW = W - pad * 2;

    ctx.clearRect(0, 0, W, H);

    // Card background with rounded corners
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.clip();
    ctx.fillStyle = 'rgba(16, 12, 10, 0.88)';
    ctx.fillRect(0, 0, W, H);

    // Subtle heritage amber header accent strip
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, 0, W, 8);
    ctx.restore();

    // Border
    ctx.strokeStyle = 'rgba(255, 236, 210, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(1.5, 1.5, W - 3, H - 3, 23);
    ctx.stroke();

    ctx.textBaseline = 'top';
    let y = pad - 6;

    // Header Badge
    ctx.font = '700 24px "Helvetica Neue", system-ui, sans-serif';
    ctx.fillStyle = ACCENT;
    ctx.fillText('[DONALD TRUMP · HERITAGE TOUR GUIDE]', pad, y);
    y += 40;

    // Monument Title
    ctx.font = '700 48px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#fff6ea';
    ctx.fillText(title, pad, y, maxTextW);
    y += 62;

    // Divider Line
    ctx.fillStyle = ACCENT;
    ctx.fillRect(pad, y, 70, 4);
    y += 24;

    // Story Body
    ctx.font = '400 32px "Helvetica Neue", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 246, 234, 0.94)';
    const lines = wrapText(ctx, caption, maxTextW);
    for (const line of lines.slice(0, 3)) {
      ctx.fillText(line, pad, y);
      y += 46;
    }

    this.texture.needsUpdate = true;
  }
}

function wrapText(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Apply the official Indian Traditional Attire turnaround color palette:
 * - Navy Blue Nehru Vest (#1D263B)
 * - Cream / Off-White Silk Kurta & Churidar (#F4EDE4)
 * - Deep Maroon Stole with Golden Borders (#88252C & #D4A853)
 * - Golden Blonde Hair (#E5B876)
 * - Natural Warm Skin Tone (#F2BA93)
 * - Dark Leather Brown Mojari Shoes (#382318)
 */
function applyTrumpIndianAttireColors(geometry) {
  const pos = geometry.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  const cNavy = new THREE.Color('#1D263B');
  const cNavyShadow = new THREE.Color('#141C2B');
  const cCream = new THREE.Color('#F4EDE4');
  const cCreamShade = new THREE.Color('#E6DDD0');
  const cMaroon = new THREE.Color('#88252C');
  const cGoldTrim = new THREE.Color('#D4A853');
  const cHair = new THREE.Color('#E5B876');
  const cHairDark = new THREE.Color('#C49352');
  const cSkin = new THREE.Color('#F2BA93');
  const cSkinRosy = new THREE.Color('#EAA082');
  const cShoes = new THREE.Color('#382318');
  const cButton = new THREE.Color('#E5C158');

  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ax = Math.abs(x);

    // 1. FOOTWEAR: Rajasthani Leather Mojari
    if (y < 0.11) {
      c.copy(cShoes);
    }
    // 2. CHURIDAR PYJAMA: Off-White / Cream Fabric
    else if (y < 0.68) {
      const foldNoise = (Math.sin(y * 42) + Math.cos(x * 28)) * 0.035;
      c.copy(cCream).lerp(cCreamShade, Math.max(0, foldNoise));
    }
    // 3. KURTA HEM: Lower Kurta Flare
    else if (y < 1.05 && ax < 0.36) {
      const foldNoise = (Math.sin(y * 32) + Math.sin(x * 18)) * 0.04;
      c.copy(cCream).lerp(cCreamShade, Math.max(0, foldNoise));
    }
    // 4. HANDS & WRISTS: Exposed Skin
    else if (y < 1.05 && ax >= 0.36) {
      c.copy(cSkin);
    }
    // 5. UPPER BODY: SLEEVES, NAVY VEST & MAROON STOLE (1.05 to 1.55)
    else if (y >= 1.05 && y < 1.55) {
      // Kurta sleeves on outer arms
      if (ax > 0.28) {
        c.copy(cCream);
      }
      // Brass buttons down the center placket
      else if (z > 0.045 && ax < 0.018 && (Math.abs((y - 1.15) % 0.10) < 0.025)) {
        c.copy(cButton);
      }
      // Center Kurta strip
      else if (z > 0.04 && ax < 0.065) {
        c.copy(cCream);
      }
      // Maroon Stole with gold geometric borders
      else if (z > 0.03 && ax >= 0.065 && ax <= 0.25) {
        const isBorder = ax < 0.088 || ax > 0.228 || (Math.sin(y * 55) > 0.72);
        if (isBorder) {
          c.copy(cGoldTrim);
        } else {
          c.copy(cMaroon);
        }
      }
      // Deep Navy Blue Nehru Vest Jacket
      else {
        const vestShade = (Math.cos(y * 20) + Math.sin(x * 15)) * 0.04;
        c.copy(cNavy).lerp(cNavyShadow, Math.max(0, vestShade));
      }
    }
    // 6. NECK & MANDARIN COLLAR (1.55 to 1.63)
    else if (y >= 1.55 && y < 1.63) {
      if (z > 0.05 && ax < 0.068) {
        c.copy(cCream); // Cream buttoned collar
      } else if (ax >= 0.08 && ax <= 0.22) {
        c.copy(cMaroon); // Stole collar wrap
      } else {
        c.copy(cSkin);
      }
    }
    // 7. HEAD, FACE & GOLDEN BLONDE HAIR (y >= 1.63)
    else {
      // Front facial plane
      const isFace = (y < 1.765) && (z > 0.015) && (ax < 0.108);

      if (isFace) {
        const isCheekOrLip = (y > 1.66 && y < 1.72 && ax > 0.035) || (y > 1.64 && y < 1.67 && ax < 0.04);
        c.copy(isCheekOrLip ? cSkinRosy : cSkin);
      } else {
        // Iconic Donald Trump Golden Blonde Hair
        const hairWave = Math.sin(x * 45 + y * 55) * 0.07;
        c.copy(cHair).lerp(cHairDark, Math.max(0, hairWave));
      }
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
