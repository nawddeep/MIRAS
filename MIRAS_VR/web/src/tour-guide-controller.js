/**
 * MIRAS VR · Autonomous Humanoid Tour Guide Animation & Navigation System
 * Senior 3D Character & Technical Animation Pipeline.
 * 
 * Features:
 * - Humanoid Skeletal Animation via THREE.AnimationMixer on rigged GLB
 * - Finite State Machine: IDLE, WALKING, TURNING, EXPLAINING, POINTING, WELCOMING, LISTENING
 * - Seamless animation blending, cross-fading, and priority interruption
 * - Waypoint-based site tour navigation with acceleration, deceleration, and arrival detection
 * - Pointing at landmarks and synchronized conversational storytelling
 * - Interactive demonstration HUD for manual testing of all 10 animation actions
 * - STL procedural fallback support for maximum resilience
 * - Strict Zero Emojis.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

export const TOUR_STATES = Object.freeze({
  IDLE: 'IDLE',
  WALKING: 'WALKING',
  TURNING: 'TURNING',
  EXPLAINING: 'EXPLAINING',
  POINTING: 'POINTING',
  WELCOMING: 'WELCOMING',
  LISTENING: 'LISTENING',
  LOOK_AROUND: 'LOOK_AROUND',
});

const DEFAULT_WAYPOINTS = [
  {
    id: 'courtyard_welcome',
    name: 'Courtyard Welcome',
    position: new THREE.Vector3(0.95, -1.25, -2.2),
    landmarkPos: new THREE.Vector3(0.0, 1.8, -4.5),
    story: {
      title: 'The Royal Courtyard (Manek Chowk)',
      caption: 'Welcome to Udaipur. This grand courtyard hosted royal elephant pageants and ceremonial gatherings for over four centuries.',
      duration: 8500,
    },
  },
  {
    id: 'tripolia_gate',
    name: 'Tripolia Gate',
    position: new THREE.Vector3(-1.4, -1.25, -2.4),
    landmarkPos: new THREE.Vector3(-3.2, 2.2, -4.0),
    story: {
      title: 'Tripolia Triple-Arched Gate',
      caption: 'Constructed in 1711, this historic three-arched gate served as the grand ceremonial entrance through which the Maharana entered on royal state occasions.',
      duration: 8500,
    },
  },
  {
    id: 'lake_view',
    name: 'Lake Pichola Balcony',
    position: new THREE.Vector3(1.4, -1.25, -1.9),
    landmarkPos: new THREE.Vector3(3.8, 1.5, -3.8),
    story: {
      title: 'Lake Pichola Panorama',
      caption: 'Overlooking the serene waters of Lake Pichola with Jag Mandir island palace in the distance, inspiring centuries of Mewar royal architecture.',
      duration: 8500,
    },
  },
];

export const GUIDES_CONFIG = {
  trump: {
    id: 'trump',
    name: 'Donald Trump',
    badge: 'HERITAGE GUIDE',
    title: 'Presidential Tour Guide',
    glbUrl: 'assets/models/trump_tour_guide_rigged.glb',
    stlUrl: 'assets/models/trump_tour_guide.stl',
    themeColor: '#e0893a',
    welcomeStory: {
      title: 'City Palace, Udaipur',
      lead: 'Courtyard Welcome',
      body: 'Folks, welcome to City Palace, Udaipur! Believe me, this is one of the most incredible royal palaces in Rajasthan. Absolutely tremendous 400-year history on Lake Pichola.',
      caption: 'Folks, welcome to City Palace, Udaipur! Believe me, this is one of the most incredible royal palaces in Rajasthan. Absolutely tremendous 400-year history on Lake Pichola.',
      duration: 8500,
    },
  },
  salman: {
    id: 'salman',
    name: 'Salman Khan',
    badge: 'BOLLYWOOD GUIDE',
    title: 'Charismatic Heritage Companion',
    glbUrl: 'assets/models/salman_tour_guide_rigged.glb',
    stlUrl: 'assets/models/salman_khan_guide.stl',
    themeColor: '#287277',
    welcomeStory: {
      title: 'City Palace, Udaipur',
      lead: 'Swagat Hai Aapka!',
      body: 'Welcome to Udaipur! Hum yahan explore karenge Lake Pichola ke kinare khada 400 saal purana shandaar City Palace. Ek baar jo commitment kar di, toh poora tour karke hi jaayenge!',
      caption: 'Welcome to Udaipur! Hum yahan explore karenge Lake Pichola ke kinare khada 400 saal purana shandaar City Palace. Ek baar jo commitment kar di, toh poora tour karke hi jaayenge!',
      duration: 8500,
    },
  },
};

const BUBBLE_FADE_MS = 400;

export class TourGuideController {
  constructor(scene, camera, renderer, options = {}) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.currentGuideId = options.guideId || 'trump';
    const guideDef = GUIDES_CONFIG[this.currentGuideId] || GUIDES_CONFIG.trump;
    this.glbUrl = options.glbUrl || guideDef.glbUrl;
    this.stlUrl = options.stlUrl || guideDef.stlUrl;
    this.onFinished = options.onFinished;
    this.onGuideChange = options.onGuideChange;

    this.root = new THREE.Group();
    this.root.name = 'TOUR_GUIDE_ROOT';
    scene.add(this.root);

    this.characterGroup = new THREE.Group();
    this.characterGroup.name = 'TOUR_GUIDE_CHARACTER';
    this.root.add(this.characterGroup);

    // Dedicated cinematic lighting for companion character
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    keyLight.position.set(-1.0, 2.0, 2.0);
    const rimLight = new THREE.DirectionalLight(0xddeeff, 1.2);
    rimLight.position.set(1.5, 1.5, -1.0);
    const fillLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.characterGroup.add(keyLight, rimLight, fillLight);

    // 3D Floating Speech Plaque
    this.bubble = new TourSpeechBubble();
    this.characterGroup.add(this.bubble.mesh);
    this.bubble.mesh.position.set(-0.75, 1.62, 0.1);

    // Animation & State Machine
    this.state = TOUR_STATES.IDLE;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.currentHotspot = null;
    this.shownAt = 0;
    this.duration = 9000;

    // Waypoint Navigation System
    this.waypoints = options.waypoints || DEFAULT_WAYPOINTS;
    this.currentWaypointIndex = -1;
    this.activeWaypoint = null;
    this.tourActive = false;
    this.walkSpeed = 0.85; // m/s
    this.turnSpeed = 3.8; // rad/s

    // Follow math vectors
    this._headPos = new THREE.Vector3();
    this._headQuat = new THREE.Quaternion();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._targetPos = new THREE.Vector3();
    this._moveDir = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this._lookTarget = new THREE.Vector3();
    this._charForward = new THREE.Vector3();
    this._charRight = new THREE.Vector3();
    this._first = true;
    this.lastPos = new THREE.Vector3();
    this.hasLastPos = false;

    // Procedural Fallback Uniforms (if STL is used)
    this.animUniforms = null;
    this.walkIntensity = 0;
    this.walkPhase = 0;
    this.strafeIntensity = 0;
    this.speakIntensity = 0;
    this.speakPhase = 0;
  }

  /**
   * Switch the active tour guide character between available guides.
   * Cleans up existing mesh/animations and dynamically loads the new guide.
   * @param {string} guideId 'trump' | 'salman'
   */
  async switchGuide(guideId) {
    if (!GUIDES_CONFIG[guideId] || this.currentGuideId === guideId) return;

    log(`Switching guide from ${this.currentGuideId} to ${guideId}`);
    this.currentGuideId = guideId;
    const guideDef = GUIDES_CONFIG[guideId];
    this.glbUrl = guideDef.glbUrl;
    this.stlUrl = guideDef.stlUrl;

    // Clean up current character model & animation mixer
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.model);
      this.mixer = null;
    }
    this.actions = {};
    this.activeAction = null;

    if (this.model) {
      this.characterGroup.remove(this.model);
      this.model.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
            else child.material.dispose();
          }
        }
      });
      this.model = null;
    }

    // Load new guide asset
    await this.load();

    // Reset state to Idle
    this.setState(TOUR_STATES.IDLE);

    // Show welcoming dialogue on speech plaque
    if (guideDef.welcomeStory) {
      this.show(guideDef.welcomeStory, performance.now());
    }

    if (this.onGuideChange) {
      this.onGuideChange(guideDef);
    }

    return guideDef;
  }

  /**
   * Load the 3D character asset.
   * Prioritizes the rigged animated GLB model with full bone skinning.
   * Falls back gracefully to the procedural STL pipeline if GLB is missing.
   */
  async load() {
    // 1. Try loading rigged animated GLB
    try {
      log('Attempting to load rigged animated GLB:', this.glbUrl);
      const gltfLoader = new GLTFLoader();
      const gltf = await gltfLoader.loadAsync(this.glbUrl);

      this.model = gltf.scene;
      this.model.name = `${this.currentGuideId}_Tour_Guide_Rigged_Model`;
      this.characterGroup.add(this.model);

      // Setup AnimationMixer
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.model);
        log(`Loaded ${gltf.animations.length} animation clips from GLB for ${this.currentGuideId}`);

        for (const clip of gltf.animations) {
          const action = this.mixer.clipAction(clip);
          this.actions[clip.name] = action;
          log(`  Registered action: ${clip.name} (${clip.duration.toFixed(2)}s)`);
        }

        // Play default Idle animation
        this.playAction('Idle', 0.2);
      }

      this.isRigged = true;
      log(`Rigged Tour Guide (${this.currentGuideId}) loaded successfully from GLB`);
      return true;
    } catch (glbErr) {
      log('GLB load failed or unrigged, trying fallback STL:', glbErr);
      return this.loadSTLFallback();
    }
  }

  /**
   * Fallback loader using the calibrated STL vertex shader deformation pipeline
   */
  async loadSTLFallback() {
    try {
      const loader = new STLLoader();
      const geometry = await loader.loadAsync(this.stlUrl);

      geometry.rotateX(-Math.PI / 2);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();

      const bb = geometry.boundingBox;
      const centerX = (bb.max.x + bb.min.x) / 2;
      const centerZ = (bb.max.z + bb.min.z) / 2;
      geometry.translate(-centerX, -bb.min.y, -centerZ);

      // Colorize the STL model with calibrated character turnaround palette
      if (this.currentGuideId === 'salman') {
        applySalmanAttireColors(geometry);
      } else {
        applyTrumpIndianAttireColors(geometry);
      }

      const uniforms = {
        uTime: { value: 0 },
        uWalk: { value: 0 },
        uWalkPhase: { value: 0 },
        uStrafe: { value: 0 },
        uSpeak: { value: 0 },
        uSpeakPhase: { value: 0 },
        uHeadNod: { value: 0 },
        uHeadTurn: { value: 0 },
        uHeadTilt: { value: 0 },
      };
      this.animUniforms = uniforms;

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.44,
        metalness: 0.08,
      });

      setupProceduralShader(material, uniforms);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `${this.currentGuideId}_Tour_Guide_STL_Mesh`;

      this.model = new THREE.Group();
      this.model.add(mesh);
      this.characterGroup.add(this.model);
      this.isRigged = false;

      log('Loaded fallback STL model with GPU procedural animation pipeline');
      return true;
    } catch (err) {
      console.warn('[MIRAS Tour Guide] Failed to load 3D character:', err);
      return false;
    }
  }

  /**
   * Play an animation action with smooth cross-fading
   * @param {string} actionName
   * @param {number} fadeDuration
   * @param {number} timeScale
   */
  playAction(actionName, fadeDuration = 0.25, timeScale = 1.0) {
    if (!this.actions || !this.actions[actionName]) {
      // Map common state aliases
      const mapped = {
        [TOUR_STATES.IDLE]: 'Idle',
        [TOUR_STATES.WALKING]: 'Walk',
        [TOUR_STATES.TURNING]: 'StopAndTurn',
        [TOUR_STATES.EXPLAINING]: 'Explain',
        [TOUR_STATES.POINTING]: 'Point',
        [TOUR_STATES.WELCOMING]: 'Welcome',
        [TOUR_STATES.LISTENING]: 'Listen',
        [TOUR_STATES.LOOK_AROUND]: 'LookAround',
      }[actionName];

      if (mapped && this.actions[mapped]) {
        return this.playAction(mapped, fadeDuration, timeScale);
      }
      return;
    }

    const nextAction = this.actions[actionName];
    if (this.activeAction === nextAction) return;

    nextAction.reset();
    nextAction.timeScale = timeScale;
    nextAction.fadeIn(fadeDuration);
    nextAction.play();

    if (this.activeAction) {
      this.activeAction.fadeOut(fadeDuration);
    }
    this.activeAction = nextAction;
  }

  /**
   * Set state in the Finite State Machine with appropriate animation transitions
   * @param {string} newState
   * @param {Object} options
   */
  setState(newState, options = {}) {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    log(`State Transition: ${oldState} -> ${newState}`);

    switch (newState) {
      case TOUR_STATES.IDLE:
        this.playAction('Idle', 0.35);
        break;

      case TOUR_STATES.WALKING:
        this.playAction('Walk', 0.25, 1.1);
        break;

      case TOUR_STATES.TURNING:
        this.playAction('StopAndTurn', 0.25);
        break;

      case TOUR_STATES.POINTING:
        this.playAction('Point', 0.3);
        if (options.landmarkPos) {
          this._lookTarget.copy(options.landmarkPos);
        }
        break;

      case TOUR_STATES.EXPLAINING:
        this.playAction('Explain', 0.3);
        break;

      case TOUR_STATES.WELCOMING:
        this.playAction('Welcome', 0.3);
        break;

      case TOUR_STATES.LISTENING:
        this.playAction('Listen', 0.3);
        break;

      case TOUR_STATES.LOOK_AROUND:
        this.playAction('LookAround', 0.35);
        break;
    }
  }

  /**
   * Start automated waypoint tour
   */
  startTour() {
    this.tourActive = true;
    this.currentWaypointIndex = 0;
    this.navigateToWaypoint(this.waypoints[0]);
  }

  /**
   * Stop automated waypoint tour
   */
  stopTour() {
    this.tourActive = false;
    this.activeWaypoint = null;
    this.setState(TOUR_STATES.IDLE);
    this.bubble.hide();
  }

  /**
   * Navigate to a designated waypoint
   * @param {Object} wp
   */
  navigateToWaypoint(wp) {
    this.activeWaypoint = wp;
    this._targetPos.copy(wp.position);
    this.setState(TOUR_STATES.WALKING);
    log(`Navigating to waypoint: ${wp.name}`);
  }

  /**
   * Display hotspot story and trigger pointing/explaining sequence
   * @param {Object} hotspot
   * @param {number} now
   */
  show(hotspot, now) {
    this.currentHotspot = hotspot;
    this.shownAt = now;
    this.duration = hotspot.duration || 9000;

    this.bubble.draw(hotspot);
    this.bubble.show();

    // Sequence: Point at landmark for 2.2 seconds, then transition to Explain gestures
    this.setState(TOUR_STATES.POINTING, { landmarkPos: hotspot.worldPos });
    setTimeout(() => {
      if (this.currentHotspot === hotspot) {
        this.setState(TOUR_STATES.EXPLAINING);
      }
    }, 2200);

    // Speak narration via Web Speech API if supported
    speakNarration(hotspot.caption);
  }

  dismiss() {
    if (this.currentHotspot) {
      this.bubble.hide();
      this.currentHotspot = null;
      this.setState(TOUR_STATES.IDLE);
      if (this.onFinished) {
        this.onFinished(this.currentHotspot, performance.now());
      }
    }
  }

  /**
   * Called every frame in the render loop.
   * Handles navigation physics, arrival detection, head tracking, and animation blending.
   */
  update(dt, now) {
    // Clamp delta time to avoid large jumps
    const delta = Math.min(dt, 0.1);

    // 1. Advance Skeletal Animation Mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 2. Head position tracking
    const vr = this.renderer.xr.isPresenting;
    const head = vr ? this.renderer.xr.getCamera() : this.camera;
    head.getWorldPosition(this._headPos);
    head.getWorldQuaternion(this._headQuat);

    head.getWorldDirection(this._forward);
    this._forward.y = 0;
    if (this._forward.lengthSq() < 0.001) this._forward.set(0, 0, -1);
    this._forward.normalize();
    this._right.crossVectors(this._forward, this._up).normalize();

    // 3. Navigation & Movement Handling
    if (!this.activeWaypoint) {
      // Free follow mode: stay ~2.3m forward and ~0.95m to user's right
      this._targetPos
        .copy(this._headPos)
        .addScaledVector(this._forward, 2.3)
        .addScaledVector(this._right, 0.95);
      this._targetPos.y = this._headPos.y - 1.25;
    }

    if (this._first) {
      this.characterGroup.position.copy(this._targetPos);
      this.lastPos.copy(this._targetPos);
      this.hasLastPos = true;
      this._first = false;
    } else {
      // Smooth movement interpolation
      const distToTarget = this.characterGroup.position.distanceTo(this._targetPos);

      if (this.activeWaypoint) {
        // Waypoint navigation physics with arrival detection
        if (distToTarget > 0.18) {
          const moveStep = Math.min(distToTarget, this.walkSpeed * delta);
          this._moveDir.subVectors(this._targetPos, this.characterGroup.position).normalize();
          this.characterGroup.position.addScaledVector(this._moveDir, moveStep);

          // Face movement direction while walking
          const targetHeading = new THREE.Vector3()
            .copy(this.characterGroup.position)
            .add(this._moveDir);
          targetHeading.y = this.characterGroup.position.y;
          this.characterGroup.lookAt(targetHeading);

          if (this.state !== TOUR_STATES.WALKING) {
            this.setState(TOUR_STATES.WALKING);
          }
        } else {
          // Arrived at waypoint!
          const reachedWp = this.activeWaypoint;
          this.activeWaypoint = null;
          log(`Arrived at waypoint: ${reachedWp.name}`);

          // Turn to face visitor, point to landmark, and explain story
          this.setState(TOUR_STATES.TURNING);
          setTimeout(() => {
            if (reachedWp.story) {
              this.show(reachedWp.story, performance.now());
            } else {
              this.setState(TOUR_STATES.IDLE);
            }
          }, 800);
        }
      } else {
        // Free companion follow mode (simultaneous directional tracking with user)
        const dx = this._targetPos.x - this.characterGroup.position.x;
        const dz = this._targetPos.z - this.characterGroup.position.z;
        const horizDist = Math.sqrt(dx * dx + dz * dz);

        // Turn to look at user
        const eyeLevelTarget = new THREE.Vector3(
          this._headPos.x,
          this.characterGroup.position.y,
          this._headPos.z
        );
        this.characterGroup.lookAt(eyeLevelTarget);

        // Character local orientation vectors
        this.characterGroup.getWorldDirection(this._charForward);
        this._charForward.y = 0;
        if (this._charForward.lengthSq() < 0.001) this._charForward.set(0, 0, -1);
        this._charForward.normalize();
        this._charRight.crossVectors(this._charForward, this._up).normalize();

        // Project displacement onto character's right vector:
        // positive = moving right, negative = moving left
        const lateralMoveX = dx * this._charRight.x + dz * this._charRight.z;

        // Follow speed: responsive and simultaneous with user's head & body motion
        const followSpeed = Math.min(1.0, delta * 7.5);
        this.characterGroup.position.lerp(this._targetPos, followSpeed);

        // State & animation management during user movement:
        // Only override state if not in an active presentation (pointing / explaining)
        const isPresenting =
          this.state === TOUR_STATES.EXPLAINING ||
          this.state === TOUR_STATES.POINTING;

        if (!isPresenting) {
          if (horizDist > 0.07) {
            // User is moving or turning! Switch to Walk
            if (this.state !== TOUR_STATES.WALKING) {
              this.setState(TOUR_STATES.WALKING);
            }
            // Bank into the turn when moving right or left
            if (this.model) {
              const bankTarget = -Math.max(-0.1, Math.min(0.1, lateralMoveX * 0.22));
              this.model.rotation.z += (bankTarget - this.model.rotation.z) * Math.min(1.0, delta * 8.0);
            }
          } else {
            // User stopped moving! Immediately stop and stand in Idle
            if (this.state === TOUR_STATES.WALKING) {
              this.setState(TOUR_STATES.IDLE);
            }
            if (this.model) {
              this.model.rotation.z *= Math.max(0.0, 1.0 - delta * 8.0);
            }
          }
        }
      }
    }

    // 4. Update Procedural Animation Uniforms (if STL fallback is used)
    if (this.animUniforms && this.model) {
      this.updateProceduralFallback(delta, now);
    }

    // 5. Auto-dismiss story after duration
    if (this.state === TOUR_STATES.EXPLAINING && now - this.shownAt >= this.duration) {
      this.dismiss();
      // If on an automated tour, proceed to the next waypoint!
      if (this.tourActive && this.waypoints.length > 0) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
        setTimeout(() => {
          if (this.tourActive) {
            this.navigateToWaypoint(this.waypoints[this.currentWaypointIndex]);
          }
        }, 1500);
      }
    }
  }

  /**
   * Real-time update for procedural STL pipeline fallback
   */
  updateProceduralFallback(dt, now) {
    const dx = this.characterGroup.position.x - this.lastPos.x;
    const dz = this.characterGroup.position.z - this.lastPos.z;
    const distMoved = Math.sqrt(dx * dx + dz * dz);
    const moveSpeed = dt > 0.0005 ? distMoved / dt : 0;
    this.lastPos.copy(this.characterGroup.position);

    const isStopping = moveSpeed < 0.035;
    const targetWalk = isStopping ? 0.0 : Math.min(1.0, moveSpeed / 0.5);
    this.walkIntensity += (targetWalk - this.walkIntensity) * Math.min(1.0, dt * 6.0);

    if (this.walkIntensity > 0.015) {
      this.walkPhase = (this.walkPhase + dt * (6.4 + this.walkIntensity * 2.8)) % (Math.PI * 2);
    }

    const isSpeaking = this.state === TOUR_STATES.EXPLAINING;
    const targetSpeak = isSpeaking ? 1.0 : 0.0;
    this.speakIntensity += (targetSpeak - this.speakIntensity) * Math.min(1.0, dt * 5.0);
    if (this.speakIntensity > 0.01) {
      this.speakPhase += dt * (1.1 + Math.sin(now * 0.0012) * 0.25);
    }

    this.animUniforms.uTime.value = now * 0.001;
    this.animUniforms.uWalk.value = this.walkIntensity;
    this.animUniforms.uWalkPhase.value = this.walkPhase;
    this.animUniforms.uSpeak.value = this.speakIntensity;
    this.animUniforms.uSpeakPhase.value = this.speakPhase;
  }
}

