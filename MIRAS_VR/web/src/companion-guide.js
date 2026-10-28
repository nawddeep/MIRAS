/**
 * MIRAS · 3D Donald Trump Heritage Companion Guide
 * Senior 3D Technical Animation & Character Controller Integration.
 * 
 * Features:
 * - Direct integration with TourGuideController
 * - High-fidelity Skeletal Animations via THREE.AnimationMixer on rigged GLB
 * - Finite State Machine: IDLE, WALKING, TURNING, EXPLAINING, POINTING, WELCOMING, LISTENING
 * - Seamless animation blending, cross-fading, and priority interruption
 * - Waypoint-based site tour navigation with acceleration, deceleration, and arrival detection
 * - Pointing at landmarks and synchronized conversational storytelling
 * - STL procedural fallback support for maximum resilience
 * - Strict Zero Emojis.
 */
import * as THREE from 'three';
import { TourGuideController, TOUR_STATES } from './tour-guide-controller.js';

export { TOUR_STATES };

export class TrumpCompanionGuide {
  constructor(scene, camera, renderer, options = {}) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    const glbUrl = options.url && options.url.endsWith('.glb')
      ? options.url
      : 'assets/models/trump_tour_guide_rigged.glb';
    const stlUrl = options.stlUrl || 'assets/models/trump_tour_guide.stl';

    this.controller = new TourGuideController(scene, camera, renderer, {
      glbUrl,
      stlUrl,
      onFinished: options.onFinished,
    });

    this.root = this.controller.root;
    this.characterGroup = this.controller.characterGroup;
  }

  async load() {
    return this.controller.load();
  }

  get active() {
    return (
      this.controller.state === TOUR_STATES.EXPLAINING ||
      this.controller.state === TOUR_STATES.POINTING
    );
  }

  get state() {
    return this.controller.state;
  }

  setState(newState, options) {
    this.controller.setState(newState, options);
  }

  playAction(actionName, fadeDuration, timeScale) {
    this.controller.playAction(actionName, fadeDuration, timeScale);
  }

  startTour() {
    this.controller.startTour();
  }

  stopTour() {
    this.controller.stopTour();
  }

  get tourActive() {
    return this.controller.tourActive;
  }

  show(hotspot, now) {
    this.controller.show(hotspot, now);
  }

  dismiss() {
    this.controller.dismiss();
  }

  update(dt, now) {
    this.controller.update(dt, now);
  }
}
