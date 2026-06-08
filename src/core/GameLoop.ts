/**
 * 游戏主循环
 * 管理游戏的更新和渲染循环
 */

export interface GameLoopCallbacks {
  update: (deltaTime: number) => void;
  render: () => void;
}

export class GameLoop {
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private accumulator: number = 0;
  private readonly timeStep: number = 1000 / 60; // 60 FPS
  private animationFrameId: number | null = null;

  constructor(private callbacks: GameLoopCallbacks) {}

  /**
   * 启动游戏循环
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    
    this.loop(this.lastTime);
  }

  /**
   * 停止游戏循环
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 检查游戏循环是否正在运行
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 游戏循环主函数
   */
  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    // 计算时间差
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 防止时间差过大(如标签页切换后返回)
    if (deltaTime > 1000) {
      deltaTime = this.timeStep;
    }

    // 累积时间
    this.accumulator += deltaTime;

    // 固定时间步长更新
    while (this.accumulator >= this.timeStep) {
      this.callbacks.update(this.timeStep);
      this.accumulator -= this.timeStep;
    }

    // 渲染
    this.callbacks.render();

    // 继续下一帧
    this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
  }
}

// 单例实例
let gameLoopInstance: GameLoop | null = null;

export const createGameLoop = (callbacks: GameLoopCallbacks): GameLoop => {
  if (gameLoopInstance) {
    gameLoopInstance.stop();
  }
  gameLoopInstance = new GameLoop(callbacks);
  return gameLoopInstance;
};

export const getGameLoop = (): GameLoop | null => {
  return gameLoopInstance;
};

export const destroyGameLoop = (): void => {
  if (gameLoopInstance) {
    gameLoopInstance.stop();
    gameLoopInstance = null;
  }
};
