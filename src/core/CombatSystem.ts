import type { MechaData, Vector2D } from '@/types';

// 战斗系统
export class CombatSystem {
  private attackBoxes: Map<string, { x: number; y: number; width: number; height: number }> = new Map();

  // 设置攻击判定框
  setAttackBox(playerId: string, box: { x: number; y: number; width: number; height: number } | null): void {
    if (box) {
      this.attackBoxes.set(playerId, box);
    } else {
      this.attackBoxes.delete(playerId);
    }
  }

  // 检测攻击碰撞
  checkAttackCollision(attacker: MechaData, target: MechaData, attackRange: number): boolean {
    // 简单的距离检测
    const dx = attacker.position.x - target.position.x;
    const dy = attacker.position.y - target.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 检查攻击范围
    if (distance > attackRange) return false;

    // 检查朝向（攻击者必须面向目标）
    const isTargetToRight = target.position.x > attacker.position.x;
    if (attacker.facingRight !== isTargetToRight) return false;

    return true;
  }

  // 计算伤害
  calculateDamage(attacker: MechaData, target: MechaData): number {
    let damage = attacker.attack;

    // 防御减免
    if (target.isDefending) {
      damage = Math.floor(damage * 0.5);
    }

    // 随机波动
    damage = Math.floor(damage * (0.9 + Math.random() * 0.2));

    return Math.max(1, damage);
  }

  // 清除所有攻击判定框
  clear(): void {
    this.attackBoxes.clear();
  }
}