/**
 * Procedural GPU Vertex Shader Setup for STL Fallback
 */
function setupProceduralShader(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWalk = uniforms.uWalk;
    shader.uniforms.uWalkPhase = uniforms.uWalkPhase;
    shader.uniforms.uStrafe = uniforms.uStrafe;
    shader.uniforms.uSpeak = uniforms.uSpeak;
    shader.uniforms.uSpeakPhase = uniforms.uSpeakPhase;
    shader.uniforms.uHeadNod = uniforms.uHeadNod;
    shader.uniforms.uHeadTurn = uniforms.uHeadTurn;
    shader.uniforms.uHeadTilt = uniforms.uHeadTilt;

    shader.vertexShader =
      `
      uniform float uTime;
      uniform float uWalk;
      uniform float uWalkPhase;
      uniform float uStrafe;
      uniform float uSpeak;
      uniform float uSpeakPhase;
      uniform float uHeadNod;
      uniform float uHeadTurn;
      uniform float uHeadTilt;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      float py = position.y;
      float px = position.x;
      float apx = abs(px);

      // 1. Walking Stride
      if (py < 0.65) {
        float legWeight = clamp((0.65 - py) / 0.65, 0.0, 1.0);
        float strideZ = 0.15 * legWeight * uWalk;
        float stepY = 0.048 * legWeight * uWalk;
        if (px > 0.02) {
          transformed.z += sin(uWalkPhase) * strideZ;
          transformed.y += max(0.0, sin(uWalkPhase)) * stepY;
        } else if (px < -0.02) {
          transformed.z += -sin(uWalkPhase) * strideZ;
          transformed.y += max(0.0, -sin(uWalkPhase)) * stepY;
        }
      }

      // 2. Arms & Conversational Trumpian Hand Gestures
      if (apx >= 0.28 && py >= 0.65 && py <= 1.48) {
        float armWeight = clamp((1.45 - py) / 0.70, 0.0, 1.0);
        float elbowWeight = clamp((1.12 - py) / 0.32, 0.0, 1.0);
        float fingerWeight = clamp((0.88 - py) / 0.16, 0.0, 1.0);
        float isLeft = px > 0.0 ? 1.0 : -1.0;

        float armSwing = -isLeft * sin(uWalkPhase) * 0.12 * armWeight * uWalk;
        transformed.z += armSwing;

        if (uSpeak > 0.001) {
          float gPhase = uSpeakPhase * 2.8;
          float pulse = sin(gPhase);
          transformed.z += (0.12 + 0.05 * pulse) * elbowWeight * uSpeak;
          transformed.x += isLeft * pulse * 0.08 * elbowWeight * uSpeak;
        }
      }
      `
    );
  };
}

