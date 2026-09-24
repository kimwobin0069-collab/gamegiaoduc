/**
 * Web Audio Synthesizer - Tạo hiệu ứng âm thanh gameshow chuyên nghiệp không cần file ngoài
 */
class GameshowAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, gainLevel = 0.15) {
    if (!this.enabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Tiếng tíc tắc đồng hồ bình thường
  playTick() {
    this.playTone(800, 'triangle', 0.05, 0.1);
  }

  // Tiếng tíc tắc dồn dập (5 giây cuối)
  playUrgentTick() {
    this.playTone(1200, 'square', 0.08, 0.2);
  }

  // Tiếng hết giờ (Buzzer)
  playTimeUp() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  // Tiếng khóa / chốt đáp án kịch tính (Ai là triệu phú)
  playLock() {
    if (!this.enabled) return;
    this.init();
    const freqs = [220, 330, 440];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.4, 0.15), i * 120);
    });
  }

  // Tiếng trả lời đúng (Hân hoan, vinh danh)
  playCorrect() {
    if (!this.enabled) return;
    this.init();
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chord.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.5, 0.18), i * 80);
    });
  }

  // Tiếng trả lời sai
  playWrong() {
    if (!this.enabled) return;
    this.init();
    const chord = [260, 240, 220];
    chord.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.3, 0.2), i * 150);
    });
  }

  // Tiếng quay nón kỳ diệu (Clicking liên tục)
  playWheelClick() {
    this.playTone(600 + Math.random() * 200, 'triangle', 0.03, 0.08);
  }

  // Tiếng chuông giành quyền trả lời (Buzzer Keng)
  playBellBuzzer() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  // Khúc nhạc chiến thắng cuối trận
  playFanfare() {
    if (!this.enabled) return;
    const notes = [
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.4 },
      { f: 783.99, d: 0.3 },
      { f: 1046.50, d: 0.8 }
    ];
    let time = 0;
    notes.forEach(n => {
      setTimeout(() => this.playTone(n.f, 'triangle', n.d, 0.25), time * 1000);
      time += n.d * 0.9;
    });
  }
}

window.gameshowAudio = new GameshowAudio();
