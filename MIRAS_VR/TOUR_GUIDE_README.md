# MIRAS VR — Autonomous Animated Tour Guide Character Pipeline

## 1. Technical Analysis of the Original STL Model

### 1.1 Geometry & Dimensions
- **Original Source File**: `Stylized Trump Tour Guide.stl` (48,115,484 bytes).
- **Triangle Count**: 962,308 raw triangles (2,886,924 unindexed vertices).
- **Bounding Box**:
  - Width ($X$): $-0.620\text{ m}$ to $+0.619\text{ m}$ ($1.239\text{ m}$ span from left to right fingertips in A-pose).
  - Depth ($Y$): $-0.259\text{ m}$ to $+0.257\text{ m}$ ($0.516\text{ m}$ front-to-back torso depth).
  - Height ($Z$): $-0.952\text{ m}$ to $+0.950\text{ m}$ ($1.902\text{ m}$ total height from mojari soles to hair crest).
- **Original Orientation**: $Z$-up, facing $-Y$ in raw STL coordinate space.
- **Sculpt Quality**: High-fidelity stylized sculpt representing Donald Trump in traditional Indian formal attire (Nehru jacket/vest, silk kurta, churidar pyjama, angavastram stole, mojari shoes, and swept-back voluminous hair).
- **File Integrity**: The original STL file is preserved 100% untouched and intact in both root and assets directories.

### 1.2 Important Limitations Discovered in Raw STL
1. **Unrigged Static Mesh**: Raw STL format does not support skeletal armatures, bone hierarchies, vertex groups, or skinning weights.
2. **Zero UV Mapping & Color Metadata**: Standard binary STL files do not carry UV coordinates or texture channels.
3. **Heavy Triangle Density**: At ~962,000 triangles and 48 MB, running real-time deformation on mobile WebXR devices causes frame drops if loaded unoptimized.
4. **Sculpted Geometric Fusion**: The angavastram stole is physically sculpted on top of the vest; wrists and fingers are modeled in an A-pose requiring careful bone weight assignment to prevent limb deformation bleeding into the torso.

---

## 2. Rigging & Animation Pipeline (Blender 4.5 Python)

The automated script `miras-repo/MIRAS_VR/blender/build_rigged_tour_guide.py` executes directly through Blender 4.5 in headless background mode:

```bash
blender -b --python build_rigged_tour_guide.py
```

### 2.1 Mesh Optimization & Vertex Color Calibration
1. **Weld & Cleanup**: Dissolves degenerate geometry and welds coincident vertices within $10^{-5}\text{ m}$.
2. **Decimation**: Retains fine details (facial likeness, hair wave, clothing folds, stole fringes) while reducing geometry to ~65,000 triangles for native 90 FPS rendering in WebXR.
3. **Grounding**: Aligns origin between feet on the ground plane at $Z = 0.0\text{ m}$.
4. **Vertex Colors**: Bakes the official Indian Attire turnaround palette:
   - Royal Navy Blue Nehru Vest: `#1D263B`
   - Cream / Off-White Silk Kurta & Pyjama: `#F5EFE6`
   - Deep Maroon Angavastram Stole: `#88252C`
   - Golden Zari Borders & Tassels: `#D4A853`
   - Golden Blonde Hair: `#E5B876`
   - Warm Natural Caucasian Skin: `#F2BA93`
   - Dark Leather Mojari Shoes: `#382318`
   - Brass Button Placket: `#E5C158`

### 2.2 Humanoid Skeletal Hierarchy
A 20-bone humanoid armature is programmatically constructed with anatomical joint placements:

```
root (0.0, 0.0, 0.0)
└── pelvis (0.0, 0.0, 0.90)
    ├── spine (0.0, 0.01, 1.05)
    │   └── chest (0.0, 0.01, 1.25)
    │       ├── neck (0.0, 0.0, 1.54)
    │       │   └── head (0.0, -0.02, 1.64)
    │       ├── shoulder.L (0.08, 0.0, 1.48)
    │       │   └── upper_arm.L (0.28, 0.0, 1.44)
    │       │       └── forearm.L (0.44, 0.04, 1.12)
    │       │           └── hand.L (0.54, -0.01, 0.90)
    │       └── shoulder.R (-0.08, 0.0, 1.48)
    │           └── upper_arm.R (-0.28, 0.0, 1.44)
    │               └── forearm.R (-0.44, 0.04, 1.12)
    │                   └── hand.R (-0.54, -0.01, 0.90)
    ├── thigh.L (0.12, 0.0, 0.88)
    │   └── shin.L (0.13, 0.0, 0.48)
    │       └── foot.L (0.13, 0.02, 0.11)
    └── thigh.R (-0.12, 0.0, 0.88)
        └── shin.R (-0.13, 0.0, 0.48)
            └── foot.R (-0.13, 0.02, 0.11)
```

### 2.3 Normalized Anatomical Skinning
Vertex group weights are computed using Gaussian exponential distance falloffs from bone centerline segments:
$$w_i = \exp\left(-\frac{1}{2}\left(\frac{d_i}{r_{\text{bone}}}\right)^2\right)$$
- Segment bounds prevent arm bones from influencing torso or opposite limbs.
- Weights are normalized per vertex ($\sum w_i = 1.0$).
- Bound via Blender's Armature modifier.

