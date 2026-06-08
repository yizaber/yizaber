// 音频管理器
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private bgmOscillators: OscillatorNode[] = [];
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    this.initAudioContext();
  }

  // 初始化音频上下文
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // 生成音效
  private createTone(frequency: number, duration: number, type: OscillatorType = 'square'): AudioBuffer | null {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // 添加包络
      const envelope = Math.max(0, 1 - t / duration);
      
      let sample = 0;
      switch (type) {
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
        case 'sine':
        default:
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
      }
      
      data[i] = sample * envelope * 0.3;
    }

    return buffer;
  }

  // 播放音效
  playSound(name: 'attack' | 'hit' | 'defend' | 'jump' | 'land' | 'win' | 'lose'): void {
    if (this.isMuted || !this.audioContext) return;

    const soundConfig: Record<string, { freq: number; duration: number; type: OscillatorType }> = {
      attack: { freq: 440, duration: 0.15, type: 'square' },
      hit: { freq: 220, duration: 0.1, type: 'sawtooth' },
      defend: { freq: 880, duration: 0.2, type: 'sine' },
      jump: { freq: 330, duration: 0.15, type: 'triangle' },
      land: { freq: 110, duration: 0.1, type: 'square' },
      win: { freq: 660, duration: 0.5, type: 'square' },
      lose: { freq: 165, duration: 0.5, type: 'sawtooth' }
    };

    const config = soundConfig[name];
    if (!config) return;

    const buffer = this.createTone(config.freq, config.duration, config.type);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  // 播放背景音乐
  playBGM(): void {
    if (!this.audioContext || this.bgmOscillators.length > 0) return;

    // 创建简单的8-bit风格背景音乐
    const baseFreq = 110; // A2
    const notes = [0, 4, 7, 12, 7, 4, 0, -5]; // 简单的和弦进行

    notes.forEach((interval, index) => {
      setTimeout(() => {
        if (this.isMuted || this.bgmOscillators.length === 0) return;

        const freq = baseFreq * Math.pow(2, interval / 12);
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = this.volume * 0.1;

        osc.connect(gain);
        gain.connect(this.audioContext!.destination);
        osc.start();

        this.bgmOscillators.push(osc);

        // 1秒后停止这个音符
        setTimeout(() => {
          osc.stop();
          const index = this.bgmOscillators.indexOf(osc);
          if (index > -1) {
            this.bgmOscillators.splice(index, 1);
          }
        }, 1000);
      }, index * 500);
    });

    // 循环播放
    setTimeout(() => {
      if (!this.isMuted) {
        this.playBGM();
      }
    }, notes.length * 500 + 1000);
  }

  // 停止背景音乐
  stopBGM(): void {
    this.bgmOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // 忽略已停止的oscillator
      }
    });
    this.bgmOscillators = [];
  }

  // 设置音量
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // 静音/取消静音
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    }
    return this.isMuted;
  }

  // 恢复音频上下文（在用户交互后调用）
  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
