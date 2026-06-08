class AudioManager {
  private isMuted: boolean = true;
  private ctx: AudioContext | null = null;

  constructor() {
    // In SSR, window is undefined, so we defer initialization.
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("batcave.audio.muted");
      if (stored === null) {
        // Default to muted
        window.localStorage.setItem("batcave.audio.muted", "true");
        this.isMuted = true;
      } else {
        this.isMuted = stored === "true";
      }
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("batcave.audio.muted", muted ? "true" : "false");
    }
  }

  getMuted(): boolean {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("batcave.audio.muted");
      if (stored !== null) {
        this.isMuted = stored === "true";
      }
    }
    return this.isMuted;
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playCheckinComplete() {
    if (this.getMuted()) return;
    this.initContext();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    // Play double beep (high pitch, quick)
    this.playBeep(880, 0.08, now, "sine");
    this.playBeep(1100, 0.08, now + 0.1, "sine");
  }

  playFoundationComplete() {
    if (this.getMuted()) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Ascending chime (C5 -> E5 -> G5 -> C6)
    this.playBeep(523.25, 0.08, now, "sine");
    this.playBeep(659.25, 0.08, now + 0.08, "sine");
    this.playBeep(783.99, 0.08, now + 0.16, "sine");
    this.playBeep(1046.50, 0.16, now + 0.24, "sine");
  }

  playCountermeasureAccepted() {
    if (this.getMuted()) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Descending mechanical sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playCountermeasureCompleted() {
    if (this.getMuted()) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Upward sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playThreatDetected() {
    if (this.getMuted()) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pulse warning siren with low pass filter
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.4);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, now);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
  }

  playClick() {
    if (this.getMuted()) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(1600, now);
    
    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playToggle() {
    if (this.getMuted()) return;
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playBeep(600, 0.05, now, "sine");
    this.playBeep(850, 0.06, now + 0.05, "sine");
  }

  private playBeep(freq: number, duration: number, time: number, type: OscillatorType) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }
}

export const audioManager = new AudioManager();
