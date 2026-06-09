import type { MechaData, Vector2D } from '@/types';

// 粒子效果
interface ParticleEffect {
  position: Vector2D;
  velocity: Vector2D;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// 机甲渲染器
export class MechaRenderer {
  private ctx: CanvasRenderingContext2D;
  private pixelSize: number = 4;
  private particles: ParticleEffect[] = [];

  // 机甲配色方案
  private colorSchemes: Record<string, { primary: string; secondary: string; accent: string; highlight: string }> = {
    BLUE: {
      primary: '#3182CE',
      secondary: '#2C5282',
      accent: '#63B3ED',
      highlight: '#90CDF4'
    },
    RED: {
      primary: '#E53E3E',
      secondary: '#C53030',
      accent: '#FC8181',
      highlight: '#FEB2B2'
    }
  };

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.setupPixelArtRendering();
  }

  // 设置像素艺术渲染模式
  private setupPixelArtRendering(): void {
    this.ctx.imageSmoothingEnabled = false;
  }

  // 渲染机甲
  render(mecha: MechaData, isFlipped: boolean = false): void {
    const { position, type, state } = mecha;
    const scheme = this.colorSchemes[type] || this.colorSchemes.BLUE;

    this.ctx.save();

    if (isFlipped) {
      this.ctx.scale(-1, 1);
    }

    // 根据状态渲染不同姿态
    switch (state) {
      case 'ATTACK':
        this.renderAttackPose(position, scheme);
        break;
      case 'DEFEND':
        this.renderDefendPose(position, scheme);
        break;
      case 'JUMP':
        this.renderJumpPose(position, scheme);
        break;
      case 'HIT':
        this.renderHitPose(position, scheme);
        break;
      case 'WALK':
      case 'IDLE':
      default:
        this.renderIdlePose(position, scheme);
        break;
    }

    this.ctx.restore();

    // 更新和渲染粒子效果
    this.updateAndRenderParticles();
  }

