import type { MechaData, Vector2D, MechaType, ActionType } from '@/types';
import { MECHA_CONFIG, ANIMATION_CONFIG } from '@/types';

// 机甲部件定义
interface MechaPart {
  offset: Vector2D;
  size: Vector2D;
  color: string;
  detailColor: string;
}

// 动画帧配置
interface AnimationFrame {
  duration: number;
  parts: Map<string, MechaPart>;
  effects?: ParticleEffect[];
}

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
  private animationTimers: Map<string, number> = new Map();
  private particles: ParticleEffect[] = [];

  // 机甲配色方案
  private colorSchemes = {
    heavy: {
      primary: '#4A5568',
      secondary: '#2D3748',
      accent: '#E53E3E',
      highlight: '#718096'
    },
    speed: {
      primary: '#3182CE',
      secondary: '#2C5282',
      accent: '#38B2AC',
      highlight: '#63B3ED'
    },
    balanced: {
      primary: '#38A169',
      secondary: '#276749',
      accent: '#D69E2E',
      highlight: '#68D391'
    }
  };

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.setupPixelArtRendering();
  }

  // 设置像素艺术渲染模式
  private setupPixelArtRendering(): void {
    // 禁用图像平滑，保持像素风格
    this.ctx.imageSmoothingEnabled = false;
  }

  // 渲染机甲
  render(mecha: MechaData, isFlipped: boolean = false): void {
    const { position, mechaType, action, hp, maxHp } = mecha;
    const scheme = this.colorSchemes[mechaType];

    this.ctx.save();

    // 应用翻转（用于朝向对手）
    if (isFlipped) {
      this.ctx.scale(-1, 1);
    }

    // 根据动作状态渲染不同的机甲姿态
    switch (action) {
      case 'attack':
        this.renderAttackPose(position, scheme, mechaType);
        break;
      case 'defend':
        this.renderDefendPose(position, scheme, mechaType);
        break;
      case 'jump':
        this.renderJumpPose(position, scheme, mechaType);
        break;
      case 'hit':
        this.renderHitPose(position, scheme, mechaType);
        break;
      case 'idle':
      default:
        this.renderIdlePose(position, scheme, mechaType);
        break;
    }

    // 渲染血条
    this.renderHealthBar(position, hp, maxHp, scheme);

    this.ctx.restore();

    // 更新和渲染粒子效果
    this.updateAndRenderParticles();
  }

  // 渲染待机姿势
  private renderIdlePose(pos: Vector2D, scheme: any, type: MechaType): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体（核心）
    this.drawPixelRect(x, y - 40 * ps, 16 * ps, 20 * ps, scheme.primary);
    // 胸部细节
    this.drawPixelRect(x + 4 * ps, y - 36 * ps, 8 * ps, 8 * ps, scheme.secondary);
    // 核心发光
    this.drawPixelRect(x + 6 * ps, y - 34 * ps, 4 * ps, 4 * ps, scheme.accent);

    // 头部
    this.drawPixelRect(x + 2 * ps, y - 56 * ps, 12 * ps, 16 * ps, scheme.primary);
    // 眼睛/传感器
    this.drawPixelRect(x + 4 * ps, y - 50 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 肩膀
    this.drawPixelRect(x - 8 * ps, y - 44 * ps, 10 * ps, 12 * ps, scheme.secondary);
    this.drawPixelRect(x + 14 * ps, y - 44 * ps, 10 * ps, 12 * ps, scheme.secondary);

    // 手臂（待机姿势自然下垂）
    this.drawPixelRect(x - 6 * ps, y - 32 * ps, 6 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(x + 16 * ps, y - 32 * ps, 6 * ps, 20 * ps, scheme.primary);
    // 手部
    this.drawPixelRect(x - 8 * ps, y - 12 * ps, 10 * ps, 8 * ps, scheme.secondary);
    this.drawPixelRect(x + 14 * ps, y - 12 * ps, 10 * ps, 8 * ps, scheme.secondary);

    // 腿部
    this.drawPixelRect(x, y - 20 * ps, 8 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 8 * ps, y - 20 * ps, 8 * ps, 16 * ps, scheme.primary);
    // 膝盖关节
    this.drawPixelRect(x + 2 * ps, y - 10 * ps, 4 * ps, 4 * ps, scheme.secondary);
    this.drawPixelRect(x + 10 * ps, y - 10 * ps, 4 * ps, 4 * ps, scheme.secondary);

    // 脚部
    this.drawPixelRect(x - 2 * ps, y - 4 * ps, 12 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 6 * ps, y - 4 * ps, 12 * ps, 6 * ps, scheme.secondary);
  }

  // 渲染攻击姿势
  private renderAttackPose(pos: Vector2D, scheme: any, type: MechaType): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体倾斜
    this.ctx.save();
    this.ctx.translate(x + 8 * ps, y - 30 * ps);
    this.ctx.rotate(0.2);

    // 身体核心
    this.drawPixelRect(-8 * ps, -10 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(-4 * ps, -6 * ps, 8 * ps, 8 * ps, scheme.accent);

    this.ctx.restore();

    // 头部（跟随身体）
    this.drawPixelRect(x + 6 * ps, y - 56 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 8 * ps, y - 50 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 后臂（向后摆）
    this.drawPixelRect(x - 12 * ps, y - 40 * ps, 6 * ps, 16 * ps, scheme.secondary);

    // 攻击手臂（向前伸出）
    this.drawPixelRect(x + 20 * ps, y - 36 * ps, 24 * ps, 8 * ps, scheme.primary);
    // 武器/拳头
    this.drawPixelRect(x + 44 * ps, y - 40 * ps, 12 * ps, 16 * ps, scheme.accent);

    // 腿部（弓步姿势）
    // 后腿
    this.drawPixelRect(x, y - 20 * ps, 6 * ps, 12 * ps, scheme.primary);
    this.drawPixelRect(x - 4 * ps, y - 8 * ps, 10 * ps, 8 * ps, scheme.secondary);
    // 前腿
    this.drawPixelRect(x + 10 * ps, y - 24 * ps, 6 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 8 * ps, y - 8 * ps, 12 * ps, 8 * ps, scheme.secondary);

    // 攻击特效
    this.createAttackEffect(x + 50 * ps, y - 30 * ps, scheme.accent);
  }

  // 渲染防御姿势
  private renderDefendPose(pos: Vector2D, scheme: any, type: MechaType): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体（紧凑姿势）
    this.drawPixelRect(x + 2 * ps, y - 40 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(x + 6 * ps, y - 36 * ps, 8 * ps, 8 * ps, scheme.accent);

    // 头部
    this.drawPixelRect(x + 4 * ps, y - 56 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 6 * ps, y - 50 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 防御手臂（交叉在前）
    // 左臂
    this.drawPixelRect(x - 4 * ps, y - 36 * ps, 12 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 2 * ps, y - 32 * ps, 6 * ps, 12 * ps, scheme.primary);
    // 右臂
    this.drawPixelRect(x + 12 * ps, y - 36 * ps, 12 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 12 * ps, y - 32 * ps, 6 * ps, 12 * ps, scheme.primary);

    // 防御护盾效果
    this.drawPixelRect(x - 8 * ps, y - 48 * ps, 40 * ps, 48 * ps, scheme.accent + '40');
    this.drawPixelRect(x - 4 * ps, y - 44 * ps, 32 * ps, 40 * ps, scheme.accent + '60');

    // 腿部（稳固站立）
    this.drawPixelRect(x, y - 20 * ps, 8 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 12 * ps, y - 20 * ps, 8 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x - 2 * ps, y - 4 * ps, 12 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 10 * ps, y - 4 * ps, 12 * ps, 6 * ps, scheme.secondary);
  }

  // 渲染跳跃姿势
  private renderJumpPose(pos: Vector2D, scheme: any, type: MechaType): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体（倾斜向上）
    this.ctx.save();
    this.ctx.translate(x + 8 * ps, y - 30 * ps);
    this.ctx.rotate(-0.15);

    this.drawPixelRect(-8 * ps, -10 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(-4 * ps, -6 * ps, 8 * ps, 8 * ps, scheme.accent);

    this.ctx.restore();

    // 头部
    this.drawPixelRect(x + 6 * ps, y - 58 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 8 * ps, y - 52 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 手臂（向上摆动）
    this.drawPixelRect(x - 8 * ps, y - 48 * ps, 6 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 18 * ps, y - 48 * ps, 6 * ps, 16 * ps, scheme.primary);

    // 腿部（向后伸展）
    this.drawPixelRect(x + 2 * ps, y - 20 * ps, 6 * ps, 8 * ps, scheme.primary);
    this.drawPixelRect(x + 10 * ps, y - 20 * ps, 6 * ps, 8 * ps, scheme.primary);
    // 小腿向后
    this.drawPixelRect(x - 4 * ps, y - 16 * ps, 8 * ps, 6 * ps, scheme.secondary);
    this.drawPixelRect(x + 16 * ps, y - 16 * ps, 8 * ps, 6 * ps, scheme.secondary);

    // 喷射特效
    this.createJetEffect(x, y, scheme.accent);
  }

  // 渲染受击姿势
  private renderHitPose(pos: Vector2D, scheme: any, type: MechaType): void {
    const x = pos.x;
    const y = pos.y;
    const ps = this.pixelSize;

    // 身体（向后倾斜）
    this.ctx.save();
    this.ctx.translate(x + 8 * ps, y - 30 * ps);
    this.ctx.rotate(0.25);

    this.drawPixelRect(-8 * ps, -10 * ps, 16 * ps, 20 * ps, scheme.primary);
    this.drawPixelRect(-4 * ps, -6 * ps, 8 * ps, 8 * ps, scheme.accent);

    this.ctx.restore();

    // 头部（后仰）
    this.drawPixelRect(x + 4 * ps, y - 54 * ps, 12 * ps, 16 * ps, scheme.primary);
    this.drawPixelRect(x + 6 * ps, y - 48 * ps, 8 * ps, 4 * ps, scheme.accent);

    // 手臂（向后摆动）
    this.drawPixelRect(x - 10 * ps, y - 36 * ps, 6 * ps, 12 * ps, scheme.primary);
    this.drawPixelRect(x + 20 * ps, y - 36 * ps, 6 * ps, 12 * ps, scheme.primary);

    // 腿部（后退姿态）
    this.drawPixelRect(x - 4 * ps, y - 20 * ps, 8 * ps, 14 * ps, scheme.primary);
    this.drawPixelRect(x + 12 * ps, y - 20 * ps, 6 * ps, 14 * ps, scheme.primary);

    // 受击特效（闪烁）
    if (Math.floor(Date.now() / 50) % 2 === 0) {
      this.ctx.fillStyle = '#FFFFFF40';
      this.ctx.fillRect(x - 20 * ps, y - 60 * ps, 56 * ps, 64 * ps);
    }

    // 伤害数字
    this.renderDamageNumber(x + 10 * ps, y - 70 * ps, 'HIT!');
  }

  // 绘制像素矩形
  private drawPixelRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  // 渲染血条
  private renderHealthBar(pos: Vector2D, hp: number, maxHp: number, scheme: any): void {
    const x = pos.x;
    const y = pos.y - 70 * this.pixelSize;
    const width = 40 * this.pixelSize;
    const height = 4 * this.pixelSize;
    const ps = this.pixelSize;

    // 血条背景
    this.drawPixelRect(x, y, width, height, '#2D3748');

    // 血量
    const hpPercent = Math.max(0, hp / maxHp);
    const hpWidth = width * hpPercent;
    const hpColor = hpPercent > 0.5 ? scheme.accent : hpPercent > 0.25 ? '#D69E2E' : '#E53E3E';
    this.drawPixelRect(x, y, hpWidth, height, hpColor);

    // 血条边框
    this.drawPixelRect(x, y, width, ps, '#1A202C');
    this.drawPixelRect(x, y + height - ps, width, ps, '#1A202C');
    this.drawPixelRect(x, y, ps, height, '#1A202C');
    this.drawPixelRect(x + width - ps, y, ps, height, '#1A202C');
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

  // 渲染伤害数字
  private renderDamageNumber(x: number, y: number, text: string): void {
    this.ctx.fillStyle = '#E53E3E';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillText(text, x, y);
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

    // 绘制像素星星
    this.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % width;
      const y = (i * 89) % (height * 0.6);
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

    // 平台
    this.renderPlatform(width * 0.3, groundY - 100, 120, 20);
    this.renderPlatform(width * 0.6, groundY - 150, 100, 20);
  }

  // 渲染平台
  private renderPlatform(x: number, y: number, width: number, height: number): void {
    // 平台主体
    this.ctx.fillStyle = '#4A5568';
    this.ctx.fillRect(x, y, width, height);

    // 平台边框
    this.ctx.fillStyle = '#718096';
    this.ctx.fillRect(x, y, width, 4);
    this.ctx.fillRect(x, y, 4, height);
    this.ctx.fillRect(x + width - 4, y, 4, height);

    // 像素细节
    this.ctx.fillStyle = '#2D3748';
    for (let i = 8; i < width - 8; i += 12) {
      this.ctx.fillRect(x + i, y + 8, 4, 4);
    }
  }

  // 渲染特效
  renderEffect(x: number, y: number, effectType: 'hit' | 'spark' | 'explosion'): void {
    const ps = this.pixelSize;

    switch (effectType) {
      case 'hit':
        // 击中特效
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
        // 火花特效
        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 5; i++) {
          const px = x + (Math.random() - 0.5) * 16 * ps;
          const py = y + (Math.random() - 0.5) * 16 * ps;
          const size = (Math.random() * 3 + 1) * ps;
          this.ctx.fillRect(px, py, size, size);
        }
        break;

      case 'explosion':
        // 爆炸特效
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
