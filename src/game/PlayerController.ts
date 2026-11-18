import * as THREE from 'three';
import { AudioManager } from './AudioManager';
import { BoxCollider, HouseWorld, InteractiveObject } from './HouseWorld';
import { GameSettings } from './types';

const _rayCenter = new THREE.Vector2(0, 0);
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _moveDir = new THREE.Vector3();
const _flashlightOffset = new THREE.Vector3();

export class PlayerController {
  public readonly camera: THREE.PerspectiveCamera;
  public readonly flashlight: THREE.SpotLight;
  public readonly flashlightTarget = new THREE.Object3D();

  public position = new THREE.Vector3(0, 1.62, 13.4);
  public yaw = 0;
  public pitch = 0.04;
  public eyeHeight = 1.62;
  public radius = 0.34;

  public flashlightOn = true;
  public flashlightBattery = 100;
  public canMove = true;
  public canLook = true;

  private keys: Record<string, boolean> = {};
  private touchMoveX = 0;
  private touchMoveY = 0;
  private bobPhase = 0;
  private lastBobSin = 0;
  private velocity = new THREE.Vector2(0, 0);
  private flashlightFlickerTimer = 0;
  private raycaster = new THREE.Raycaster();

  private settings: GameSettings;
  private domElement: HTMLElement;
  private world: HouseWorld;
  private audio: AudioManager;

  public isPointerLocked = false;
  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundPointerLockChange: () => void;
  private boundBlur: () => void;

  public onInteractPressed?: () => void;
  public onFlashlightToggled?: (on: boolean) => void;
  public onInventoryPressed?: () => void;
  public onPausePressed?: () => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    domElement: HTMLElement,
    world: HouseWorld,
    audio: AudioManager,
    settings: GameSettings
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;
    this.audio = audio;
    this.settings = settings;

    this.camera.rotation.order = 'YXZ';

