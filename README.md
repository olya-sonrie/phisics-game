# Незнайко: Онлайн (Physics Game)

An interactive educational board game about physics concepts, featuring the beloved character Neznaiko (Незнайко). Players move around a game board answering physics questions about density (ρ), force (F), pressure (p), and work (A).

## 🎮 Game Features

- **Multiplayer Online**: Up to 4 teams can play simultaneously
- **Real-time Gameplay**: Built with Firebase Realtime Database
- **Educational Content**: Physics questions integrated into gameplay
- **Interactive Board**: Visual game map with special tiles
- **Team-based Play**: Four physics-themed teams to choose from
- **Admin Controls**: Teacher/admin can reset game sessions

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd physics-game

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:3000`

### Building for Production

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

## 🎯 How to Play

1. **Join a Room**: Enter your name and room code (e.g., "7-A")
2. **Choose a Team**: Select from four physics-themed teams:
   - ρ (Густина) - Density (Red)
   - F (Сила) - Force (Blue) 
   - p (Тиск) - Pressure (Green)
   - A (Робота) - Work (Purple)
3. **Take Turns**: Roll the dice and move around the board
4. **Answer Questions**: Land on question tiles to answer physics problems
5. **Special Tiles**:
   - 🟢 Green: Correct answers advance you forward
   - 🔵 Blue: Wrong answers send you backward
   - 🔴 Red: Skip your next turn
6. **Win**: First player to reach position 92 wins!

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Database**: Firebase Realtime Database
- **Styling**: CSS with custom properties
- **Linting**: ESLint with TypeScript support

## 📁 Project Structure

```
src/
├── App.tsx          # Main game component
├── App.css          # Game styling
├── firebase.ts      # Firebase configuration
├── main.tsx         # React entry point
├── assets/
│   └── game.jpeg    # Game board image
└── data/
    └── coordinates.json  # Board position coordinates
```

## 🔧 Configuration

### Firebase Setup

The game uses Firebase Realtime Database. The configuration is in `src/firebase.ts`. To use your own Firebase project:

1. Create a new Firebase project
2. Enable Realtime Database
3. Replace the config object in `firebase.ts`

### Game Customization

- **Questions**: Edit the `QUESTIONS` object in `App.tsx`
- **Special Tiles**: Modify `SPECIAL_NODES` for different game mechanics
- **Board Layout**: Update `coordinates.json` for tile positions
- **Teams**: Customize team names and colors in the component

## 👨‍🏫 Admin Features

Teachers can access admin mode to:
- Reset game sessions
- Clear all players from a room
- Start fresh games

Access admin mode from the login screen with password: `admin123`

## 🎨 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Style

The project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

## 🌐 Deployment

The project is configured for GitHub Pages deployment with base path `/phisics-game/`. To deploy elsewhere, update the `base` setting in `vite.config.ts`.

## 📝 License

This project is private and intended for educational use.

## 🤝 Contributing

This is an educational project. For suggestions or improvements, please create an issue or submit a pull request.
