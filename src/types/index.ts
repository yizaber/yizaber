// 基础类型
export interface Vector2D {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 游戏状态
export type GamePhase = 'MENU' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'RESULT';

export interface GameState {
  phase: GamePhase;
  round: number;
  maxRounds: number;
  timeRemaining: number;
  winner: string | null;
}

// 机甲类型
export type MechaType = 'BLUE' | 'RED';
export type MechaState = 'IDLE' | 'WALK' | 'JUMP' | 'ATTACK' | 'DEFEND' | 'HIT' | 'DEAD';

export interface MechaData {
  id: string;
  type: MechaType;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  jumpForce: number;
  position: Vector2D;
  velocity: Vector2D;
  state: MechaState;
  facingRight: boolean;
  isGrounded: boolean;
  isDefending: boolean;
  attackCooldown: number;
  animationTimer: number;
  animationFrame: number;
  score: number;
}

// 输入类型
export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
  defend: boolean;
}

// 动画类型
export interface Animation {
  name: string;
  frames: number;
  frameDuration: number;
  loop: boolean;
}

// 特效类型
export type EffectType = 'HIT' | 'ATTACK' | 'DEFEND' | 'JUMP' | 'LAND' | 'SPAWN';

export interface Effect {
  id: string;
  type: EffectType;
  position: Vector2D;
  duration: number;
  timer: number;
  frame: number;
}

// 音频类型
export type SoundType = 'ATTACK' | 'HIT' | 'DEFEND' | 'JUMP' | 'LAND' | 'WIN' | 'UI';

// 常量
export const GAME_CONSTANTS = {
  WIDTH: 800,
  HEIGHT: 600,
  FPS: 60,
  GRAVITY: 0.8,
  FRICTION: 0.85,
  MAX_SPEED: 8,
  ROUND_TIME: 99,
} as const;

export const MECHA_CONFIG = {
  BLUE: {
    name: '蓝焰机甲',
    maxHealth: 100,
    attack: 10,
    defense: 5,
    speed: 5,
    jumpForce: 15,
    color: '#00d4ff',
    width: 48,
    height: 64,
  },
  RED: {
    name: '赤钢机甲',
    maxHealth: 120,
    attack: 12,
    defense: 8,
    speed: 4,
    jumpForce: 13,
    color: '#ff3366',
    width: 52,
    height: 64,
  },
} as const;

export const ANIMATION_CONFIG: Record<string, Animation> = {
  IDLE: { name: 'idle', frames: 8, frameDuration: 100, loop: true },
  WALK: { name: 'walk', frames: 8, frameDuration: 80, loop: true },
  JUMP: { name: 'jump', frames: 4, frameDuration: 100, loop: false },
  ATTACK: { name: 'attack', frames: 6, frameDuration: 60, loop: false },
  DEFEND: { name: 'defend', frames: 4, frameDuration: 100, loop: true },
  HIT: { name: 'hit', frames: 4, frameDuration: 80, loop: false },
  DEAD: { name: 'dead', frames: 8, frameDuration: 100, loop: false },
} as const;

// 攻击结果
export interface AttackResult {
  success: boolean;
  damage: number;
  effects: Array<{
    type: string;
    position: Vector2D;
    duration: number;
  }>;
}
