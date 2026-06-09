import type { MechaData } from '@/types';
import { GAME_CONSTANTS } from '@/types';

export class PhysicsEngine {
  private gravity: number = 0.8;
  private friction: number = 0.85;
  private groundY: number = 400;

  constructor() {}

  // 更新机甲物理
  updateMecha(mecha: MechaData, deltaTime: number): void {
    // 应用重力
    if (!mecha.isGrounded) {
      mecha.velocity.y += this.gravity;
    }

    // 应用摩擦力
    mecha.velocity.x *= this.friction;

    // 更新位置
    mecha.position.x += mecha.velocity.x;
    mecha.position.y += mecha.velocity.y;

    // 地面碰撞检测
    if (mecha.position.y >= this.groundY) {
      mecha.position.y = this.groundY;
      mecha.velocity.y = 0;
      if (!mecha.isGrounded) {
        mecha.isGrounded = true;
        mecha.state = 'IDLE';
      }
    }

    // 边界限制
    mecha.position.x = Math.max(50, Math.min(750, mecha.position.x));
  }

  // 设置地面高度
  setGroundY(y: number): void {
    this.groundY = y;
  }

  // 检查两个机甲是否碰撞
  checkCollision(mecha1: MechaData, mecha2: MechaData): boolean {
    const dx = mecha1.position.x - mecha2.position.x;
    const dy = mecha1.position.y - mecha2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 50; // 碰撞阈值
  }
}
