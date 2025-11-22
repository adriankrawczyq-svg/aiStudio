
import React, { useRef, useState, useEffect } from 'react';
import { CatMarker, GameState } from '../types';
import { Cat, AlertCircle } from 'lucide-react';

interface GameCanvasProps {
  imageBase64: string;
  cats: CatMarker[];
  onCatFound: (catId: string) => void;
  onMiss: () => void;
  gameState: GameState;
  activeHint: { x: number; y: number } | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ imageBase64, cats, onCatFound, onMiss, gameState, activeHint }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [clickFeedback, setClickFeedback] = useState<{ x: number; y: number; hit: boolean; label?: string } | null>(null);

  const isGameOver = gameState === GameState.WON || gameState === GameState.GAME_OVER;

  // Clear feedback after animation
  useEffect(() => {
    if (clickFeedback) {
      const timer = setTimeout(() => setClickFeedback(null), 600);
      return () => clearTimeout(timer);
    }
  }, [clickFeedback]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== GameState.PLAYING) return;
    if (!imgRef.current || !containerRef.current) return;

    const imgElement = imgRef.current;
    const rect = imgElement.getBoundingClientRect();
    
    // Determine the actual rendered size of the image within the element (handling object-fit: contain)
    // The natural ratio of the image vs the ratio of the container
    const naturalRatio = imgElement.naturalWidth / imgElement.naturalHeight;
    const displayRatio = rect.width / rect.height;

    let renderedWidth, renderedHeight, offsetX, offsetY;

    if (displayRatio > naturalRatio) {
      // Image is pillar-boxed (black/white bars on sides)
      renderedHeight = rect.height;
      renderedWidth = rect.height * naturalRatio;
      offsetX = (rect.width - renderedWidth) / 2;
      offsetY = 0;
    } else {
      // Image is letter-boxed (black/white bars on top/bottom)
      renderedWidth = rect.width;
      renderedHeight = rect.width / naturalRatio;
      offsetX = 0;
      offsetY = (rect.height - renderedHeight) / 2;
    }

    // Click coordinates relative to the element
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Check if click is outside the actual image area (in the whitespace)
    if (
      clientX < offsetX || 
      clientX > offsetX + renderedWidth || 
      clientY < offsetY || 
      clientY > offsetY + renderedHeight
    ) {
      return; // Ignore clicks outside image
    }

    // Normalize to 0-1000 scale based on the RENDERED image dimensions
    const normX = ((clientX - offsetX) / renderedWidth) * 1000;
    const normY = ((clientY - offsetY) / renderedHeight) * 1000;

    // Find ALL possible matches
    const matches = cats.filter(cat => {
      if (cat.found) return false;

      const { ymin, xmin, ymax, xmax } = cat.box;
      // INCREASED PADDING: Abstract shapes are fuzzy.
      // 7.5% tolerance on each side
      const padding = 75; 

      return (
        normX >= xmin - padding && 
        normX <= xmax + padding && 
        normY >= ymin - padding && 
        normY <= ymax + padding
      );
    });

    // Calculate feedback position in percentage relative to container
    const feedbackX = (clientX / rect.width) * 100;
    const feedbackY = (clientY / rect.height) * 100;

    if (matches.length > 0) {
      // If multiple overlaps, pick the one with the center closest to the click
      const closestCat = matches.sort((a, b) => {
        const distA = Math.hypot(a.x - normX, a.y - normY);
        const distB = Math.hypot(b.x - normX, b.y - normY);
        return distA - distB;
      })[0];

      onCatFound(closestCat.id);
      setClickFeedback({ x: feedbackX, y: feedbackY, hit: true });
    } else {
      // Missed
      onMiss();
      setClickFeedback({ x: feedbackX, y: feedbackY, hit: false, label: "-50" });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner bg-gray-100 group select-none"
      onClick={handleImageClick}
    >
      {/* Main Game Image */}
      <img 
        ref={imgRef}
        src={`data:image/png;base64,${imageBase64}`} 
        alt="Generated landscape with hidden cats" 
        className={`w-full h-full object-contain transition-opacity duration-500 ${gameState === GameState.PLAYING || gameState === GameState.WON ? 'opacity-100 game-cursor' : 'opacity-50'}`}
        draggable={false}
      />

      {/* --- MARKERS RENDER LOOP --- */}
      {cats.map(cat => {
        // 1. FOUND CATS (During game AND After game)
        if (cat.found) {
          return (
            <React.Fragment key={cat.id}>
              {/* Bouncing Icon */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 animate-bounce"
                style={{ top: `${cat.y / 10}%`, left: `${cat.x / 10}%` }}
              >
                <div className="bg-white p-1.5 rounded-full shadow-lg text-pink-500 border-2 border-pink-200">
                  <Cat size={20} fill="currentColor" />
                </div>
              </div>
              
              {/* Green Border (Only show on Game Over to confirm the hitbox) */}
              {isGameOver && (
                <div 
                  className="absolute border-2 border-green-400 rounded-lg opacity-60 pointer-events-none"
                  style={{
                    left: `${cat.box.xmin / 10}%`,
                    top: `${cat.box.ymin / 10}%`,
                    width: `${(cat.box.xmax - cat.box.xmin) / 10}%`,
                    height: `${(cat.box.ymax - cat.box.ymin) / 10}%`,
                  }}
                />
              )}
            </React.Fragment>
          );
        }

        // 2. MISSED CATS (Only shown when Game Over or Won)
        // Note: Even if we WON, there shouldn't be missed cats, but if there were logic errors or specific modes, this handles it.
        // Primarily used for GAME_OVER.
        if (isGameOver && !cat.found) {
           return (
             <div 
               key={cat.id}
               className="absolute border-4 border-dashed border-red-500 bg-red-400/30 rounded-lg z-10 pointer-events-none animate-pulse"
               style={{
                 left: `${cat.box.xmin / 10}%`,
                 top: `${cat.box.ymin / 10}%`,
                 width: `${(cat.box.xmax - cat.box.xmin) / 10}%`,
                 height: `${(cat.box.ymax - cat.box.ymin) / 10}%`,
               }}
             >
               {/* Label pointing to the missed cat */}
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md whitespace-nowrap flex items-center gap-1 z-20">
                  <AlertCircle size={12} /> Tu byłem!
               </div>
             </div>
           );
        }

        return null;
      })}

      {/* Active Hint Overlay */}
      {activeHint && (
        <div 
          className="absolute w-32 h-32 -ml-16 -mt-16 border-4 border-yellow-400 rounded-full opacity-80 animate-ping pointer-events-none z-20 shadow-[0_0_15px_rgba(250,204,21,0.8)]"
          style={{ 
            top: `${activeHint.y / 10}%`, 
            left: `${activeHint.x / 10}%` 
          }}
        />
      )}

      {/* Click Feedback Animation */}
      {clickFeedback && (
        <div 
          className={`absolute flex flex-col items-center justify-center pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2`}
          style={{ top: `${clickFeedback.y}%`, left: `${clickFeedback.x}%` }}
        >
          <div className={`w-12 h-12 rounded-full border-4 animate-ping ${clickFeedback.hit ? 'border-green-400' : 'border-red-400'}`} />
          
          {!clickFeedback.hit && (
            <span className="mt-2 text-red-500 font-bold text-lg animate-bounce shadow-white drop-shadow-md">
              {clickFeedback.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};