---

## 3. The 10 Humanoid Animation Actions

Baked into NLA tracks and exported directly into `trump_tour_guide_rigged.glb`:

1. **Idle** (60 frames @ 30fps): Natural breathing chest rise, relaxed arm sway, subtle pelvic weight shifts, gentle head gaze micro-movements.
2. **Walk** (36 frames @ 30fps): Seamless biped walking cycle with alternating forward/back leg strides, knee lifts, heel strikes, counter-arm swings with elbow bends, hip sway, and forward stride lean.
3. **StopAndTurn** (45 frames @ 30fps): Deceleration step, feet planting flat on the ground, smooth rotational body realignment to face visitor/destination.
4. **Explain** (72 frames @ 30fps): Trumpian hand gestures, double-hand accordion expansion, palm-up conversational emphasis, head nods synchronized with dialogue.
5. **Point** (60 frames @ 30fps): Right arm raises and extends smoothly, pointing toward the landmark; torso and head orient to target, hold pose, and lower.
6. **Welcome** (60 frames @ 30fps): Two-handed open-palm inviting gesture, warm welcoming head tilt, returning to ready stance.
7. **LookAround** (80 frames @ 30fps): Surveying the environment, head turns smoothly left then right, upper torso follows with natural anticipation.
8. **Listen** (60 frames @ 30fps): Attentive listening stance, relaxed hands, subtle affirmative nods and weight shift.
9. **TurnAround** (60 frames @ 30fps): Smooth 180-degree turnaround footwork and body rotation.
10. **ReturnToIdle** (30 frames @ 30fps): Clean easing transition returning all bones to the neutral standing pose.

---

## 4. Tour Guide Behavior Controller (`TourGuideController`)

Located in `MIRAS_VR/web/src/tour-guide-controller.js`.

### 4.1 Finite State Machine (`TOUR_STATES`)
- `IDLE`: Relaxed breathing, subtle gaze, resting stance.
- `WALKING`: Waypoint path navigation, smooth stride, leg and arm swing, ground contact, acceleration/deceleration.
- `TURNING`: Rotates to face visitor or destination point.
- `EXPLAINING`: Conversational hand gestures, double-hand accordion expansion, speech bubble narration.
- `POINTING`: Extends arm toward selected landmark, orienting torso and head toward the point of interest.
- `WELCOMING`: Inviting two-handed welcoming gesture.
- `LISTENING`: Attentive receptive stance with affirmative nods.
- `LOOK_AROUND`: Panoramic visual inspection of the heritage surroundings.

### 4.2 Animation Blending & Priority
- Utilizes Three.js `AnimationMixer` with cross-fading (`fadeIn`, `fadeOut`, `timeScale`).
- Smooth transitions between states prevent abrupt popping or foot sliding.

### 4.3 Waypoint-Based Navigation System
Coordinates tour destinations across site hotspots:
1. `Courtyard Welcome` (`position: (0.95, -1.25, -2.2)`): Manek Chowk grand courtyard introduction.
2. `Tripolia Gate` (`position: (-1.4, -1.25, -2.4)`): Three-arched 1711 ceremonial entrance.
3. `Lake Pichola Balcony` (`position: (1.4, -1.25, -1.9)`): Waterside panorama overlooking Jag Mandir.

#### Autonomous Tour Sequence:
1. Visitor activates tour or dwells on a hotspot.
2. Guide transitions to `WALKING`, orienting toward the target waypoint.
3. Accelerates smoothly, steps with grounded stride physics, and decelerates upon entering arrival radius ($< 0.18\text{ m}$).
4. Stops and executes `TURNING` to face the visitor.
5. Transitions to `POINTING` ($2.2\text{s}$), extending arm toward landmark coordinates.
6. Transitions to `EXPLAINING`, narrating historical story via 3D floating plaque and Web Speech API.
7. Automatically proceeds to next waypoint or eases back to `IDLE`.

---

## 5. Web Interface & Demonstration Controls

A dedicated interactive HUD (`#tour-guide-hud`) is positioned on screen with action buttons:
- **Idle**: Neutral resting stance.
- **Walk**: Activates locomotion cycle.
- **Stop & Turn**: Halts and faces visitor.
- **Explain**: Triggers Trumpian accordion speech gestures.
- **Point**: Extends arm to point at landmark.
- **Welcome**: Performs two-handed welcoming gesture.
- **Look Around**: Sweeps head and torso across the panorama.
- **Listen**: Attentive listening posture.
- **Start Guided Tour**: Launches the autonomous multi-waypoint guided tour.

---

## 6. Execution Instructions

### Run the Web Viewer:
```bash
cd MIRAS_VR/web
npm run dev
```
Open `http://localhost:5173/` in any desktop browser, mobile device, or Meta Quest VR headset.

### Rebuild Character Rig:
```bash
cd MIRAS_VR/blender
"C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b --python build_rigged_tour_guide.py
```
Output asset generated at:
`MIRAS_VR/web/public/assets/models/trump_tour_guide_rigged.glb` (3.07 MB).
