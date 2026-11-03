export class AudioService {
  private static ctx: AudioContext | null = null;
  private static noiseBuffer: AudioBuffer | null = null;
  private static reverbConvolver: ConvolverNode | null = null;
  private static masterGain: GainNode | null = null;
  private static lastDistantTime: Record<string, number> = {};
  private static outNode: AudioNode | null = null;
  private static outDelay: number = 0;
  private static pitchMultiplier: number = 1;
  public static muted: boolean = false;
  public static soundMode: number = 0; // 0=fog echo, 1=everywhere, 2=muffler
  public static masterVolume: number = 0.8;
  public static sfxVolume: number = 0.85;

  public static getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : this.masterVolume * this.sfxVolume,
        this.ctx.currentTime
      );
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public static updateVolumes(
    muted: boolean,
    masterVol: number,
    sfxVol: number,
    soundMode: number
  ) {
    this.muted = muted;
    this.masterVolume = masterVol;
    this.sfxVolume = sfxVol;
    this.soundMode = soundMode;
    if (this.ctx && this.masterGain) {
      const vol = muted ? 0 : masterVol * sfxVol;
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public static tone(
    freq: number,
    type: OscillatorType,
    duration: number,
    volume: number = 0.15,
    freqOffset: number = 0,
    delay: number = 0
  ) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const startTime = ctx.currentTime + delay + this.outDelay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const f = freq * this.pitchMultiplier;
      const deltaF = freqOffset * this.pitchMultiplier;

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, f), startTime);
      if (deltaF) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, f + deltaF), startTime + duration);
      }

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.outNode || this.masterGain || ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // AudioContext policy catch
    }
  }

  public static voiceChirp(pitch: number = 1.0, isCute: boolean = false) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const startTime = ctx.currentTime + this.outDelay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isCute) {
        // High-pitched cute chirp / mew blip for Nekos (Neco-Arc typewriter blip)
        const baseFreq = 780 * Math.max(0.6, pitch);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, startTime + 0.035);
        gain.gain.setValueAtTime(0.09, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);
        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.045);
      } else {
        // 8-bit retro radio comms bleep for commanders and officers
        const baseFreq = 220 * Math.max(0.4, pitch);
        osc.type = 'square';
        const jitter = (Math.random() * 30 - 15);
        osc.frequency.setValueAtTime(Math.max(60, baseFreq + jitter), startTime);
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, baseFreq * 0.8), startTime + 0.035);
        gain.gain.setValueAtTime(0.055, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.038);
        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.045);
      }
    } catch {
      // AudioContext catch
    }
  }

  /**
   * Synthesizes authentic anime Neko vocalizations inspired by Neco-Arc from Melty Blood
   * Features: "Buru Nyuu!~", "Nya!~", "Nyuuu~!", and "Dori dori dori!"
   */
  public static playNekoVoice(type: 'buru_nyuu' | 'nya' | 'nyuu' | 'dori' = 'buru_nyuu') {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime + this.outDelay;

      if (type === 'buru_nyuu') {
        // "Buru Nyuu!~" - Iconic Neco-Arc sound: rapid roll "bu-ru" then rising/peaking kawaii "nyuuu~!"
        const t0 = now;
        // Syllable 1: "Bu" (snappy low-mid pop)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(420, t0);
        osc1.frequency.exponentialRampToValueAtTime(540, t0 + 0.06);
        gain1.gain.setValueAtTime(0.18, t0);
        gain1.gain.exponentialRampToValueAtTime(0.01, t0 + 0.07);
        osc1.connect(gain1);
        gain1.connect(this.masterGain || ctx.destination);
        osc1.start(t0);
        osc1.stop(t0 + 0.075);

        // Syllable 2: "Ru" (slightly higher roll)
        const t1 = t0 + 0.08;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(580, t1);
        osc2.frequency.exponentialRampToValueAtTime(720, t1 + 0.06);
        gain2.gain.setValueAtTime(0.2, t1);
        gain2.gain.exponentialRampToValueAtTime(0.01, t1 + 0.07);
        osc2.connect(gain2);
        gain2.connect(this.masterGain || ctx.destination);
        osc2.start(t1);
        osc2.stop(t1 + 0.075);

        // Syllable 3: "Nyuuu~!" (kawaii high sweep with vocal formant)
        const t2 = t1 + 0.09;
        const osc3 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        // Pitch sweep from 720Hz peaking at 1150Hz and vibrato slide to 880Hz
        osc3.frequency.setValueAtTime(680, t2);
        osc3.frequency.exponentialRampToValueAtTime(1180, t2 + 0.12);
        osc3.frequency.exponentialRampToValueAtTime(860, t2 + 0.32);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t2);
        filter.frequency.exponentialRampToValueAtTime(2200, t2 + 0.15);
        filter.Q.value = 3.5;

        gain3.gain.setValueAtTime(0.01, t2);
        gain3.gain.linearRampToValueAtTime(0.26, t2 + 0.05);
        gain3.gain.exponentialRampToValueAtTime(0.001, t2 + 0.35);

        osc3.connect(filter);
        filter.connect(gain3);
        gain3.connect(this.masterGain || ctx.destination);
        osc3.start(t2);
        osc3.stop(t2 + 0.36);
      } else if (type === 'nya') {
        // "Nya!~" - Sweet perky anime cat meow
        const t0 = now;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // "Ny-a-a-!" frequency glide
        osc.frequency.setValueAtTime(540, t0);
        osc.frequency.exponentialRampToValueAtTime(1020, t0 + 0.08);
        osc.frequency.exponentialRampToValueAtTime(780, t0 + 0.22);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, t0);
        filter.frequency.exponentialRampToValueAtTime(2400, t0 + 0.08);
        filter.Q.value = 4.0;

        gain.gain.setValueAtTime(0.01, t0);
        gain.gain.linearRampToValueAtTime(0.24, t0 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain || ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.25);
      } else if (type === 'nyuu') {
        // "Nyuuu~" - Whimsical feline mew with gentle vibrato
        const t0 = now;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(920, t0);
        osc.frequency.exponentialRampToValueAtTime(640, t0 + 0.28);
        gain.gain.setValueAtTime(0.2, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
        osc.connect(gain);
        gain.connect(this.masterGain || ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.29);
      } else if (type === 'dori') {
        // "Dori-dori-dori!" - Rapid anime Neco-Arc triplet chitter
        for (let i = 0; i < 3; i++) {
          const ti = now + i * 0.065;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600 + i * 80, ti);
          osc.frequency.exponentialRampToValueAtTime(880 + i * 80, ti + 0.045);
          gain.gain.setValueAtTime(0.18, ti);
          gain.gain.exponentialRampToValueAtTime(0.001, ti + 0.05);
          osc.connect(gain);
          gain.connect(this.masterGain || ctx.destination);
          osc.start(ti);
          osc.stop(ti + 0.055);
        }
      }
    } catch {
      // AudioContext catch
    }
  }

  public static noise(
    duration: number,
    volume: number = 0.2,
    cutoff: number = 1500,
    delay: number = 0
  ) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
        this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }

      const startTime = ctx.currentTime + delay + this.outDelay;
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      src.buffer = this.noiseBuffer;
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.outNode || this.masterGain || ctx.destination);

      src.start(startTime, Math.random() * 0.9, duration);
    } catch {
      // ignore
    }
  }

  public static farEcho(
    playFn: () => void,
    key: string,
    x: number,
    y: number,
    alwaysMuffle: boolean,
    camX?: number,
    camY?: number,
    N: number = 15
  ) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      if (key in this.lastDistantTime && now - this.lastDistantTime[key] < 0.07) return;
      this.lastDistantTime[key] = now;

      if (!this.reverbConvolver) {
        const len = (ctx.sampleRate * 2.2) | 0;
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
          const ch = buf.getChannelData(c);
          for (let i = 0; i < len; i++) {
            ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
          }
        }
        this.reverbConvolver = ctx.createConvolver();
        this.reverbConvolver.buffer = buf;
        const revGain = ctx.createGain();
        revGain.gain.value = 0.8;
        this.reverbConvolver.connect(revGain);
        revGain.connect(this.masterGain || ctx.destination);
      }

      const dist = Math.hypot((camX ?? N / 2) - x, (camY ?? N / 2) - y);
      const distNorm = Math.min(1, dist / (N * 0.75));

      const filter = ctx.createBiquadFilter();
      const directGain = ctx.createGain();
      const verbGain = ctx.createGain();

      const isHeavy = key === 'big' ? 2 : 'ABJLFMYTV'.includes(key) ? 1 : key === 'boom' ? 1.6 : key === 'hit' ? 0.4 : 0.5;

      filter.type = 'lowpass';
      filter.frequency.value = Math.max(100, 1500 - 950 * distNorm);
      directGain.gain.value = Math.max(0.05, 0.9 - 0.5 * distNorm);
      verbGain.gain.value = 0.5 + 0.6 * distNorm;

      filter.connect(directGain);
      directGain.connect(this.masterGain || ctx.destination);

      filter.connect(verbGain);
      verbGain.connect(this.reverbConvolver);

      this.outNode = filter;
      this.outDelay = Math.min(0.7, 0.04 + dist * 0.045);
      this.pitchMultiplier = 1 - 0.25 * distNorm;

      playFn();

      if (!alwaysMuffle) {
        this.tone(46 + Math.random() * 16, 'sine', 0.5 + 0.5 * isHeavy, 0.13 * isHeavy, -12);
      }
    } finally {
      this.outNode = null;
      this.outDelay = 0;
      this.pitchMultiplier = 1;
    }
  }

  public static play(
    key: string,
    x?: number,
    y?: number,
    visible: boolean = true,
    alwaysMuffle: boolean = false,
    camPos?: { x: number; y: number },
    N: number = 15
  ) {
    if (this.muted) return;

    const SFX: Record<string, () => void> = {
      sel: () => this.tone(660, 'square', 0.07, 0.05),
      mv: () => {
        this.noise(0.1, 0.12, 500);
        this.tone(110, 'triangle', 0.12, 0.08);
      },
      fly: () => {
        this.noise(0.35, 0.1, 2500);
        this.tone(300, 'triangle', 0.35, 0.05, 200);
      },
      R: () => {
        this.noise(0.08, 0.25, 3500);
        this.tone(220, 'square', 0.08, 0.08, -150);
      },
      G: () => SFX.R(),
      M: () => {
        SFX.R();
        this.noise(0.08, 0.25, 3500, 0.1);
      },
      Y: () => {
        for (let i = 0; i < 4; i++) this.noise(0.05, 0.2, 3000, i * 0.07);
      },
      S: () => {
        this.tone(1400, 'sine', 0.18, 0.12, -1000);
        this.noise(0.04, 0.3, 7000);
      },
      A: () => {
        this.tone(90, 'sawtooth', 0.45, 0.3, -55);
        this.noise(0.4, 0.4, 500);
      },
      B: () => {
        this.tone(75, 'sawtooth', 0.35, 0.3, -40);
        this.noise(0.3, 0.35, 800);
      },
      J: () => {
        SFX.B();
        this.tone(60, 'square', 0.4, 0.25, -30, 0.05);
      },
      L: () => {
        this.noise(0.6, 0.18, 1800);
        this.tone(180, 'sawtooth', 0.6, 0.1, 700);
      },
      F: () => this.tone(500, 'triangle', 0.4, 0.1, -350),
      E: () => {
        this.tone(200, 'sawtooth', 0.4, 0.1, 1400);
        this.tone(1600, 'square', 0.2, 0.05, -1200, 0.2);
      },
      P: () => {
        [523, 659, 784].forEach((freq, idx) => this.tone(freq, 'sine', 0.2, 0.1, 0, idx * 0.09));
      },
      C: () => SFX.R(),
      T: () => SFX.M(),
      Z: () => SFX.Y(),
      N: () => SFX.P(),
      K: () => SFX.P(),
      V: () => {
        this.tone(900, 'sawtooth', 0.3, 0.1, -700);
        this.noise(0.3, 0.4, 1000, 0.28);
      },
      D: () => {
        this.tone(1600, 'sawtooth', 0.22, 0.25, -1300);
        this.noise(0.25, 0.4, 3800);
      },
      U: () => {
        this.noise(0.07, 0.3, 2200);
        this.tone(150, 'square', 0.08, 0.12, -60);
      },
      Q: () => {
        this.tone(620, 'sine', 0.14, 0.15, -320);
        this.noise(0.06, 0.18, 1400);
      },
      I: () => {
        this.tone(850, 'triangle', 0.08, 0.12, -650);
        this.noise(0.03, 0.18, 6500);
      },
      X: () => {
        this.noise(0.38, 0.35, 850);
        this.tone(110, 'sawtooth', 0.25, 0.12, 30);
      },
      MR: () => {
        this.tone(1300, 'sine', 0.16, 0.12, -900);
        this.noise(0.04, 0.25, 6500);
      },
      AT: () => {
        this.noise(0.08, 0.25, 2800);
        this.tone(160, 'square', 0.1, 0.1, -80);
      },
      AC: () => {
        this.noise(0.12, 0.3, 2400);
        this.tone(140, 'square', 0.15, 0.15, -60);
      },
      FC: () => {
        this.tone(120, 'sawtooth', 0.3, 0.2, 80);
        this.noise(0.3, 0.25, 1200);
      },
      SP: () => {
        this.tone(80, 'sawtooth', 0.5, 0.35, -50);
        this.noise(0.45, 0.45, 450);
      },
      SH: () => {
        this.tone(480, 'sawtooth', 0.22, 0.18, -250);
        this.noise(0.12, 0.25, 4000);
      },
      DW: () => {
        this.tone(55, 'square', 0.5, 0.35, -25);
        this.noise(0.4, 0.45, 600);
      },
      HF: () => {
        this.noise(0.09, 0.35, 2600);
        this.tone(180, 'square', 0.09, 0.15, -90);
      },
      SB: () => {
        this.tone(350, 'triangle', 0.5, 0.15, -280);
        this.noise(0.5, 0.3, 800, 0.1);
      },
      NS: () => {
        this.tone(1200, 'sine', 0.25, 0.12, 400);
        this.noise(0.1, 0.15, 6000);
      },
      IJ: () => {
        this.tone(700, 'sawtooth', 0.2, 0.15, -450);
        this.noise(0.2, 0.3, 3000);
      },
      MT: () => {
        this.tone(140, 'sine', 0.15, 0.2, -60);
        this.noise(0.15, 0.2, 1200);
      },
      SR: () => {
        this.tone(90, 'sawtooth', 0.3, 0.3, -50);
        this.noise(0.35, 0.4, 750);
      },
      CH: () => {
        this.tone(1400, 'sine', 0.08, 0.1, -800);
        this.tone(800, 'square', 0.12, 0.08, 200, 0.05);
      },
      GS: () => {
        this.noise(1.2, 0.6, 380);
        this.tone(45, 'sawtooth', 1, 0.45, -20);
        this.tone(85, 'square', 0.4, 0.25, -45, 0.05);
      },
      hit: () => {
        this.noise(0.15, 0.3, 900);
        this.tone(120, 'sine', 0.15, 0.2, -70);
      },
      boom: () => {
        this.noise(0.8, 0.5, 600);
        this.tone(60, 'sawtooth', 0.7, 0.35, -35);
      },
      big: () => {
        this.noise(1.1, 0.5, 450);
        this.tone(52, 'sawtooth', 0.9, 0.4, -28);
        this.noise(0.35, 0.35, 1600, 0.04);
        this.tone(100, 'square', 0.25, 0.15, -60);
      },
      cap: () => {
        [392, 523, 659, 784].forEach((freq, idx) =>
          this.tone(freq, 'triangle', 0.15, 0.1, 0, idx * 0.07)
        );
      },
      spawn: () => this.tone(300, 'sine', 0.2, 0.1, 500),
      turn: () => {
        this.tone(440, 'sine', 0.15, 0.1);
        this.tone(660, 'sine', 0.25, 0.1, 0, 0.12);
      },
      go: () => {
        [262, 330, 392, 523].forEach((freq, idx) =>
          this.tone(freq, 'square', 0.2, 0.07, 0, idx * 0.1)
        );
      },
      win: () => {
        [523, 659, 784, 1047, 1319].forEach((freq, idx) =>
          this.tone(freq, 'triangle', 0.3, 0.12, 0, idx * 0.12)
        );
      },
      lose: () => {
        [392, 330, 262, 196].forEach((freq, idx) =>
          this.tone(freq, 'sawtooth', 0.4, 0.1, 0, idx * 0.2)
        );
      },
      // Pass & Play Specific Audio
      passTurn: () => {
        // Dual-tone alert chime notifying to hand over device
        this.tone(587.33, 'sine', 0.18, 0.15); // D5
        this.tone(880, 'sine', 0.28, 0.18, 0, 0.12); // A5
        this.tone(1174.66, 'triangle', 0.35, 0.12, 0, 0.24); // D6
      },
      turnReady: () => {
        // Tactical turn confirmation sweep
        this.tone(150, 'sawtooth', 0.25, 0.18, 250);
        this.noise(0.12, 0.18, 2000, 0.05);
        this.tone(784, 'sine', 0.3, 0.15, 0, 0.12);
      },
      // Intuitive UI Audio
      click: () => {
        this.noise(0.02, 0.14, 4000);
        this.tone(900, 'sine', 0.03, 0.08, -300);
      },
      tab: () => {
        this.tone(480, 'sine', 0.06, 0.09, 180);
      },
      coin: () => {
        [880, 1108.73, 1318.51, 1760].forEach((freq, idx) =>
          this.tone(freq, 'sine', 0.15, 0.12, 0, idx * 0.055)
        );
      },
      purchase: () => {
        [659.25, 830.61, 987.77, 1318.51].forEach((freq, idx) =>
          this.tone(freq, 'triangle', 0.2, 0.14, 0, idx * 0.06)
        );
      },
      error: () => {
        this.tone(160, 'sawtooth', 0.12, 0.2, -30);
        this.tone(130, 'sawtooth', 0.18, 0.25, -20, 0.1);
      },
      equip: () => {
        this.noise(0.04, 0.25, 5000);
        this.tone(420, 'square', 0.06, 0.1, -120, 0.02);
        this.tone(680, 'sine', 0.08, 0.1, 0, 0.06);
      },
      heal: () => {
        [440, 554.37, 659.25, 880].forEach((freq, idx) =>
          this.tone(freq, 'sine', 0.25, 0.1, 0, idx * 0.08)
        );
      },
      siren: () => {
        this.tone(650, 'sawtooth', 0.2, 0.15, 200);
        this.tone(850, 'sawtooth', 0.2, 0.15, -200, 0.2);
        this.tone(650, 'sawtooth', 0.2, 0.15, 200, 0.4);
      },
      repair: () => {
        this.noise(0.03, 0.2, 6000);
        this.tone(1200, 'square', 0.05, 0.08, -400);
        this.noise(0.03, 0.2, 6000, 0.12);
        this.tone(1400, 'square', 0.05, 0.08, -500, 0.12);
      },
      speed: () => {
        this.tone(1000, 'triangle', 0.04, 0.1, 400);
      },
      radar: () => {
        this.tone(1200, 'sine', 0.35, 0.12, -200);
      },
      notification: () => {
        this.tone(523.25, 'sine', 0.1, 0.12);
        this.tone(783.99, 'sine', 0.2, 0.14, 0, 0.08);
      },
    };

    if (x === undefined || y === undefined) {
      if (SFX[key]) SFX[key]();
      return;
    }

    if (this.soundMode === 1) {
      this.farEcho(SFX[key] || (() => {}), key, x, y, alwaysMuffle, camPos?.x, camPos?.y, N);
    } else if (visible) {
      if (SFX[key]) SFX[key]();
    } else if (this.soundMode === 0 && !alwaysMuffle) {
      this.farEcho(SFX[key] || (() => {}), key, x, y, alwaysMuffle, camPos?.x, camPos?.y, N);
    }
  }
}
