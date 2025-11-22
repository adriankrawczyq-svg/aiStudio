import React, { useState, useCallback, useEffect } from 'react';
import { generateCatLandscape, detectCatsInImage } from './services/geminiService';
import { GameState, CatMarker, Difficulty, ArtStyle, LeaderboardEntry } from './types';
import { GameCanvas } from './components/GameCanvas';
import { LoadingScreen } from './components/LoadingScreen';
import { PaymentModal } from './components/PaymentModal';
import { Leaderboard } from './components/Leaderboard';
import { PromoModal } from './components/PromoModal';
import { Cat, Trophy, AlertCircle, Clock, Star, Lightbulb, TimerOff, Youtube, Palette, CreditCard, BarChart2, Eye, ArrowLeft, Lock, Heart, Sparkles, ExternalLink, Coffee } from 'lucide-react';

const DIFFICULTY_CONFIG = {
  EASY: { cats: 7, time: 90, hints: 3, label: 'Łatwy', pointsPerCat: 100 },
  MEDIUM: { cats: 10, time: 120, hints: 2, label: 'Średni', pointsPerCat: 200 },
  HARD: { cats: 12, time: 180, hints: 1, label: 'Ekspert', pointsPerCat: 300 },
};

const STYLE_OPTIONS: { id: ArtStyle; label: string; icon: string }[] = [
  { id: 'MINECRAFT', label: 'Minecraft (Voxel)', icon: '🧱' },
  { id: 'CARTOON', label: 'Gumball / Cartoon', icon: '🎨' },
  { id: 'IMPRESSIONISM', label: 'Impresjonizm', icon: '🖌️' },
  { id: 'REALISTIC', label: 'Realistyczny', icon: '📷' },
  { id: 'SKETCH', label: 'Szkic Ołówkiem', icon: '✏️' },
  { id: 'ABSTRACT', label: 'Abstrakcja', icon: '🌀' },
];

