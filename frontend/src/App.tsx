import { useState, useEffect } from 'react'
import useWebSocket from './useWebSocketLite'
import axios from 'axios'
import { Sun, Moon, Trophy, X } from 'lucide-react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8001/ws/game/'

function App() {
  const [view, setView] = useState<'LOBBY' | 'WAITING' | 'PLAYING' | 'FINISHED'>('LOBBY')
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')
  const [isGm, setIsGm] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Game State
  const [board, setBoard] = useState<string[][]>([])
  const [timeLeft, setTimeLeft] = useState(180)
  const [currentWord, setCurrentWord] = useState('')
  const [myScore, setMyScore] = useState(0)
  const [myWords, setMyWords] = useState<{word: string, points: number}[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  
  // Players
  const [players, setPlayers] = useState<Record<string, number>>({})

  const { sendJsonMessage } = useWebSocket(view !== 'LOBBY' && roomCode ? `${WS_URL}${roomCode}/` : null, {
    onOpen: () => console.log('WebSocket connection opened.'),
    onMessage: (event) => {
      const data = JSON.parse(event.data)
      if (data.action === 'GAME_START') {
        setBoard(data.board)
        setTimeLeft(180)
        setView('PLAYING')
        setMyScore(0)
        setMyWords([])
      } else if (data.action === 'TIMER_TICK') {
        setTimeLeft(data.time_left)
      } else if (data.action === 'SCORE_UPDATE') {
        setPlayers(prev => ({
          ...prev,
          [data.player_name]: data.total_score
        }))
        if (data.player_name === name) {
          setMyScore(data.total_score)
          setMyWords(prev => [{word: data.word, points: data.points}, ...prev])
        }
      } else if (data.action === 'WORD_ERROR') {
        setErrorMsg(data.error)
        setTimeout(() => setErrorMsg(''), 2500)
      } else if (data.action === 'GAME_OVER') {
        setView('FINISHED')
      }
    }
  })

  const createRoom = async () => {
    try {
      const res = await axios.post(`${API_URL}room/create/`)
      setRoomCode(res.data.code)
      setIsGm(true)
      joinRoomSubmit(res.data.code, name)
    } catch (e) { console.error(e) }
  }

  const joinRoomSubmit = async (code: string, pName: string) => {
    try {
      const res = await axios.post(`${API_URL}room/join/`, { code, name: pName })
      setRoomCode(res.data.room)
      setIsGm(res.data.is_gm)
      setView('WAITING')
      setPlayers(prev => ({ ...prev, [pName]: 0 }))
    } catch (e) { alert("Room not found") }
  }

  const startGame = () => {
    sendJsonMessage({ action: 'START_GAME' })
  }

  const submitWord = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWord.trim()) return
    sendJsonMessage({
      action: 'SUBMIT_WORD',
      player_name: name,
      word: currentWord.trim()
    })
    setCurrentWord('')
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
        
        {/* HEADER */}
        <header className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 transition-colors">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">SCRIBBAGE</h1>
            <div className="text-[13px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-0.5 tracking-widest">ni Roosc</div>
          </div>
          <div className="flex items-center gap-4">
            {view !== 'LOBBY' && (
              <div className={`text-xl sm:text-2xl font-mono font-black ${timeLeft < 30 && view === 'PLAYING' ? 'text-red-500' : 'text-gray-800 dark:text-slate-200'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
            >
              <Trophy size={20} />
            </button>
          </div>
        </header>

        {/* MAIN AREA */}
        <main className="flex-1 flex flex-col items-center justify-start p-4 gap-6 overflow-y-auto w-full max-w-4xl mx-auto text-gray-800 dark:text-slate-200">
          
          {view === 'LOBBY' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md w-full max-w-md mt-10 transition-colors">
              <h2 className="text-2xl font-bold mb-6 text-center">Tournament Practice</h2>
              <input 
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 mb-4 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors" 
                placeholder="Your Name" 
                value={name} onChange={e => setName(e.target.value)} 
              />
              <input 
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3 mb-6 rounded-lg uppercase focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors" 
                placeholder="Room Code (to join)" 
                value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} 
              />
              <div className="flex space-x-4">
                <button 
                  className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  onClick={() => joinRoomSubmit(roomCode, name)}
                  disabled={!name || !roomCode}
                >Join Room</button>
                <button 
                  className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                  onClick={createRoom}
                  disabled={!name}
                >Create Room</button>
              </div>
            </div>
          )}

          {view === 'WAITING' && (
            <div className="flex flex-col items-center justify-center mt-20">
              <h2 className="text-3xl font-bold mb-2">Room: <span className="text-indigo-600 dark:text-indigo-400">{roomCode}</span></h2>
              <p className="mb-8 text-gray-500 dark:text-slate-400">Waiting for Game Master to start...</p>
              {isGm && (
                <button 
                  className="bg-green-600 text-white px-8 py-3 rounded-lg text-xl font-bold shadow hover:bg-green-700 transition-colors"
                  onClick={startGame}
                >Start Tournament Round!</button>
              )}
            </div>
          )}

          {(view === 'PLAYING' || view === 'FINISHED') && (
             <div className="w-full flex flex-col md:flex-row gap-8 mt-4">
                {/* Left Column: Board & Input */}
                <div className="flex-1 max-w-lg mx-auto w-full">
                  
                  <div className="grid grid-cols-4 gap-2 bg-indigo-100 dark:bg-slate-800 p-3 rounded-xl aspect-square mb-6 shadow-sm border border-indigo-200 dark:border-slate-700">
                    {board.map((row, r) => 
                      row.map((letter, c) => (
                        <div key={`${r}-${c}`} className="bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-4xl sm:text-5xl font-black text-gray-800 dark:text-slate-100 shadow-sm select-none transition-colors">
                          {letter === 'Q' ? 'Qu' : letter}
                        </div>
                      ))
                    )}
                  </div>

                  {errorMsg && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg font-bold z-50">
                      {errorMsg}
                    </div>
                  )}

                  {view === 'PLAYING' && (
                    <form onSubmit={submitWord} className="flex gap-2">
                      <input
                        autoFocus
                        className="flex-1 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-slate-700 p-4 rounded-lg text-xl uppercase font-bold focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                        placeholder="Type word & press Enter"
                        value={currentWord}
                        onChange={e => setCurrentWord(e.target.value.toUpperCase())}
                      />
                      <button type="submit" className="bg-indigo-600 text-white px-6 rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors shadow">
                        Submit
                      </button>
                    </form>
                  )}

                  {view === 'FINISHED' && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg text-xl font-bold text-center border border-red-200 dark:border-red-800 transition-colors">
                      Time is up! Round Finished.
                    </div>
                  )}
                </div>

                {/* Right Column: Leaderboard & Words */}
                <div className="w-full md:w-80 flex flex-col gap-4">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                    <h3 className="text-lg font-black mb-3 border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                      <Trophy className="text-amber-500 w-5 h-5"/> Live Leaderboard
                    </h3>
                    <div className="flex flex-col gap-1">
                      {Object.entries(players).sort((a,b) => b[1] - a[1]).map(([p, score], idx) => (
                        <div key={p} className={`flex justify-between p-2 rounded-md ${p === name ? 'bg-indigo-50 dark:bg-indigo-900/20 font-bold text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-slate-300'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black w-4 opacity-50">#{idx+1}</span>
                            <span>{p}</span>
                          </div>
                          <span>{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 flex-1 transition-colors">
                    <h3 className="text-lg font-black mb-3 border-b border-gray-100 dark:border-slate-700 pb-2">My Words ({myScore} pts)</h3>
                    <div className="overflow-y-auto max-h-64 pr-2">
                      {myWords.map((w, i) => (
                        <div key={i} className="flex justify-between py-1 text-sm border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                          <span className="uppercase font-bold text-gray-700 dark:text-slate-200">{w.word}</span>
                          <span className="text-green-600 dark:text-green-400 font-bold">+{w.points}</span>
                        </div>
                      ))}
                      {myWords.length === 0 && <p className="text-gray-400 dark:text-slate-500 italic text-sm">No words found yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
          )}

        </main>

        {/* FOOTER */}
        <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 p-3 flex flex-col justify-center items-center gap-1 shrink-0 z-10 text-sm font-bold transition-colors">
          <div className="text-xs text-gray-400 dark:text-slate-500 font-medium tracking-widest uppercase">Developed by Roosc</div>
          <div className="flex gap-6 mt-1">
            <a href="https://github.com/ur1el0" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors" title="GitHub">GitHub</a>
            <a href="https://www.linkedin.com/in/roosc-za%C3%B1o-08568a357/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="LinkedIn">LinkedIn</a>
            <a href="https://facebook.com/dumayac.nhel" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Facebook">Facebook</a>
            <a href="https://instagram.com/fuschiapenk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors" title="Instagram">Instagram</a>
          </div>
        </footer>

        {/* LEADERBOARD MODAL */}
        {showLeaderboard && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] transition-colors">
               <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
                 <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                   <Trophy className="w-5 h-5 text-amber-300" /> Leaderboard
                 </h2>
                 <button onClick={() => setShowLeaderboard(false)} className="text-white hover:text-gray-200">
                   <X size={20} />
                 </button>
               </div>
               <div className="p-4 overflow-y-auto">
                 {Object.keys(players).length === 0 ? (
                   <div className="text-gray-500 dark:text-slate-400 text-center py-8 font-medium">No scores yet.</div>
                 ) : (
                   <div className="flex flex-col gap-2">
                     {Object.entries(players).sort((a,b) => b[1] - a[1]).map(([p, score], i) => (
                       <div key={p} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 transition-colors">
                         <div className="flex items-center gap-3">
                           <div className={`font-black w-6 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-300 dark:text-slate-600'}`}>
                             #{i + 1}
                           </div>
                           <div className="font-bold text-gray-700 dark:text-slate-200 text-sm sm:text-base">{p}</div>
                         </div>
                         <div className="font-black text-indigo-600 dark:text-indigo-400">{score} pts</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           </div>
        )}

      </div>
    </div>
  )
}

export default App
