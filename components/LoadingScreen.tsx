import React from 'react';
import { GameState } from '../types';
import { Paintbrush, ScanEye } from 'lucide-react';

interface LoadingScreenProps {
  state: GameState;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ state }) => {
  if (state !== GameState.GENERATING_IMAGE && state !== GameState.ANALYZING_IMAGE) return null;

  return (
    <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 rounded-2xl">
      <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center text-center max-w-md w-full border-4 border-pink-200 animate-pulse">
        {state === GameState.GENERATING_IMAGE ? (
          <>
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 text-pink-500">
              <Paintbrush size={32} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Rysowanie Krajobrazu...</h2>
            <p className="text-gray-500">AI tworzy unikalny świat i ukrywa w nim koty.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-500">
              <ScanEye size={32} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Szukanie Kotów...</h2>
            <p className="text-gray-500">AI weryfikuje pozycje kotów, abyś mógł je znaleźć.</p>
          </>
        )}
      </div>
    </div>
  );
};