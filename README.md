# Scrib

Scrib is a shortened word for Scribbage. It is a fast-paced, full-stack word puzzle game inspired by Scrabble. Build interconnected words against a 3-minute clock using a random assortment of 13 letters and wildcards. The project demonstrates a production-grade architecture combining React and Django REST Framework.

## Features

- Time Pressure: Players have 3 minutes to arrange 13 random tiles into valid words.
- Strict Validation: The backend uses Depth-First Search (DFS) to ensure the board is contiguous and validates all horizontal/vertical words against a 170k+ word dictionary (TWL06).
- Drag and Drop: Built with dnd-kit for seamless tile arrangement.
- Responsive UI: Fully playable on both Desktop and Mobile devices.
- Accessibility: Keyboard navigation support and screen reader announcements for visually impaired players.
- Global Leaderboard: Compete for the highest score based on word length and tile usage.

## Tech Stack

### Frontend (Client)

- React 18
- TypeScript
- Vite
- TailwindCSS
- dnd-kit (Drag and drop mechanics)
- Axios

### Backend (API)

- Python 3
- Django 5
- Django REST Framework (DRF)
- SQLite (Development) / PostgreSQL (Production)
- django-cors-headers

## Forking and Setup Instructions

To contribute to or modify Scribbage, follow these steps to fork the repository and set it up locally.

### 1. Fork and Clone

1. Click the "Fork" button at the top right of this repository on GitHub.
2. Clone your forked repository to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/Scrib.git
cd Scrib
```

### 2. Backend Setup

Navigate to the backend directory, create a virtual environment, and run the Django server.

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

# Start the development server (runs on port 8005)
python manage.py runserver 8005
```

### 3. Frontend Setup

Open a new terminal window, navigate to the frontend directory, and start the Vite development server.

```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

The frontend will start on http://localhost:5173. By default, it will look for the backend API at http://127.0.0.1:8005/api.

## Playing the Game

1. Enter your name in the input field.
2. Click "Start" to roll 13 random dice.
3. Drag tiles from the Tray onto the Grid to form intersecting words.
4. If you place a Joker (blank tile), you will be prompted to assign it a letter.
5. You can use the "Recall All" button to pull all tiles back to the Tray.
6. Click "Submit" before the 3-minute timer runs out.
7. The backend will validate your board. If valid, your score will be added to the Global Leaderboard.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