/**
 * 3D Floating Speech Plaque placed beside the tour guide
 */
class TourSpeechBubble {
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
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / BUBBLE_FADE_MS);
      this.material.opacity = progress;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  hide() {
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / BUBBLE_FADE_MS);
      this.material.opacity = 1 - progress;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.mesh.visible = false;
      }
    };
    requestAnimationFrame(animate);
  }

  draw(hotspot) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pad = 42;
    const maxTextW = w - pad * 2;

    ctx.clearRect(0, 0, w, h);

    // Premium charcoal backdrop with clean border
    const radius = 24;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(w - radius, 0);
    ctx.quadraticCurveTo(w, 0, w, radius);
    ctx.lineTo(w, h - radius);
    ctx.quadraticCurveTo(w, h, w - radius, h);
    ctx.lineTo(radius, h);
    ctx.quadraticCurveTo(0, h, 0, h - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();

    ctx.fillStyle = 'rgba(13, 12, 16, 0.94)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const title = hotspot.title || 'Heritage Site';
    const caption = hotspot.caption || '';

    ctx.textBaseline = 'top';
    let y = pad - 6;

    // Header Badge
    ctx.font = '700 24px "Helvetica Neue", system-ui, sans-serif';
    ctx.fillStyle = '#e0893a';
    ctx.fillText('[DONALD TRUMP · HERITAGE TOUR GUIDE]', pad, y);
    y += 40;

    // Monument Title
    ctx.font = '700 48px Georgia, "Times New Roman", serif';
    ctx.fillStyle = '#fff6ea';
    ctx.fillText(title, pad, y, maxTextW);
    y += 62;

    // Divider Line
    ctx.fillStyle = '#e0893a';
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
 * Text-to-speech synthesis integration (Web Speech API)
 */
function speakNarration(text) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 0.96;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      // Audio speech optional, silently ignore
    }
  }
}

