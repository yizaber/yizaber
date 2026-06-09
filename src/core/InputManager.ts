// 输入状态
interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
  defend: boolean;
}

// 按键映射
const KEY_MAP: Record<string, { playerId: string; action: keyof InputState }> = {
  // 玩家1 - WASD
  'KeyA': { playerId: 'player1', action: 'left' },
  'KeyD': { playerId: 'player1', action: 'right' },
  'KeyW': { playerId: 'player1', action: 'up' },
  'KeyS': { playerId: 'player1', action: 'down' },
  'KeyJ': { playerId: 'player1', action: 'attack' },
  'KeyK': { playerId: 'player1', action: 'defend' },
  
  // 玩家2 - 方向键
  'ArrowLeft': { playerId: 'player2', action: 'left' },
  'ArrowRight': { playerId: 'player2', action: 'right' },
  'ArrowUp': { playerId: 'player2', action: 'up' },
  'ArrowDown': { playerId: 'player2', action: 'down' },
  'Numpad1': { playerId: 'player2', action: 'attack' },
  'Digit1': { playerId: 'player2', action: 'attack' },
  'Numpad2': { playerId: 'player2', action: 'defend' },
  'Digit2': { playerId: 'player2', action: 'defend' },
};

export class InputManager {
  private inputs: Map<string, InputState> = new Map();
  private pressedKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  private justReleasedKeys: Set<string> = new Set();

  constructor() {
    // 初始化玩家输入状态
    this.inputs.set('player1', this.createDefaultInputState());
    this.inputs.set('player2', this.createDefaultInputState());

    // 绑定事件
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private createDefaultInputState(): InputState {
    return {
      left: false,
      right: false,
      up: false,
      down: false,
      attack: false,
      defend: false,
    };
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.code;
    
    if (!this.pressedKeys.has(key)) {
      this.pressedKeys.add(key);
      this.justPressedKeys.add(key);
      
      // 更新玩家输入状态
      const mapping = KEY_MAP[key];
      if (mapping) {
        const playerInput = this.inputs.get(mapping.playerId);
        if (playerInput) {
          playerInput[mapping.action] = true;
        }
      }
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.code;
    
    this.pressedKeys.delete(key);
    this.justReleasedKeys.add(key);
    
    // 更新玩家输入状态
    const mapping = KEY_MAP[key];
    if (mapping) {
      const playerInput = this.inputs.get(mapping.playerId);
      if (playerInput) {
        playerInput[mapping.action] = false;
      }
    }
  }

  // 获取玩家输入状态
  getPlayerInput(playerId: string): InputState | undefined {
    return this.inputs.get(playerId);
  }

  // 检查按键是否按下
  isKeyDown(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  // 检查按键是否刚被按下（只在按下的一帧返回true）
  isKeyJustPressed(key: string): boolean {
    return this.justPressedKeys.has(key);
  }

  // 检查按键是否刚被释放（只在释放的一帧返回true）
  isKeyJustReleased(key: string): boolean {
    return this.justReleasedKeys.has(key);
  }

  // 更新输入状态（每帧调用）
  update(): void {
    // 清空刚按下和刚释放的按键集合
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
  }

  // 销毁（清理事件监听）
  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
