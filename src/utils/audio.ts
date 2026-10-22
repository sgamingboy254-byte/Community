// Web Audio API lightweight sound synthesizer with studio-grade acoustic clarity
class SoundEffects {
  private ctx: AudioContext | null = null;

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Windows 7 Professional Iconic 4-Note Aero Chime
  playWindows7Startup() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const t0 = ctx.currentTime + 0.05;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, t0);
      compressor.knee.setValueAtTime(25, t0);
      compressor.ratio.setValueAtTime(6, t0);
      compressor.attack.setValueAtTime(0.005, t0);
      compressor.release.setValueAtTime(0.3, t0);
      compressor.connect(ctx.destination);

      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(800, t0);
      masterFilter.frequency.exponentialRampToValueAtTime(3600, t0 + 1.2);
      masterFilter.frequency.exponentialRampToValueAtTime(1600, t0 + 3.8);
      masterFilter.connect(compressor);

      // Warm Ambient Glass-Strings Pad
      const aeroPadNotes = [
        { freq: 130.81, detune: -4 },
        { freq: 196.0, detune: 3 },
        { freq: 329.63, detune: -2 },
        { freq: 392.0, detune: 4 },
      ];

      aeroPadNotes.forEach((pad) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pad.freq, t0);
        osc.detune.setValueAtTime(pad.detune, t0);

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(0.055, t0 + 0.8);
        gain.gain.setValueAtTime(0.055, t0 + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.6);

        osc.connect(gain);
        gain.connect(masterFilter);

        osc.start(t0);
        osc.stop(t0 + 3.7);
      });

      // Signature Windows 7 Four Chime Notes (G4 -> D5 -> B4 -> C5)
      const win7Chimes = [
        { time: 0.35, freq: 392.0, dur: 2.0, vol: 0.22, name: 'G4' },
        { time: 0.72, freq: 587.33, dur: 2.1, vol: 0.24, name: 'D5' },
        { time: 1.08, freq: 493.88, dur: 2.2, vol: 0.23, name: 'B4' },
        { time: 1.48, freq: 523.25, dur: 2.8, vol: 0.28, name: 'C5 (Resolve)' },
      ];

      win7Chimes.forEach((chime) => {
        const startTime = t0 + chime.time;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(chime.freq, startTime);

        gain1.gain.setValueAtTime(0.0001, startTime);
        gain1.gain.linearRampToValueAtTime(chime.vol, startTime + 0.035);
        gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + chime.dur);

        osc1.connect(gain1);
        gain1.connect(masterFilter);

        osc1.start(startTime);
        osc1.stop(startTime + chime.dur + 0.1);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(chime.freq * 2, startTime);

        gain2.gain.setValueAtTime(0.0001, startTime);
        gain2.gain.linearRampToValueAtTime(chime.vol * 0.4, startTime + 0.025);
        gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + chime.dur * 0.65);

        osc2.connect(gain2);
        gain2.connect(masterFilter);

        osc2.start(startTime);
        osc2.stop(startTime + chime.dur);

        if (chime.name.includes('Resolve')) {
          const oscShimmer = ctx.createOscillator();
          const gainShimmer = ctx.createGain();
          oscShimmer.type = 'sine';
          oscShimmer.frequency.setValueAtTime(chime.freq * 3, startTime + 0.05);

          gainShimmer.gain.setValueAtTime(0.0001, startTime + 0.05);
          gainShimmer.gain.linearRampToValueAtTime(0.06, startTime + 0.12);
          gainShimmer.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);

          oscShimmer.connect(gainShimmer);
          gainShimmer.connect(masterFilter);

          oscShimmer.start(startTime + 0.05);
          oscShimmer.stop(startTime + 2.3);
        }
      });

      // Warm Foundation Bass
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(65.41, t0 + 0.1);

      bassGain.gain.setValueAtTime(0.0001, t0 + 0.1);
      bassGain.gain.linearRampToValueAtTime(0.14, t0 + 0.7);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);

      bassOsc.connect(bassGain);
      bassGain.connect(masterFilter);

      bassOsc.start(t0 + 0.1);
      bassOsc.stop(t0 + 3.3);
    } catch (err) {
      console.warn('Windows 7 audio startup error:', err);
    }
  }

  playWindowsXPStartup() {
    this.playWindows7Startup();
  }

  // Ultra-Crisp Futuristic Send Sound (Dual-tone Harmonic Sweep + Soft Pop)
  playSend() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      // Tone 1: Upward sweet bubble sweep (523Hz -> 1046Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, t);
      osc1.frequency.exponentialRampToValueAtTime(1046.5, t + 0.12);

      gain1.gain.setValueAtTime(0.1, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.15);

      // Tone 2: Crystalline top sparkle (1567Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1567.98, t + 0.02);

      gain2.gain.setValueAtTime(0.05, t + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t + 0.02);
      osc2.stop(t + 0.17);
    } catch {
      // Audio playback failed silently
    }
  }

  // Lush Triple-Chime Receive Sound (C5 -> E5 -> G5 Marimba Glass Chord)
  playReceive() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const notes = [
        { freq: 659.25, time: 0, dur: 0.22, vol: 0.1 },      // E5
        { freq: 783.99, time: 0.05, dur: 0.26, vol: 0.11 },   // G5
        { freq: 1046.5, time: 0.11, dur: 0.35, vol: 0.14 },   // C6
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, t + n.time);

        gain.gain.setValueAtTime(0.001, t + n.time);
        gain.gain.linearRampToValueAtTime(n.vol, t + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + n.time);
        osc.stop(t + n.time + n.dur + 0.05);
      });
    } catch {
      // Audio playback failed silently
    }
  }

  // Satisfying Bubble Pop for Button Taps and Emoji Reactions
  playPop() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.06);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch {}
  }

  // Sparkling Chime for Direct Personal Messages & Mentions
  playChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      [783.99, 1174.66, 1567.98].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);

        gain.gain.setValueAtTime(0.001, t + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.06 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.3);
      });
    } catch {}
  }

  // Gold Coin Clink for Wallet Grants & Transfers
  playCoin() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [987.77, 1318.51, 1975.53].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.12, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.23);
      });
    } catch {
      // Audio playback failed silently
    }
  }

  // Triumphant Royal Alert for Power Person & Super Admin Events
  playRoleAlert() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const fanfare = [
        { freq: 440, time: 0, dur: 0.12 },
        { freq: 554.37, time: 0.09, dur: 0.12 },
        { freq: 659.25, time: 0.18, dur: 0.15 },
        { freq: 880, time: 0.28, dur: 0.38 },
      ];

      fanfare.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f.freq, t + f.time);

        gain.gain.setValueAtTime(0.001, t + f.time);
        gain.gain.linearRampToValueAtTime(0.12, t + f.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + f.time + f.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + f.time);
        osc.stop(t + f.time + f.dur + 0.05);
      });
    } catch {
      // Audio playback failed silently
    }
  }
}

export const sound = new SoundEffects();
