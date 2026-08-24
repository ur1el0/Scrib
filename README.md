# Scribbage

Scribbage is a modern, full-stack, open-source web application for playing a competitive crossword dice game. Built for speed, responsiveness, and accessibility, this project demonstrates a production-grade architecture combining React (Vite) and Django REST Framework.

## Features
- 🎲 **Interactive Gameplay:** Roll 13 letter dice and drag/click to place them on a 15x15 board.
- ⏱️ **Real-Time Timer:** 3-minute rounds synchronized via client state.
- 🏆 **Global Leaderboard:** Compete for the highest score.
- 📱 **Fully Responsive:** Optimized for both desktop and mobile platforms with native touch support.
- ♿ **Accessible:** Full keyboard navigation (Tab, Enter, Space) and ARIA support.
- 💾 **Offline Resilience:** State is cached in `localStorage`—if you refresh, you don't lose your game!

## Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide React
- **Backend:** Django, Django REST Framework, Python
- **Database:** PostgreSQL (Production) / SQLite (Development)

## Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the server (Port 8005)
python manage.py runserver 8005
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Setup environment variables (copy .env.example to .env)
cp .env.example .env

# Start the Vite development server
npm run dev
```

## Contributing
Contributions are welcome! Please create a feature branch and submit a Pull Request. Ensure that you adhere to the granular, feature-based commit strategy.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
