import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { GameLoop } from '@/core/GameLoop';
import { InputManager } from '@/core/InputManager';
import { PhysicsEngine } from '@/core/PhysicsEngine';
import { MechaRenderer } from '@/core/MechaRenderer';
import { CombatSystem } from '@/core/CombatSystem';
import { AudioManager } from '@/core/AudioManager';
import type { MechaData } from '@/types';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const physicsEngineRef = useRef<PhysicsEngine | null>(null);
  const mechaRendererRef = useRef<MechaRenderer | null>(null);
  const combatSystemRef = useRef<CombatSystem | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);

  const gameState = useGameStore((state) => state.gameState);
  const players = useGameStore((state) => state.players);
  const effects = useGameStore((state) => state.effects);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const updatePlayerState = useGameStore((state) => state.updatePlayerState);
  const updatePlayerFacing = useGameStore((state) => state.updatePlayerFacing);
  const updatePlayerGrounded = useGameStore((state) => state.updatePlayerGrounded);
  const updatePlayerDefending = useGameStore((state) => state.updatePlayerDefending);
  const dealDamage = useGameStore((state) => state.dealDamage);
  const updateEffects = useGameStore((state) => state.updateEffects);
  const tick = useGameStore((state) => state.tick);

  // 更新单个玩家的函数
  const updatePlayer = useCallback((
    player: MechaData,
    input: { left: boolean; right: boolean; up: boolean; down: boolean; attack: boolean; defend: boolean },
    playerId: string,
    opponent: MechaData | undefined
  ) => {
    // 处理移动
    if (input.left) {
      player.velocity.x = Math.max(player.velocity.x - 1, -player.speed);
      updatePlayerFacing(playerId, false);
    } else if (input.right) {
      player.velocity.x = Math.min(player.velocity.x + 1, player.speed);
      updatePlayerFacing(playerId, true);
    } else {
      player.velocity.x *= 0.85;
    }

    // 处理跳跃
    if (input.up && player.isGrounded) {
      player.velocity.y = -player.jumpForce;
      updatePlayerGrounded(playerId, false);
      updatePlayerState(playerId, 'JUMP');
      audioManagerRef.current?.playSound('jump');
    }

    // 处理攻击
    if (input.attack && player.attackCooldown <= 0 && opponent) {
      updatePlayerState(playerId, 'ATTACK');
      player.attackCooldown = 20;
      audioManagerRef.current?.playSound('attack');

      // 检测攻击命中
      if (combatSystemRef.current?.checkAttackCollision(player, opponent, 60)) {
        const targetId = playerId === 'player1' ? 'player2' : 'player1';
        dealDamage(targetId, player.attack);
        audioManagerRef.current?.playSound('hit');
      }
    }

    // 处理防御
    if (input.defend) {
      updatePlayerDefending(playerId, true);
      updatePlayerState(playerId, 'DEFEND');
    } else {
      updatePlayerDefending(playerId, false);
    }

    // 更新物理
    if (physicsEngineRef.current) {
      physicsEngineRef.current.updateMecha(player, 16.67);
    }

    // 更新动画
    if (player.attackCooldown > 0) {
      player.attackCooldown--;
    }

    // 更新位置
    updatePlayerPosition(playerId, player.position, player.velocity);
  }, [updatePlayerFacing, updatePlayerGrounded, updatePlayerState, updatePlayerDefending, dealDamage, updatePlayerPosition]);

  // 渲染函数
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mechaRendererRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 渲染背景
    mechaRendererRef.current.renderBackground(canvas.width, canvas.height);

    // 渲染玩家
    if (players.player1) {
      mechaRendererRef.current.render(players.player1, !players.player1.facingRight);
    }
    if (players.player2) {
      mechaRendererRef.current.render(players.player2, !players.player2.facingRight);
    }

    // 渲染特效
    effects.forEach(effect => {
      mechaRendererRef.current?.renderEffect(effect.position.x, effect.position.y, effect.type.toLowerCase() as 'hit' | 'spark' | 'explosion');
    });

    // 渲染UI
    renderUI(ctx, canvas);
  }, [players, effects]);

  // 渲染UI
  const renderUI = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // 渲染计时器
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = Math.floor(gameState.timeRemaining % 60);
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timeText, canvas.width / 2, 50);

    // 渲染游戏状态
    if (gameState.phase === 'RESULT') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';

      if (gameState.winner) {
        const winnerText = gameState.winner === 'player1' ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
        ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2);
      } else {
        ctx.fillText('DRAW!', canvas.width / 2, canvas.height / 2);
      }

      ctx.font = '24px monospace';
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 60);
    }

    // 渲染操作说明
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, canvas.height - 80, 200, 70);
    ctx.fillRect(canvas.width - 210, canvas.height - 80, 200, 70);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P1: WASD + J(Atk) K(Def)', 20, canvas.height - 60);
    ctx.fillText('P2: Arrows + 1(Atk) 2(Def)', canvas.width - 200, canvas.height - 60);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化各个系统
    inputManagerRef.current = new InputManager();
    physicsEngineRef.current = new PhysicsEngine();
    mechaRendererRef.current = new MechaRenderer(canvas.getContext('2d')!);
    combatSystemRef.current = new CombatSystem();
    audioManagerRef.current = new AudioManager();

    // 更新函数
    const update = (deltaTime: number) => {
      if (gameState.phase !== 'PLAYING') return;

      // 处理输入
      const p1Input = inputManagerRef.current?.getPlayerInput('player1');
      const p2Input = inputManagerRef.current?.getPlayerInput('player2');

      // 更新玩家1
      if (players.player1 && p1Input) {
        updatePlayer(players.player1, p1Input, 'player1', players.player2);
      }

      // 更新玩家2
      if (players.player2 && p2Input) {
        updatePlayer(players.player2, p2Input, 'player2', players.player1);
      }

      // 更新特效
      updateEffects(deltaTime);

      // 更新游戏时间
      tick(deltaTime);

      // 清理输入
      inputManagerRef.current?.update();
    };

    // 初始化游戏循环
    gameLoopRef.current = new GameLoop({
      update,
      render,
    });

    // 开始游戏
    gameLoopRef.current.start();
    audioManagerRef.current?.playBGM();

    return () => {
      gameLoopRef.current?.stop();
      inputManagerRef.current?.destroy();
      audioManagerRef.current?.stopBGM();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState, players, effects, updatePlayer, render, updateEffects, tick]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-gray-900"
      tabIndex={0}
    />
  );
}
