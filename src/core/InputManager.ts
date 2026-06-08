/**
 * 输入管理器
 * 处理键盘输入，支持双人游戏
 */

import type { PlayerInput } from '@/types';

// 输入映射配置
const INPUT_MAP = {
  player1: {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    attack: ['Space', 'KeyZ'],
    defend: ['KeyS', 'ArrowDown'],
  },
  player2: {
    left: ['Numpad4', 'KeyJ'],
    right: ['Numpad6', 'KeyL'],
    up: ['Numpad8', 'KeyI'],
    down: ['Numpad5', 'KeyK'],
    attack: ['Numpad0', 'KeyU', 'Enter'],
    defend: ['Numpad5', 'KeyK', 'ArrowDown'],
  },
};

export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private keysPressed: Map<string, boolean> = new Map();
  private keysReleased: Map<string, boolean> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * 销毁输入管理器，清理事件监听
   */
  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keys.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
  }

  /**
   * 启用/禁用输入
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.keysPressed.clear();
      this.keysReleased.clear();
    }
  }

  /**
   * 处理按键按下
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    // 防止默认行为(如空格滚动页面)
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }

    const code = event.code;
    
    // 记录按键按下(用于检测单击)
    if (!this.keys.get(code)) {
      this.keysPressed.set(code, true);
    }
    
    this.keys.set(code, true);
  }

  /**
   * 处理按键释放
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    const code = event.code;
    
    this.keys.set(code, false);
    this.keysReleased.set(code, true);
  }

  /**
   * 检查按键是否按下
   */
  isKeyDown(code: string): boolean {
    return !!this.keys.get(code);
  }

  /**
   * 检查按键是否刚刚按下(单击检测)
   */
  isKeyPressed(code: string): boolean {
    return !!this.keysPressed.get(code);
  }

  /**
   * 检查按键是否刚刚释放
   */
  isKeyReleased(code: string): boolean {
    return !!this.keysReleased.get(code);
  }

  /**
   * 获取玩家的输入状态
   */
  getPlayerInput(playerId: 'player1' | 'player2'): PlayerInput {
    const map = INPUT_MAP[playerId];
    
    return {
      left: map.left.some(k => this.isKeyDown(k)),
      right: map.right.some(k => this.isKeyDown(k)),
      up: map.up.some(k => this.isKeyPressed(k)),
      down: map.down.some(k => this.isKeyDown(k)),
      attack: map.attack.some(k => this.isKeyPressed(k)),
      defend: map.defend.some(k => this.isKeyDown(k)),
    };
  }

  /**
   * 更新输入状态(每帧调用)
   * 清除按键按下/释放状态
   */
  update(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }
};

// 单例实例
let inputManagerInstance: InputManager | null = null;

export const createInputManager = (): InputManager => {
  if (inputManagerInstance) {
    inputManagerInstance.destroy();
  }
  inputManagerInstance = new InputManager();
  return inputManagerInstance;
};

export const getInputManager = (): InputManager | null => {
  return inputManagerInstance;
};

export const destroyInputManager = (): void => {
  if (inputManagerInstance) {
    inputManagerInstance.destroy();
    inputManagerInstance = null;
  }
};
