import { create } from 'zustand';
import { produce } from 'immer';
import type {
  GameState,
  MechaData,
  MechaType,
  GamePhase,
  Effect,
  Vector2D,
} from '@/types';
import { GAME_CONSTANTS, MECHA_CONFIG } from '@/types';

// 创建初始机甲数据
const createInitialMecha = (id: string, type: MechaType, x: number): MechaData => {
  const config = MECHA_CONFIG[type];
  return {
    id,
    type,
    name: config.name,
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    attack: config.attack,
    defense: config.defense,
    speed: config.speed,
    jumpForce: config.jumpForce,
    position: { x, y: 400 },
    velocity: { x: 0, y: 0 },
    state: 'IDLE',
    facingRight: type === 'RED',
    isGrounded: false,
    isDefending: false,
    attackCooldown: 0,
    animationTimer: 0,
    animationFrame: 0,
    score: 0,
  };
};

// 初始游戏状态
const initialGameState: GameState = {
  phase: 'MENU',
  round: 1,
  maxRounds: 3,
  timeRemaining: GAME_CONSTANTS.ROUND_TIME,
  winner: null,
};

// 游戏Store接口
interface GameStore {
  // 状态
  gameState: GameState;
  players: Record<string, MechaData>;
  effects: Effect[];
  
  // 游戏流程控制
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (winner: string) => void;
  resetGame: () => void;
  nextRound: () => void;
  
  // 玩家操作
  updatePlayerPosition: (playerId: string, position: Vector2D, velocity: Vector2D) => void;
  updatePlayerState: (playerId: string, state: MechaData['state']) => void;
  updatePlayerFacing: (playerId: string, facingRight: boolean) => void;
  updatePlayerGrounded: (playerId: string, isGrounded: boolean) => void;
  updatePlayerDefending: (playerId: string, isDefending: boolean) => void;
  setPlayerAttackCooldown: (playerId: string, cooldown: number) => void;
  dealDamage: (targetId: string, damage: number, attackerId?: string) => void;
  
  // 动画
  updateAnimation: (playerId: string, deltaTime: number) => void;
  setAnimationFrame: (playerId: string, frame: number) => void;
  
  // 特效
  addEffect: (effect: Omit<Effect, 'id' | 'timer'>) => string;
  updateEffects: (deltaTime: number) => void;
  removeEffect: (effectId: string) => void;
  clearEffects: () => void;
  
  // 游戏时间
  tick: (deltaTime: number) => void;
}

