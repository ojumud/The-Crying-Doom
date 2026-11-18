import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RECORDING_LINES } from '../data/dialogue';
import { AudioManager } from './AudioManager';
import { HouseWorld } from './HouseWorld';
import { PlayerController } from './PlayerController';
import {
  createInitialSaveData,
  loadSavedGame,
  saveGame,
} from './SaveManager';
import { createProceduralTextures, ProceduralTexturePack } from './Textures';
import {
  ClueId,
  DiscoveryNotification,
  GameSettings,
  InteractableTarget,
  InventoryItemId,
  ObjectiveId,
  OBJECTIVES,
  SaveGameData,
  ScreenState,
  SubtitleMessage,
} from './types';

export interface EngineCallbacks {
  onScreenChange: (screen: ScreenState) => void;
  onTargetChange: (target: InteractableTarget | null) => void;
  onObjectiveChange: (objective: ObjectiveId, text: string) => void;
  onSubtitle: (sub: SubtitleMessage | null) => void;
  onDiscovery: (notif: DiscoveryNotification) => void;
  onStateSync: (save: SaveGameData) => void;
  onFlashlightChange: (on: boolean, battery: number) => void;
  onIntroTitle: (show: boolean) => void;
  onBlackoutKnock: (phase: 'none' | 'black' | 'knock1' | 'knock2' | 'knock3') => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private textures: ProceduralTexturePack;
  public readonly world: HouseWorld;
  public readonly audio: AudioManager;
  public readonly player: PlayerController;

  private clock = new THREE.Clock();
  private elapsed = 0;
  private frameId = 0;
  private disposed = false;

  public screen: ScreenState = 'menu';
  public saveState: SaveGameData = createInitialSaveData();
  private settings: GameSettings;
  private callbacks: EngineCallbacks;

  private msgSeq = 1;
  private subtitleTimer: number | null = null;
  private activeTargetId: string | null = null;

  // Scripted event timers/flags
  private hesitationPlayed = false;
  private hallwayShadowAnim = { active: false, t: 0 };
  private mirrorAnim = { active: false, t: 0 };
  private recordingPlaybackActive = false;
  private endingPhase: 'idle' | 'whisper' | 'turn_around' | 'spotted' | 'blackout' = 'idle';
  private endingTimer = 0;
  private autoSaveAccum = 0;
  private batterySyncAccum = 0;

  private boundResize: () => void;

