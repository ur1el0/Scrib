# Scrib (MSEUF English Festival Practice Tool)

Scrib is a real-time multiplayer word puzzle game designed specifically as a practice tool for the **Manuel S. Enverga University Foundation (MSEUF) English Festival**. 

While originally inspired by classic crossword dice games, this specific branch/project has been completely architected to simulate the competitive, high-pressure tournament environment of the English Festival (which utilizes standard Boggle mechanics).

## MSEUF English Festival Rules

### Eligibility & Screening
- The competition is open to all bona fide students of Manuel S. Enverga University Foundation enrolled in specified Languages and Humanities courses under the College of Arts and Sciences.
- **Tournament Format:** Four (4) participants play against each other on a single shared board. The winner of the board advances to the next level.

### Gameplay Mechanics
1. **The Board:** 16 randomized letter cubes are arranged in a 4x4 grid.
2. **The Timer:** Players have exactly **3 minutes** to find as many words as possible.
3. **Forming Words:**
   - Words are formed by tracing a contiguous path through adjacent cubes (horizontally, vertically, or diagonally).
   - You cannot skip or jump across the board.
   - You cannot use the *exact same* letter block more than once in a single word.
4. **Scoring Rubric:** Score is determined purely by word length, not letter rarity.
   - **3 or 4 letters:** 1 point
   - **5 letters:** 2 points
   - **6 letters:** 3 points
   - **7 letters:** 5 points
   - **8 or more letters:** 11 points

## Features
- **Real-Time Multiplayer:** Synchronized game starts, live countdown timers, and instant score broadcasting powered by Django Channels (WebSockets).
- **Tournament Rooms:** Create custom room codes to play synchronously against up to 3 other friends.
- **Strict Validation:** The backend uses Depth-First Search (DFS) pathfinding to verify the word exists on the contiguous 4x4 board, cross-referenced against the official tournament dictionary (TWL06).
- **Responsive UI:** Dark mode support, live interactive leaderboard, and error feedback for invalid traces.

## Tech Stack
### Frontend (Client)
- React 19, TypeScript, Vite
- TailwindCSS v4
- WebSockets (Native Hook)
- Axios & Lucide React

### Backend (API)
- Python 3.10+
- Django 5
- Django Channels (Asynchronous WebSockets)
- Daphne (ASGI Server)
- SQLite (Development)

## Setup Instructions

### 1. Backend Setup
Navigate to the backend directory, create a virtual environment, and run the ASGI server.

```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Start the Daphne ASGI server (runs on port 8001 for WebSockets)
daphne -p 8001 config.asgi:application
```

### 2. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and start the Vite development server.

```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

The frontend will start on http://localhost:5173. 

## License
This project is licensed under the MIT License.
