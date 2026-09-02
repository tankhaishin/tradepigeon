// GoodTrader 2.0 Web Audio Sound Generator (Duolingo Style)

class AudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  // Tactile Haptic Vibration Engine (Web Vibrate API)
  triggerHaptic(pattern = [10]) {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Haptics fallback gracefully
      }
    }
  }

  // Play crisp Duolingo-style Success Chime (Two-tone arpeggio) + Haptic Pulse
  playSuccess() {
    this.triggerHaptic([15, 30, 15]);
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      
      // Note 1: C5 (523.25Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: E5 (659.25Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.1);
      gain2.gain.setValueAtTime(0.2, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn('[AudioEngine] Web Audio Error:', e);
    }
  }

  // Play Level-Up Fanfare + Haptic Burst
  playLevelUp() {
    this.triggerHaptic([20, 40, 20, 40, 30]);
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + (idx * 0.08);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch (e) {
      console.warn('[AudioEngine] Level Up Audio Error:', e);
    }
  }

  // Play Mascot Click Pop + Light Haptic Tap
  playPop() {
    this.triggerHaptic(12);
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('[AudioEngine] Pop Audio Error:', e);
    }
  }
}

export const soundFx = new AudioEngine();
