# Scrib

Scrib is a real-time multiplayer word-building game. Players join a room, share a 4×4 letter board, and make words before the three-minute timer ends.

## How to play

1. Enter your name and create a room, or join with a room code.
2. The room host starts the round. Everyone receives the same board.
3. Submit words made from the board tiles.

A word must have at least three letters, appear in the bundled TWL06 word list, and use only tiles on the board. Tiles can be used in any order and each tile can be used once. The Q tile is displayed as Qu and supplies both letters together.

Each letter in a valid word is worth one point. For example, CAT is worth 3 points. A player cannot score the same word twice. At the end of the round, the game shows words that could be made but were not submitted.

## How the word check works

The backend copies the board tiles into a list. It reads the submitted word from left to right and looks for a matching unused tile. When it finds one, it removes that tile from the list. If it cannot find a tile for any letter, the word is rejected.

The backend also checks the word length and looks for the word in the bundled list of more than 170,000 words. Since tiles do not need to touch, there is no path search or recursion.

At the end of the round, the backend checks each word in the word list against the board tiles to find missed words. This simple full-list scan is easier to follow, but can take longer than a trie-based search.

## How multiplayer works

- The API creates rooms and adds players.
- Each player's browser opens a WebSocket connection for the room.
- The backend sends the board, timer updates, score updates, and final results to everyone in that room.
- Django stores rooms, players, and submitted words in SQLite by default.
- The local Channels layer is in memory. Redis and Celery are not used by the current game flow.

## Technology

- Frontend: React, TypeScript, Vite, Tailwind CSS, Axios
- Backend: Python, Django REST Framework, Django Channels, WebSockets
- Database: SQLite by default

## Where to look in the code

- frontend/src/App.tsx — game screens, board, and leaderboard.
- frontend/src/useWebSocketLite.ts — live room connection.
- backend/game/consumers.py — room messages, timer, and score broadcasts.
- backend/game/logic.py — board generation, word checking, and scoring.
- backend/game/models.py — rooms, players, and submitted words.
- backend/game/twl06.txt — word list used for validation.

## Run locally

Start the backend in one terminal:

~~~bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8001
~~~

Start the frontend in another terminal:

~~~bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
~~~

Open <http://127.0.0.1:5173/>. The frontend connects to the backend on port 8001 by default.

## License

This project is licensed under the MIT License.
