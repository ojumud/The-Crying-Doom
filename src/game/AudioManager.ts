import { GameSettings } from './types';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private roomHumGain: GainNode | null = null;
  private basementDroneGain: GainNode | null = null;

  private musicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private dripTimer: number | null = null;
  private cryingTimer: number | null = null;

  private muted = false;
  private initialized = false;
  private isInside = false;
  private isBasement = false;
  private ambienceSilenced = false;
  private cryingIntensity = 0; // 0..1

  private settings: GameSettings = {
    masterVolume: 0.85,
    musicVolume: 0.65,
    sfxVolume: 0.85,
    mouseSensitivity: 1,
    graphicsQuality: 'high',
    showTouchControls: 'auto',
    reducedCameraMovement: false,
    reducedScreenEffects: false,
  };

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.ambienceGain = this.ctx.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.ambienceGain.connect(this.sfxGain);
    this.masterGain.connect(this.ctx.destination);

    this.noiseBuffer = this.createNoiseBuffer(3);
    this.setupContinuousAmbience();
    this.applyVolumes();
    this.startSchedulers();

    this.initialized = true;
  }

  public updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    this.applyVolumes();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyVolumes();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = this.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.05);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * 0.55, now, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.05);
  }

  private createNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Smooth brown/pinkish noise
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
      data[i] *= 2.8;
    }
    return buffer;
  }

  private setupContinuousAmbience(): void {
    if (!this.ctx || !this.noiseBuffer || !this.ambienceGain) return;

    // Outside wind
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 340;
    this.windFilter.Q.value = 2.2;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.22;
    windSrc.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambienceGain);
    windSrc.start();

    // Subtle house room hum
    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.value = 54;
    this.roomHumGain = this.ctx.createGain();
    this.roomHumGain.gain.value = 0.02;
    humOsc.connect(this.roomHumGain);
    this.roomHumGain.connect(this.ambienceGain);
    humOsc.start();

    // Basement sub-drone
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.value = 38;
    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = 90;
    this.basementDroneGain = this.ctx.createGain();
    this.basementDroneGain.gain.value = 0;
    subOsc.connect(subFilter);
    subFilter.connect(this.basementDroneGain);
    this.basementDroneGain.connect(this.ambienceGain);
    subOsc.start();
  }

  public setEnvironmentState(opts: {
    inside: boolean;
    basement: boolean;
    cryingIntensity: number;
  }): void {
    this.isInside = opts.inside;
    this.isBasement = opts.basement;
    this.cryingIntensity = opts.cryingIntensity;
    if (!this.ctx || !this.windGain || !this.windFilter || !this.roomHumGain || !this.basementDroneGain) {
      return;
    }
    const now = this.ctx.currentTime;
    const mult = this.ambienceSilenced ? 0.12 : 1;
    this.windGain.gain.setTargetAtTime((opts.inside ? (opts.basement ? 0.02 : 0.06) : 0.24) * mult, now, 0.4);
    this.windFilter.frequency.setTargetAtTime(opts.inside ? 220 : 380, now, 0.4);
    this.roomHumGain.gain.setTargetAtTime((opts.inside ? 0.045 : 0.01) * mult, now, 0.4);
    this.basementDroneGain.gain.setTargetAtTime((opts.basement ? 0.11 : 0) * mult, now, 0.5);
  }

  public silenceAmbienceBriefly(durationMs = 2800): void {
    this.ambienceSilenced = true;
    this.setEnvironmentState({
      inside: this.isInside,
      basement: this.isBasement,
      cryingIntensity: this.cryingIntensity,
    });
    window.setTimeout(() => {
      this.ambienceSilenced = false;
      this.setEnvironmentState({
        inside: this.isInside,
        basement: this.isBasement,
        cryingIntensity: this.cryingIntensity,
      });
    }, durationMs);
  }

  private startSchedulers(): void {
    // Sparse minor piano notes & atmospheric drone swells
    const minorScale = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 415.3, 440];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running') return;
      if (this.ambienceSilenced) return;
      if (Math.random() < 0.45) {
        const freq = minorScale[Math.floor(Math.random() * minorScale.length)] * (Math.random() < 0.35 ? 0.5 : 1);
        this.playPianoNote(freq, 0.09 + Math.random() * 0.06, 3.8);
      }
    }, 4800);

    // Occasional house creaks & distant thunder
    this.ambienceTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.ambienceSilenced) return;
      if (this.isInside && Math.random() < 0.42) {
        this.playWoodCreak(0.14);
      } else if (!this.isBasement && Math.random() < 0.22) {
        this.playDistantThunder();
      }
    }, 7500);

    // Basement water drip
    this.dripTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (this.isBasement && Math.random() < 0.65) {
        this.playWaterDrip();
      }
    }, 2400);

    // Distant crying motif
    this.cryingTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (this.cryingIntensity > 0.05 && Math.random() < 0.68) {
        this.playDistantCrying(this.cryingIntensity);
      }
    }, 5200);
  }

  public playPianoNote(freq: number, volume = 0.14, duration = 3.5): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.002, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  public playDistantCrying(intensity = 0.45): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const sobCount = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < sobCount; i++) {
      const start = now + i * 0.72;
      const dur = 0.58;
      const osc = this.ctx.createOscillator();
      const vib = this.ctx.createOscillator();
      const vibGain = this.ctx.createGain();
      const formant = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const baseF = 360 + Math.random() * 55 - i * 18;
      osc.frequency.setValueAtTime(baseF, start);
      osc.frequency.exponentialRampToValueAtTime(baseF * 0.84, start + dur);

      vib.frequency.value = 6.5;
      vibGain.gain.value = 9;
      vib.connect(vibGain);
      vibGain.connect(osc.frequency);

      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(820, start);
      formant.frequency.linearRampToValueAtTime(540, start + dur);
      formant.Q.value = 4.5;

      const vol = Math.min(0.18, 0.04 + intensity * 0.12);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      vib.start(start);
      osc.stop(start + dur + 0.05);
      vib.stop(start + dur + 0.05);
    }
  }

  public playDistantThunder(): void {
    if (!this.ctx || !this.noiseBuffer || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 2.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);
    src.start(now);
    src.stop(now + 3.1);
  }

  public playWoodCreak(volume = 0.2): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const dur = 0.65 + Math.random() * 0.35;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const startFreq = 130 + Math.random() * 60;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(startFreq * 0.72, now + dur * 0.6);
    osc.frequency.linearRampToValueAtTime(startFreq * 0.9, now + dur);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  public playWaterDrip(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const base = 1100 + Math.random() * 450;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.65, now + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playFootstep(surface: 'wood' | 'concrete' | 'gravel' = 'wood'): void {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = surface === 'concrete' ? 620 : surface === 'gravel' ? 1400 : 280;
    filter.Q.value = surface === 'wood' ? 1.8 : 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(surface === 'concrete' ? 0.13 : 0.1, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now, Math.random() * 1.5, 0.12);
  }

  public playDoorSlam(): void {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Low impact thud
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.25);

    const thudGain = this.ctx.createGain();
    thudGain.gain.setValueAtTime(0.65, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(thudGain);
    thudGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);

    // Burst slam noise
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.45, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(now, 0, 0.26);

    // Deadbolt lock click shortly after
    window.setTimeout(() => this.playLockClick(), 340);
  }

  public playLockClick(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playDoorOpen(): void {
    this.playLockClick();
    window.setTimeout(() => this.playWoodCreak(0.24), 110);
  }

  public playFlashlightClick(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.025);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playPageFlip(): void {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now, 0.2, 0.16);
  }

  public playKeyPickup(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [1320, 1760, 2110].forEach((freq, idx) => {
      const t = now + idx * 0.055;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  public playKnock(loud = false): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const vol = loud ? 0.85 : 0.48;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(loud ? 135 : 175, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(310, now);
    osc2.frequency.exponentialRampToValueAtTime(110, now + 0.08);
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(vol * 0.45, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(this.sfxGain);
    gain2.connect(this.sfxGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.26);
    osc2.stop(now + 0.13);
  }

  public playMechanismClick(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playMechanismUnlock(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [180, 260, 110].forEach((f, idx) => {
      const t = now + idx * 0.16;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.18);
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playHorrorSting(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [68, 72, 139].forEach((f) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 0.88, now + 1.8);
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, now);
      filter.frequency.exponentialRampToValueAtTime(110, now + 1.8);
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 2.0);
    });
  }

  public playTapePlayback(durationSeconds = 9.5): void {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playMechanismClick();

    // Tape hiss bed
    const hiss = this.ctx.createBufferSource();
    hiss.buffer = this.noiseBuffer;
    hiss.loop = true;
    const hFilter = this.ctx.createBiquadFilter();
    hFilter.type = 'bandpass';
    hFilter.frequency.value = 1850;
    hFilter.Q.value = 1.2;
    const hGain = this.ctx.createGain();
    hGain.gain.setValueAtTime(0.0001, now);
    hGain.gain.linearRampToValueAtTime(0.09, now + 0.2);
    hGain.gain.setValueAtTime(0.09, now + durationSeconds - 0.4);
    hGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    hiss.connect(hFilter);
    hFilter.connect(hGain);
    hGain.connect(this.sfxGain);
    hiss.start(now);
    hiss.stop(now + durationSeconds + 0.05);

    // Subtle low voice-like cadence pulses
    const offsets = [0.4, 2.2, 4.4, 6.6];
    offsets.forEach((off, idx) => {
      const t = now + off;
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(125 - idx * 8, t);
      osc.frequency.linearRampToValueAtTime(98 - idx * 6, t + 1.1);
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 460;
      filter.Q.value = 3;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.075, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 1.2);
    });
  }

  public playWhisper(): void {
    if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.linearRampToValueAtTime(1100, now + 1.1);
    filter.Q.value = 4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now, 0.3, 1.3);
  }

  public dispose(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    if (this.ambienceTimer) clearInterval(this.ambienceTimer);
    if (this.dripTimer) clearInterval(this.dripTimer);
    if (this.cryingTimer) clearInterval(this.cryingTimer);
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}
