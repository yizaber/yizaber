import type { MechaData, GameState, Vector2D } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { GameLoop } from './GameLoop';
import { InputManager } from './InputManager';
import { PhysicsEngine } from './PhysicsEngine';
import { MechaRenderer } from './MechaRenderer';
import { CombatSystem } from './CombatSystem';
import { AudioManager } from './AudioManager';

// 游戏场景类
export class GameScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameLoop: GameLoop;
  private inputManager: InputManager;
  private physicsEngine: PhysicsEngine;
  private mechaRenderer: MechaRenderer;
  private combatSystem: CombatSystem;
  private audioManager: AudioManager;

  private gameStore: ReturnType<typeof useGameStore>;
  private player1Id: string = 'player1';
  private player2Id: string = 'player2';

  private lastTime: number = 0;
  private frameCount: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    // 初始化游戏存储
    this.gameStore = useGameStore;

    // 初始化各个系统
    this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));
    this.inputManager = new InputManager();
    this.physicsEngine = new PhysicsEngine();
    this.mechaRenderer = new MechaRenderer(this.ctx);
    this.combatSystem = new CombatSystem();
    this.audioManager = new AudioManager();

    // 设置画布尺寸
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // 初始化游戏
    this.initGame();
  }

  // 调整画布尺寸
  private resize(): void {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    } else {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  // 初始化游戏
  private initGame(): void {
    // 初始化玩家1机甲（重型）
    const player1 = this.gameStore.getState().mechas.get(this.player1Id);
    if (player1) {
      player1.position = { x: this.canvas.width * 0.3, y: this.canvas.height * 0.7 };
      player1.mechaType = 'heavy';
      player1.hp = MECHA_CONFIG.heavy.maxHp;
      player1.maxHp = MECHA_CONFIG.heavy.maxHp;
      player1.energy = MECHA_CONFIG.heavy.maxEnergy;
      player1.maxEnergy = MECHA_CONFIG.heavy.maxEnergy;
    }

    // 初始化玩家2机甲（速度型）
    const player2 = this.gameStore.getState().mechas.get(this.player2Id);
    if (player2) {
      player2.position = { x: this.canvas.width * 0.7, y: this.canvas.height * 0.7 };
      player2.mechaType = 'speed';
      player2.hp = MECHA_CONFIG.speed.maxHp;
      player2.maxHp = MECHA_CONFIG.speed.maxHp;
      player2.energy = MECHA_CONFIG.speed.maxEnergy;
      player2.maxEnergy = MECHA_CONFIG.speed.maxEnergy;
    }
  }

  // 游戏更新逻辑
  private update(deltaTime: number): void {
    const store = this.gameStore.getState();

    // 更新游戏时间
    store.updateGameTime(deltaTime);

    // 处理输入
    this.handleInput();

    // 更新物理
    this.updatePhysics(deltaTime);

    // 更新战斗
    this.updateCombat();

    // 更新特效
    this.updateEffects(deltaTime);

    // 检查游戏结束条件
    this.checkGameOver();
  }

  // 处理输入
  private handleInput(): void {
    const store = this.gameStore.getState();

    // 玩家1输入（WASD + 攻击键）
    const p1Input = {
      left: this.inputManager.isKeyDown('a'),
      right: this.inputManager.isKeyDown('d'),
      up: this.inputManager.isKeyDown('w'),
      down: this.inputManager.isKeyDown('s'),
      attack: this.inputManager.isKeyPressed('j'),
      defend: this.inputManager.isKeyDown('k'),
      special: this.inputManager.isKeyPressed('l')
    };

    // 玩家2输入（方向键 + 数字键）
    const p2Input = {
      left: this.inputManager.isKeyDown('arrowleft'),
      right: this.inputManager.isKeyDown('arrowright'),
      up: this.inputManager.isKeyDown('arrowup'),
      down: this.inputManager.isKeyDown('arrowdown'),
      attack: this.inputManager.isKeyPressed('1'),
      defend: this.inputManager.isKeyDown('2'),
      special: this.inputManager.isKeyPressed('3')
    };

    // 更新玩家操作
    store.setPlayerInput(this.player1Id, p1Input);
    store.setPlayerInput(this.player2Id, p2Input);

    // 处理音频恢复（用户交互后）
    if (p1Input.attack || p1Input.special || p2Input.attack || p2Input.special) {
      this.audioManager.resume();
    }
  }

  // 更新物理
  private updatePhysics(deltaTime: number): void {
    const store = this.gameStore.getState();

    // 更新两个玩家的物理
    [this.player1Id, this.player2Id].forEach(playerId => {
      const mecha = store.mechas.get(playerId);
      const input = store.playerInputs.get(playerId);

      if (!mecha || !input) return;

      // 应用移动
      if (input.left) {
        mecha.velocity.x = Math.max(mecha.velocity.x - 1, -MECHA_CONFIG[mecha.mechaType].speed);
        mecha.facingRight = false;
      } else if (input.right) {
        mecha.velocity.x = Math.min(mecha.velocity.x + 1, MECHA_CONFIG[mecha.mechaType].speed);
        mecha.facingRight = true;
      } else {
        // 摩擦力
        mecha.velocity.x *= 0.8;
      }

      // 跳跃
      if (input.up && mecha.isGrounded) {
        mecha.velocity.y = -MECHA_CONFIG[mecha.mechaType].jumpPower;
        mecha.isGrounded = false;
        mecha.action = 'jump';
        this.audioManager.playSound('jump');
      }

      // 应用重力
      mecha.velocity.y += GAME_CONSTANTS.GRAVITY;

      // 更新位置
      mecha.position.x += mecha.velocity.x * deltaTime * 0.06;
      mecha.position.y += mecha.velocity.y * deltaTime * 0.06;

      // 地面碰撞
      const groundY = this.canvas.height * 0.75;
      if (mecha.position.y > groundY) {
        mecha.position.y = groundY;
        mecha.velocity.y = 0;
        if (!mecha.isGrounded) {
          mecha.isGrounded = true;
          mecha.action = 'idle';
          this.audioManager.playSound('land');
        }
      }

      // 世界边界
      mecha.position.x = Math.max(50, Math.min(this.canvas.width - 50, mecha.position.x));

      // 能量恢复
      mecha.energy = Math.min(mecha.maxEnergy, mecha.energy + 0.1);
    });
  }

  // 更新战斗
  private updateCombat(): void {
    const store = this.gameStore.getState();

    // 处理玩家1的攻击
    this.processPlayerAttack(this.player1Id, this.player2Id);

    // 处理玩家2的攻击
    this.processPlayerAttack(this.player2Id, this.player1Id);

    // 更新攻击状态
    this.combatSystem.updateAttackStates();
  }

  // 处理玩家攻击
  private processPlayerAttack(attackerId: string, targetId: string): void {
    const store = this.gameStore.getState();
    const attacker = store.mechas.get(attackerId);
    const target = store.mechas.get(targetId);
    const input = store.playerInputs.get(attackerId);

    if (!attacker || !target || !input) return;

    // 检查是否正在攻击
    const attackState = this.combatSystem.getAttackState(attackerId);
    if (attackState?.isAttacking) return;

    // 处理防御
    if (input.defend) {
      attacker.action = 'defend';
      return;
    }

    // 处理攻击
    let attackType: 'light' | 'heavy' | 'special' | null = null;
    if (input.attack) {
      attackType = 'light';
    } else if (input.special && attacker.energy >= 30) {
      attackType = 'special';
      attacker.energy -= 30;
    }

    if (attackType) {
      const result = this.combatSystem.initiateAttack(attacker, attackType);
      if (result.success) {
        attacker.action = 'attack';
        this.audioManager.playSound('attack');

        // 添加特效
        result.effects.forEach(effect => {
          store.addEffect({
            id: `effect_${Date.now()}_${Math.random()}`,
            type: effect.type,
            position: effect.position,
            duration: effect.duration,
            startTime: Date.now()
          });
        });

        // 检测命中
        const hitResult = this.checkAttackHit(attacker, target, attackType);
        if (hitResult) {
          this.applyDamage(targetId, hitResult.damage, hitResult.effects);
          this.audioManager.playSound('hit');
        }
      }
    }
  }

  // 检测攻击命中
  private checkAttackHit(attacker: MechaData, target: MechaData, attackType: string): { damage: number; effects: any[] } | null {
    // 简化的距离检测
    const distance = Math.abs(attacker.position.x - target.position.x);
    const attackRange = attackType === 'special' ? 100 : attackType === 'heavy' ? 70 : 50;

    if (distance > attackRange) return null;

    // 检查目标是否在防御状态
    const isDefending = target.action === 'defend';
    const baseDamage = attackType === 'special' ? 25 : attackType === 'heavy' ? 15 : 8;
    const damage = isDefending ? Math.floor(baseDamage * 0.3) : baseDamage;

    return {
      damage,
      effects: [{
        type: isDefending ? 'spark' : 'hit',
        position: { x: target.position.x, y: target.position.y - 30 },
        duration: 200
      }]
    };
  }

  // 应用伤害
  private applyDamage(targetId: string, damage: number, effects: any[]): void {
    const store = this.gameStore.getState();
    store.applyDamage(targetId, damage);

    // 添加特效
    effects.forEach(effect => {
      store.addEffect({
        id: `effect_${Date.now()}_${Math.random()}`,
        type: effect.type,
        position: effect.position,
        duration: effect.duration,
        startTime: Date.now()
      });
    });
  }

  // 更新特效
  private updateEffects(deltaTime: number): void {
    const store = this.gameStore.getState();
    const now = Date.now();
    const effects = store.effects;

    // 移除过期的特效
    effects.forEach(effect => {
      if (now - effect.startTime > effect.duration) {
        store.removeEffect(effect.id);
      }
    });
  }

  // 渲染
  private render(): void {
    const store = this.gameStore.getState();
    const state = store.gameState;

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染背景
    this.mechaRenderer.renderBackground(this.canvas.width, this.canvas.height);

    // 获取两个玩家
    const player1 = store.mechas.get(this.player1Id);
    const player2 = store.mechas.get(this.player2Id);

    if (player1 && player2) {
      // 根据位置决定渲染顺序（实现简单的深度排序）
      if (player1.position.y <= player2.position.y) {
        this.mechaRenderer.render(player1, !player1.facingRight);
        this.mechaRenderer.render(player2, !player2.facingRight);
      } else {
        this.mechaRenderer.render(player2, !player2.facingRight);
        this.mechaRenderer.render(player1, !player1.facingRight);
      }
    }

    // 渲染特效
    this.renderEffects();

    // 渲染UI
    this.renderUI();
  }

  // 渲染特效
  private renderEffects(): void {
    const store = this.gameStore.getState();
    const effects = store.effects;

    effects.forEach(effect => {
      this.mechaRenderer.renderEffect(effect.position.x, effect.position.y, effect.type);
    });
  }

  // 渲染UI
  private renderUI(): void {
    const store = this.gameStore.getState();
    const state = store.gameState;

    // 渲染计时器
    const minutes = Math.floor(state.remainingTime / 60000);
    const seconds = Math.floor((state.remainingTime % 60000) / 1000);
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(timeText, this.canvas.width / 2, 50);

    // 渲染游戏状态
    if (state.phase === 'finished') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 48px monospace';
      this.ctx.textAlign = 'center';

      if (state.winner) {
        const winnerText = state.winner === this.player1Id ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
        this.ctx.fillText(winnerText, this.canvas.width / 2, this.canvas.height / 2);
      } else {
        this.ctx.fillText('DRAW!', this.canvas.width / 2, this.canvas.height / 2);
      }

      this.ctx.font = '24px monospace';
      this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);

      // 检查重新开始
      if (this.inputManager.isKeyPressed('r')) {
        this.restart();
      }
    }

    // 渲染操作说明
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, this.canvas.height - 80, 200, 70);
    this.ctx.fillRect(this.canvas.width - 210, this.canvas.height - 80, 200, 70);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('P1: WASD + J(Atk) K(Def) L(Spc)', 20, this.canvas.height - 60);
    this.ctx.textAlign = 'right';
    this.ctx.fillText('P2: Arrows + 1(Atk) 2(Def) 3(Spc)', this.canvas.width - 20, this.canvas.height - 60);
  }

  // 检查游戏结束
  private checkGameOver(): void {
    const store = this.gameStore.getState();
    const state = store.gameState;

    if (state.phase === 'finished') return;

    const player1 = store.mechas.get(this.player1Id);
    const player2 = store.mechas.get(this.player2Id);

    if (!player1 || !player2) return;

    // 检查是否有玩家血量归零
    if (player1.hp <= 0 || player2.hp <= 0) {
      let winner: string | null = null;
      if (player1.hp > 0) winner = this.player1Id;
      else if (player2.hp > 0) winner = this.player2Id;

      store.endGame(winner);

      if (winner === this.player1Id) {
        this.audioManager.playSound('win');
      } else {
        this.audioManager.playSound('lose');
      }
    }

    // 检查时间是否耗尽
    if (state.remainingTime <= 0) {
      let winner: string | null = null;
      if (player1.hp > player2.hp) winner = this.player1Id;
      else if (player2.hp > player1.hp) winner = this.player2Id;

      store.endGame(winner);
    }
  }

  // 重新开始游戏
  private restart(): void {
    const store = this.gameStore.getState();
    store.resetGame();
    this.initGame();
    this.combatSystem.clear();
  }

  // 开始游戏
  start(): void {
    this.audioManager.resume();
    this.audioManager.playBGM();
    this.gameLoop.start();
  }

  // 停止游戏
  stop(): void {
    this.gameLoop.stop();
    this.audioManager.stopBGM();
  }

  // 销毁
  destroy(): void {
    this.stop();
    this.inputManager.destroy();
    window.removeEventListener('resize', () => this.resize());
  }
}