  constructor(
    container: HTMLElement,
    settings: GameSettings,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.settings = settings;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && settings.graphicsQuality === 'high',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl
        ? 1
        : Math.min(window.devicePixelRatio, settings.graphicsQuality === 'high' ? 2 : 1.25)
    );
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070c);
    this.scene.fog = new THREE.FogExp2(0x05070c, 0.042);

    // Mandatory studio environment map for metallic/glass PBR realism
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.22;
    pmrem.dispose();

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(64, w / h, 0.14, 90);

    this.textures = createProceduralTextures(this.renderer.capabilities.getMaxAnisotropy());
    this.world = new HouseWorld(this.textures, this.isSoftwareGl);
    this.world.reducedEffects = settings.reducedScreenEffects;
    this.scene.add(this.world.group);

    this.audio = new AudioManager();
    this.audio.updateSettings(settings);

    this.player = new PlayerController(
      this.camera,
      this.scene,
      this.renderer.domElement,
      this.world,
      this.audio,
      settings
    );

    this.player.onInteractPressed = () => this.handleInteract();
    this.player.onFlashlightToggled = (on) => {
      this.saveState.flashlightOn = on;
      this.callbacks.onFlashlightChange(on, this.player.flashlightBattery);
    };
    this.player.onInventoryPressed = () => {
      if (this.screen === 'playing') {
        this.setScreen('inventory');
      } else if (this.screen === 'inventory') {
        this.setScreen('playing');
      }
    };
    this.player.onPausePressed = () => {
      if (this.screen === 'playing') {
        this.setScreen('paused');
      } else if (
        this.screen === 'paused' ||
        this.screen === 'diary' ||
        this.screen === 'photograph' ||
        this.screen === 'puzzle' ||
        this.screen === 'inventory'
      ) {
        this.setScreen('playing');
      }
    };

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.boundResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundResize);

    this.clock.start();
    this.tick();
  }

  private handleResize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public updateSettings(settings: GameSettings): void {
    this.settings = settings;
    this.audio.updateSettings(settings);
    this.player.updateSettings(settings);
    this.world.reducedEffects = settings.reducedScreenEffects;
    if (!this.isSoftwareGl) {
      this.renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, settings.graphicsQuality === 'high' ? 2 : 1.25)
      );
    }
  }

  public setScreen(screen: ScreenState): void {
    this.screen = screen;
    this.callbacks.onScreenChange(screen);
    if (screen === 'playing') {
      this.player.canMove = this.endingPhase === 'idle';
      this.player.canLook = true;
      this.player.clearKeys();
    } else if (screen === 'ending_sequence') {
      this.player.canMove = false;
      this.player.canLook = this.endingPhase === 'turn_around';
    } else {
      this.player.canMove = false;
      this.player.canLook = false;
      this.player.clearKeys();
      this.player.exitPointerLock();
    }
  }

  public startNewGame(): void {
    this.audio.init();
    this.saveState = createInitialSaveData();
    this.hesitationPlayed = false;
    this.endingPhase = 'idle';
    this.hallwayShadowAnim = { active: false, t: 0 };
    this.mirrorAnim = { active: false, t: 0 };
    this.world.entitySilhouette.visible = false;
    this.world.mirrorGhostMesh.visible = false;
    this.world.frontDoorAngle = 0;
    this.world.frontDoorTargetAngle = 0;
    this.world.setFrontDoorLocked(false);
    this.world.basementDoorAngle = 0;
    this.world.basementDoorTargetAngle = 0;
    this.world.basementDoorCollider.maxY = 2.6;
    this.world.hiddenPanelOffset = 0;
    this.world.hiddenPanelTargetOffset = 0;
    this.world.hiddenPanelCollider.maxY = -0.5;
    this.world.shiftChairGroup.position.set(0.4, 0, -3.1);
    this.world.shiftChairGroup.rotation.y = 0.2;

    this.restoreInteractiveFlags();
    this.world.basementKeyMesh.visible = true;
    this.player.flashlightOn = true;
    this.player.flashlightBattery = 100;
    this.player.setPose(
      this.saveState.playerPos.x,
      this.saveState.playerPos.y,
      this.saveState.playerPos.z,
      this.saveState.playerYaw,
      this.saveState.playerPitch
    );

    this.callbacks.onBlackoutKnock('none');
    this.callbacks.onStateSync({ ...this.saveState });
    this.setObjective('obj_enter_house', false);
    this.setScreen('playing');
    this.player.requestPointerLock();

    this.showSubtitle('Crystal', 'That crying... Is someone inside this house?', 4.2);
    this.audio.playDistantCrying(0.25);
    this.persistSave();
  }

  public continueGame(): boolean {
    const loaded = loadSavedGame();
    if (!loaded) return false;
    this.audio.init();
    this.saveState = loaded;
    this.endingPhase = 'idle';
    this.callbacks.onBlackoutKnock('none');

    // Sync world state from save flags
    this.world.setFrontDoorLocked(loaded.flags.frontDoorLocked);
    if (loaded.flags.livingEventTriggered) {
      this.world.triggerLivingRoomShift();
    }
    if (loaded.flags.basementDoorOpen) {
      this.world.basementDoorAngle = -Math.PI * 0.52;
      this.world.basementDoorTargetAngle = -Math.PI * 0.52;
      this.world.basementDoorCollider.maxY = -10;
    }
    if (loaded.flags.puzzleSolved) {
      this.world.hiddenPanelOffset = 1.65;
      this.world.hiddenPanelTargetOffset = 1.65;
      this.world.hiddenPanelCollider.maxY = -10;
    }

    this.restoreInteractiveFlags();
    this.player.flashlightOn = loaded.flashlightOn;
    this.player.flashlightBattery = loaded.flashlightBattery;
    this.player.setPose(
      loaded.playerPos.x,
      loaded.playerPos.y,
      loaded.playerPos.z,
      loaded.playerYaw,
      loaded.playerPitch
    );

    this.callbacks.onStateSync({ ...this.saveState });
    this.callbacks.onObjectiveChange(
      loaded.currentObjective,
      OBJECTIVES[loaded.currentObjective].text
    );
    this.callbacks.onFlashlightChange(this.player.flashlightOn, this.player.flashlightBattery);
    this.setScreen('playing');
    this.player.requestPointerLock();
    return true;
  }

  private restoreInteractiveFlags(): void {
    const f = this.saveState.flags;
    this.world.basementKeyMesh.visible = !f.basementKeyCollected;
    this.setInteractiveProps('old_diary', true, f.diaryRead ? 'READ DIARY AGAIN' : 'READ DIARY');
    this.setInteractiveProps('basement_key', !f.basementKeyCollected, 'PICK UP BASEMENT KEY');
    this.setInteractiveProps(
      'front_door',
      true,
      f.enteredHouse ? 'OPEN FRONT DOOR' : 'ENTER HOUSE'
    );
    this.setInteractiveProps(
      'basement_door',
      !f.basementDoorOpen,
      f.basementDoorUnlocked ? 'OPEN BASEMENT DOOR' : 'OPEN BASEMENT DOOR'
    );
    this.setInteractiveProps('basement_mechanism', !f.puzzleSolved, 'EXAMINE MECHANISM');
    this.setInteractiveProps('hidden_compartment_item', f.puzzleSolved && !f.compartmentInspected, 'INSPECT HIDDEN RELICS');
  }

  private setInteractiveProps(id: string, enabled: boolean, prompt?: string): void {
    const item = this.world.interactives.find((i) => i.id === id);
    if (!item) return;
    item.enabled = enabled;
    if (prompt) item.prompt = prompt;
  }

  private showSubtitle(speaker: string | undefined, text: string, duration = 3.8): void {
    if (this.subtitleTimer) clearTimeout(this.subtitleTimer);
    this.callbacks.onSubtitle({
      id: this.msgSeq++,
      speaker,
      text,
      duration,
    });
    this.subtitleTimer = window.setTimeout(() => {
      this.callbacks.onSubtitle(null);
    }, duration * 1000);
  }

  private showDiscovery(label: string, title: string): void {
    this.callbacks.onDiscovery({
      id: this.msgSeq++,
      label,
      title,
    });
  }

  private setObjective(obj: ObjectiveId, notify = true): void {
    this.saveState.currentObjective = obj;
    const text = OBJECTIVES[obj].text;
    this.callbacks.onObjectiveChange(obj, text);
    if (notify) {
      this.showDiscovery('OBJECTIVE UPDATED', text);
    }
    this.persistSave();
  }

  private grantItem(id: InventoryItemId, label: string, name: string): void {
    if (!this.saveState.inventory.includes(id)) {
      this.saveState.inventory = [...this.saveState.inventory, id];
      this.showDiscovery(label, name);
      this.callbacks.onStateSync({ ...this.saveState });
      this.persistSave();
    }
  }

  private grantClue(id: ClueId): void {
    if (!this.saveState.clues.includes(id)) {
      this.saveState.clues = [...this.saveState.clues, id];
      this.callbacks.onStateSync({ ...this.saveState });
      this.persistSave();
    }
  }

  public persistSave(): void {
    if (!this.saveState) return;
    this.saveState.playerPos = {
      x: Number(this.player.position.x.toFixed(3)),
      y: Number(this.player.position.y.toFixed(3)),
      z: Number(this.player.position.z.toFixed(3)),
    };
    this.saveState.playerYaw = Number(this.player.yaw.toFixed(4));
    this.saveState.playerPitch = Number(this.player.pitch.toFixed(4));
    this.saveState.flashlightOn = this.player.flashlightOn;
    this.saveState.flashlightBattery = Math.round(this.player.flashlightBattery);
    saveGame(this.saveState);
  }

  private triggerEnterHouse(): void {
    if (this.saveState.flags.enteredHouse) return;
    this.saveState.flags.enteredHouse = true;
    this.saveState.flags.frontDoorLocked = true;
    this.player.canMove = false;
    this.player.setPose(0, 1.62, 4.15, 0, 0.02);
    this.world.frontDoorAngle = 0.7;
    this.world.frontDoorTargetAngle = 0;
    this.world.setFrontDoorLocked(true);
    this.setInteractiveProps('front_door', true, 'TRY FRONT DOOR');

    this.audio.playDoorSlam();
    this.showSubtitle('Crystal', 'Wait—the door just slammed shut!', 3.2);

    window.setTimeout(() => {
      if (this.disposed) return;
      this.audio.playDistantCrying(0.45);
      this.callbacks.onIntroTitle(true);
      this.setObjective('obj_investigate_living', false);

      window.setTimeout(() => {
        if (this.disposed) return;
        this.callbacks.onIntroTitle(false);
        this.player.canMove = true;
        this.showSubtitle('Crystal', 'The lock is jammed... And that crying is coming from upstairs.', 4.2);
        this.persistSave();
      }, 3600);
    }, 1100);
  }

  private handleInteract(): void {
    if (this.screen !== 'playing') return;
    const target = this.player.getTargetedInteractive();
    if (!target) return;

    switch (target.id) {
      case 'front_door': {
        if (!this.saveState.flags.enteredHouse) {
          this.triggerEnterHouse();
        } else {
          this.audio.playLockClick();
          this.showSubtitle('Crystal', 'The door won\'t open. I need to find another way out.', 3.4);
        }
        break;
      }

      case 'wall_clock': {
        this.audio.playMechanismClick();
        this.saveState.flags.clockExamined = true;
        this.grantClue('clock_1015');
        this.showSubtitle('Crystal', '10:15... Why did it stop here?', 3.6);
        this.showDiscovery('CLUE RECORDED', 'Wall Clock Stopped at 10:15');
        break;
      }

      case 'old_diary': {
        this.audio.playPageFlip();
        this.setScreen('diary');
        break;
      }

      case 'old_photograph': {
        this.saveState.flags.photoExamined = true;
        this.grantItem('old_photograph', 'EVIDENCE COLLECTED', 'Old Family Photograph');
        this.grantClue('photo_scratched_face');
        this.audio.playPageFlip();
        this.setScreen('photograph');
        break;
      }

      case 'bedroom_drawer': {
        this.audio.playLockClick();
        this.showSubtitle('Crystal', 'The drawer is jammed shut. Looks like someone forced it closed.', 3.4);
        break;
      }

      case 'basement_key': {
        this.saveState.flags.basementKeyCollected = true;
        this.world.basementKeyMesh.visible = false;
        this.setInteractiveProps('basement_key', false);
        this.audio.playKeyPickup();
        this.grantItem('basement_key', 'NEW ITEM DISCOVERED', 'Basement Key');
        this.showSubtitle('Crystal', 'A heavy iron key... Could this open the basement door?', 3.6);
        this.setObjective('obj_unlock_basement');
        break;
      }

      case 'basement_door': {
        if (!this.saveState.flags.basementKeyCollected) {
          this.audio.playLockClick();
          this.showSubtitle('Crystal', 'It\'s locked. I need to find the basement key.', 3.4);
          if (this.saveState.currentObjective !== 'obj_find_basement_key') {
            this.setObjective('obj_find_basement_key', false);
          }
        } else {
          this.saveState.flags.basementDoorUnlocked = true;
          this.saveState.flags.basementDoorOpen = true;
          this.setInteractiveProps('basement_door', false);
          this.world.openBasementDoor();
          this.audio.playDoorOpen();
          this.showSubtitle('Crystal', 'It unlocked... What\'s down there?', 3.4);
          this.setObjective('obj_investigate_recording');
        }
        break;
      }

      case 'old_recorder': {
        if (this.recordingPlaybackActive) return;
        this.playBasementRecordingSequence();
        break;
      }

      case 'basement_mechanism': {
        this.audio.playMechanismClick();
        this.setScreen('puzzle');
        break;
      }

      case 'hidden_compartment_item': {
        this.triggerFinalSequence();
        break;
      }
    }
  }

  public onDiaryClosed(finishedReading: boolean): void {
    this.setScreen('playing');
    if (finishedReading && !this.saveState.flags.diaryRead) {
      this.saveState.flags.diaryRead = true;
      this.setInteractiveProps('old_diary', true, 'READ DIARY AGAIN');
      this.grantItem('old_diary', 'EVIDENCE COLLECTED', 'Old Diary');
      this.grantClue('diary_three_knocks');

      // First Supernatural Event!
      if (!this.saveState.flags.livingEventTriggered) {
        this.saveState.flags.livingEventTriggered = true;
        this.audio.silenceAmbienceBriefly(3000);
        this.world.flickerIntensity = 0.9;
        this.player.triggerFlashlightFlicker(1.4);
        this.world.triggerLivingRoomShift();

        window.setTimeout(() => {
          if (this.disposed) return;
          this.audio.playWoodCreak(0.28);
          this.world.flickerIntensity = 0;
          this.audio.playDistantCrying(0.65);
          this.showSubtitle('Crystal', 'Wait... I swear that chair wasn\'t facing that way.', 4.0);
          this.setObjective('obj_go_upstairs');
        }, 1200);
      }
    }
    this.player.requestPointerLock();
  }

  public onPhotographFlipped(): void {
    if (!this.saveState.flags.photoFlipped) {
      this.saveState.flags.photoFlipped = true;
      this.grantClue('photo_back_message');
      this.showDiscovery('CLUE RECORDED', 'Photograph Message & Tri-Moon Sigil');
      this.setObjective('obj_find_basement_key', false);
    }
  }

  public onPhotographClosed(): void {
    this.setScreen('playing');
    if (this.saveState.flags.photoFlipped) {
      this.showSubtitle('Crystal', '"When the clock stops, the door remembers..." What does that mean?', 4.2);
    } else {
      this.showSubtitle('Crystal', 'Why would someone scratch out just one face?', 3.6);
    }
    this.player.requestPointerLock();
  }

  public onPuzzleSolved(): void {
    this.saveState.flags.puzzleSolved = true;
    this.setInteractiveProps('basement_mechanism', false);
    this.setInteractiveProps('hidden_compartment_item', true, 'INSPECT HIDDEN RELICS');
    this.world.openHiddenCompartment();
    this.audio.playMechanismUnlock();
    this.setScreen('playing');
    this.showDiscovery('PUZZLE SOLVED', 'Hidden Basement Compartment Opened');
    this.showSubtitle('Crystal', 'There\'s a hidden room behind the wall...', 3.8);
    this.setObjective('obj_discover_compartment');
    this.player.requestPointerLock();
    this.persistSave();
  }

  private playBasementRecordingSequence(): void {
    this.recordingPlaybackActive = true;
    this.world.recordingSpinning = true;
    this.audio.playTapePlayback(10.0);

    RECORDING_LINES.forEach(([delay, text]) => {
      window.setTimeout(() => {
        if (this.disposed) return;
        this.showSubtitle('Recording', text, 2.3);
      }, delay);
    });

    window.setTimeout(() => {
      if (this.disposed) return;
      this.recordingPlaybackActive = false;
      this.world.recordingSpinning = false;
      this.audio.playLockClick();
      this.saveState.flags.recordingPlayed = true;
      this.grantItem('recording_evidence', 'EVIDENCE COLLECTED', 'Cassette Tape Evidence');
      this.grantClue('recording_voices');
      this.showSubtitle('Crystal', 'What does that mean? "It learns our voices"?', 4.0);
      this.setObjective('obj_solve_mechanism');
    }, 9800);
  }

  private triggerFinalSequence(): void {
    if (this.endingPhase !== 'idle') return;
    this.saveState.flags.compartmentInspected = true;
    this.setInteractiveProps('hidden_compartment_item', false);
    this.endingPhase = 'whisper';
    this.endingTimer = 0;

    this.setScreen('ending_sequence');
    this.player.canMove = false;
    this.player.canLook = false;

    this.audio.silenceAmbienceBriefly(15000);
    this.world.recordingSpinning = true;
    this.audio.playMechanismClick();

    window.setTimeout(() => {
      if (this.disposed) return;
      this.audio.playWhisper();
      this.showSubtitle('Unknown Voice', '"She\'s here."', 2.8);
    }, 900);

    window.setTimeout(() => {
      if (this.disposed) return;
      this.endingPhase = 'turn_around';
      this.player.canLook = true;
      this.audio.playDistantCrying(0.95);
      this.setObjective('obj_survive_final', false);
      this.showSubtitle('Crystal', 'No... no, that\'s right behind me...', 3.6);

      // Place silhouette at far end of basement facing Crystal
      this.world.entitySilhouette.visible = true;
      this.world.entitySilhouette.position.set(1.2, -3.4, -15.4);
      this.world.entitySilhouette.rotation.y = -Math.PI / 2;
      this.world.flickerIntensity = 0.75;
      this.player.triggerFlashlightFlicker(4.5);
    }, 3400);
  }

  private checkTriggers(dt: number): void {
    if (this.screen !== 'playing' && this.screen !== 'ending_sequence') return;

    const p = this.player.position;

    // Exterior hesitation & crying distance falloff
    if (!this.saveState.flags.enteredHouse) {
      if (!this.hesitationPlayed && p.z < 9.2) {
        this.hesitationPlayed = true;
        this.showSubtitle('Crystal', 'Why would someone be crying in an abandoned house?', 3.8);
      }
      if (p.z < 6.1 && Math.abs(p.x) < 1.1) {
        this.triggerEnterHouse();
      }
    }

    // Upstairs objective progression
    if (
      this.saveState.flags.diaryRead &&
      !this.saveState.flags.photoExamined &&
      p.y > 4.6 &&
      this.saveState.currentObjective === 'obj_go_upstairs'
    ) {
      this.setObjective('obj_examine_photo', false);
    }

    // Bedroom mirror subtle ghostly reflection
    if (
      this.saveState.flags.photoExamined &&
      !this.saveState.flags.mirrorEventTriggered &&
      p.y > 4.6 &&
      p.x < -3.0 &&
      p.z > 1.0
    ) {
      this.saveState.flags.mirrorEventTriggered = true;
      this.mirrorAnim = { active: true, t: 0 };
      this.world.mirrorGhostMesh.visible = true;
      this.audio.playHorrorSting();
      this.player.triggerFlashlightFlicker(0.8);
      this.showSubtitle('Crystal', 'Did something just move in the mirror?!', 3.4);
    }

    if (this.mirrorAnim.active) {
      this.mirrorAnim.t += dt;
      if (this.mirrorAnim.t > 1.05) {
        this.mirrorAnim.active = false;
        this.world.mirrorGhostMesh.visible = false;
      }
    }

    // Hallway supernatural silhouette event after finding photograph & exiting bedroom
    if (
      this.saveState.flags.photoExamined &&
      !this.saveState.flags.hallwayShadowTriggered &&
      p.y > 4.6 &&
      p.x > 1.85 &&
      p.x < 3.6
    ) {
      this.saveState.flags.hallwayShadowTriggered = true;
      this.hallwayShadowAnim = { active: true, t: 0 };
      this.world.entitySilhouette.visible = true;
      this.world.entitySilhouette.position.set(4.6, 3.64, -1.6);
      this.world.entitySilhouette.rotation.y = Math.PI;
      this.audio.playHorrorSting();
      this.player.triggerFlashlightFlicker(1.1);
      this.showSubtitle('Crystal', 'Hello?! Is someone there?', 3.5);
    }

    if (this.hallwayShadowAnim.active) {
      this.hallwayShadowAnim.t += dt;
      const progress = this.hallwayShadowAnim.t / 1.45;
      this.world.entitySilhouette.position.z = THREE.MathUtils.lerp(-1.6, -4.35, Math.min(1, progress));
      this.world.entitySilhouette.position.x = THREE.MathUtils.lerp(4.6, 5.2, Math.min(1, progress));
      if (progress >= 1) {
        this.hallwayShadowAnim.active = false;
        this.world.entitySilhouette.visible = false;
      }
    }

    // Ending sequence look-around check
    if (this.endingPhase === 'turn_around') {
      this.endingTimer += dt;
      // Check if player rotated toward +X (looking back out into the basement) or 6.5s elapsed
      const dirX = -Math.sin(this.player.yaw);
      if ((dirX > 0.45 && this.endingTimer > 1.6) || this.endingTimer > 6.5) {
        this.endingPhase = 'spotted';
        this.endingTimer = 0;
        this.audio.playHorrorSting();
        // Lunge silhouette slightly closer in flicker then cut to black
        this.world.entitySilhouette.position.set(-2.5, -3.4, -15.8);

        window.setTimeout(() => {
          if (this.disposed) return;
          this.endingPhase = 'blackout';
          this.player.canLook = false;
          this.audio.playKnock(true);
          this.callbacks.onBlackoutKnock('black');

          window.setTimeout(() => {
            if (this.disposed) return;
            this.audio.playKnock(true);
            this.callbacks.onBlackoutKnock('knock1');
          }, 1500);
          window.setTimeout(() => {
            if (this.disposed) return;
            this.audio.playKnock(true);
            this.callbacks.onBlackoutKnock('knock2');
          }, 2500);
          window.setTimeout(() => {
            if (this.disposed) return;
            this.audio.playKnock(true);
            this.callbacks.onBlackoutKnock('knock3');
          }, 3500);
          window.setTimeout(() => {
            if (this.disposed) return;
            this.world.entitySilhouette.visible = false;
            this.world.recordingSpinning = false;
            this.world.flickerIntensity = 0;
            this.setScreen('chapter_complete');
          }, 5400);
        }, 950);
      }
    }
  }

  private tick = (): void => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    this.elapsed += dt;

    if (this.screen === 'menu') {
      // Atmospheric main menu live camera pan outside the abandoned house
      const camX = Math.sin(this.elapsed * 0.14) * 2.2;
      const camZ = 14.5 + Math.cos(this.elapsed * 0.11) * 0.9;
      this.camera.position.set(camX, 2.35, camZ);
      this.camera.lookAt(-0.4, 3.3, 4.0);
      this.player.flashlight.intensity = 0;
      this.world.update(dt, this.elapsed);
    } else if (this.screen === 'playing' || this.screen === 'ending_sequence') {
      this.saveState.playTimeSeconds += dt;
      this.player.update(dt);
      this.world.update(dt, this.elapsed);
      this.checkTriggers(dt);

      // Dynamic environment audio
      const p = this.player.position;
      const inside = p.z < 5.5;
      const basement = p.y < -0.5;
      let crying = 0;
      if (!inside) {
        crying = THREE.MathUtils.clamp((15 - p.z) / 10, 0.08, 0.35);
      } else if (!this.saveState.flags.photoExamined) {
        crying = p.y > 2.5 ? 0.52 : 0.28;
      } else if (basement) {
        crying = 0.2;
      }
      this.audio.setEnvironmentState({ inside, basement, cryingIntensity: crying });

      // Raycast interaction prompt
      if (this.screen === 'playing') {
        const target = this.player.getTargetedInteractive();
        const nextId = target ? target.id : null;
        if (nextId !== this.activeTargetId) {
          this.activeTargetId = nextId;
          this.callbacks.onTargetChange(
            target ? { id: target.id, prompt: target.prompt, room: target.room } : null
          );
        }
      } else if (this.activeTargetId !== null) {
        this.activeTargetId = null;
        this.callbacks.onTargetChange(null);
      }

      // Periodic battery HUD sync & autosave
      this.batterySyncAccum += dt;
      if (this.batterySyncAccum > 1.0) {
        this.batterySyncAccum = 0;
        this.callbacks.onFlashlightChange(this.player.flashlightOn, this.player.flashlightBattery);
      }

      this.autoSaveAccum += dt;
      if (this.autoSaveAccum > 5.0 && this.screen === 'playing') {
        this.autoSaveAccum = 0;
        this.persistSave();
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    if (this.subtitleTimer) clearTimeout(this.subtitleTimer);
    window.removeEventListener('resize', this.boundResize);

    this.player.dispose();
    this.world.dispose();
    this.textures.dispose();
    this.audio.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
