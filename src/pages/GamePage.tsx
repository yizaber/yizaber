import { GameCanvas } from '@/components/GameCanvas';
import { useGameStore } from '@/stores/gameStore';
import { useEffect } from 'react';

export function GamePage() {
  const gameState = useGameStore((state) => state.gameState);
  const startGame = useGameStore((state) => state.startGame);

  useEffect(() => {
    // 自动开始游戏
    if (gameState.phase === 'MENU') {
      startGame();
    }
  }, [gameState.phase, startGame]);

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden">
      <GameCanvas />
    </div>
  );
}
