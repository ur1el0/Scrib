import { useState } from 'react'
import useWebSocket from 'react-use-websocket'
import axios from 'axios'
import './App.css'

const WS_URL = 'ws://127.0.0.1:8000/ws/game/'
const API_URL = 'http://127.0.0.1:8000/api/'

function App() {
  const [view, setView] = useState<'LOBBY' | 'WAITING' | 'PLAYING' | 'FINISHED'>('LOBBY')
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')
  const [isGm, setIsGm] = useState(false)
  
  // Game State
  const [board, setBoard] = useState<string[][]>([])
  const [timeLeft, setTimeLeft] = useState(180)
  const [currentWord, setCurrentWord] = useState('')
  const [myScore, setMyScore] = useState(0)
  const [myWords, setMyWords] = useState<{word: string, points: number}[]>([])
  
  // Players
  const [players, setPlayers] = useState<Record<string, number>>({})

  const { sendJsonMessage } = useWebSocket(roomCode ? `${WS_URL}${roomCode}/` : null, {
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

  if (view === 'LOBBY') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-4xl font-bold mb-8">Tournament Scrib</h1>
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <input 
            className="w-full border p-2 mb-4 rounded" 
            placeholder="Your Name" 
            value={name} onChange={e => setName(e.target.value)} 
          />
          <input 
            className="w-full border p-2 mb-4 rounded uppercase" 
            placeholder="Room Code (to join)" 
            value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} 
          />
          <div className="flex space-x-4">
            <button 
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={() => joinRoomSubmit(roomCode, name)}
              disabled={!name || !roomCode}
            >Join Room</button>
            <button 
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
              onClick={createRoom}
              disabled={!name}
            >Create Room</button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'WAITING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h2 className="text-2xl font-bold mb-4">Room: {roomCode}</h2>
        <p className="mb-8">Waiting for Game Master to start...</p>
        {isGm && (
          <button 
            className="bg-green-500 text-white px-8 py-3 rounded text-xl font-bold shadow hover:bg-green-600"
            onClick={startGame}
          >Start Tournament Round!</button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Board & Input */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">Room: {roomCode}</h2>
            <div className={`text-4xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-600'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 bg-gray-300 p-2 rounded-lg aspect-square mb-6">
            {board.map((row, r) => 
              row.map((letter, c) => (
                <div key={`${r}-${c}`} className="bg-white rounded-md flex items-center justify-center text-4xl font-bold shadow-sm select-none">
                  {letter === 'Q' ? 'Qu' : letter}
                </div>
              ))
            )}
          </div>

          {view === 'PLAYING' && (
            <form onSubmit={submitWord} className="flex gap-2">
              <input
                autoFocus
                className="flex-1 border-2 border-gray-300 p-4 rounded text-xl uppercase"
                placeholder="Type word & press Enter"
                value={currentWord}
                onChange={e => setCurrentWord(e.target.value.toUpperCase())}
              />
              <button type="submit" className="bg-blue-500 text-white px-6 rounded font-bold text-lg hover:bg-blue-600">
                Submit
              </button>
            </form>
          )}

          {view === 'FINISHED' && (
            <div className="bg-red-100 text-red-800 p-4 rounded text-xl font-bold text-center border border-red-200">
              Time is up! Round Finished.
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard & Words */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">Leaderboard</h3>
            {Object.entries(players).sort((a,b) => b[1] - a[1]).map(([p, score]) => (
              <div key={p} className={`flex justify-between py-1 ${p === name ? 'font-bold text-blue-600' : ''}`}>
                <span>{p}</span>
                <span>{score}</span>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 rounded shadow flex-1">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">My Words ({myScore} pts)</h3>
            <div className="overflow-y-auto max-h-96">
              {myWords.map((w, i) => (
                <div key={i} className="flex justify-between py-1 text-sm border-b border-gray-100 last:border-0">
                  <span className="uppercase">{w.word}</span>
                  <span className="text-green-600 font-bold">+{w.points}</span>
                </div>
              ))}
              {myWords.length === 0 && <p className="text-gray-400 italic text-sm">No words found yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
