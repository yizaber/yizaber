// 游戏主循环
interface GameLoopCallbacks {
  update: (deltaTime: number) => void;
  render: () => void;
}

export class GameLoop {
  private callbacks: GameLoopCallbacks;
  private isRunning: boolean = false;
  private lastTimestamp: number = 0;
  private targetFPS: number = 60;
  private frameInterval: number = 1000 / 60;
  private accumulatedTime: number = 0;
  private maxDeltaTime: number = 100; // 防止卡顿导致的过大时间步

  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks;
  }

  // 开始游戏循环
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.accumulatedTime = 0;
    
    requestAnimationFrame(this.loop.bind(this));
  }

  // 停止游戏循环
  stop(): void {
    this.isRunning = false;
  }

  // 游戏循环
  private loop(timestamp: number): void {
    if (!this.isRunning) return;

    // 计算时间差
    let deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // 限制最大时间步，防止卡顿
    deltaTime = Math.min(deltaTime, this.maxDeltaTime);

    // 累计时间
    this.accumulatedTime += deltaTime;

    // 固定时间步长更新
    while (this.accumulatedTime >= this.frameInterval) {
      this.callbacks.update(this.frameInterval);
      this.accumulatedTime -= this.frameInterval;
    }

    // 渲染
    this.callbacks.render();

    // 下一帧
    requestAnimationFrame(this.loop.bind(this));
  }

  // 设置目标帧率
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }

  // 检查是否正在运行
  isActive(): boolean {
    return this.isRunning;
  }
}
