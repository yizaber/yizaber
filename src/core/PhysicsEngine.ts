/**
 * 物理引擎
 * 处理重力、摩擦力、碰撞检测等物理计算
 */

import type { MechaData, Vector2D, Rectangle } from '@/types';
import { GAME_CONSTANTS, MECHA_CONFIG } from '@/types';

// 平台定义
interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 碰撞信息
interface CollisionInfo {
  collided: boolean;
  normal: Vector2D;
  penetration: number;
}

export class PhysicsEngine {
  private gravity: number = GAME_CONSTANTS.GRAVITY;
  private friction: number = GAME_CONSTANTS.FRICTION;
  private platforms: Platform[] = [];
  private worldBounds: Rectangle = {
    x: 0,
    y: 0,
    width: GAME_CONSTANTS.WIDTH,
    height: GAME_CONSTANTS.HEIGHT,
  };

  constructor() {
    // 初始化默认平台(主战斗平台)
    this.platforms = [
      {
        x: 100,
        y: 450,
        width: 600,
        height: 30,
      },
    ];
  }

  /**
   * 设置世界边界
   */
  setWorldBounds(bounds: Rectangle): void {
    this.worldBounds = bounds;
  }

  /**
   * 添加平台
   */
  addPlatform(platform: Platform): void {
    this.platforms.push(platform);
  }

  /**
   * 清除所有平台
   */
  clearPlatforms(): void {
    this.platforms = [];
  }

  /**
   * 更新机甲物理状态
   */
  updateMecha(mecha: MechaData, deltaTime: number): void {
    // 应用重力
    if (!mecha.isGrounded) {
      mecha.velocity.y += this.gravity;
    }

    // 应用摩擦力
    mecha.velocity.x *= this.friction;

    // 限制最大速度
    const maxSpeed = GAME_CONSTANTS.MAX_SPEED;
    mecha.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, mecha.velocity.x));
    mecha.velocity.y = Math.max(-20, Math.min(20, mecha.velocity.y));

    // 更新位置
    mecha.position.x += mecha.velocity.x;
    mecha.position.y += mecha.velocity.y;

    // 碰撞检测与响应
    this.handleCollisions(mecha);

    // 检查是否掉出世界
    if (mecha.position.y > this.worldBounds.height + 100) {
      // 触发坠落处理
      mecha.health = Math.max(0, mecha.health - 30);
      mecha.position.y = -50;
      mecha.velocity.y = 0;
    }
  }

  /**
   * 处理碰撞检测和响应
   */
  private handleCollisions(mecha: MechaData): void {
    const config = MECHA_CONFIG[mecha.type];
    const mechaBounds: Rectangle = {
      x: mecha.position.x - config.width / 2,
      y: mecha.position.y - config.height,
      width: config.width,
      height: config.height,
    };

    mecha.isGrounded = false;

    // 与平台碰撞
    for (const platform of this.platforms) {
      const collision = this.checkRectangleCollision(mechaBounds, platform);
      
      if (collision.collided) {
        // 处理碰撞响应
        if (Math.abs(collision.normal.y) > 0.5) {
          // 垂直碰撞
          if (collision.normal.y < 0) {
            // 着陆
            mecha.position.y = platform.y;
            mecha.velocity.y = 0;
            mecha.isGrounded = true;
          } else {
            // 撞击天花板
            mecha.position.y = platform.y + platform.height + config.height;
            mecha.velocity.y = 0;
          }
        } else {
          // 水平碰撞
          if (collision.normal.x < 0) {
            mecha.position.x = platform.x - config.width / 2;
          } else {
            mecha.position.x = platform.x + platform.width + config.width / 2;
          }
          mecha.velocity.x = 0;
        }
      }
    }

    // 与世界边界碰撞
    const halfWidth = config.width / 2;
    if (mecha.position.x < halfWidth) {
      mecha.position.x = halfWidth;
      mecha.velocity.x = 0;
    } else if (mecha.position.x > this.worldBounds.width - halfWidth) {
      mecha.position.x = this.worldBounds.width - halfWidth;
      mecha.velocity.x = 0;
    }
  }

  /**
   * 矩形碰撞检测
   */
  private checkRectangleCollision(a: Rectangle, b: Rectangle): CollisionInfo {
    const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

    if (overlapX > 0 && overlapY > 0) {
      // 确定碰撞法线
      let normal: Vector2D = { x: 0, y: 0 };
      let penetration: number = 0;

      if (overlapX < overlapY) {
        // 水平碰撞
        normal.x = a.x < b.x ? -1 : 1;
        penetration = overlapX;
      } else {
        // 垂直碰撞
        normal.y = a.y < b.y ? -1 : 1;
        penetration = overlapY;
      }

      return { collided: true, normal, penetration };
    }

    return { collided: false, normal: { x: 0, y: 0 }, penetration: 0 };
  }

  /**
   * 检查两个机甲之间的碰撞(攻击判定)
   */
  checkMechaCollision(mecha1: MechaData, mecha2: MechaData): boolean {
    const config1 = MECHA_CONFIG[mecha1.type];
    const config2 = MECHA_CONFIG[mecha2.type];

    const bounds1: Rectangle = {
      x: mecha1.position.x - config1.width / 2,
      y: mecha1.position.y - config1.height,
      width: config1.width,
      height: config1.height,
    };

    const bounds2: Rectangle = {
      x: mecha2.position.x - config2.width / 2,
      y: mecha2.position.y - config2.height,
      width: config2.width,
      height: config2.height,
    };

    return this.checkRectangleCollision(bounds1, bounds2).collided;
  }

  /**
   * 计算攻击范围碰撞(攻击框判定)
   */
  checkAttackCollision(attacker: MechaData, target: MechaData, attackRange: number): boolean {
    const config = MECHA_CONFIG[attacker.type];
    
    // 攻击框中心位置(根据朝向)
    const attackCenterX = attacker.facingRight 
      ? attacker.position.x + config.width / 2 + attackRange / 2
      : attacker.position.x - config.width / 2 - attackRange / 2;
    
    const attackCenterY = attacker.position.y - config.height / 2;
    
    // 目标中心
    const targetConfig = MECHA_CONFIG[target.type];
    const targetCenterX = target.position.x;
    const targetCenterY = target.position.y - targetConfig.height / 2;
    
    // 计算距离
    const dx = attackCenterX - targetCenterX;
    const dy = attackCenterY - targetCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 检查是否在攻击范围内
    return distance < (attackRange + targetConfig.width) / 2;
  }
}
