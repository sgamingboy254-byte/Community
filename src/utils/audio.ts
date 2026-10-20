// Web Audio API lightweight sound synthesizer
class SoundEffects {
  private ctx: AudioContext | null = null;

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
  // Synthesizes the signature crystal chime & warm glass-harmonica strings in C Major:
  // Note 1: G4 (392Hz) -> Note 2: D5 (587Hz) -> Note 3: B4 (494Hz) -> Note 4: C5 (523Hz)
  playWindows7Startup() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const t0 = ctx.currentTime + 0.05;

      // Dynamics compressor / limiter for pristine clarity and warm aero ambiance
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, t0);
      compressor.knee.setValueAtTime(25, t0);
      compressor.ratio.setValueAtTime(6, t0);
      compressor.attack.setValueAtTime(0.005, t0);
      compressor.release.setValueAtTime(0.3, t0);
      compressor.connect(ctx.destination);

      // Aero Glass Master Filter (crisp, airy acoustic frequency response)
      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(800, t0);
      masterFilter.frequency.exponentialRampToValueAtTime(3600, t0 + 1.2);
      masterFilter.frequency.exponentialRampToValueAtTime(1600, t0 + 3.8);
      masterFilter.connect(compressor);

      // 1. Warm Ambient Glass-Strings Pad (C Major: C3, G3, E4, G4)
      const aeroPadNotes = [
        { freq: 130.81, detune: -4 }, // C3
        { freq: 196.00, detune: 3 },  // G3
        { freq: 329.63, detune: -2 }, // E4
        { freq: 392.00, detune: 4 },  // G4
      ];

      aeroPadNotes.forEach((pad) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pad.freq, t0);
        osc.detune.setValueAtTime(pad.detune, t0);

        // Gentle swell like the Windows 7 startup bloom
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(0.055, t0 + 0.8);
        gain.gain.setValueAtTime(0.055, t0 + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.6);

        osc.connect(gain);
        gain.connect(masterFilter);

        osc.start(t0);
        osc.stop(t0 + 3.7);
      });

      // 2. The Signature Windows 7 Four Chime Notes (G4 -> D5 -> B4 -> C5)
      const win7Chimes = [
        { time: 0.35, freq: 392.00, dur: 2.0, vol: 0.22, name: 'G4' },
        { time: 0.72, freq: 587.33, dur: 2.1, vol: 0.24, name: 'D5' },
        { time: 1.08, freq: 493.88, dur: 2.2, vol: 0.23, name: 'B4' },
        { time: 1.48, freq: 523.25, dur: 2.8, vol: 0.28, name: 'C5 (Resolve)' },
      ];

      win7Chimes.forEach((chime) => {
        const startTime = t0 + chime.time;

        // Primary Pure Crystal Bell (Sine wave)
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

        // Glassy Octave Overtone (+1 Octave, Glockenspiel/Aero Bell)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(chime.freq * 2, startTime);

        gain2.gain.setValueAtTime(0.0001, startTime);
        gain2.gain.linearRampToValueAtTime(chime.vol * 0.4, startTime + 0.025);
        gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + (chime.dur * 0.65));

        osc2.connect(gain2);
        gain2.connect(masterFilter);

        osc2.start(startTime);
        osc2.stop(startTime + chime.dur);

        // Shimmering 3rd Harmonic on the resolving C5 note
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

      // 3. Low Warm Foundation Bass (C2 = 65.41 Hz)
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

  // Alias for backward-compatibility redirecting to Windows 7 Professional sound
  playWindowsXPStartup() {
    this.playWindows7Startup();
  }

  playSend() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio playback failed silently
    }
  }

  playReceive() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio playback failed silently
    }
  }

  playCoin() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [987.77, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.1, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.18);
      });
    } catch {
      // Audio playback failed silently
    }
  }

  playRoleAlert() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(329.63, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(523.25, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio playback failed silently
    }
  }
}

export const sound = new SoundEffects();
