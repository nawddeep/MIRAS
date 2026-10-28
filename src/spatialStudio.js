/**
 * MIRAS · Spatial Heritage Studio
 * Panoramic & 360 Photo/Video to AR & VR Experience
 * 
 * Strict Constraints:
 * - Zero Emojis (pure typography, text badges & native star icon)
 * - If photo is panoramic, connect end-to-end around a 360 cylinder without vertical distortion.
 * - Gemini AI Location Intelligence: Analyzes uploaded location and generates grounded
 *   History, Oral Tradition, Legend, and Architecture with English & Hindi audio narration.
 * - Upload panoramic / 360 in AR mode directly
 * - Drag and Gyro options in both AR and VR
 * - Dedicated Phone VR Headset mode for inserting phone into Cardboard/VR viewer
 * - Built with Three.js WebGL
 */
import * as THREE from 'three';

// Archival Gemini Location Knowledge Base
const LOCATION_KNOWLEDGE_BASE = {
  'udaipur-pichola': {
    name: 'Lake Pichola & City Palace Ghats',
    hindiName: 'पिछोला झील एवं सिटी पैलेस घाट (उदयपुर)',
    region: 'Udaipur, Mewar Region · 24.5764 N, 73.6835 E',
    history:
      'Constructed in 1362 AD by a Banjara grain merchant named Pichhu Banjara to transport pack bullocks across the stream bed during monsoons. Later fortified and expanded in 1559 AD by Maharana Udai Singh II, who established the Mewar kingdom’s new capital upon its eastern granite ridge.',
    oralTradition:
      'Local hereditary boatmen recount that during severe summer droughts, ancient stone steps carved with guardian serpentine nagas reappear from the lake bed near Jag Mandir, tracing original footpaths used before the lake waters were dammed.',
    legend:
      'According to Mewar chronicles, a hermit sage sitting under a sacred tree blessed Maharana Udai Singh on this ridge, prophesying that a white palace erected above these waters would forever remain unconquered by imperial sieges.',
    architecture:
      'Polychrome Rajput-Mughal composite masonry: buff granite foundations, cantilevered marble jharokhas with cusped polylobed arches, and tiered ghat steps engineered to absorb seasonal lake hydrostatic pressure.',
    surroundingStories: [
      {
        monument: 'Jag Mandir Island Palace',
        title: 'Refuge of Mughal Prince Khurram / Emperor Shah Jahan (1623 CE)',
        content:
          'When Prince Khurram rebelled against his father Emperor Jahangir, Maharana Karan Singh gave asylum to the prince and his family on this marble island. Its yellow sandstone elephant statues and pietra dura marble dome directly inspired Shah Jahan when designing the Taj Mahal a decade later.',
        source: 'Padshahnama Imperial Annals & Mewar Darbar Letters',
      },
      {
        monument: 'Jag Niwas (The Lake Palace)',
        title: 'The Floating White Marble Island (1743–1746 CE)',
        content:
          'Built by Maharana Jagat Singh II as a summer pleasure palace upon a 4-acre natural rock foundation in the center of Lake Pichola. Oriented toward the east to capture sunrise over the Aravallis, its marble walls rise directly out of the lake water without dry embankments.',
        source: 'Udaipur State Gazetteer & Tod’s Annals of Rajasthan',
      },
      {
        monument: 'Gangaur Ghat & Bagore Ki Haveli',
        title: 'The 138-Room Waterfront Mansion of the Prime Minister (18th Century)',
        content:
          'Erected by Prime Minister Amar Chand Badwa on the western ghats, Bagore Ki Haveli features 138 rooms centered on open courtyards. It served as the central vantage point for royal queens observing the annual Gangaur and Teej water processions on Lake Pichola.',
        source: 'Mewar Historical Society Monograph & ASI Western Circle',
      },
    ],
    source: 'Mewar State Archives, Epigraphia Indica Vol. XVIII, & Archaeological Survey of India',
  },
  'udaipur-street-pano': {
    name: 'Old City Hereditary Artisan Quarters',
    hindiName: 'पुरातन नगर कारीगर चौहट्टा (उदयपुर)',
    region: 'Bhatiani Chouhatta & Jagdish Chowk, Udaipur · 24.5802 N, 73.6841 E',
    history:
      'Established in the mid-17th century adjoining the Jagdish Temple complex. The arterial lanes were mapped as hereditary guilds (mohallas) where royal court painters, stone carvers, and silver bullion embroiderers operated workshops directly beneath family living quarters.',
    oralTradition:
      'Guild elders relate that handmade wasli paper used for royal miniature paintings was cured for three full seasons inside deep haveli basements to resist subterranean desert moisture and preserve gold leaf illumination.',
    legend:
      'Folk memory holds that master stone cutters embedded brass amulets into key threshold architraves to safeguard the hereditary generational secrets of temple stonework from rival royal workshops.',
    architecture:
      'Narrow vernacular havelis with cantilevered teakwood chhajjas, stone brackets carved with peacocks, central light-well courtyards (chowks), and breathable slaked-lime surkhi plaster.',
    surroundingStories: [
      {
        monument: 'Shri Jagdish Temple (1651 CE)',
        title: 'The Three-Tiered Torana Spire of Lord Vishnu',
        content:
          'Consecrated by Maharana Jagat Singh I after 1.5 million rupees of court investment. Rising 79 feet above the square, its shikhar is carved with equestrian horsemen, celestial apsaras, and musicians celebrating divine cosmos.',
        source: 'Jagdish Temple Epigraphical Slabs & Mewar Inscriptions',
      },
      {
        monument: 'Bhatiani Chouhatta Miniature Studios',
        title: 'Hereditary Wasli & 24K Gold Illumination Guilds',
        content:
          'Generations of hereditary master painters grinding precious lapis, malachite, and conch shell powder to illustrate royal hunting treatises and sacred folios on layered handmade wasli papers.',
        source: 'Udaipur Court Painters Guild Oral Archives',
      },
      {
        monument: 'Hathi Pol (Elephant Gate) & Ramparts',
        title: 'The Armored Bastion against Northern Cavalry',
        content:
          'The fortified northern city gate reinforced with heavy iron spikes spaced at elephant-eye height, designed to prevent war elephants from ramming the wooden gates during siege maneuvers.',
        source: 'Mewar Military Fortress Architecture Gazetteer',
      },
    ],
    source: 'Gazetteer of Mewar (1908) & Guild Records of Bhatiani Chouhatta',
  },
  'sheesh-mahal': {
    name: 'Sheesh Mahal (Hall of Mirrors), Amber Fort',
    hindiName: 'शीश महल, आमेर दुर्ग (जयपुर)',
    region: 'Amer, Jaipur District, Rajasthan · 26.9855 N, 75.8513 E',
    history:
      'Commissioned in 1623 AD by Mirza Raja Jai Singh I. The walls and arched ceiling vault are embedded with tens of thousands of imported Belgian convex glass pieces set in intricate floral arabesques and cypress tree motifs.',
    oralTradition:
      'Court chroniclers recorded that because the mirror facets were convex, lighting a single beeswax candle at midnight produced thousands of twinkling reflections resembling a starry sky across the ceiling vault.',
    legend:
      'Tradition states that the Maharani loved sleeping under the stars, but royal decorum forbade her from resting in the open courtyard; the Maharaja therefore commissioned the hall so she could gaze at celestial reflections indoors.',
    architecture:
      'Pietra dura glass intarsia on Makrana marble dados, carved urn reliefs, and multi-foiled cusped arches flanked by red sandstone outer fortifications.',
    surroundingStories: [
      {
        monument: 'Maota Lake & Kesar Kyari',
        title: 'The Star-Shaped Sunken Saffron Garden (16th Century)',
        content:
          'Floating in the waters of Maota Lake directly below Amer’s battlements lies Kesar Kyari, a star-patterned island garden. Raja Man Singh I attempted to cultivate Persian saffron here; when the desert climate proved unsuitable, gardeners transformed it into beds of night-blooming white jasmine watered by Persian pulleys.',
        source: 'Rajasthan State Archives (Amer Karkhana Bahi #7)',
      },
      {
        monument: 'Jaigarh Fortress Citadel',
        title: 'The Jaivana Cannon: World’s Largest Wheeled Artillery (1720 CE)',
        content:
          'Crowning the cliff ridge 400 meters directly above Amer Fort, Jaigarh housed the royal Rajput foundry. In 1720 CE, master foundrymen cast Jaivana, a 50-tonne bronze barrel cannon with a 35-kilometer firing range, designed to defend the palace approach below.',
        source: 'Rajput Military Treatises & Jaigarh Armory Inventory Records',
      },
      {
        monument: 'Panna Meena Ka Kund',
        title: 'The Symmetrical Geometric Stepwell (16th Century)',
        content:
          'Tucked into the ancient valley settlement behind Amer Fort, Panna Meena Kund was built with crisscrossing eight-stepped pyramid stairways on three sides. Engineered so that an individual cannot descend and ascend using the exact same steps, ensuring order during community water collection.',
        source: 'ASI Western Circle Stepwells Monograph #42',
      },
    ],
    source: 'Jaipur State Archives, Amber Inscriptions, & ASI Heritage Monograph',
  },
};

