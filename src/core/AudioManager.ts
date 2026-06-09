// 音频管理器
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;
  private bgmOscillators: OscillatorNode[] = [];

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

  // 播放音效
  playSound(name: 'attack' | 'hit' | 'defend' | 'jump' | 'land' | 'win' | 'lose'): void {
    if (this.isMuted || !this.audioContext) return;

    const frequencies: Record<string, number> = {
      attack: 440,
      hit: 220,
      defend: 880,
      jump: 330,
      land: 110,
      win: 660,
      lose: 165
    };

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = frequencies[name] || 440;
    gain.gain.value = this.volume * 0.3;

    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  // 播放背景音乐
  playBGM(): void {
    if (!this.audioContext || this.bgmOscillators.length > 0) return;

    // 简单的背景音乐节拍
    const notes = [220, 261, 329, 392]; // Am7和弦
    
    notes.forEach((freq, index) => {
      setTimeout(() => {
        if (this.isMuted || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.value = this.volume * 0.1;

        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);

        this.bgmOscillators.push(osc);
      }, index * 500);
    });

    // 循环播放
    setTimeout(() => {
      this.bgmOscillators = [];
      if (!this.isMuted) {
        this.playBGM();
      }
    }, 2000);
  }

  // 停止背景音乐
  stopBGM(): void {
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
