import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, X } from 'lucide-react';
import { DndContext, useDraggable, useDroppable, TouchSensor, MouseSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { BoardItem, TrayItem, ScoreData } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005/api';

const getSavedState = () => {
  try {
    return JSON.parse(localStorage.getItem('scribbage_state') || '{}');
  } catch {
    return {};
  }
};

// --- DRAG AND DROP COMPONENTS ---
const DraggableTile = ({ id, letter, is_wildcard }: { id: string, letter: string, is_wildcard?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
    id,
    data: { letter, is_wildcard}
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      aria-label={is_wildcard ? 'Joker tile' : `${letter} tile`}
      className={`w-full h-full flex items-center justify-center rounded border shadow-sm text-xs sm:text-base font-black cursor-grab touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
        ${is_wildcard 
          ? 'bg-purple-100 border-purple-300 text-purple-900'
          : 'bg-amber-100 border-amber-300 text-amber-900'}
      `}
    >
      {letter === '_' ? '?' : letter}
    </div>
  );
};

const DroppableGridCell = ({ id, tile }: { id: string, tile?: BoardItem }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  let cellLabel = "Tray slot";
  if (id.startsWith('grid-')) {
     const [, r, c] = id.split('-');
     cellLabel = `Row ${r}, Column ${c} ${tile ? '(Occupied)' : '(Empty)'}`;
  }

  return (
    <div 
      ref={setNodeRef} 
      aria-label={cellLabel}
      role="region"
      className={`aspect-square w-full rounded border flex items-center justify-center p-0 sm:p-0.5
        ${isOver ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-200'}
      `}
    >
      {tile && <DraggableTile id={tile.id} letter={tile.letter} is_wildcard={tile.is_wildcard} />}
    </div>
  );
};

export default function App() {
  const savedState = getSavedState();
  const [playerName, setPlayerName] = useState(savedState.playerName || 'Player1');
  const [dice, setDice] = useState<TrayItem[]>(savedState.dice || []);
  const [placedTiles, setPlacedTiles] = useState<BoardItem[]>(savedState.placedTiles || []);
  const [timeLeft, setTimeLeft] = useState(savedState.timeLeft ?? 180);
  const [isPlaying, setIsPlaying] = useState(savedState.isPlaying ?? false);
  const [leaderboard, setLeaderboard] = useState<ScoreData[]>([]);
  const [feedback, setFeedback] = useState<{valid: boolean, message: string, score?: number, breakdown?: {word: string, score: number}[]} | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const announcements = {
    onDragStart({ active }: any) {
      const isJoker = active.data.current?.is_wildcard
      const letter = isJoker ? 'Joker' : active.data.current?.letter
      return `Picked up ${letter} tile.`
    },
    onDragOver({ over }: any) {
      if (over) {
        const overName = over.id === 'tray'
          ? 'the Tray'
          : `Row ${over.id.split('-')[1]}, Column ${over.id.split('-')[2]}`
        return `Tile moved over ${overName}.`
      }
      return `Tile is no longer over a valid drop area.`
    },
    onDragEnd({ active, over }: any) {
      if (over) {
        const isJoker = active.data.current?.is_wildcard;
        const letter = isJoker ? 'Joker' :active.data.current?.letter;
        const overName = over.id === 'tray'
          ? 'the Tray'
          : `Row ${over.id.split('-')[1]}, Column ${over.id.split('-')[2]}`
        return `Dropped ${letter} tile onto ${overName}.`
      }
      return `Tile was dropped outside, returning to original position.`
    },
    onDragCancel() {
      return `Drag cancelled.`
    }
  }
  useEffect(() => {
    if (isPlaying || placedTiles.length > 0 || dice.length > 0) {
      localStorage.setItem('scribbage_state', JSON.stringify({
        dice, placedTiles, timeLeft, isPlaying, playerName
      }));
    }
  }, [dice, placedTiles, timeLeft, isPlaying, playerName]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isPlaying && timeLeft === 0) {
      submitBoard();
    }
  }, [isPlaying, timeLeft]);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/leaderboard/`);
      setLeaderboard(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const startRound = async () => {
    try {
      const res = await axios.get(`${API_URL}/game/roll/`);
      const trayDice = res.data.dice.map((letter: string) => ({
        id: `dice-${crypto.randomUUID()}`,
        letter
      }));
      setDice(trayDice);
      setPlacedTiles([]);
      setTimeLeft(180);
      setIsPlaying(true);
      setFeedback(null);
    } catch (e) {
      console.error(e);
      let errorMessage = "Failed to start round."
      if (axios.isAxiosError(e) && !e.response) {
        errorMessage = "Server is waking up. Please wait 30 seconds and try again!"
      }
      setFeedback({valid: false, message: errorMessage})
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !isPlaying) return;
    
    const tileId = active.id as string;
    const targetId = over.id as string;

    let sourceTile: TrayItem | BoardItem | undefined = dice.find(d => d.id === tileId);
    let fromTray = true;
    if (!sourceTile) {
      sourceTile = placedTiles.find(t => t.id === tileId);
      fromTray = false;
    }
    if (!sourceTile) return;

    if (targetId === 'tray') {
      if (!fromTray) {
        const boardItem = sourceTile as BoardItem;
        setPlacedTiles(prev => prev.filter(t => t.id !== tileId));
        setDice(prev => [...prev, { id: tileId, letter: boardItem.is_wildcard ? '_' : boardItem.letter }]);
      }
    } else if (targetId.startsWith('grid-')) {
      const [, rStr, cStr] = targetId.split('-');
      const r = parseInt(rStr);
      const c = parseInt(cStr);
      
      const occupied = placedTiles.find(t => t.row === r && t.col === c);
      if (occupied && occupied.id !== tileId) return;

      let letter = sourceTile.letter;
      let is_wildcard = (sourceTile as BoardItem).is_wildcard || false;
      
      if (fromTray && letter === '_') {
          const input = prompt("Enter a letter (A-Z) for this Joker:");
          if (!input || !/^[a-zA-Z]$/.test(input)) {
             alert("You must enter a single letter from A to Z.");
             return;
          }
          letter = input.toUpperCase();
          is_wildcard = true;
      }
      
      if (fromTray) {
        setDice(prev => prev.filter(d => d.id !== tileId));
        setPlacedTiles(prev => [...prev, { id: tileId, row: r, col: c, letter, is_wildcard }]);
      } else {
        setPlacedTiles(prev => prev.map(t => t.id === tileId ? { ...t, row: r, col: c } : t));
      }
    }
  };

  const submitBoard = async () => {
    if (placedTiles.length === 0) return;
    setIsPlaying(false);
    
    const fullRoll = [...dice.map(d => d.letter)];
    for (const t of placedTiles) {
      fullRoll.push(t.is_wildcard ? '_' : t.letter);
    }
    
    try {
      const res = await axios.post(`${API_URL}/game/submit/`, {
        player_name: playerName,
        dice: fullRoll,
        board: placedTiles
      });
      
      if (res.data.valid) {
        setFeedback({
          valid: true, 
          message: `Valid!`,
          score: res.data.score,
          breakdown: res.data.breakdown
        });
        fetchLeaderboard();
        localStorage.removeItem('scribbage_state');
      } else {
        setFeedback({valid: false, message: res.data.error});
      }
    } catch (e) {
      console.error(e);
      let errorMessage = "Submission failed or network error.";
      
      if (axios.isAxiosError(e)) {
        if (e.response) {
            // DRF Validation errors (400 Bad Request) usually come back as JSON objects mapping fields to arrays of errors
            if (e.response.data && typeof e.response.data === 'object') {
                 const firstKey = Object.keys(e.response.data)[0];
                 const firstError = e.response.data[firstKey];
                 errorMessage = `Error: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
            } else {
                 errorMessage = `Server Error: ${e.response.statusText}`;
            }
        } else if (e.request) {
            errorMessage = "Server took too long to respond (it might be waking up). Please try again!";
        }
      }
      setFeedback({valid: false, message: errorMessage});
    }
  };

  const recallAllTiles = () => {
    if (!isPlaying || placedTiles.length === 0) return;
    
    const returnedTiles = placedTiles.map(t => ({
      id: t.id,
      letter: t.is_wildcard ? '_' : t.letter
    }));
    
    setDice(prev => [...prev, ...returnedTiles]);
    setPlacedTiles([]);
  };

  const TrayZone = () => {
    const { setNodeRef } = useDroppable({ id: 'tray' });
    return (
      <div className="bg-white rounded-lg shadow border p-2 flex flex-col h-[160px] sm:h-[180px]">
        <div className="flex justify-between items-center mb-1 px-1 shrink-0">
          <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">Tray</span>
          <span className="text-[10px] sm:text-xs font-bold text-gray-500">{dice.length}/13</span>
        </div>
        <div ref={setNodeRef} className="grid grid-cols-7 gap-1 flex-grow items-start content-start">
          {dice.map((tile) => (
            <div key={tile.id} className="aspect-square w-full max-w-[45px] mx-auto">
              <DraggableTile id={tile.id} letter={tile.letter} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} accessibility={{ announcements }}>
      <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden font-sans text-gray-800">
        
        {/* HEADER */}
        <header className="bg-white border-b px-3 py-2 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-indigo-700 tracking-tight leading-none">SCRIBBAGE</h1>
            <div className="text-[15px] text-gray-500 font-bold uppercase mt-0.5">ni Roosc</div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-xl sm:text-2xl font-mono font-black ${timeLeft < 30 && isPlaying ? 'text-red-500' : 'text-slate-800'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="bg-amber-100 text-amber-700 p-2 rounded-full shadow-sm hover:bg-amber-200"
            >
              <Trophy size={16} />
            </button>
          </div>
        </header>

        {/* MAIN GAME AREA */}
        <main className="flex-1 flex flex-col items-center justify-start p-2 gap-2 overflow-y-auto w-full max-w-lg mx-auto">
          
          {/* Controls */}
          <div className="w-full flex gap-2 shrink-0">
            <input 
              type="text" 
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="flex-1 min-w-0 px-2 py-1.5 border rounded shadow-sm font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Name"
              disabled={isPlaying}
            />
            <button 
              onClick={startRound}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded font-bold shadow-sm text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isPlaying ? "Restart" : "Start"}
            </button>
            <button 
              onClick={recallAllTiles}
              disabled={!isPlaying || placedTiles.length === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded font-bold shadow-sm text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Recall All
            </button>
            <button 
              onClick={submitBoard}
              disabled={!isPlaying || placedTiles.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded font-bold shadow-sm text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Submit
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`w-full p-2 rounded shadow-sm border-l-4 text-xs sm:text-sm font-bold ${feedback.valid ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'} shrink-0`}>
              <div>
                {feedback.valid && <span className="mr-2">Score: {feedback.score}.</span>}
                {feedback.message}
              </div>
              {feedback.valid && feedback.breakdown && (
                <ul className="mt-2 space-y-1 bg-white/50 p-2 rounded font-mono text-xs text-gray-700">
                  {feedback.breakdown.map((item, idx) => (
                    <li key={idx} className="flex justify-between border-b border-green-100 last:border-0 pb-0.5 last:pb-0">
                      <span>{item.word}</span>
                      <span>{item.score} pts</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* GRID */}
          <div className="w-full aspect-square bg-gray-200 rounded-lg p-0.5 sm:p-1 shadow-inner shrink-0 mt-auto mb-auto">
            <div className="w-full h-full grid grid-cols-15 gap-[1px]">
              {Array.from({length: 15}).map((_, r) => (
                Array.from({length: 15}).map((_, c) => (
                  <DroppableGridCell 
                    key={`${r}-${c}`} 
                    id={`grid-${r}-${c}`} 
                    tile={placedTiles.find(t => t.row === r && t.col === c)} 
                  />
                ))
              ))}
            </div>
          </div>

          {/* TRAY */}
          <div className="w-full shrink-0">
            <TrayZone />
          </div>
          
        </main>

        {/* FOOTER: SOCIAL LINKS */}
        <footer className="bg-white border-t p-2 flex flex-col justify-center items-center gap-1 shrink-0 z-10 text-sm font-bold">
          <div className="text-xs text-gray-500 font-medium tracking-wide uppercase">Developed by Roosc</div>
          <div className="flex gap-6 mt-1">
            <a href="https://github.com/ur1el0" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition-colors" title="GitHub">GitHub</a>
            <a href="https://www.linkedin.com/in/roosc-za%C3%B1o-08568a357/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700 transition-colors" title="LinkedIn">LinkedIn</a>
            <a href="https://facebook.com/dumayac.nhel" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors" title="Facebook">Facebook</a>
            <a href="https://instagram.com/fuschiapenk" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600 transition-colors" title="Instagram">Instagram</a>
          </div>
        </footer>

        {/* LEADERBOARD MODAL */}
        {showLeaderboard && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-300" /> Leaderboard
                </h2>
                <button onClick={() => setShowLeaderboard(false)} className="text-white hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                {leaderboard.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No scores yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {leaderboard.map((score, i) => (
                      <div key={score.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                        <div className="flex items-center gap-3">
                          <div className={`font-black w-6 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                            #{i + 1}
                          </div>
                          <div className="font-bold text-gray-700 text-sm sm:text-base">{score.player_name}</div>
                        </div>
                        <div className="font-black text-indigo-600">{score.score}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DndContext>
  );
}
