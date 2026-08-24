import { useState, useEffect } from 'react';
import axios from 'axios';
import type { BoardItem, ScoreData } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function App() {
  const [playerName, setPlayerName] = useState('Player1');
  const [dice, setDice] = useState<string[]>([]);
  const [placedTiles, setPlacedTiles] = useState<BoardItem[]>([]);
  const [selectedTrayIndex, setSelectedTrayIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isPlaying, setIsPlaying] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreData[]>([]);
  const [feedback, setFeedback] = useState<{valid: boolean, message: string, score?: number} | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isPlaying && timeLeft === 0) {
      setIsPlaying(false);
      setFeedback({valid: false, message: "Time's up! Please submit your board."});
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
      setDice(res.data.dice);
      setPlacedTiles([]);
      setTimeLeft(180);
      setIsPlaying(true);
      setSelectedTrayIndex(null);
      setFeedback(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrayClick = (index: number) => {
    if (!isPlaying) return;
    if (selectedTrayIndex === index) {
      setSelectedTrayIndex(null);
    } else {
      setSelectedTrayIndex(index);
    }
  };

  const handleGridClick = (row: number, col: number) => {
    if (!isPlaying) return;
    
    // Check if cell is occupied
    const existingIndex = placedTiles.findIndex(t => t.row === row && t.col === col);
    
    if (existingIndex !== -1) {
      // Return to tray
      const tile = placedTiles[existingIndex];
      setDice([...dice, tile.letter]);
      setPlacedTiles(placedTiles.filter((_, i) => i !== existingIndex));
      setSelectedTrayIndex(null);
    } else if (selectedTrayIndex !== null) {
      // Place from tray
      const letter = dice[selectedTrayIndex];
      setPlacedTiles([...placedTiles, { row, col, letter }]);
      setDice(dice.filter((_, i) => i !== selectedTrayIndex));
      setSelectedTrayIndex(null);
    }
  };

  const submitBoard = async () => {
    if (placedTiles.length === 0) return;
    setIsPlaying(false);
    
    // The original full dice pool before any placements was what the backend expects?
    // Wait, backend validate_submission expects the full 13 dice roll or just the ones placed?
    // The backend says: "Validates that placed letters match the rolled dice pool."
    // It subtracts placed letters from the submitted dice list.
    // So we should send the FULL original roll, or the backend expects `dice` to represent the full pool.
    const fullRoll = [...dice, ...placedTiles.map(t => t.letter)];
    
    try {
      const res = await axios.post(`${API_URL}/game/submit/`, {
        player_name: playerName,
        dice: fullRoll,
        board: placedTiles
      });
      
      if (res.data.valid) {
        setFeedback({
          valid: true, 
          message: `Valid! Words: ${res.data.words.join(', ')}`,
          score: res.data.score
        });
        fetchLeaderboard();
      } else {
        setFeedback({valid: false, message: res.data.error});
      }
    } catch (e) {
      console.error(e);
      setFeedback({valid: false, message: "Submission failed or network error."});
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-8 flex gap-8 justify-center">
      
      {/* LEFT COLUMN: GAME BOARD */}
      <div className="flex flex-col gap-6 max-w-3xl">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-indigo-700 tracking-tight mb-2">SCRIBBAGE</h1>
            <div className="flex gap-4 items-center">
              <input 
                type="text" 
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                className="px-3 py-2 border rounded shadow-sm font-medium"
                placeholder="Player Name"
                disabled={isPlaying}
              />
              <button 
                onClick={startRound}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-bold shadow-md transition-colors"
              >
                {isPlaying ? "Restart" : "Start Game"}
              </button>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">Time Remaining</div>
            <div className={`text-5xl font-mono font-black ${timeLeft < 30 && isPlaying ? 'text-red-500' : 'text-slate-800'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </header>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className={`p-4 rounded shadow-sm border-l-4 font-medium ${feedback.valid ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
            {feedback.valid && <div className="text-2xl font-black mb-1">Score: {feedback.score}</div>}
            <div>{feedback.message}</div>
          </div>
        )}

        {/* BOARD GRID */}
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <div className="grid grid-cols-15 gap-1 bg-gray-100 p-2 rounded-lg" style={{gridTemplateColumns: 'repeat(15, minmax(0, 1fr))'}}>
            {Array.from({length: 15}).map((_, r) => (
              Array.from({length: 15}).map((_, c) => {
                const tile = placedTiles.find(t => t.row === r && t.col === c);
                return (
                  <div 
                    key={`${r}-${c}`}
                    onClick={() => handleGridClick(r, c)}
                    className={`aspect-square rounded border border-gray-200 flex items-center justify-center text-xl font-bold cursor-pointer transition-colors select-none
                      ${tile ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm hover:bg-red-100 hover:border-red-300 hover:text-red-900' : 'bg-white hover:bg-indigo-50'}
                    `}
                  >
                    {tile ? tile.letter : ''}
                  </div>
                )
              })
            ))}
          </div>
        </div>

        {/* DICE TRAY */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col gap-4">
          <div className="text-sm text-gray-500 font-bold uppercase tracking-widest flex justify-between">
            <span>Dice Tray</span>
            <span>{dice.length} remaining</span>
          </div>
          <div className="flex flex-wrap gap-3 min-h-[4rem]">
            {dice.map((letter, i) => (
              <div 
                key={i}
                onClick={() => handleTrayClick(i)}
                className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 text-2xl font-black cursor-pointer transition-all select-none
                  ${selectedTrayIndex === i 
                    ? 'border-indigo-600 bg-indigo-100 text-indigo-800 scale-110 shadow-md' 
                    : 'border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-400 hover:shadow-sm'}
                `}
              >
                {letter}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-2 border-t mt-2">
            <button 
              onClick={submitBoard}
              disabled={!isPlaying || placedTiles.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold shadow-md transition-colors text-lg"
            >
              Submit Board
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LEADERBOARD */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-indigo-600 text-white p-4">
            <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
              🏆 Leaderboard
            </h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {leaderboard.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No scores yet. Be the first!</div>
            ) : (
              leaderboard.map((score, i) => (
                <div key={score.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`font-black w-6 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                      #{i + 1}
                    </div>
                    <div className="font-bold text-gray-700">{score.player_name}</div>
                  </div>
                  <div className="font-black text-indigo-600 text-lg">{score.score}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export default App