const MAX_FREE_GAMES = 3;

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>('MINECRAFT');
  const [imageData, setImageData] = useState<string | null>(null);
  const [cats, setCats] = useState<CatMarker[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  
  // Game Limit State
  const [gamesPlayed, setGamesPlayed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('catHideouts_gamesPlayed');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [showPromo, setShowPromo] = useState(false);

  // Leaderboard State
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('catHideouts_leaderboard');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Game Stats
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [hintsLeft, setHintsLeft] = useState<number>(0);
  const [activeHint, setActiveHint] = useState<{x: number, y: number} | null>(null);

  const foundCount = cats.filter(c => c.found).length;
  const totalCount = cats.length;
  const gamesLeft = Math.max(0, MAX_FREE_GAMES - gamesPlayed);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === GameState.PLAYING && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState(GameState.GAME_OVER);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  // Handle Score Screen Delay
  useEffect(() => {
    if (gameState === GameState.WON || gameState === GameState.GAME_OVER) {
      // Delay showing the result overlay so user can see the revealed cats on the canvas first
      const timer = setTimeout(() => {
        setShowResultOverlay(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setShowResultOverlay(false);
    }
  }, [gameState]);

  // Check limit on mount
  useEffect(() => {
    if (gamesPlayed >= MAX_FREE_GAMES) {
      setShowPromo(true);
    }
  }, [gamesPlayed]);

  const incrementGameCount = () => {
    const newCount = gamesPlayed + 1;
    setGamesPlayed(newCount);
    localStorage.setItem('catHideouts_gamesPlayed', newCount.toString());
  };

  const startGame = async (selectedDifficulty?: Difficulty) => {
    if (gamesPlayed >= MAX_FREE_GAMES) {
      setShowPromo(true);
      return;
    }

    try {
      const diff = selectedDifficulty || difficulty;
      setDifficulty(diff);
      setGameState(GameState.GENERATING_IMAGE);
      setErrorMsg(null);
      setCats([]);
      setScore(0);
      setActiveHint(null);
      setScoreSubmitted(false);
      setShowResultOverlay(false);
      
      const config = DIFFICULTY_CONFIG[diff];
      setTimeLeft(config.time);
      setHintsLeft(config.hints);

      // Increment game count immediately when starting generation
      incrementGameCount();

      // 1. Generate Image
      const base64 = await generateCatLandscape(diff, selectedStyle);
      setImageData(base64);

      // 2. Detect Cats
      setGameState(GameState.ANALYZING_IMAGE);
      // Pass the difficulty AND style to detection so it knows what KIND of cats to look for
      const boxes = await detectCatsInImage(base64, diff, selectedStyle);

      if (boxes.length === 0) {
        throw new Error("Nie udało się znaleźć kotów na wygenerowanym obrazku. Spróbuj ponownie.");
      }

      // 3. Prepare Game
      const gameCats: CatMarker[] = boxes.map((box, index) => ({
        id: `cat-${index}`,
        x: (box.xmin + box.xmax) / 2,
        y: (box.ymin + box.ymax) / 2,
        found: false,
        box: box
      }));

      setCats(gameCats);
      setGameState(GameState.PLAYING);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Wystąpił błąd podczas generowania gry.");
      setGameState(GameState.ERROR);
    }
  };

  const handleCatFound = useCallback((catId: string) => {
    setCats(prev => {
      const newCats = prev.map(cat => {
         if (cat.id === catId && !cat.found) {
             setScore(s => s + DIFFICULTY_CONFIG[difficulty].pointsPerCat);
             return { ...cat, found: true };
         }
         return cat;
      });
      
      // Check win condition
      const allFound = newCats.every(c => c.found);
      if (allFound) {
        // Bonus calculation
        const timeBonus = timeLeft * 10;
        setScore(s => s + timeBonus);
        // Delay state change slightly to allow the last cat animation to start
        setTimeout(() => setGameState(GameState.WON), 500);
      }
      
      return newCats;
    });
  }, [difficulty, timeLeft]);

  const handleMiss = useCallback(() => {
    // Deduct 50 points for missing, but don't go below 0
    setScore(s => Math.max(0, s - 50));
  }, []);

  const triggerHint = () => {
    if (hintsLeft <= 0 || gameState !== GameState.PLAYING) return;

    const unfound = cats.filter(c => !c.found);
    if (unfound.length === 0) return;

    const randomCat = unfound[Math.floor(Math.random() * unfound.length)];
    setActiveHint({ x: randomCat.x, y: randomCat.y });
    setHintsLeft(prev => prev - 1);

    // Clear hint after 2 seconds
    setTimeout(() => {
      setActiveHint(null);
    }, 2000);
  };

  const submitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      name: playerName.trim(),
      score: score,
      difficulty: DIFFICULTY_CONFIG[difficulty].label,
      date: new Date().toISOString(),
    };

    const updatedLeaderboard = [...leaderboardEntries, newEntry];
    setLeaderboardEntries(updatedLeaderboard);
    localStorage.setItem('catHideouts_leaderboard', JSON.stringify(updatedLeaderboard));
    
    setScoreSubmitted(true);
    setGameState(GameState.LEADERBOARD);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto p-4 md:p-6 font-sans relative">
      
      {/* Sidebar Actions - Visible on large screens (xl and up) */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-4">
        {/* Youtube Link */}
        <a 
          href="https://aistudio.google.com" // Pointing to AI Studio as requested
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-xl border-2 border-white hover:border-purple-100 transition-all hover:-translate-y-1 w-40 group cursor-pointer"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
            <Youtube size={24} />
          </div>
          <span className="text-center font-bold text-gray-700 text-sm leading-tight group-hover:text-purple-600 transition-colors">
            Zbuduj to w AI Studio
          </span>
          <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
            Sprawdź za darmo
          </span>
        </a>

        {/* Payment Button */}
        <button 
          onClick={() => setIsPaymentOpen(true)}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-xl border-2 border-white hover:border-pink-100 transition-all hover:-translate-y-1 w-40 group cursor-pointer"
        >
          <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-pink-600 mb-3 group-hover:bg-pink-600 group-hover:text-white transition-colors shadow-sm">
            <CreditCard size={24} />
          </div>
          <span className="text-center font-bold text-gray-700 text-sm leading-tight group-hover:text-pink-600 transition-colors">
            Wesprzyj Twórcę
          </span>
          <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">
            Postaw kawę ☕
          </span>
        </button>
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-pink-100 relative z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setGameState(GameState.IDLE)}>
          <div className="bg-pink-500 p-2 rounded-xl text-white">
            <Cat size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Kocie Kryjówki</h1>
            {gameState === GameState.PLAYING && (
               <span className="text-xs font-semibold text-pink-500 uppercase bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
                 {DIFFICULTY_CONFIG[difficulty].label} • {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label}
               </span>
            )}
          </div>
        </div>

        {gameState === GameState.PLAYING ? (
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 w-full md:w-auto">
             {/* Timer */}
             <div className={`flex items-center gap-2 ${timeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
                <Clock size={20} />
                <span className="text-xl font-mono font-bold">{formatTime(timeLeft)}</span>
             </div>

             {/* Score */}
             <div className="flex items-center gap-2 text-yellow-600">
                <Star size={20} fill="currentColor" />
                <span className="text-xl font-bold">{score}</span>
             </div>

             {/* Counter */}
             <div className="flex items-center gap-2 text-gray-600">
                <span className="text-sm uppercase font-bold text-gray-400 mr-1">Koty</span>
                <span className="text-xl font-bold text-pink-600">{foundCount}</span>
                <span className="text-gray-400">/</span>
                <span className="text-xl font-bold text-gray-600">{totalCount}</span>
             </div>

             {/* Hint Button */}
             <button 
               onClick={triggerHint}
               disabled={hintsLeft === 0}
               className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold transition-all
                 ${hintsLeft > 0 
                   ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer' 
                   : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
             >
               <Lightbulb size={16} className={hintsLeft > 0 ? "fill-yellow-400" : ""} />
               <span>Podpowiedź ({hintsLeft})</span>
             </button>
          </div>
        ) : (
          <div className="flex gap-3">
             <div className="hidden md:flex items-center px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500">
                Gier: {gamesPlayed}/{MAX_FREE_GAMES}
             </div>
             <button 
                onClick={() => setGameState(GameState.LEADERBOARD)}
                className="flex items-center gap-2 text-gray-600 hover:text-pink-600 font-semibold transition-colors"
             >
                <BarChart2 size={20} />
                <span>Tabela Wyników</span>
             </button>
          </div>
        )}
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative bg-white rounded-3xl shadow-xl border-4 border-white overflow-hidden min-h-[500px] flex items-center justify-center">
        
        {/* LEADERBOARD VIEW */}
        {gameState === GameState.LEADERBOARD && (
           <Leaderboard entries={leaderboardEntries} onBack={() => setGameState(GameState.IDLE)} />
        )}

        {/* IDLE / MENU VIEW */}
        {gameState === GameState.IDLE && (
          <div className="text-center p-8 max-w-3xl w-full overflow-y-auto max-h-full relative">
             
             <div className="mb-6 inline-block p-6 bg-pink-50 rounded-full animate-bounce-slow">
                <Cat size={64} className="text-pink-400" />
             </div>
             <h2 className="text-3xl font-bold text-gray-800 mb-2">Wybierz Ustawienia Gry</h2>
             <p className="text-gray-600 mb-6">
               Znajdź ukryte koty zanim skończy się czas! Uważaj, pudła odejmują punkty.
             </p>
             
             <div className="mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100 inline-flex items-center gap-2 text-sm text-blue-700">
               <Lock size={14} />
               <span>Darmowe gry: <strong>{gamesLeft}</strong> pozostało</span>
             </div>

             {/* Style Selector */}
             <div className="mb-8">
               <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center justify-center gap-2">
                 <Palette size={20} /> Wybierz Styl Graficzny
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                 {STYLE_OPTIONS.map((style) => (
                   <button
                     key={style.id}
                     onClick={() => setSelectedStyle(style.id)}
                     className={`relative p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 group h-full
                       ${selectedStyle === style.id 
                         ? 'border-pink-500 bg-pink-50 shadow-md ring-2 ring-pink-200 ring-offset-1' 
                         : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50 hover:shadow-sm'}`}
                   >
                     <span className="text-3xl flex-shrink-0 bg-white rounded-lg p-1 shadow-sm">{style.icon}</span>
                     <span className={`font-medium leading-tight ${selectedStyle === style.id ? 'text-pink-700' : 'text-gray-700 group-hover:text-pink-600'}`}>
                       {style.label}
                     </span>
                     {selectedStyle === style.id && (
                       <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full"></div>
                     )}
                   </button>
                 ))}
               </div>
             </div>

             {/* Difficulty Selector */}
             <h3 className="text-lg font-bold text-gray-700 mb-4">Wybierz Poziom Trudności</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
               {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((level) => {
                 const isLocked = gamesPlayed >= MAX_FREE_GAMES;
                 return (
                 <button
                   key={level}
                   onClick={() => startGame(level)}
                   disabled={isLocked}
                   className={`group relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-md
                     ${isLocked 
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                        : 'border-gray-100 hover:border-pink-400 hover:bg-pink-50 cursor-pointer'}`}
                 >
                   <div className="font-bold text-gray-800 mb-1 text-lg group-hover:text-pink-600 transition-colors">{DIFFICULTY_CONFIG[level].label}</div>
                   <div className="flex justify-between items-end mt-2">
                      <div className="text-sm text-gray-500">{DIFFICULTY_CONFIG[level].cats} Kotów</div>
                      <div className="text-sm text-pink-600 font-bold bg-pink-100 px-2 py-1 rounded-md">
                        {DIFFICULTY_CONFIG[level].time}s
                      </div>
                   </div>
                   {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-xl backdrop-blur-[1px]">
                        <Lock className="text-gray-400" />
                      </div>
                   )}
                 </button>
               )})}
             </div>
          </div>
        )}

        {/* ERROR STATE */}
        {gameState === GameState.ERROR && (
          <div className="text-center p-8 text-red-500">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Ups! Coś poszło nie tak.</h3>
            <p className="mb-6 text-gray-600">{errorMsg}</p>
            <button 
               onClick={() => setGameState(GameState.IDLE)}
               className="bg-gray-800 hover:bg-black text-white font-bold py-2 px-6 rounded-full"
             >
               Wróć do menu
             </button>
          </div>
        )}

        {/* ACTIVE GAME / WON / LOST */}
        {imageData && gameState !== GameState.LEADERBOARD && gameState !== GameState.IDLE && gameState !== GameState.ERROR && (
           <div className="relative w-full h-full group/canvas">
              <GameCanvas 
                imageBase64={imageData} 
                cats={cats} 
                onCatFound={handleCatFound} 
                onMiss={handleMiss}
                gameState={gameState}
                activeHint={activeHint}
              />
              <LoadingScreen state={gameState} />
              
              {/* Review Mode Button (Visible when Game Over/Won but Overlay is Hidden) */}
              {(gameState === GameState.WON || gameState === GameState.GAME_OVER) && !showResultOverlay && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                  <button 
                    onClick={() => setShowResultOverlay(true)}
                    className="flex items-center gap-2 bg-gray-900/90 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all backdrop-blur-md"
                  >
                    <ArrowLeft size={20} /> Wróć do wyniku
                  </button>
                </div>
              )}

              {/* VICTORY OVERLAY */}
              {gameState === GameState.WON && showResultOverlay && (
                <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">
                   <div className="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-sm w-full transform scale-110 border-4 border-yellow-200 relative flex flex-col max-h-[90vh] overflow-y-auto">
                      
                      {/* Review Board Button */}
                      <button 
                        onClick={() => setShowResultOverlay(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Zobacz planszę"
                      >
                        <Eye size={24} />
                      </button>

                      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-500 shadow-inner flex-shrink-0">
                        <Trophy size={40} fill="currentColor" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-1">Zwycięstwo!</h2>
                      <p className="text-gray-500 mb-4 text-sm">Wszystkie koty odnalezione</p>
                      
                      <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                        <div className="flex justify-between text-xl font-bold text-gray-800">
                          <span>Twój Wynik:</span>
                          <span>{score}</span>
                        </div>
                      </div>

                      {/* Score Submission Form */}
                      <div className="flex-grow">
                      {!scoreSubmitted ? (
                        <form onSubmit={submitScore} className="mb-4">
                          <div className="mb-3">
                            <input 
                              type="text" 
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                              placeholder="Wpisz swoje imię"
                              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-pink-500 outline-none text-center font-bold text-gray-700"
                              maxLength={12}
                              required
                              autoFocus
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white text-lg font-bold py-2 px-6 rounded-xl shadow-lg transition-all mb-2"
                          >
                            Zapisz Wynik
                          </button>
                          <button 
                            type="button"
                            onClick={() => setGameState(GameState.IDLE)}
                            className="text-sm text-gray-400 hover:text-gray-600 font-semibold"
                          >
                            Pomiń
                          </button>
                        </form>
                      ) : (
                         <button 
                            onClick={() => setGameState(GameState.LEADERBOARD)}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-bold py-3 px-6 rounded-xl shadow-lg transition-all mb-4"
                          >
                            Zobacz Tabelę
                          </button>
                      )}
                      </div>

                      {/* Footer Promo & Support */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                         <p className="text-xs text-gray-400 font-medium">Podobała Ci się gra?</p>
                         <div className="flex gap-2 justify-center">
                             <button 
                               onClick={() => setIsPaymentOpen(true)}
                               className="flex items-center gap-1.5 bg-pink-50 text-pink-600 hover:bg-pink-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                             >
                                <Coffee size={14} /> Wesprzyj
                             </button>
                             <a 
                               href="https://aistudio.google.com"
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center gap-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                             >
                                <Sparkles size={14} /> Zbudowane na Gemini
                             </a>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* GAME OVER OVERLAY */}
              {gameState === GameState.GAME_OVER && showResultOverlay && (
                <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">
                   <div className="bg-white p-6 rounded-3xl shadow-2xl text-center max-w-sm w-full border-4 border-red-200 relative flex flex-col max-h-[90vh] overflow-y-auto">
                      
                      {/* Review Board Button */}
                      <button 
                        onClick={() => setShowResultOverlay(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Zobacz planszę"
                      >
                        <Eye size={24} />
                      </button>

                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500 flex-shrink-0">
                        <TimerOff size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-1">Koniec czasu!</h2>
                      <p className="text-gray-600 mb-4 text-sm">Koty wygrały tym razem.</p>
                      
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                         <div className="text-sm text-gray-500 mb-1">Twój wynik</div>
                         <div className="text-3xl font-bold text-gray-800">{score}</div>
                         <div className="text-xs text-gray-400 mt-2">Znaleziono {foundCount} z {totalCount} kotów</div>
                      </div>

                      <button 
                        onClick={() => setGameState(GameState.IDLE)}
                        className="w-full bg-gray-800 hover:bg-gray-900 text-white text-lg font-bold py-3 px-6 rounded-xl shadow-lg transition-all mb-2"
                      >
                        Spróbuj ponownie
                      </button>

                       {/* Footer Promo & Support */}
                       <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                         <p className="text-xs text-gray-400 font-medium">Zbuduj własną grę z Google AI</p>
                         <div className="flex gap-2 justify-center">
                             <button 
                               onClick={() => setIsPaymentOpen(true)}
                               className="flex items-center gap-1.5 bg-pink-50 text-pink-600 hover:bg-pink-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                             >
                                <Coffee size={14} /> Wesprzyj
                             </button>
                             <a 
                               href="https://aistudio.google.com"
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center gap-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                             >
                                <Sparkles size={14} /> Wypróbuj Gemini
                             </a>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>
        )}
      </main>

      {/* Mobile Footer Action */}
      <div className="xl:hidden mt-4 flex justify-center gap-4">
          <button 
             onClick={() => setGameState(GameState.LEADERBOARD)}
             className="flex items-center gap-2 text-gray-600 font-bold bg-gray-100 px-4 py-2 rounded-full border border-gray-200"
          >
             <BarChart2 size={18} />
          </button>
          <button 
            onClick={() => setIsPaymentOpen(true)}
            className="flex items-center gap-2 text-pink-600 font-bold bg-pink-50 px-4 py-2 rounded-full border border-pink-200"
          >
            <CreditCard size={18} />
            <span>Wesprzyj</span>
          </button>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-gray-400 text-xs md:text-sm pb-4">
        Powered by Google Gemini 2.5 Flash Image & Vision
      </footer>

      {/* Modals */}
      <PaymentModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
      <PromoModal isOpen={showPromo} />

    </div>
  );
}