/**
 * Calibrated Indian Attire Vertex Color Assignment for STL fallback
 */
function applyTrumpIndianAttireColors(geometry) {
  const pos = geometry.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  // Exact 5-Swatch Turnaround Color Palette from Reference Image
  const cNavy = new THREE.Color('#22222E');
  const cCream = new THREE.Color('#D9C3AC');
  const cCreamShade = new THREE.Color('#C7B29B');
  const cMaroon = new THREE.Color('#6C2225');
  const cGoldTrim = new THREE.Color('#987148');
  const cHair = new THREE.Color('#987148');
  const cSkin = new THREE.Color('#E29468');
  const cLips = new THREE.Color('#B46240');
  const cShoes = new THREE.Color('#422C21');
  const cButton = new THREE.Color('#CDA05A');

  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ax = Math.abs(x);

    if (y < 0.11) {
      c.copy(cShoes);
    } else if (y < 0.48) {
      c.copy(cCream).lerp(cCreamShade, Math.max(0, Math.sin(y * 42) * 0.03));
    } else if (y >= 0.72 && y < 0.93 && ax >= 0.45) {
      c.copy(cSkin);
    } else if (y >= 0.90 && y < 1.48 && ax >= 0.28) {
      c.copy(cCream);
    } else if (y >= 0.48 && y < 1.55) {
      const isStoleZ = (y < 0.84 && z > 0.11) || (y >= 0.84 && y < 1.15 && z > 0.075) || (y >= 1.15 && z > 0.035);
      const isStoleX = ax >= 0.055 && ax <= 0.235;
      if (isStoleZ && isStoleX && y >= 0.54) {
        const isBorder = ax < 0.082 || ax > 0.208 || y < 0.575;
        c.copy(isBorder ? cGoldTrim : cMaroon);
      } else if (z > 0.08 && ax < 0.016 && y >= 0.86) {
        c.copy(cButton);
      } else if (y < 0.84) {
        c.copy(cCream);
      } else {
        c.copy(cNavy);
      }
    } else if (y >= 1.55 && y < 1.64) {
      if (z > 0.015 && ax < 0.085) {
        c.copy(cSkin);
      } else if (ax >= 0.085 && ax <= 0.18) {
        c.copy(cMaroon);
      } else {
        c.copy(cNavy);
      }
    } else {
      const isFront = z > 0.025 && ax < 0.092;
      const isForeheadHair = (y >= 1.745 && z < 0.09) || y >= 1.76;
      if (isFront && !isForeheadHair) {
        if (y >= 1.635 && y <= 1.655 && ax < 0.032 && z > 0.09) {
          c.copy(cLips);
        } else {
          c.copy(cSkin);
        }
      } else {
        c.copy(cHair);
      }
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/**
 * Calibrated Salman Khan Pathani Attire Vertex Color Assignment for STL fallback
 * Exact 4-swatch turnaround palette: Black Kurta/Salwar, Charcoal Fold, Tan Skin, Turquoise Bracelet.
 */
function applySalmanAttireColors(geometry) {
  const pos = geometry.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  const cBlack = new THREE.Color('#262424');
  const cCharcoal = new THREE.Color('#373536');
  const cSkin = new THREE.Color('#D8A47C');
  const cTurquoise = new THREE.Color('#287277');
  const cSilver = new THREE.Color('#B0B4B8');
  const cShoes = new THREE.Color('#141416');
  const cHair = new THREE.Color('#18181A');
  const cButton = new THREE.Color('#202022');

  const c = new THREE.Color();

  const elbowR = new THREE.Vector3(-0.38, 0.04, 1.22);
  const handR = new THREE.Vector3(-0.56, -0.05, 0.86);
  const armVecR = new THREE.Vector3().subVectors(handR, elbowR);
  const armLen2R = armVecR.lengthSq();

  const elbowL = new THREE.Vector3(0.38, 0.04, 1.22);
  const handL = new THREE.Vector3(0.56, -0.05, 0.86);
  const armVecL = new THREE.Vector3().subVectors(handL, elbowL);
  const armLen2L = armVecL.lengthSq();

  const pt = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ax = Math.abs(x);

    // Footwear: Black formal loafers
    if (y < 0.11) {
      c.copy(cShoes);
    }
    // Salwar: Black trousers
    else if (y < 0.52) {
      c.copy(cBlack);
    }
    // Bilateral Arms & Hands (Continuous Arm Axis Projection)
    else if (ax > 0.24 && y > 0.75 && y < 1.45) {
      pt.set(x, z, y); // pos in Three.js space: Y is up, Z is depth, but in STL coordinate space:
      // Note: in loadSTLFallback, geometry.rotateX(-PI/2) was applied, so Three.js Y is height, -Z is front.
      // Let's compute t along arm:
      const sideIsRight = x < 0;
      const elbow = sideIsRight ? elbowR : elbowL;
      const armVec = sideIsRight ? armVecR : armVecL;
      const armLen2 = sideIsRight ? armLen2R : armLen2L;

      const dot = (x - elbow.x) * armVec.x + (z - elbow.y) * armVec.y + (y - elbow.z) * armVec.z;
      const t = dot / armLen2;

      if (t < 0.24) {
        c.copy(cBlack);
      } else if (t < 0.27) {
        c.copy(cCharcoal);
      } else if (t < 0.65) {
        c.copy(cSkin);
      } else if (t <= 0.74) {
        if (sideIsRight) {
          if (z < -0.015 && x < -0.45) {
            c.copy(cTurquoise);
          } else {
            c.copy(cSilver);
          }
        } else {
          c.copy(cSkin);
        }
      } else {
        c.copy(cSkin);
      }
    }
    // Torso: Black Pathani Kurta with buttons
    else if (y < 1.52) {
      if (z > 0.08 && ax < 0.015 && y >= 1.08 && Math.abs((y - 1.18) % 0.08) < 0.015) {
        c.copy(cButton);
      } else {
        c.copy(cBlack);
      }
    }
    // Neck & Collar
    else if (y < 1.58) {
      if (z > 0.01 && ax < 0.05) {
        c.copy(cSkin);
      } else {
        c.copy(cBlack);
      }
    }
    // Chin & Jawline
    else if (y < 1.66) {
      if (z > -0.01 && ax < 0.08) {
        c.copy(cSkin);
      } else {
        c.copy(cHair);
      }
    }
    // Face Features (Cheeks, Nose, Mouth, Eyes, Forehead)
    else if (y < 1.82) {
      if (z > 0.035 && ax < 0.082) {
        c.copy(cSkin);
      } else {
        c.copy(cHair);
      }
    }
    // Forehead Hairline & Slicked Dark Hair
    else {
      if (y < 1.835 && z > 0.095 && ax < 0.045) {
        c.copy(cSkin);
      } else {
        c.copy(cHair);
      }
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function log(...args) {
  console.info('[MIRAS Tour Guide Controller]', ...args);
}