  // 渲染待机姿势
  private renderIdlePose(pos: Vector2D, scheme: { primary: string; secondary: string; accent: string }): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体（核心）
    this.drawPixelRect(x, y - 40 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(x + 4 * ps, y - 36 * ps, 8 * ps, 8 * ps, scheme.secondary);
    this.drawPixelRect(x + 6 * ps, y - 34 * ps, 4 * ps, 4 * ps, scheme.accent);

    // 头部
    this.drawPixelRect(x + 2 * ps, y - 56 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 4 * ps, y - 50 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 肩膀
    this.drawPixelRect(x - 8 * ps, y - 44 * ps, 10 * ps, 12 * ps, scheme.secondary);
    this.drawPixelRect(x + 14 * ps, y - 44 * ps, 10 * ps, 12 * ps, scheme.secondary);

    // 手臂
    this.drawPixelRect(x - 6 * ps, y - 32 * ps, 6 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(x + 16 * ps, y - 32 * ps, 6 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(x - 8 * ps, y - 12 * ps, 10 * ps, 8 * ps, scheme.secondary);
    this.drawPixelRect(x + 14 * ps, y - 12 * ps, 10 * ps, 8 * ps, scheme.secondary);

    // 腿部
    this.drawPixelRect(x, y - 20 * ps, 8 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 8 * ps, y - 20 * ps, 8 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 2 * ps, y - 10 * ps, 4 * ps, 4 * ps, scheme.secondary);
    this.drawPixelRect(x + 10 * ps, y - 10 * ps, 4 * ps, 4 * ps, scheme.secondary);

    // 脚部
    this.drawPixelRect(x - 2 * ps, y - 4 * ps, 12 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 6 * ps, y - 4 * ps, 12 * ps, 6 * ps, scheme.secondary);
  }

  // 渲染攻击姿势
  private renderAttackPose(pos: Vector2D, scheme: { primary: string; secondary: string; accent: string }): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体
    this.ctx.save();
    this.ctx.translate(x + 8 * ps, y - 30 * ps);
    this.ctx.rotate(0.2);
    this.drawPixelRect(-8 * ps, -10 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(-4 * ps, -6 * ps, 8 * ps, 8 * ps, scheme.accent);
    this.ctx.restore();

    // 头部
    this.drawPixelRect(x + 6 * ps, y - 56 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 8 * ps, y - 50 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 后臂
    this.drawPixelRect(x - 12 * ps, y - 40 * ps, 6 * ps, 16 * ps, scheme.secondary);

    // 攻击手臂
    this.drawPixelRect(x + 20 * ps, y - 36 * ps, 24 * ps, 8 * ps, scheme.primary);
    this.drawPixelRect(x + 44 * ps, y - 40 * ps, 12 * ps, 16 * ps, scheme.accent);

    // 腿部
    this.drawPixelRect(x, y - 20 * ps, 6 * ps, 12 * ps, scheme.primary);
    this.drawPixelRect(x - 4 * ps, y - 8 * ps, 10 * ps, 8 * ps, scheme.secondary);
    this.drawPixelRect(x + 10 * ps, y - 24 * ps, 6 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 8 * ps, y - 8 * ps, 12 * ps, 8 * ps, scheme.secondary);

    // 攻击特效
    this.createAttackEffect(x + 50 * ps, y - 30 * ps, scheme.accent);
  }

  // 渲染防御姿势
  private renderDefendPose(pos: Vector2D, scheme: { primary: string; secondary: string; accent: string }): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体
    this.drawPixelRect(x + 2 * ps, y - 40 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(x + 6 * ps, y - 36 * ps, 8 * ps, 8 * ps, scheme.accent);

    // 头部
    this.drawPixelRect(x + 4 * ps, y - 56 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 6 * ps, y - 50 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 防御手臂
    this.drawPixelRect(x - 4 * ps, y - 36 * ps, 12 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 2 * ps, y - 32 * ps, 6 * ps, 12 * ps, scheme.primary);
    this.drawPixelRect(x + 12 * ps, y - 36 * ps, 12 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 12 * ps, y - 32 * ps, 6 * ps, 12 * ps, scheme.primary);

    // 防御护盾
    this.drawPixelRect(x - 8 * ps, y - 48 * ps, 40 * ps, 48 * ps, scheme.accent + '40');
    this.drawPixelRect(x - 4 * ps, y - 44 * ps, 32 * ps, 40 * ps, scheme.accent + '60');

    // 腿部
    this.drawPixelRect(x, y - 20 * ps, 8 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 12 * ps, y - 20 * ps, 8 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x - 2 * ps, y - 4 * ps, 12 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 10 * ps, y - 4 * ps, 12 * ps, 6 * ps, scheme.secondary);
  }

  // 渲染跳跃姿势
  private renderJumpPose(pos: Vector2D, scheme: { primary: string; secondary: string; accent: string }): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体
    this.ctx.save();
    this.ctx.translate(x + 8 * ps, y - 30 * ps);
    this.ctx.rotate(-0.15);
    this.drawPixelRect(-8 * ps, -10 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(-4 * ps, -6 * ps, 8 * ps, 8 * ps, scheme.accent);
    this.ctx.restore();

    // 头部
    this.drawPixelRect(x + 6 * ps, y - 58 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 8 * ps, y - 52 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 手臂
    this.drawPixelRect(x - 8 * ps, y - 48 * ps, 6 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 18 * ps, y - 48 * ps, 6 * ps, 16 * ps, scheme.primary);

    // 腿部
    this.drawPixelRect(x + 2 * ps, y - 20 * ps, 6 * ps, 8 * ps, scheme.primary);
    this.drawPixelRect(x + 10 * ps, y - 20 * ps, 6 * ps, 8 * ps, scheme.primary);
    this.drawPixelRect(x - 4 * ps, y - 16 * ps, 8 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 16 * ps, y - 16 * ps, 8 * ps, 6 * ps, scheme.secondary);

    // 喷射特效
    this.createJetEffect(x, y, scheme.accent);
  }

  // 渲染受击姿势
  private renderHitPose(pos: Vector2D, scheme: { primary: string; secondary: string; accent: string }): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体
    this.ctx.save();
    this.ctx.translate(x + 8 * ps, y - 30 * ps);
    this.ctx.rotate(0.25);
    this.drawPixelRect(-8 * ps, -10 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(-4 * ps, -6 * ps, 8 * ps, 8 * ps, scheme.accent);
    this.ctx.restore();

    // 头部
    this.drawPixelRect(x + 4 * ps, y - 54 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 6 * ps, y - 48 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 手臂
    this.drawPixelRect(x - 10 * ps, y - 36 * ps, 6 * ps, 12 * ps, scheme.primary);
    this.drawPixelRect(x + 20 * ps, y - 36 * ps, 6 * ps, 12 * ps, scheme.primary);

    // 腿部
    this.drawPixelRect(x - 4 * ps, y - 20 * ps, 8 * ps, 14 * ps, scheme.primary);
    this.drawPixelRect(x + 12 * ps, y - 20 * ps, 6 * ps, 14 * ps, scheme.primary);

    // 受击闪烁
    if (Math.floor(Date.now() / 50) % 2 === 0) {
      this.ctx.fillStyle = '#FFFFFF40';
      this.ctx.fillRect(x - 20 * ps, y - 60 * ps, 56 * ps, 64 * ps);
    }
  }

  // 绘制像素矩形
  private drawPixelRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  // 渲染背景场景
  renderBackground(width: number, height: number): void {
    // 天空渐变
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1A202C');
    gradient.addColorStop(0.5, '#2D3748');
    gradient.addColorStop(1, '#4A5568');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    // 像素星星
    this.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % width;
      const y = (i * 89) % Math.floor(height * 0.6);
      const size = ((i % 3) + 1) * 2;
      this.ctx.fillRect(x, y, size, size);
    }

    // 地面
    const groundY = height * 0.75;
    this.ctx.fillStyle = '#2D3748';
    this.ctx.fillRect(0, groundY, width, height - groundY);

    // 地面像素细节
    this.ctx.fillStyle = '#4A5568';
    for (let i = 0; i < width; i += 20) {
      const h = (i % 3) * 4;
      this.ctx.fillRect(i, groundY, 8, h);
    }
  }

  // 创建攻击特效
  private createAttackEffect(x: number, y: number, color: string): void {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        position: { x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20 },
        velocity: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
        life: 10,
        maxLife: 10,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  }

  // 创建喷射特效
  private createJetEffect(x: number, y: number, color: string): void {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        position: { x: x + (Math.random() - 0.5) * 20, y: y },
        velocity: { x: (Math.random() - 0.5) * 2, y: 3 + Math.random() * 2 },
        life: 15,
        maxLife: 15,
        color: color,
        size: Math.random() * 3 + 2
      });
    }
  }

  // 更新和渲染粒子
  private updateAndRenderParticles(): void {
    this.particles = this.particles.filter(p => {
      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.life--;

      if (p.life > 0) {
        const alpha = p.life / p.maxLife;
        this.ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        this.ctx.fillRect(
          Math.round(p.position.x),
          Math.round(p.position.y),
          Math.round(p.size),
          Math.round(p.size)
        );
        return true;
      }
      return false;
    });
  }

  // 渲染特效
  renderEffect(x: number, y: number, effectType: 'hit' | 'spark' | 'explosion'): void {
    const ps = this.pixelSize;

    switch (effectType) {
      case 'hit':
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const dist = 10 * ps;
          const px = x + Math.cos(angle) * dist;
          const py = y + Math.sin(angle) * dist;
          this.ctx.fillRect(px - 2 * ps, py - 2 * ps, 4 * ps, 4 * ps);
        }
        break;

      case 'spark':
        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 5; i++) {
          const px = x + (Math.random() - 0.5) * 16 * ps;
          const py = y + (Math.random() - 0.5) * 16 * ps;
          const size = (Math.random() * 3 + 1) * ps;
          this.ctx.fillRect(px, py, size, size);
        }
        break;

      case 'explosion':
        const colors = ['#FF6B35', '#F7931E', '#FFD23F', '#FFFFFF'];
        for (let ring = 0; ring < 4; ring++) {
          this.ctx.fillStyle = colors[ring];
          const size = (16 - ring * 3) * ps;
          this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
        break;
    }
  }

  // 设置像素大小
  setPixelSize(size: number): void {
    this.pixelSize = size;
  }
}