    // Flashlight Spotlight
    this.flashlight = new THREE.SpotLight(0xfff1d6, 4.2, 16, Math.PI / 5.4, 0.52, 1.35);
    this.flashlight.castShadow = false;
    scene.add(this.flashlight);
    scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    this.raycaster.layers.set(1);

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundPointerLockChange = this.handlePointerLockChange.bind(this);
    this.boundBlur = this.clearKeys.bind(this);

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('mousemove', this.boundMouseMove);
    this.domElement.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    window.addEventListener('blur', this.boundBlur);
  }

  public updateSettings(settings: GameSettings): void {
    this.settings = settings;
  }

  public clearKeys(): void {
    this.keys = {};
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.isDragging = false;
  }

  public setTouchMove(x: number, y: number): void {
    this.touchMoveX = x;
    this.touchMoveY = y;
  }

  public addTouchLook(dx: number, dy: number): void {
    if (!this.canLook) return;
    const sens = 0.0036 * this.settings.mouseSensitivity;
    this.yaw -= dx * sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * sens, -1.32, 1.32);
  }

  public requestPointerLock(): void {
    try {
      if (document.pointerLockElement !== this.domElement && this.domElement.requestPointerLock) {
        const res = this.domElement.requestPointerLock() as unknown as Promise<void> | undefined;
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      }
    } catch {
      // Fallback drag-to-look remains active
    }
  }

  public exitPointerLock(): void {
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch {
      // Ignore
    }
  }

  public triggerFlashlightFlicker(duration = 1.2): void {
    this.flashlightFlickerTimer = Math.max(this.flashlightFlickerTimer, duration);
  }

  private handlePointerLockChange(): void {
    const wasLocked = this.isPointerLocked;
    this.isPointerLocked = document.pointerLockElement === this.domElement;
    if (wasLocked && !this.isPointerLocked && this.canMove) {
      this.onPausePressed?.();
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.canLook) return;
    this.audio.init();
    if (!this.isPointerLocked) {
      this.requestPointerLock();
      this.isDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.canLook) return;
    const sens = 0.0021 * this.settings.mouseSensitivity;
    if (this.isPointerLocked) {
      this.yaw -= e.movementX * sens;
      this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * sens, -1.32, 1.32);
    } else if (this.isDragging) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.yaw -= dx * sens * 1.4;
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * sens * 1.4, -1.32, 1.32);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) {
      this.keys[e.code] = true;
      return;
    }
    this.keys[e.code] = true;

    if (e.code === 'Escape') {
      this.onPausePressed?.();
      return;
    }
    if (e.code === 'KeyI') {
      this.onInventoryPressed?.();
      return;
    }
    if (!this.canLook && !this.canMove) return;

    if (e.code === 'KeyF') {
      this.toggleFlashlight();
    } else if (e.code === 'KeyE') {
      this.onInteractPressed?.();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  public toggleFlashlight(): void {
    if (this.flashlightBattery <= 0 && !this.flashlightOn) return;
    this.flashlightOn = !this.flashlightOn;
    this.audio.playFlashlightClick();
    this.onFlashlightToggled?.(this.flashlightOn);
  }

  public setPose(x: number, y: number, z: number, yaw: number, pitch: number): void {
    this.position.set(x, y, z);
    this.yaw = yaw;
    this.pitch = pitch;
    this.velocity.set(0, 0);
    this.syncCameraAndFlashlight(0, 1);
  }

  private resolveCollisions(nx: number, nz: number, footY: number): [number, number] {
    let x = nx;
    let z = nz;
    const r = this.radius;
    const headY = footY + this.eyeHeight;

    const testPass = (colliders: BoxCollider[]) => {
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        // Ignore colliders not overlapping Crystal's vertical body span
        if (c.maxY <= footY + 0.12 || c.minY >= headY) continue;

        const closestX = THREE.MathUtils.clamp(x, c.minX, c.maxX);
        const closestZ = THREE.MathUtils.clamp(z, c.minZ, c.maxZ);
        const dx = x - closestX;
        const dz = z - closestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq < r * r) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = r - dist;
            x += (dx / dist) * push;
            z += (dz / dist) * push;
          } else {
            // Center inside box fallback: push out along smallest overlap
            const penLeft = Math.abs(x - c.minX);
            const penRight = Math.abs(c.maxX - x);
            const penTop = Math.abs(z - c.minZ);
            const penBot = Math.abs(c.maxZ - z);
            const minPen = Math.min(penLeft, penRight, penTop, penBot);
            if (minPen === penLeft) x = c.minX - r;
            else if (minPen === penRight) x = c.maxX + r;
            else if (minPen === penTop) z = c.minZ - r;
            else z = c.maxZ + r;
          }
        }
      }
    };

    testPass(this.world.colliders);
    testPass(this.world.colliders);
    return [x, z];
  }

  public update(delta: number): void {
    const dt = Math.min(delta, 0.05);

    // Subtle battery drain & passive slow regen when off so never frustrating
    if (this.flashlightOn && this.canMove) {
      this.flashlightBattery = Math.max(12, this.flashlightBattery - dt * 0.14);
    } else if (!this.flashlightOn) {
      this.flashlightBattery = Math.min(100, this.flashlightBattery + dt * 1.6);
    }

    if (this.flashlightFlickerTimer > 0) {
      this.flashlightFlickerTimer = Math.max(0, this.flashlightFlickerTimer - dt);
    }

    let moveForward = 0;
    let moveRight = 0;
    if (this.canMove) {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

      moveForward += this.touchMoveY;
      moveRight += this.touchMoveX;
    }

    const sprinting = Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const maxSpeed = sprinting ? 3.55 : 2.25;

    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    _moveDir.set(0, 0, 0).addScaledVector(_forward, moveForward).addScaledVector(_right, moveRight);
    if (_moveDir.lengthSq() > 1) _moveDir.normalize();

    const targetVx = _moveDir.x * maxSpeed;
    const targetVz = _moveDir.z * maxSpeed;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVx, 12, dt);
    this.velocity.y = THREE.MathUtils.damp(this.velocity.y, targetVz, 12, dt);

    const speed = this.velocity.length();
    const currentFootY = this.position.y - this.eyeHeight;

    if (speed > 0.02) {
      const nextX = this.position.x + this.velocity.x * dt;
      const nextZ = this.position.z + this.velocity.y * dt;
      const [resolvedX, resolvedZ] = this.resolveCollisions(nextX, nextZ, currentFootY);
      this.position.x = resolvedX;
      this.position.z = resolvedZ;
    }

    // Ground/stair height damping
    const targetFootY = this.world.getFloorHeightAt(this.position.x, this.position.z, currentFootY);
    const smoothedFootY = THREE.MathUtils.damp(currentFootY, targetFootY, 16, dt);
    this.position.y = smoothedFootY + this.eyeHeight;

    // Restrained head-bob & footsteps
    let bobY = 0;
    if (speed > 0.35 && this.canMove) {
      this.bobPhase += dt * (sprinting ? 10.5 : 7.4);
      const bobSin = Math.sin(this.bobPhase);
      bobY = this.settings.reducedCameraMovement ? 0 : bobSin * 0.022;
      if (this.lastBobSin >= 0 && bobSin < 0) {
        const surf =
          this.position.z > 5.6
            ? 'gravel'
            : this.position.y < 0.2
            ? 'concrete'
            : 'wood';
        this.audio.playFootstep(surf);
      }
      this.lastBobSin = bobSin;
    } else {
      this.bobPhase = 0;
      this.lastBobSin = 0;
    }

    this.syncCameraAndFlashlight(bobY, dt);
  }

  private syncCameraAndFlashlight(bobY: number, dt: number): void {
    this.camera.position.set(this.position.x, this.position.y + bobY, this.position.z);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Flashlight held slightly below/right of eye level
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    _forward.set(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    _flashlightOffset
      .copy(this.camera.position)
      .addScaledVector(_right, 0.16)
      .addScaledVector(_forward, 0.15);
    _flashlightOffset.y -= 0.12;

    this.flashlight.position.copy(_flashlightOffset);
    this.flashlightTarget.position.copy(this.camera.position).addScaledVector(_forward, 6.0);

    if (!this.flashlightOn) {
      this.flashlight.intensity = 0;
    } else if (this.flashlightFlickerTimer > 0 && !this.settings.reducedScreenEffects) {
      const flick = Math.sin(this.flashlightFlickerTimer * 47) * Math.cos(this.flashlightFlickerTimer * 29);
      this.flashlight.intensity = flick > 0.2 ? 0.55 : 4.1;
    } else {
      const targetIntensity = this.position.y < 0 ? 4.8 : 4.0;
      this.flashlight.intensity = THREE.MathUtils.damp(this.flashlight.intensity, targetIntensity, 18, Math.max(dt, 0.016));
    }
  }

  public getTargetedInteractive(): InteractiveObject | null {
    this.raycaster.setFromCamera(_rayCenter, this.camera);
    const hits = this.raycaster.intersectObjects(this.world.raycastTargets, false);
    if (hits.length === 0) return null;

    const hit = hits[0];
    const id = hit.object.userData.interactiveId as string | undefined;
    if (!id) return null;

    const interactive = this.world.interactives.find((item) => item.id === id);
    if (!interactive || !interactive.enabled) return null;
    if (hit.distance > interactive.maxDistance) return null;

    return interactive;
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('mousemove', this.boundMouseMove);
    this.domElement.removeEventListener('mousedown', this.boundMouseDown);
    window.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    window.removeEventListener('blur', this.boundBlur);
  }
}