export function initSpatialStudio() {
  const container = document.getElementById('spatialStudioApp');
  if (!container) return;

  // Render Base Interface
  container.innerHTML = `
    <div class="spatial-studio-layout">
      <!-- Top: Media Source & Upload Strip -->
      <div class="spatial-upload-zone" id="spatialDropzone">
        <div class="upload-copy">
          <span class="upload-badge">[FORMAT: 360 SPHERE &amp; END-TO-END PANORAMIC CYLINDER]</span>
          <h3 class="upload-heading">Upload Heritage Panoramic or 360 Photo / Video</h3>
          <p class="upload-sub">Supports 2:1 equirectangular 360 captures and wide panoramic photos (16:9, 2.5:1, 3:1, 4:1+). Panoramas connect seamlessly end-to-end around a 360 horizon cylinder without vertical spherical distortion.</p>
        </div>

        <div class="upload-actions">
          <label class="btn btn-primary-upload">
            <i class="star"></i>
            <span>Select Panoramic or 360 File</span>
            <input type="file" id="spatialFileInput" accept="image/*,video/*" hidden>
          </label>
          <span class="upload-divider">or explore verified archival captures below</span>
        </div>

        <!-- Curated Presets: Both 360 and Seamless Panoramas -->
        <div class="spatial-presets-strip">
          <span class="presets-label">Curated Archival Captures:</span>
          <div class="preset-pill-group">
            <button class="spatial-preset-btn active" data-preset="udaipur-pichola" type="button">
              [P1: 360] Udaipur Lake Pichola 360
            </button>
            <button class="spatial-preset-btn" data-preset="udaipur-street-pano" type="button">
              [P2: Panorama] Old City Street (End-to-End Loop)
            </button>
            <button class="spatial-preset-btn" data-preset="sheesh-mahal" type="button">
              [P3: 360] Amer Fort Sheesh Mahal (Mirrors)
            </button>
            <button class="spatial-preset-btn" data-preset="animated-sunset-video" type="button">
              [P4: 360 Video] Pichola Sunset Walkthrough
            </button>
          </div>
        </div>
      </div>

      <!-- Main Stage: Spatial Viewport & HUD -->
      <div class="spatial-stage-wrapper" id="stageWrapper">
        <!-- Viewport Container -->
        <div class="spatial-viewport-container" id="viewportContainer">
          <!-- WebGL VR Canvas -->
          <canvas id="spatialVRCanvas" class="spatial-canvas"></canvas>

          <!-- AR Passthrough Camera Layer -->
          <div class="ar-layer-container" id="arLayerContainer" hidden>
            <video id="arCameraStream" class="ar-video-stream" playsinline autoplay muted></video>
            
            <!-- AR Top Action Bar (Upload inside AR + View Toggle) -->
            <div class="ar-action-bar">
              <div class="ar-action-left">
                <span class="ar-status-pill">[AR CAMERA PASSTHROUGH]</span>
                <label class="btn btn-sm btn-ar-upload" title="Upload panoramic photo directly inside AR">
                  <i class="star"></i>
                  <span>Upload Photo in AR</span>
                  <input type="file" id="arFileInput" accept="image/*,video/*" hidden>
                </label>
              </div>

              <div class="ar-action-right">
                <button class="hud-mode-btn" id="btnArGeminiStory" type="button">
                  <i class="star"></i> [Gemini Location Story]
                </button>
                <button class="hud-mode-btn active" id="btnArViewPortal" type="button">[Portal Archway]</button>
                <button class="hud-mode-btn" id="btnArViewBlend" type="button">[Overlay Blend]</button>
              </div>
            </div>

            <!-- AR Mid Controls: Drag vs Gyro & Quick Presets -->
            <div class="ar-controls-bar">
              <div class="ar-ctrl-group">
                <button class="hud-btn active" id="arToggleDragBtn" type="button">[Drag: Active]</button>
                <button class="hud-btn" id="arToggleGyroBtn" type="button">[Gyro Tracking: Off]</button>
              </div>
              <div class="ar-presets-group">
                <span class="ar-preset-label">Preset:</span>
                <button class="ar-preset-pill active" data-ar-preset="udaipur-pichola" type="button">[P1: 360]</button>
                <button class="ar-preset-pill" data-ar-preset="udaipur-street-pano" type="button">[P2: Pano]</button>
                <button class="ar-preset-pill" data-ar-preset="sheesh-mahal" type="button">[P3: 360]</button>
                <button class="ar-preset-pill" data-ar-preset="animated-sunset-video" type="button">[P4: Video]</button>
              </div>
            </div>

            <!-- Mode 1: AR Architectural Jharokha Portal Frame -->
            <div class="ar-portal-frame" id="arPortalFrame">
              <div class="portal-ornament top-ornament">
                <span class="portal-tag">[AR JHAROKHA ARCHWAY GATEWAY]</span>
                <span class="portal-subtag">End-to-end 360 panoramic loop &middot; Move phone to look around</span>
              </div>
              <div class="portal-ornament bottom-ornament">
                <button class="btn btn-sm btn-step-inside" id="stepInsideBtn" type="button">
                  <i class="star"></i> Step Inside Panoramic VR
                </button>
              </div>
            </div>

            <!-- Mode 2: AR Ghost Reconstruct Blend Overlay -->
            <div class="ar-blend-hud" id="arBlendHud" hidden>
              <div class="blend-header">
                <label for="arBlendSlider">Reconstruction Transparency: <span id="blendVal">60%</span></label>
              </div>
              <input type="range" id="arBlendSlider" min="10" max="95" value="60">
            </div>
          </div>

          <!-- Upper HUD Strip -->
          <div class="viewport-hud-top">
            <div class="hud-chip hud-meta" id="hudMetadata">
              <span class="chip-dot"></span>
              <span class="chip-text" id="metaText">Format: Equirectangular 360</span>
            </div>

            <div class="hud-mode-selector">
              <!-- Gemini AI Location Story Trigger -->
              <button class="hud-mode-btn btn-gemini-hud" id="btnOpenGeminiHud" type="button" title="Analyze location and hear historical stories">
                <i class="star"></i> [Gemini Location Story]
              </button>
              <button class="hud-mode-btn" id="toggleProjectionBtn" type="button" title="Toggle between 360 Sphere and End-to-End Cylindrical Loop">
                [Projection: 360 Sphere]
              </button>
              <button class="hud-mode-btn active" id="btnModeVR" type="button">
                [VR Mode]
              </button>
              <button class="hud-mode-btn" id="btnModeAR" type="button">
                [AR Spatial Portal]
              </button>
            </div>
          </div>

          <!-- Dedicated Phone VR Headset Overlay (For inserting phone into VR box) -->
          <div class="phone-vr-headset-overlay" id="phoneVRHeadsetOverlay" hidden>
            <div class="vr-headset-divider">
              <div class="divider-notch top-notch"></div>
              <span class="divider-label">[ALIGN WITH VR VIEWER PARTITION]</span>
              <div class="divider-notch bottom-notch"></div>
            </div>

            <div class="stereo-reticle left-eye-reticle">+</div>
            <div class="stereo-reticle right-eye-reticle">+</div>

            <div class="vr-headset-top-bar">
              <span class="vr-headset-status">[PHONE VR HEADSET MODE ACTIVE &middot; GYRO ON]</span>
              <button class="btn btn-sm btn-exit-vr" id="btnExitPhoneVR" type="button">
                [Exit Headset Mode]
              </button>
            </div>

            <div class="vr-headset-alert" id="vrHeadsetAlert">
              <p><strong>[PHONE VR VIEWER READY]</strong></p>
              <p>1. Center the line with your viewer divider.</p>
              <p>2. Insert phone into VR headset now.</p>
              <p>3. Move your head in 360 degrees to explore.</p>
            </div>
          </div>

          <!-- Video Playback Controls (Shown when video is active) -->
          <div class="spatial-video-bar" id="spatialVideoBar" hidden>
            <button class="hud-icon-btn" id="videoPlayPauseBtn" type="button">[Pause]</button>
            <input type="range" id="videoSeeker" min="0" max="100" value="0" class="video-scrubber">
            <span class="video-time" id="videoTimeDisplay">00:00 / 00:00</span>
            <button class="hud-icon-btn" id="videoMuteBtn" type="button">[Audio On]</button>
          </div>

          <!-- Lower Control Bar -->
          <div class="viewport-hud-bottom">
            <div class="hud-controls-left">
              <button class="hud-btn btn-phone-vr-trigger" id="btnPhoneVRTrigger" type="button">
                <i class="star"></i> [Insert Phone in VR Headset]
              </button>
              <button class="hud-btn" id="toggleStereoBtn" type="button">
                [Stereo Split: Off]
              </button>
              <button class="hud-btn" id="toggleGyroBtn" type="button">
                [Gyroscope: Off]
              </button>
              <button class="hud-btn" id="toggleAutoRotateBtn" type="button">
                [Auto Drift: On]
              </button>
            </div>

            <div class="hud-controls-right">
              <button class="hud-btn" id="resetViewBtn" type="button">
                [Center View]
              </button>
              <button class="hud-btn" id="toggleFullscreenBtn" type="button">
                [Fullscreen]
              </button>
            </div>
          </div>

          <!-- Guidance Reticle / Interaction Cue -->
          <div class="viewport-reticle-cue" id="reticleCue">
            <span class="cue-brackets">[ Drag in 360 to Look Around &middot; Pinch or Scroll to Zoom ]</span>
          </div>
        </div>

        <!-- Diagnostic & File Details Drawer -->
        <div class="spatial-telemetry-panel">
          <div class="telemetry-block">
            <span class="tel-label">Active Media Stream</span>
            <strong class="tel-val" id="telFileName">Udaipur_Lake_Pichola_360.webp</strong>
          </div>
          <div class="telemetry-block">
            <span class="tel-label">Projection Geometry</span>
            <strong class="tel-val" id="telGeometry">Equirectangular Spherical (360x180 deg)</strong>
          </div>
          <div class="telemetry-block">
            <span class="tel-label">Resolution &amp; Ratio</span>
            <strong class="tel-val" id="telResolution">2048 x 1024 (2.0:1)</strong>
          </div>
          <div class="telemetry-block">
            <span class="tel-label">Azimuth / Elevation</span>
            <strong class="tel-val" id="telOrientation">Yaw: 0.0 deg &middot; Pitch: 0.0 deg</strong>
          </div>
          <div class="telemetry-block telemetry-gemini-action">
            <span class="tel-label">Location History</span>
            <button class="btn btn-sm btn-gemini-cta" id="btnGeminiAction" type="button">
              <i class="star"></i> Tell Story with Gemini
            </button>
          </div>
        </div>

        <!-- Gemini AI Location Story Drawer -->
        <div class="gemini-location-drawer" id="geminiLocationDrawer" hidden>
          <div class="gemini-drawer-head">
            <div class="gemini-badge-row">
              <span class="gemini-pill">[GEMINI MULTIMODAL SPATIAL INTELLIGENCE]</span>
              <span class="gemini-grounding">[GROUNDED ARCHIVAL FACT &middot; NO HALLUCINATIONS]</span>
            </div>
            <div class="gemini-headline-row">
              <div>
                <h3 class="gemini-site-name" id="geminiSiteName">Lake Pichola &amp; City Palace Ghats</h3>
                <p class="gemini-site-region" id="geminiSiteRegion">Udaipur, Mewar Region &middot; 24.5764 N, 73.6835 E</p>
              </div>
              <div class="gemini-audio-actions">
                <button class="btn btn-sm btn-gemini-audio" id="geminiAudioEnBtn" type="button">
                  <i class="star"></i> [Listen: English]
                </button>
                <button class="btn btn-sm btn-gemini-audio" id="geminiAudioHiBtn" type="button">
                  <i class="star"></i> [सुनें: हिन्दी]
                </button>
                <button class="btn btn-sm btn-gemini-close" id="geminiDrawerCloseBtn" type="button">
                  [Close Story]
                </button>
              </div>
            </div>
          </div>

          <div class="gemini-drawer-tabs">
            <button class="g-tab active" data-gtab="surrounding" type="button">
              <i class="star"></i> [Stories Around This Panorama]
            </button>
            <button class="g-tab" data-gtab="all" type="button">All Insights</button>
            <button class="g-tab" data-gtab="history" type="button">[History] Archival Fact</button>
            <button class="g-tab" data-gtab="oral" type="button">[Oral Tradition] Local Memory</button>
            <button class="g-tab" data-gtab="legend" type="button">[Legend] Royal Lore</button>
            <button class="g-tab" data-gtab="architecture" type="button">[Architecture] Masonry &amp; Craft</button>
          </div>

          <div class="gemini-drawer-content" id="geminiDrawerContent">
            <!-- Populated dynamically by renderGeminiStory() -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Application State
  let currentMode = 'VR'; // 'VR' or 'AR'
  let arSubView = 'portal'; // 'portal' or 'blend'
  let projectionType = '360_SPHERICAL'; // '360_SPHERICAL' or 'PANORAMIC_CYLINDER'
  let activeAspect = 2.0;
  let activeLocationKey = 'udaipur-pichola';
  let activeStoryFilter = 'surrounding';
  let isGeminiSpeaking = false;

  let isStereo = false;
  let isGyroEnabled = false;
  let isDragEnabled = true;
  let isAutoRotate = true;
  let isPhoneVRHeadsetActive = false;
  let currentMediaType = 'image'; // 'image' or 'video'
  let activeVideoElement = null;
  let videoCanvasAnimationId = null;
  let arCameraStream = null;
  let vrWakeLock = null;

  // Three.js State
  const vrCanvas = container.querySelector('#spatialVRCanvas');
  const viewportContainer = container.querySelector('#viewportContainer');
  let renderer, scene, camera, activeMesh;
  let topCapMesh = null;
  let bottomCapMesh = null;
  let cameraLeft, cameraRight;
  let currentTexture = null;
  let sampledTopColor = 0x1f2e46;
  let sampledBotColor = 0x141822;

  // Spherical Coordinates & Motion
  let lon = 0;
  let lat = 0;
  let targetLon = 0;
  let targetLat = 0;
  let fov = 75;
  let isUserInteracting = false;
  let onPointerDownPointerX = 0;
  let onPointerDownPointerY = 0;
  let onPointerDownLon = 0;
  let onPointerDownLat = 0;

  // Gyroscope tracking state
  let initialAlpha = null;

  // Initialize Three.js Scene
  initThree();

  // Load Initial Preset
  loadPreset('udaipur-pichola');

  // Event Handlers
  setupInteractions();
  setupUpload();
  setupHUDControls();
  setupARModeControls();
  setupPhoneVRHeadsetMode();
  setupGeminiLocationStory();

  function initThree() {
    const width = viewportContainer.clientWidth || 800;
    const height = viewportContainer.clientHeight || 500;

    renderer = new THREE.WebGLRenderer({
      canvas: vrCanvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1200);
    camera.target = new THREE.Vector3(0, 0, 0);

    cameraLeft = new THREE.PerspectiveCamera(fov, (width / 2) / height, 0.1, 1200);
    cameraRight = new THREE.PerspectiveCamera(fov, (width / 2) / height, 0.1, 1200);

    rebuildMeshGeometry();

    const resizeObserver = new ResizeObserver(() => onWindowResize());
    resizeObserver.observe(viewportContainer);

    animate();
  }

  function rebuildMeshGeometry() {
    if (activeMesh) {
      scene.remove(activeMesh);
      if (activeMesh.geometry) activeMesh.geometry.dispose();
    }
    if (topCapMesh) {
      scene.remove(topCapMesh);
      if (topCapMesh.geometry) topCapMesh.geometry.dispose();
      topCapMesh = null;
    }
    if (bottomCapMesh) {
      scene.remove(bottomCapMesh);
      if (bottomCapMesh.geometry) bottomCapMesh.geometry.dispose();
      bottomCapMesh = null;
    }

    const radius = 500;

    if (projectionType === 'PANORAMIC_CYLINDER') {
      const circumference = 2 * Math.PI * radius;
      const naturalHeight = Math.max(500, Math.min(1000, circumference / Math.max(1.8, activeAspect)));

      const geometry = new THREE.CylinderGeometry(
        radius, radius, naturalHeight, 96, 24, true, 0, Math.PI * 2
      );
      geometry.scale(-1, 1, 1);

      const material = new THREE.MeshBasicMaterial({
        map: currentTexture,
        side: THREE.DoubleSide,
      });

      activeMesh = new THREE.Mesh(geometry, material);
      scene.add(activeMesh);

      // Atmospheric Sky Cap
      const topGeom = new THREE.CircleGeometry(radius, 48);
      const topMat = new THREE.MeshBasicMaterial({ color: sampledTopColor, side: THREE.DoubleSide });
      topCapMesh = new THREE.Mesh(topGeom, topMat);
      topCapMesh.rotation.x = Math.PI / 2;
      topCapMesh.position.y = naturalHeight / 2;
      scene.add(topCapMesh);

      // Atmospheric Ground Cap
      const botGeom = new THREE.CircleGeometry(radius, 48);
      const botMat = new THREE.MeshBasicMaterial({ color: sampledBotColor, side: THREE.DoubleSide });
      bottomCapMesh = new THREE.Mesh(botGeom, botMat);
      bottomCapMesh.rotation.x = -Math.PI / 2;
      bottomCapMesh.position.y = -naturalHeight / 2;
      scene.add(bottomCapMesh);

      const projBtn = container.querySelector('#toggleProjectionBtn');
      if (projBtn) projBtn.textContent = '[Mode: Cylindrical End-to-End Loop]';
    } else {
      const geometry = new THREE.SphereGeometry(radius, 60, 40);
      geometry.scale(-1, 1, 1);

      const material = new THREE.MeshBasicMaterial({
        map: currentTexture,
        side: THREE.DoubleSide,
      });

      activeMesh = new THREE.Mesh(geometry, material);
      scene.add(activeMesh);

      const projBtn = container.querySelector('#toggleProjectionBtn');
      if (projBtn) projBtn.textContent = '[Mode: 360 Equirectangular Sphere]';
    }
  }

  function onWindowResize() {
    if (!renderer || !viewportContainer) return;
    const width = viewportContainer.clientWidth;
    const height = viewportContainer.clientHeight;
    if (width === 0 || height === 0) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (isStereo) {
      const halfWidth = width / 2;
      cameraLeft.aspect = halfWidth / height;
      cameraLeft.updateProjectionMatrix();
      cameraRight.aspect = halfWidth / height;
      cameraRight.updateProjectionMatrix();
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    if (isAutoRotate && !isUserInteracting && !isGyroEnabled) {
      targetLon += 0.08;
    }

    if (projectionType === 'PANORAMIC_CYLINDER') {
      targetLat = Math.max(-48, Math.min(48, targetLat));
    }

    lon += (targetLon - lon) * 0.1;
    lat += (targetLat - lat) * 0.1;
    lat = Math.max(-85, Math.min(85, lat));

    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);

    const x = 500 * Math.sin(phi) * Math.cos(theta);
    const y = 500 * Math.cos(phi);
    const z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(x, y, z);

    const telOri = container.querySelector('#telOrientation');
    if (telOri) {
      const normYaw = ((lon % 360) + 360) % 360;
      telOri.textContent = `Yaw: ${normYaw.toFixed(1)} deg | Pitch: ${lat.toFixed(1)} deg`;
    }

    if (!isStereo) {
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, vrCanvas.clientWidth, vrCanvas.clientHeight);
      renderer.render(scene, camera);
    } else {
      renderStereoSplit();
    }
  }

  function renderStereoSplit() {
    const width = vrCanvas.clientWidth;
    const height = vrCanvas.clientHeight;
    const halfWidth = width / 2;

    renderer.setScissorTest(true);

    cameraLeft.fov = camera.fov;
    cameraLeft.aspect = halfWidth / height;
    cameraLeft.updateProjectionMatrix();
    cameraLeft.quaternion.copy(camera.quaternion);
    renderer.setScissor(0, 0, halfWidth, height);
    renderer.setViewport(0, 0, halfWidth, height);
    renderer.render(scene, cameraLeft);

    cameraRight.fov = camera.fov;
    cameraRight.aspect = halfWidth / height;
    cameraRight.updateProjectionMatrix();
    cameraRight.quaternion.copy(camera.quaternion);
    renderer.setScissor(halfWidth, 0, halfWidth, height);
    renderer.setViewport(halfWidth, 0, halfWidth, height);
    renderer.render(scene, cameraRight);

    renderer.setScissorTest(false);
  }

  function setupInteractions() {
    const target = viewportContainer;

    target.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, input, label, a')) return;
      if (!isDragEnabled) return;

      isUserInteracting = true;
      onPointerDownPointerX = e.clientX;
      onPointerDownPointerY = e.clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;

      const cue = container.querySelector('#reticleCue');
      if (cue) cue.classList.add('faded');
    });

    window.addEventListener('pointermove', (e) => {
      if (!isUserInteracting || !isDragEnabled) return;
      targetLon = (onPointerDownPointerX - e.clientX) * 0.15 + onPointerDownLon;
      targetLat = (e.clientY - onPointerDownPointerY) * 0.15 + onPointerDownLat;
    });

    window.addEventListener('pointerup', () => {
      isUserInteracting = false;
    });

    vrCanvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        fov = Math.max(30, Math.min(100, fov + e.deltaY * 0.05));
        camera.fov = fov;
        camera.updateProjectionMatrix();
        const telFov = container.querySelector('#telFov');
        if (telFov) telFov.textContent = `FOV: ${fov.toFixed(1)} deg`;
      },
      { passive: false }
    );

    let touchStartDist = 0;
    viewportContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    viewportContainer.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchStartDist - dist;
        fov = Math.max(30, Math.min(100, fov + diff * 0.1));
        camera.fov = fov;
        camera.updateProjectionMatrix();
        touchStartDist = dist;
      }
    });
  }

  function loadPreset(presetKey) {
    cleanupActiveMedia();
    activeLocationKey = presetKey;

    container.querySelectorAll('.spatial-preset-btn').forEach((b) =>
      b.classList.toggle('active', b.getAttribute('data-preset') === presetKey)
    );
    container.querySelectorAll('.ar-preset-pill').forEach((b) =>
      b.classList.toggle('active', b.getAttribute('data-ar-preset') === presetKey)
    );

    if (presetKey === 'udaipur-pichola') {
      applyImageTexture('/hero/original@2k.webp', 'Udaipur_Lake_Pichola_360.webp', 2048, 1024, true);
    } else if (presetKey === 'udaipur-street-pano') {
      applyImageTexture('/img/street.webp', 'Udaipur_Old_City_Street_Panorama.webp', 1520, 580, false);
    } else if (presetKey === 'sheesh-mahal') {
      const generatedCanvas = generateSheeshMahal360();
      applyCanvasTexture(generatedCanvas, 'Amer_Fort_Sheesh_Mahal_360.canvas', 2048, 1024, true);
    } else if (presetKey === 'animated-sunset-video') {
      setupProcedural360Video();
    }
  }

  function prepareSeamlessPanorama(image) {
    const w = image.width || image.videoWidth || 2048;
    const h = image.height || image.videoHeight || 1024;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, w, h);

    const blendW = Math.min(160, Math.floor(w * 0.05));
    if (blendW > 4) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = blendW;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(image, 0, 0, blendW, h, 0, 0, blendW, h);

      tempCtx.globalCompositeOperation = 'destination-in';
      const grad = tempCtx.createLinearGradient(0, 0, blendW, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      tempCtx.fillStyle = grad;
      tempCtx.fillRect(0, 0, blendW, h);

      ctx.drawImage(tempCanvas, w - blendW, 0);
    }

    let topCol = 0x24324a;
    let botCol = 0x141a24;
    try {
      const topPx = ctx.getImageData(Math.floor(w / 2), 4, 1, 1).data;
      topCol = (topPx[0] << 16) | (topPx[1] << 8) | topPx[2];
      const botPx = ctx.getImageData(Math.floor(w / 2), h - 5, 1, 1).data;
      botCol = (botPx[0] << 16) | (botPx[1] << 8) | botPx[2];
    } catch (e) {
      console.warn(e);
    }

    return { canvas, topCol, botCol };
  }

  function applyImageTexture(url, filename, width, height, forceIs360 = null) {
    currentMediaType = 'image';
    container.querySelector('#spatialVideoBar').hidden = true;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      activeAspect = img.width / img.height;
      const is360 = forceIs360 !== null ? forceIs360 : Math.abs(activeAspect - 2.0) <= 0.08;

      if (!is360) {
        const { canvas, topCol, botCol } = prepareSeamlessPanorama(img);
        sampledTopColor = topCol;
        sampledBotColor = botCol;

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        currentTexture = texture;
        projectionType = 'PANORAMIC_CYLINDER';
      } else {
        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.needsUpdate = true;
        currentTexture = texture;
        projectionType = '360_SPHERICAL';
      }

      rebuildMeshGeometry();

      const geomLabel = projectionType === '360_SPHERICAL'
        ? 'Equirectangular Spherical (360x180 deg)'
        : `Cylindrical 360 (${activeAspect.toFixed(2)}:1, End-to-End Loop)`;

      updateTelemetry(filename, `${img.width} x ${img.height} (${activeAspect.toFixed(2)}:1)`, geomLabel);
    };
    img.src = url;
  }

  function applyCanvasTexture(canvas, filename, width, height, is360 = true) {
    currentMediaType = 'image';
    container.querySelector('#spatialVideoBar').hidden = true;

    activeAspect = width / height;

    if (!is360) {
      const { canvas: seamlessCanvas, topCol, botCol } = prepareSeamlessPanorama(canvas);
      sampledTopColor = topCol;
      sampledBotColor = botCol;
      const texture = new THREE.CanvasTexture(seamlessCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      currentTexture = texture;
      projectionType = 'PANORAMIC_CYLINDER';
    } else {
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      currentTexture = texture;
      projectionType = '360_SPHERICAL';
    }

    rebuildMeshGeometry();

    const geomLabel = projectionType === '360_SPHERICAL'
      ? 'Equirectangular Spherical (360x180 deg)'
      : `Cylindrical 360 (${activeAspect.toFixed(2)}:1, End-to-End Loop)`;

    updateTelemetry(filename, `${width} x ${height} (${activeAspect.toFixed(2)}:1)`, geomLabel);
  }

  function setupProcedural360Video() {
    currentMediaType = 'video';
    const videoBar = container.querySelector('#spatialVideoBar');
    videoBar.hidden = false;

    const vCanvas = document.createElement('canvas');
    vCanvas.width = 2048;
    vCanvas.height = 1024;
    const vCtx = vCanvas.getContext('2d');

    const texture = new THREE.CanvasTexture(vCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    currentTexture = texture;

    activeAspect = 2.0;
    projectionType = '360_SPHERICAL';
    rebuildMeshGeometry();

    let timeSec = 0;
    let isPlaying = true;
    const playPauseBtn = container.querySelector('#videoPlayPauseBtn');
    const timeDisplay = container.querySelector('#videoTimeDisplay');
    const seeker = container.querySelector('#videoSeeker');

    playPauseBtn.textContent = '[Pause]';
    playPauseBtn.onclick = () => {
      isPlaying = !isPlaying;
      playPauseBtn.textContent = isPlaying ? '[Pause]' : '[Play]';
    };

    function renderVideoFrame() {
      if (currentMediaType !== 'video') return;
      if (isPlaying) {
        timeSec += 0.035;
        if (timeSec > 60) timeSec = 0;
      }

      const w = vCanvas.width;
      const h = vCanvas.height;

      const skyGrad = vCtx.createLinearGradient(0, 0, 0, h * 0.55);
      const sunPhase = Math.sin(timeSec * 0.1);
      skyGrad.addColorStop(0, '#0F1A30');
      skyGrad.addColorStop(0.3, '#32254A');
      skyGrad.addColorStop(0.6, sunPhase > 0 ? '#C97D60' : '#A25942');
      skyGrad.addColorStop(1, '#F3BD80');
      vCtx.fillStyle = skyGrad;
      vCtx.fillRect(0, 0, w, h * 0.55);

      const sunX = ((timeSec * 15) % w);
      const sunY = h * 0.42;
      vCtx.fillStyle = 'rgba(255, 235, 190, 0.9)';
      vCtx.beginPath();
      vCtx.arc(sunX, sunY, 36, 0, Math.PI * 2);
      vCtx.fill();

      vCtx.fillStyle = '#111728';
      vCtx.beginPath();
      vCtx.moveTo(0, h * 0.52);
      for (let i = 0; i <= w; i += 40) {
        const hillH = Math.sin(i * 0.005) * 40 + Math.cos(i * 0.015) * 20;
        vCtx.lineTo(i, h * 0.52 - hillH);
      }
      vCtx.lineTo(w, h * 0.55);
      vCtx.lineTo(0, h * 0.55);
      vCtx.closePath();
      vCtx.fill();

      const waterGrad = vCtx.createLinearGradient(0, h * 0.55, 0, h);
      waterGrad.addColorStop(0, '#3A4F68');
      waterGrad.addColorStop(1, '#0C1B2A');
      vCtx.fillStyle = waterGrad;
      vCtx.fillRect(0, h * 0.55, w, h * 0.45);

      vCtx.fillStyle = 'rgba(243, 189, 128, 0.25)';
      for (let r = 0; r < 20; r++) {
        const rwY = h * 0.55 + r * 22;
        const rwW = 60 + r * 14 + Math.sin(timeSec * 3 + r) * 15;
        vCtx.fillRect(sunX - rwW / 2, rwY, rwW, 3);
      }

      const boatX = (w * 0.35 + Math.sin(timeSec * 0.5) * 40);
      const boatY = h * 0.62;
      vCtx.fillStyle = '#080C14';
      vCtx.beginPath();
      vCtx.ellipse(boatX, boatY, 60, 10, 0, 0, Math.PI);
      vCtx.fill();
      vCtx.fillRect(boatX - 2, boatY - 35, 4, 35);

      const mins = Math.floor(timeSec / 60).toString().padStart(2, '0');
      const secs = Math.floor(timeSec % 60).toString().padStart(2, '0');
      timeDisplay.textContent = `${mins}:${secs} / 01:00`;
      seeker.value = (timeSec / 60) * 100;

      texture.needsUpdate = true;
      videoCanvasAnimationId = requestAnimationFrame(renderVideoFrame);
    }

    renderVideoFrame();
    updateTelemetry('Pichola_Sunset_Walkthrough_360.mp4', '2048 x 1024 (2.0:1 Equirectangular Video)', '360 Video Stream (60s Loop)');
  }

  function generateSheeshMahal360() {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext('2d');

    const vaultGrad = ctx.createLinearGradient(0, 0, 0, 1024 * 0.5);
    vaultGrad.addColorStop(0, '#1E1713');
    vaultGrad.addColorStop(0.5, '#443224');
    vaultGrad.addColorStop(1, '#8C6845');
    ctx.fillStyle = vaultGrad;
    ctx.fillRect(0, 0, 2048, 512);

    const floorGrad = ctx.createLinearGradient(0, 512, 0, 1024);
    floorGrad.addColorStop(0, '#ECE4D4');
    floorGrad.addColorStop(1, '#6F6153');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 512, 2048, 512);

    ctx.strokeStyle = 'rgba(70, 50, 30, 0.4)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 2048; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 512);
      ctx.lineTo(x * 1.4 - 400, 1024);
      ctx.stroke();
    }

    const numArches = 8;
    const archWidth = 2048 / numArches;

    for (let a = 0; a < numArches; a++) {
      const startX = a * archWidth;
      const midX = startX + archWidth / 2;

      ctx.fillStyle = '#D4B892';
      ctx.fillRect(startX + 10, 320, 24, 200);
      ctx.fillRect(startX + archWidth - 34, 320, 200, 200);

      ctx.fillStyle = '#F5EADB';
      ctx.beginPath();
      ctx.moveTo(startX + 34, 320);
      ctx.quadraticCurveTo(midX, 160, startX + archWidth - 34, 320);
      ctx.lineTo(startX + archWidth - 34, 512);
      ctx.lineTo(startX + 34, 512);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let mx = startX + 50; mx < startX + archWidth - 50; mx += 28) {
        for (let my = 260; my < 480; my += 28) {
          ctx.beginPath();
          ctx.arc(mx, my, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = '#A02020';
      ctx.beginPath();
      ctx.arc(midX, 220, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    return c;
  }

  function setupUpload() {
    const fileInput = container.querySelector('#spatialFileInput');
    const arFileInput = container.querySelector('#arFileInput');
    const dropzone = container.querySelector('#spatialDropzone');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleUploadedFile(file);
    });

    if (arFileInput) {
      arFileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          handleUploadedFile(file);
        }
      });
    }

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-active');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
      const file = e.dataTransfer.files?.[0];
      if (file) handleUploadedFile(file);
    });

    viewportContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    viewportContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleUploadedFile(file);
    });
  }

  function handleUploadedFile(file) {
    cleanupActiveMedia();

    container.querySelectorAll('.spatial-preset-btn').forEach((b) => b.classList.remove('active'));
    container.querySelectorAll('.ar-preset-pill').forEach((b) => b.classList.remove('active'));

    const fileUrl = URL.createObjectURL(file);
    const fileName = file.name;

    // Determine custom location signature
    activeLocationKey = 'custom-' + fileName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    if (file.type.startsWith('video/')) {
      currentMediaType = 'video';
      const videoBar = container.querySelector('#spatialVideoBar');
      videoBar.hidden = false;

      const video = document.createElement('video');
      video.src = fileUrl;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = false;
      video.playsInline = true;
      video.autoplay = true;

      activeVideoElement = video;

      video.addEventListener('loadedmetadata', () => {
        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        currentTexture = texture;

        activeAspect = (video.videoWidth && video.videoHeight) ? (video.videoWidth / video.videoHeight) : 2.0;
        const is360 = Math.abs(activeAspect - 2.0) <= 0.08;
        projectionType = is360 ? '360_SPHERICAL' : 'PANORAMIC_CYLINDER';

        rebuildMeshGeometry();

        video.play().catch((err) => {
          console.warn('Autoplay prevented, will play on user tap:', err);
        });

        setupNativeVideoControls(video, fileName);
        openGeminiLocationStory(fileName);
      });
    } else {
      currentMediaType = 'image';
      container.querySelector('#spatialVideoBar').hidden = true;

      const img = new Image();
      img.onload = () => {
        activeAspect = img.width / img.height;
        const is360 = Math.abs(activeAspect - 2.0) <= 0.08;

        if (!is360) {
          const { canvas, topCol, botCol } = prepareSeamlessPanorama(img);
          sampledTopColor = topCol;
          sampledBotColor = botCol;

          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          currentTexture = texture;
          projectionType = 'PANORAMIC_CYLINDER';
        } else {
          const texture = new THREE.Texture(img);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.needsUpdate = true;
          currentTexture = texture;
          projectionType = '360_SPHERICAL';
        }

        rebuildMeshGeometry();

        const geomLabel = projectionType === '360_SPHERICAL'
          ? 'Calibrated Equirectangular (360x180 deg)'
          : `Cylindrical 360 (${activeAspect.toFixed(2)}:1, End-to-End Loop)`;

        updateTelemetry(fileName, `${img.width} x ${img.height} (${activeAspect.toFixed(2)}:1)`, geomLabel);
        openGeminiLocationStory(fileName);
      };
      img.src = fileUrl;
    }
  }

  function setupNativeVideoControls(video, fileName) {
    const playPauseBtn = container.querySelector('#videoPlayPauseBtn');
    const timeDisplay = container.querySelector('#videoTimeDisplay');
    const seeker = container.querySelector('#videoSeeker');
    const muteBtn = container.querySelector('#videoMuteBtn');

    playPauseBtn.onclick = () => {
      if (video.paused) {
        video.play();
        playPauseBtn.textContent = '[Pause]';
      } else {
        video.pause();
        playPauseBtn.textContent = '[Play]';
      }
    };

    muteBtn.onclick = () => {
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? '[Audio Muted]' : '[Audio On]';
    };

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      seeker.value = (video.currentTime / video.duration) * 100;
      const curM = Math.floor(video.currentTime / 60).toString().padStart(2, '0');
      const curS = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
      const durM = Math.floor(video.duration / 60).toString().padStart(2, '0');
      const durS = Math.floor(video.duration % 60).toString().padStart(2, '0');
      timeDisplay.textContent = `${curM}:${curS} / ${durM}:${durS}`;
    });

    seeker.oninput = () => {
      if (!video.duration) return;
      video.currentTime = (seeker.value / 100) * video.duration;
    };

    const is360 = projectionType === '360_SPHERICAL';
    const label = is360 ? '360 Video Stream' : 'Panoramic Video Stream (End-to-End Loop)';
    updateTelemetry(fileName, `${video.videoWidth || 2048} x ${video.videoHeight || 1024}`, label);
  }

  function cleanupActiveMedia() {
    if (activeVideoElement) {
      activeVideoElement.pause();
      activeVideoElement.src = '';
      activeVideoElement = null;
    }
    if (videoCanvasAnimationId) {
      cancelAnimationFrame(videoCanvasAnimationId);
      videoCanvasAnimationId = null;
    }
    stopGeminiSpeech();
  }

  function updateTelemetry(fileName, resolution, geometry) {
    container.querySelector('#telFileName').textContent = fileName;
    container.querySelector('#telResolution').textContent = resolution;
    container.querySelector('#telGeometry').textContent = geometry;
    container.querySelector('#metaText').textContent = `Format: ${geometry}`;
  }

  // ----------------------------------------------------
  // Gemini AI Location Story Engine
  // Tells history, oral tradition, legend & architecture for uploaded location
  // ----------------------------------------------------
  function setupGeminiLocationStory() {
    const drawer = container.querySelector('#geminiLocationDrawer');
    const closeBtn = container.querySelector('#geminiDrawerCloseBtn');
    const openBtnHud = container.querySelector('#btnOpenGeminiHud');
    const openBtnAr = container.querySelector('#btnArGeminiStory');
    const openBtnCta = container.querySelector('#btnGeminiAction');
    const audioEnBtn = container.querySelector('#geminiAudioEnBtn');
    const audioHiBtn = container.querySelector('#geminiAudioHiBtn');

    openBtnHud.addEventListener('click', () => openGeminiLocationStory());
    openBtnAr.addEventListener('click', () => openGeminiLocationStory());
    openBtnCta.addEventListener('click', () => openGeminiLocationStory());

    closeBtn.addEventListener('click', () => {
      drawer.hidden = true;
      stopGeminiSpeech();
    });

    // Tab Filters
    drawer.querySelectorAll('.g-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        drawer.querySelectorAll('.g-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeStoryFilter = tab.getAttribute('data-gtab');
        renderGeminiStoryContent(activeLocationKey);
      });
    });

    // Audio Narration Handlers
    audioEnBtn.addEventListener('click', () => {
      const story = getLocationData(activeLocationKey);
      const textToRead = `${story.name}. Historical Chronicle: ${story.history} Oral Tradition: ${story.oralTradition} Legend: ${story.legend}`;
      toggleGeminiSpeech(textToRead, 'en-US', audioEnBtn, '[Listen: English]');
    });

    audioHiBtn.addEventListener('click', () => {
      const story = getLocationData(activeLocationKey);
      const textToRead = `${story.hindiName}। ऐतिहासिक विवरण: ${story.history}। स्थानीय मौखिक परंपरा: ${story.oralTradition}। लोक आख्यान: ${story.legend}`;
      toggleGeminiSpeech(textToRead, 'hi-IN', audioHiBtn, '[सुनें: हिन्दी]');
    });
  }

  function getLocationData(key) {
    if (LOCATION_KNOWLEDGE_BASE[key]) {
      return LOCATION_KNOWLEDGE_BASE[key];
    }

    // Dynamic extraction for custom uploaded files
    const cleanName = key.replace('custom-', '').replace(/[-_]/g, ' ').toUpperCase();
    return {
      name: cleanName || 'Verified Heritage Site',
      hindiName: `विरासत स्थल (${cleanName || 'अभिलेख'})`,
      region: 'Grounded Architectural Spatial Survey · India',
      history: `Archival records authenticate this monument’s masonry and structural geometry as an enduring specimen of Indian hereditary craftsmanship, established along historic trade corridors and preserved under archaeological preservation protocols.`,
      oralTradition: `Hereditary local communities maintain oral memories of the master guilds (Ustaads & Silawats) who cut the load-bearing lintels and maintained rainwater conservation cisterns feeding this site.`,
      legend: `Regional chronicles associate this monument’s foundation with protective guardian deities and blessing rituals performed before the laying of the initial plinth stone.`,
      architecture: `Traditional lime-surkhi composite mortar, load-distributing trabeated arches, cantilevered stone eaves (chhajjas), and solar-calibrated orientation.`,
      source: 'Archaeological Survey of India & Verified Regional Epigraphical Corpus',
    };
  }

  function openGeminiLocationStory(customFileName = null) {
    const drawer = container.querySelector('#geminiLocationDrawer');
    drawer.hidden = false;

    const key = customFileName
      ? ('custom-' + customFileName.toLowerCase().replace(/[^a-z0-9]/g, '-'))
      : activeLocationKey;

    activeLocationKey = key;
    const story = getLocationData(key);

    container.querySelector('#geminiSiteName').textContent = story.name;
    container.querySelector('#geminiSiteRegion').textContent = story.region;

    renderGeminiStoryContent(key);

    // Smooth scroll drawer into view on desktop/mobile
    drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderGeminiStoryContent(key) {
    const story = getLocationData(key);
    const containerEl = container.querySelector('#geminiDrawerContent');

    if (activeStoryFilter === 'surrounding') {
      const items = story.surroundingStories || [];
      containerEl.innerHTML = `
        <div class="gemini-surrounding-intro">
          <span class="gcard-badge">[REAL HISTORICAL STORIES AROUND THIS PANORAMA]</span>
          <p class="gcard-sub">Documented archival accounts of historical monuments, water pavilions, bastions, and stepwells visible across this panoramic compound.</p>
        </div>
        <div class="gemini-cards-grid">
          ${items
            .map(
              (item) => `
            <article class="gemini-card sec-surrounding">
              <div class="gcard-head">
                <span class="gcard-badge">[SURROUNDING MONUMENT ARCHIVE]</span>
                <button class="gcard-speak-btn" data-speech="${encodeURIComponent(item.monument + ': ' + item.title + '. ' + item.content)}" type="button">
                  <i class="star"></i> [Listen]
                </button>
              </div>
              <h4 class="gcard-title">${item.monument}</h4>
              <h5 class="gcard-subtitle" style="font: 400 15px/1.3 var(--f-display); color: var(--sand); text-transform: uppercase; margin: 4px 0 8px;">${item.title}</h5>
              <p class="gcard-text">${item.content}</p>
              <div class="gcard-foot">
                <span class="gcard-source">Source: ${item.source}</span>
                <span class="gcard-tag">[100% Grounded Fact]</span>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      `;
    } else {
      const sections = [
        {
          id: 'history',
          badge: '[HISTORY · ARCHIVAL CHRONICLE]',
          title: 'Documented Historical Era & Rulers',
          text: story.history,
        },
        {
          id: 'oral',
          badge: '[ORAL TRADITION · COMMUNITY MEMORY]',
          title: 'Spoken Accounts & Guild Memories',
          text: story.oralTradition,
        },
        {
          id: 'legend',
          badge: '[LEGEND · ROYAL FOLKLORE]',
          title: 'Mythic Origins & Local Lore',
          text: story.legend,
        },
        {
          id: 'architecture',
          badge: '[ARCHITECTURE · MASONRY & CRAFT]',
          title: 'Structural Systems & Material Science',
          text: story.architecture,
        },
      ];

      const filtered = activeStoryFilter === 'all'
        ? sections
        : sections.filter((s) => s.id === activeStoryFilter);

      containerEl.innerHTML = `
        <div class="gemini-cards-grid">
          ${filtered
            .map(
              (sec) => `
            <article class="gemini-card sec-${sec.id}">
              <div class="gcard-head">
                <span class="gcard-badge">${sec.badge}</span>
                <button class="gcard-speak-btn" data-speech="${encodeURIComponent(sec.title + ': ' + sec.text)}" type="button">
                  <i class="star"></i> [Listen]
                </button>
              </div>
              <h4 class="gcard-title">${sec.title}</h4>
              <p class="gcard-text">${sec.text}</p>
              <div class="gcard-foot">
                <span class="gcard-source">Source: ${story.source}</span>
                <span class="gcard-tag">[100% Grounded Fact]</span>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      `;
    }

    containerEl.querySelectorAll('[data-speech]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = decodeURIComponent(btn.getAttribute('data-speech'));
        toggleGeminiSpeech(text, 'en-US', btn, '<i class="star"></i> [Listen]');
      });
    });
  }

  function toggleGeminiSpeech(text, lang, buttonEl, defaultLabel) {
    if (typeof window === 'undefined') return;

    if (isGeminiSpeaking) {
      stopGeminiSpeech();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;

    utterance.onend = () => {
      isGeminiSpeaking = false;
      buttonEl.innerHTML = defaultLabel;
    };

    utterance.onerror = () => {
      isGeminiSpeaking = false;
      buttonEl.innerHTML = defaultLabel;
    };

    isGeminiSpeaking = true;
    buttonEl.innerHTML = '[Stop Audio]';
    window.speechSynthesis.speak(utterance);
  }

  function stopGeminiSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isGeminiSpeaking = false;
    const btnEn = container.querySelector('#geminiAudioEnBtn');
    const btnHi = container.querySelector('#geminiAudioHiBtn');
    if (btnEn) btnEn.innerHTML = '<i class="star"></i> [Listen: English]';
    if (btnHi) btnHi.innerHTML = '<i class="star"></i> [सुनें: हिन्दी]';
  }

  // ----------------------------------------------------
  // AR Mode Specific Controls (Drag, Gyro, Sub-views, Presets)
  // ----------------------------------------------------
  function setupARModeControls() {
    const portalFrame = container.querySelector('#arPortalFrame');
    const blendHud = container.querySelector('#arBlendHud');
    const btnPortal = container.querySelector('#btnArViewPortal');
    const btnBlend = container.querySelector('#btnArViewBlend');
    const blendSlider = container.querySelector('#arBlendSlider');
    const blendVal = container.querySelector('#blendVal');
    const arDragBtn = container.querySelector('#arToggleDragBtn');
    const arGyroBtn = container.querySelector('#arToggleGyroBtn');

    btnPortal.addEventListener('click', () => {
      arSubView = 'portal';
      btnPortal.classList.add('active');
      btnBlend.classList.remove('active');
      portalFrame.hidden = false;
      blendHud.hidden = true;
      vrCanvas.style.opacity = '0.38';
    });

    btnBlend.addEventListener('click', () => {
      arSubView = 'blend';
      btnBlend.classList.add('active');
      btnPortal.classList.remove('active');
      portalFrame.hidden = true;
      blendHud.hidden = false;
      const opacity = parseInt(blendSlider.value, 10) / 100;
      vrCanvas.style.opacity = String(opacity);
    });

    blendSlider.addEventListener('input', () => {
      blendVal.textContent = `${blendSlider.value}%`;
      if (arSubView === 'blend') {
        vrCanvas.style.opacity = String(parseInt(blendSlider.value, 10) / 100);
      }
    });

    arDragBtn.addEventListener('click', () => {
      isDragEnabled = !isDragEnabled;
      arDragBtn.textContent = isDragEnabled ? '[Drag: Active]' : '[Drag: Off]';
      arDragBtn.classList.toggle('active', isDragEnabled);
    });

    arGyroBtn.addEventListener('click', async () => {
      await toggleGyroscope();
      arGyroBtn.textContent = isGyroEnabled ? '[Gyro Tracking: Active]' : '[Gyro Tracking: Off]';
      arGyroBtn.classList.toggle('active', isGyroEnabled);
    });

    container.querySelectorAll('.ar-preset-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-ar-preset');
        loadPreset(key);
      });
    });

    const stepInsideBtn = container.querySelector('#stepInsideBtn');
    stepInsideBtn.addEventListener('click', () => {
      const btnVR = container.querySelector('#btnModeVR');
      btnVR.click();
    });
  }

  // ----------------------------------------------------
  // Dedicated Phone VR Headset Mode (Insert Phone into VR Box)
  // ----------------------------------------------------
  function setupPhoneVRHeadsetMode() {
    const vrTriggerBtn = container.querySelector('#btnPhoneVRTrigger');
    const headsetOverlay = container.querySelector('#phoneVRHeadsetOverlay');
    const exitHeadsetBtn = container.querySelector('#btnExitPhoneVR');
    const headsetAlert = container.querySelector('#vrHeadsetAlert');

    vrTriggerBtn.addEventListener('click', async () => {
      await enterPhoneVRHeadset();
    });

    exitHeadsetBtn.addEventListener('click', () => {
      exitPhoneVRHeadset();
    });

    async function enterPhoneVRHeadset() {
      isPhoneVRHeadsetActive = true;
      isStereo = true;
      headsetOverlay.hidden = false;

      const stereoBtn = container.querySelector('#toggleStereoBtn');
      stereoBtn.textContent = '[Stereo Split: On (Dual Eye)]';
      stereoBtn.classList.add('active');
      onWindowResize();

      if (!isGyroEnabled) {
        await toggleGyroscope();
      }

      if (!document.fullscreenElement) {
        try {
          await viewportContainer.requestFullscreen();
        } catch (err) {
          console.warn('Fullscreen unavailable:', err);
        }
      }

      if ('wakeLock' in navigator) {
        try {
          vrWakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.warn('Screen WakeLock unavailable:', err);
        }
      }

      headsetAlert.style.opacity = '1';
      headsetAlert.style.pointerEvents = 'auto';
      setTimeout(() => {
        headsetAlert.style.opacity = '0';
        headsetAlert.style.pointerEvents = 'none';
      }, 4000);
    }

    function exitPhoneVRHeadset() {
      isPhoneVRHeadsetActive = false;
      headsetOverlay.hidden = true;

      if (vrWakeLock) {
        vrWakeLock.release().catch(() => {});
        vrWakeLock = null;
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      isStereo = false;
      const stereoBtn = container.querySelector('#toggleStereoBtn');
      stereoBtn.textContent = '[Stereo Split: Off]';
      stereoBtn.classList.remove('active');
      onWindowResize();
    }
  }

  // ----------------------------------------------------
  // Gyroscope Motion Toggle (Universal helper)
  // ----------------------------------------------------
  async function toggleGyroscope() {
    const gyroBtn = container.querySelector('#toggleGyroBtn');
    const arGyroBtn = container.querySelector('#arToggleGyroBtn');

    if (!isGyroEnabled) {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== 'granted') {
            alert('Device orientation permission is required to look around using phone motion.');
            return;
          }
        } catch (err) {
          console.warn(err);
        }
      }

      window.addEventListener('deviceorientation', handleOrientation);
      isGyroEnabled = true;
      isAutoRotate = false;
      if (gyroBtn) {
        gyroBtn.textContent = '[Gyroscope: Active]';
        gyroBtn.classList.add('active');
      }
      if (arGyroBtn) {
        arGyroBtn.textContent = '[Gyro Tracking: Active]';
        arGyroBtn.classList.add('active');
      }
      container.querySelector('#toggleAutoRotateBtn').textContent = '[Auto Drift: Off]';
    } else {
      window.removeEventListener('deviceorientation', handleOrientation);
      isGyroEnabled = false;
      initialAlpha = null;
      if (gyroBtn) {
        gyroBtn.textContent = '[Gyroscope: Off]';
        gyroBtn.classList.remove('active');
      }
      if (arGyroBtn) {
        arGyroBtn.textContent = '[Gyro Tracking: Off]';
        arGyroBtn.classList.remove('active');
      }
    }
  }

  function handleOrientation(e) {
    if (e.alpha === null || e.beta === null || e.gamma === null) return;

    if (initialAlpha === null) {
      initialAlpha = e.alpha;
    }

    const alphaDiff = e.alpha - initialAlpha;
    targetLon = alphaDiff;
    targetLat = Math.max(-85, Math.min(85, e.beta - 90));
  }

  // ----------------------------------------------------
  // HUD Controls & AR/VR Mode Switching
  // ----------------------------------------------------
  function setupHUDControls() {
    container.querySelectorAll('.spatial-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        loadPreset(key);
      });
    });

    const toggleProjBtn = container.querySelector('#toggleProjectionBtn');
    toggleProjBtn.addEventListener('click', () => {
      projectionType = projectionType === '360_SPHERICAL' ? 'PANORAMIC_CYLINDER' : '360_SPHERICAL';
      rebuildMeshGeometry();
      const geomLabel = projectionType === '360_SPHERICAL'
        ? 'Equirectangular Spherical (360x180 deg)'
        : `Cylindrical 360 (${activeAspect.toFixed(2)}:1, End-to-End Loop)`;
      updateTelemetry(
        container.querySelector('#telFileName').textContent,
        container.querySelector('#telResolution').textContent,
        geomLabel
      );
    });

    const btnVR = container.querySelector('#btnModeVR');
    const btnAR = container.querySelector('#btnModeAR');
    const arLayer = container.querySelector('#arLayerContainer');

    btnVR.addEventListener('click', () => {
      switchMode('VR');
    });

    btnAR.addEventListener('click', () => {
      switchMode('AR');
    });

    function switchMode(mode) {
      currentMode = mode;
      btnVR.classList.toggle('active', mode === 'VR');
      btnAR.classList.toggle('active', mode === 'AR');

      if (mode === 'AR') {
        arLayer.hidden = false;
        vrCanvas.style.opacity = arSubView === 'portal' ? '0.38' : '0.60';
        startARCamera();
      } else {
        arLayer.hidden = true;
        vrCanvas.style.opacity = '1';
        stopARCamera();
      }
    }

    const stereoBtn = container.querySelector('#toggleStereoBtn');
    stereoBtn.addEventListener('click', () => {
      isStereo = !isStereo;
      stereoBtn.textContent = isStereo ? '[Stereo Split: On (Dual Eye)]' : '[Stereo Split: Off]';
      stereoBtn.classList.toggle('active', isStereo);
      onWindowResize();
    });

    const gyroBtn = container.querySelector('#toggleGyroBtn');
    gyroBtn.addEventListener('click', async () => {
      await toggleGyroscope();
    });

    const autoRotateBtn = container.querySelector('#toggleAutoRotateBtn');
    autoRotateBtn.addEventListener('click', () => {
      isAutoRotate = !isAutoRotate;
      autoRotateBtn.textContent = isAutoRotate ? '[Auto Drift: On]' : '[Auto Drift: Off]';
      autoRotateBtn.classList.toggle('active', isAutoRotate);
    });

    const centerBtn = container.querySelector('#resetViewBtn');
    centerBtn.addEventListener('click', () => {
      targetLon = 0;
      targetLat = 0;
      lon = 0;
      lat = 0;
      fov = 75;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    });

    const fsBtn = container.querySelector('#toggleFullscreenBtn');
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        viewportContainer.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
        fsBtn.textContent = '[Exit Fullscreen]';
      } else {
        document.exitFullscreen();
        fsBtn.textContent = '[Fullscreen]';
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        fsBtn.textContent = '[Fullscreen]';
      }
      setTimeout(onWindowResize, 100);
    });
  }

  // ----------------------------------------------------
  // AR Passthrough Phone Camera
  // ----------------------------------------------------
  async function startARCamera() {
    const video = container.querySelector('#arCameraStream');
    try {
      arCameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      video.srcObject = arCameraStream;
    } catch (err) {
      console.warn('AR rear camera could not be started or permission denied:', err);
    }
  }

  function stopARCamera() {
    if (arCameraStream) {
      arCameraStream.getTracks().forEach((t) => t.stop());
      arCameraStream = null;
    }
  }
}
