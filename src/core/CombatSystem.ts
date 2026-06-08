import type { MechaData, Vector2D, AttackResult, EffectType } from '@/types';
import { GAME_CONSTANTS, MECHA_CONFIG } from '@/types';

// 攻击判定框
interface Hitbox {
  position: Vector2D;
  size: Vector2D;
  damage: number;
  knockback: Vector2D;
  attackerId: string;
}

// 攻击配置
interface AttackConfig {
  hitbox: Vector2D;
  hitboxOffset: Vector2D;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
}

// 攻击配置表
const ATTACK_CONFIGS: Record<string, AttackConfig> = {
  light: {
    hitbox: { x: 40, y: 30 },
    hitboxOffset: { x: 20, y: -30 },
    damage: 8,
    knockbackX: 100,
    knockbackY: -50,
    startupFrames: 4,
    activeFrames: 3,
    recoveryFrames: 8
  },
  heavy: {
    hitbox: { x: 50, y: 40 },
    hitboxOffset: { x: 25, y: -35 },
    damage: 15,
    knockbackX: 200,
    knockbackY: -100,
    startupFrames: 8,
    activeFrames: 5,
    recoveryFrames: 15
  },
  special: {
    hitbox: { x: 60, y: 50 },
    hitboxOffset: { x: 30, y: -40 },
    damage: 25,
    knockbackX: 300,
    knockbackY: -150,
    startupFrames: 12,
    activeFrames: 8,
    recoveryFrames: 20
  }
};

// 战斗系统
export class CombatSystem {
  private hitboxes: Hitbox[] = [];
  private attackStates: Map<string, {
    config: AttackConfig;
    currentFrame: number;
    phase: 'startup' | 'active' | 'recovery';
    hasHit: boolean;
  }> = new Map();

  // 发起攻击
  initiateAttack(attacker: MechaData, attackType: 'light' | 'heavy' | 'special'): AttackResult {
    const config = ATTACK_CONFIGS[attackType];
    const attackId = attacker.id + '_' + Date.now();

    // 检查能量（对于重攻击和特殊攻击）
    if (attackType !== 'light' && attacker.energy < 20) {
      return {
        success: false,
        damage: 0,
        effects: []
      };
    }

    // 设置攻击状态
    this.attackStates.set(attackId, {
      config,
      currentFrame: 0,
      phase: 'startup',
      hasHit: false
    });

    return {
      success: true,
      damage: config.damage,
      effects: [{
        type: attackType === 'special' ? 'explosion' : 'spark',
        position: { x: attacker.position.x + 30, y: attacker.position.y - 30 },
        duration: config.activeFrames * 16
      }]
    };
  }

  // 更新攻击状态（每帧调用）
  updateAttackStates(): Hitbox[] {
    const activeHitboxes: Hitbox[] = [];

    this.attackStates.forEach((state, id) => {
      state.currentFrame++;
      const config = state.config;

      // 更新阶段
      if (state.phase === 'startup' && state.currentFrame >= config.startupFrames) {
        state.phase = 'active';
        state.currentFrame = 0;
      } else if (state.phase === 'active' && state.currentFrame >= config.activeFrames) {
        state.phase = 'recovery';
        state.currentFrame = 0;
      } else if (state.phase === 'recovery' && state.currentFrame >= config.recoveryFrames) {
        // 攻击结束
        this.attackStates.delete(id);
        return;
      }

      // 在active阶段生成hitbox
      if (state.phase === 'active' && !state.hasHit) {
        const attackerId = id.split('_')[0];
        // 注意：这里需要传入攻击者的位置信息，简化处理
        activeHitboxes.push({
          position: { x: 0, y: 0 }, // 需要实际位置
          size: config.hitbox,
          damage: config.damage,
          knockback: { x: config.knockbackX, y: config.knockbackY },
          attackerId
        });
      }
    });

    return activeHitboxes;
  }

  // 检测攻击命中
  checkHit(hitbox: Hitbox, target: MechaData, attackerFacingRight: boolean): AttackResult | null {
    // 检查目标是否在防御状态
    const isDefending = target.action === 'defend';

    // 简单的AABB碰撞检测
    const hitboxLeft = attackerFacingRight ?
      hitbox.position.x : hitbox.position.x - hitbox.size.x;
    const hitboxRight = attackerFacingRight ?
      hitbox.position.x + hitbox.size.x : hitbox.position.x;
    const hitboxTop = hitbox.position.y - hitbox.size.y / 2;
    const hitboxBottom = hitbox.position.y + hitbox.size.y / 2;

    const targetLeft = target.position.x - 20;
    const targetRight = target.position.x + 20;
    const targetTop = target.position.y - 60;
    const targetBottom = target.position.y;

    const isHit = !(hitboxRight < targetLeft || hitboxLeft > targetRight ||
                   hitboxBottom < targetTop || hitboxTop > targetBottom);

    if (!isHit) return null;

    // 计算伤害
    let damage = hitbox.damage;
    if (isDefending) {
      damage = Math.floor(damage * 0.3); // 防御减少70%伤害
    }

    // 计算击退
    const knockback = {
      x: attackerFacingRight ? hitbox.knockback.x : -hitbox.knockback.x,
      y: hitbox.knockback.y
    };

    return {
      success: true,
      damage,
      effects: [{
        type: isDefending ? 'spark' : 'hit',
        position: {
          x: target.position.x,
          y: target.position.y - 30
        },
        duration: 200
      }]
    };
  }

  // 获取攻击状态（用于外部查询）
  getAttackState(attackerId: string): { isAttacking: boolean; canCancel: boolean } | null {
    for (const [id, state] of this.attackStates) {
      if (id.startsWith(attackerId)) {
        return {
          isAttacking: true,
          canCancel: state.phase === 'recovery'
        };
      }
    }
    return null;
  }

  // 清除所有攻击状态
  clear(): void {
    this.hitboxes = [];
    this.attackStates.clear();
    this.particles = [];
  }
}