// 创建Game Store
export const useGameStore = create<GameStore>((set, get) => ({
  // 初始状态
  gameState: initialGameState,
  players: {
    player1: createInitialMecha('player1', 'BLUE', 200),
    player2: createInitialMecha('player2', 'RED', 550),
  },
  effects: [],
  
  // 游戏流程控制
  startGame: () => set(produce(state => {
    state.gameState.phase = 'PLAYING';
    state.gameState.timeRemaining = GAME_CONSTANTS.ROUND_TIME;
    state.gameState.winner = null;
  })),
  
  pauseGame: () => set(produce(state => {
    if (state.gameState.phase === 'PLAYING') {
      state.gameState.phase = 'PAUSED';
    }
  })),
  
  resumeGame: () => set(produce(state => {
    if (state.gameState.phase === 'PAUSED') {
      state.gameState.phase = 'PLAYING';
    }
  })),
  
  endGame: (winner: string) => set(produce(state => {
    state.gameState.phase = 'RESULT';
    state.gameState.winner = winner;
    state.players[winner].score += 1;
  })),
  
  resetGame: () => set(produce(state => {
    state.gameState = initialGameState;
    state.players = {
      player1: createInitialMecha('player1', 'BLUE', 200),
      player2: createInitialMecha('player2', 'RED', 550),
    };
    state.effects = [];
  })),
  
  nextRound: () => set(produce(state => {
    state.gameState.round += 1;
    state.gameState.timeRemaining = GAME_CONSTANTS.ROUND_TIME;
    state.gameState.phase = 'PLAYING';
    state.gameState.winner = null;
    
    // 重置玩家位置和状态
    Object.keys(state.players).forEach(playerId => {
      const player = state.players[playerId];
      player.health = player.maxHealth;
      player.position = playerId === 'player1' ? { x: 200, y: 400 } : { x: 550, y: 400 };
      player.velocity = { x: 0, y: 0 };
      player.state = 'IDLE';
      player.isDefending = false;
      player.isGrounded = false;
      player.attackCooldown = 0;
    });
    
    state.effects = [];
  })),
  
  // 玩家操作
  updatePlayerPosition: (playerId: string, position: Vector2D, velocity: Vector2D) => set(produce(state => {
    state.players[playerId].position = position;
    state.players[playerId].velocity = velocity;
  })),
  
  updatePlayerState: (playerId: string, mechaState: MechaData['state']) => set(produce(state => {
    state.players[playerId].state = mechaState;
  })),
  
  updatePlayerFacing: (playerId: string, facingRight: boolean) => set(produce(state => {
    state.players[playerId].facingRight = facingRight;
  })),
  
  updatePlayerGrounded: (playerId: string, isGrounded: boolean) => set(produce(state => {
    state.players[playerId].isGrounded = isGrounded;
  })),
  
  updatePlayerDefending: (playerId: string, isDefending: boolean) => set(produce(state => {
    state.players[playerId].isDefending = isDefending;
  })),
  
  setPlayerAttackCooldown: (playerId: string, cooldown: number) => set(produce(state => {
    state.players[playerId].attackCooldown = cooldown;
  })),
  
  dealDamage: (targetId: string, damage: number) => set(produce(state => {
    const target = state.players[targetId];
    const actualDamage = target.isDefending ? Math.floor(damage * 0.5) : damage;
    target.health = Math.max(0, target.health - actualDamage);
    
    // 添加受击特效
    state.effects.push({
      id: `hit-${Date.now()}`,
      type: 'HIT',
      position: { ...target.position },
      duration: 300,
      timer: 0,
      frame: 0,
    });
    
    // 检查游戏结束
    if (target.health === 0) {
      const winnerId = targetId === 'player1' ? 'player2' : 'player1';
      state.gameState.phase = 'RESULT';
      state.gameState.winner = winnerId;
      state.players[winnerId].score += 1;
    }
  })),
  
  // 动画
  updateAnimation: (playerId: string, deltaTime: number) => set(produce(state => {
    const player = state.players[playerId];
    player.animationTimer += deltaTime;
  })),
  
  setAnimationFrame: (playerId: string, frame: number) => set(produce(state => {
    state.players[playerId].animationFrame = frame;
  })),
  
  // 特效
  addEffect: (effect) => {
    const id = `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set(produce(state => {
      state.effects.push({
        ...effect,
        id,
        timer: 0,
      });
    }));
    return id;
  },
  
  updateEffects: (deltaTime: number) => set(produce(state => {
    state.effects = state.effects.filter(effect => {
      effect.timer += deltaTime;
      return effect.timer < effect.duration;
    });
  })),
  
  removeEffect: (effectId: string) => set(produce(state => {
    state.effects = state.effects.filter(e => e.id !== effectId);
  })),
  
  clearEffects: () => set(produce(state => {
    state.effects = [];
  })),
  
  // 游戏时间
  tick: (deltaTime: number) => set(produce(state => {
    if (state.gameState.phase === 'PLAYING') {
      state.gameState.timeRemaining = Math.max(0, state.gameState.timeRemaining - deltaTime / 1000);
      
      // 时间到，判定胜负
      if (state.gameState.timeRemaining === 0) {
        const p1Health = state.players.player1.health;
        const p2Health = state.players.player2.health;
        
        if (p1Health > p2Health) {
          state.gameState.winner = 'player1';
          state.players.player1.score += 1;
        } else if (p2Health > p1Health) {
          state.gameState.winner = 'player2';
          state.players.player2.score += 1;
        }
        // 平局不加分
        
        state.gameState.phase = 'RESULT';
      }
    }
  })),
}));
