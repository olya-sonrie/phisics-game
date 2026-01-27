import { onValue, ref, set, update } from 'firebase/database'
import { useEffect, useState } from 'react'
import './App.css'
import coordinatesData from './data/coordinates.json'
import { db } from './firebase'

// --- ТИПИ ---

type TeamName = 'ρ (Густина)' | 'F (Сила)' | 'p (Тиск)' | 'A (Робота)'
const TEAMS_ORDER: TeamName[] = ['ρ (Густина)', 'F (Сила)', 'p (Тиск)', 'A (Робота)']

interface Player {
  team: TeamName
  name: string
  uid: string
  pos: number
  isSkipping: boolean
  isActive: boolean
}

interface GameState {
  players: Record<string, Player>
  currentTurnIndex: number
  logs: string[]
  winner: string | null
  lastDice: number | null
}

interface Coord {
  x: number
  y: number
}
interface SpecialNode {
  type: 'green' | 'blue' | 'red'
  target?: number
}

// --- КОНСТАНТИ ---
const QUESTIONS: Record<number, string> = {
  4: 'Труба – це фізичне тіло чи речовина?',
  10: 'Чому човен відплив від берега?',
  19: 'Чому ми відчуваємо запах квітів?',
  21: 'Чому Незнайко летить?',
  30: 'Чому можна набрати воду в шприц?',
  31: 'Як вимірюють тиск?',
  38: 'Чому важко переміщувати ящик?',
  46: 'Чому в гідравліку ллють масло?',
  48: 'Звідки сила у Поспішайка?',
  51: 'Як літають змії?',
  56: 'Чому куля летить вгору?',
  63: 'Чому важко йти?',
  83: 'Якою лопатою легше копати?',
  87: 'Як полегшити працю?',
}

const SPECIAL_NODES: Record<number, SpecialNode> = {
  4: { type: 'green', target: 14 },
  15: { type: 'red' },
  21: { type: 'green', target: 25 },
  31: { type: 'blue', target: 28 },
  38: { type: 'blue', target: 35 },
  71: { type: 'red' },
  73: { type: 'red' },
  79: { type: 'red' },
  81: { type: 'red' },
}

const INITIAL_STATE: GameState = {
  players: {
    'ρ (Густина)': { team: 'ρ (Густина)', name: '', uid: '', pos: 1, isSkipping: false, isActive: false },
    'F (Сила)': { team: 'F (Сила)', name: '', uid: '', pos: 1, isSkipping: false, isActive: false },
    'p (Тиск)': { team: 'p (Тиск)', name: '', uid: '', pos: 1, isSkipping: false, isActive: false },
    'A (Робота)': { team: 'A (Робота)', name: '', uid: '', pos: 1, isSkipping: false, isActive: false },
  },
  currentTurnIndex: 0,
  logs: ['Гру створено'],
  winner: null,
  lastDice: null,
}

// --- КОМПОНЕНТ ---

export default function App() {
  // Локальні дані
  const [myId, setMyId] = useState<string>('')
  const [myName, setMyName] = useState<string>('')

  // Сесія
  const [sessionId, setSessionId] = useState<string>('')
  const [inputSessionId, setInputSessionId] = useState<string>('')

  // UI Flags
  const [isNameEntered, setIsNameEntered] = useState(false)
  const [isSessionLocked, setIsSessionLocked] = useState(false)

  // Game State
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myTeam, setMyTeam] = useState<TeamName | null>(null)
  const [coords, setCoords] = useState<Record<number, Coord>>(coordinatesData as any)
  const [modalData, setModalData] = useState<{ pos: number; text: string; special?: SpecialNode } | null>(null)

  // --- АДМІН (LOGIN PAGE) ---
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassInput, setAdminPassInput] = useState('')

  // Dev
  const [devMode, setDevMode] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  // 1. INITIALIZATION
  useEffect(() => {
    let storedId = localStorage.getItem('phys_game_uid')
    if (!storedId) {
      storedId = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('phys_game_uid', storedId)
    }
    setMyId(storedId)

    const storedName = localStorage.getItem('phys_game_name')
    if (storedName) {
      setMyName(storedName)
      setIsNameEntered(true)
    }

    const storedSession = localStorage.getItem('phys_game_session')
    if (storedSession) {
      setInputSessionId(storedSession)
      setSessionId(storedSession)
      setIsSessionLocked(true)
    }
  }, [])

  // 2. CONNECT TO DB
  useEffect(() => {
    if (!sessionId || !myId) return

    const gameRef = ref(db, `games/${sessionId}`)

    const unsubscribeGame = onValue(
      gameRef,
      snapshot => {
        const data = snapshot.val()

        if (data) {
          setGameState(data)
          if (!myTeam) {
            TEAMS_ORDER.forEach(t => {
              const player = data.players[t]
              if (player.isActive && player.uid === myId) {
                setMyTeam(t)
                if (player.name !== myName && !isNameEntered) {
                  setMyName(player.name)
                  setIsNameEntered(true)
                }
              }
            })
          }
        } else {
          set(gameRef, INITIAL_STATE).catch(err => setLoadingError(err.message))
        }
      },
      error => setLoadingError('Помилка доступу: ' + error.message),
    )

    return () => unsubscribeGame()
  }, [sessionId, myId, myTeam])

  // --- ACTIONS ---

  const handleLoginSubmit = () => {
    if (!myName.trim()) return alert("Введіть ім'я!")
    if (!inputSessionId.trim()) return alert('Введіть код кімнати!')

    const cleanSessionId = inputSessionId
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
    setMyName(myName)
    setSessionId(cleanSessionId)
    setIsNameEntered(true)
    setIsSessionLocked(true)
    localStorage.setItem('phys_game_name', myName)
    localStorage.setItem('phys_game_session', cleanSessionId)
  }

  const handleAdminReset = async () => {
    if (!inputSessionId.trim()) return alert('Введіть код кімнати!')
    if (adminPassInput !== 'admin123') return alert('Невірний пароль!')

    const cleanSessionId = inputSessionId
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')

    if (window.confirm(`Ви точно хочете скинути гру в кімнаті "${cleanSessionId}"? Всі гравці будуть викинуті.`)) {
      try {
        await set(ref(db, `games/${cleanSessionId}`), INITIAL_STATE)
        alert('Гру успішно скинуто!')
        setShowAdminLogin(false)
        setAdminPassInput('')
      } catch (e: any) {
        alert('Помилка: ' + e.message)
      }
    }
  }

  const leaveSessionOnly = () => {
    localStorage.removeItem('phys_game_session')
    setSessionId('')
    setInputSessionId('')
    setIsSessionLocked(false)
    setMyTeam(null)
    setGameState(null)
  }

  const joinGame = (team: TeamName) => {
    if (!gameState) return
    if (gameState.players[team].isActive && gameState.players[team].uid !== myId) {
      alert('Ця команда вже зайнята!')
      return
    }
    update(ref(db, `games/${sessionId}/players/${team}`), {
      name: myName,
      uid: myId,
      isActive: true,
    })
    setMyTeam(team)
  }

  // --- GAME LOGIC ---

  const rollDice = () => {
    if (!gameState || !myTeam) return
    const currentTeamName = TEAMS_ORDER[gameState.currentTurnIndex]
    if (gameState.players[currentTeamName].uid !== myId) return alert('Зараз не твій хід!')

    const player = gameState.players[myTeam]
    if (player.isSkipping) {
      logMove(`Гравець ${player.name} пропускає хід.`)
      updatePlayerState(myTeam, { isSkipping: false })
      passTurn()
      return
    }

    const roll = Math.floor(Math.random() * 6) + 1
    update(ref(db, `games/${sessionId}`), { lastDice: roll })
    let nextPos = player.pos + roll
    if (nextPos >= 92) nextPos = 92
    handleMoveLogic(nextPos)
  }

  const handleMoveLogic = (targetPos: number) => {
    if (!gameState || !myTeam) return
    const player = gameState.players[myTeam]

    if (targetPos === 92) {
      logMove(`${player.name} дістався БУДИНОЧКА! Перемога!`)
      updatePlayerState(myTeam, { pos: 92 })
      update(ref(db, `games/${sessionId}`), { winner: myTeam })
      return
    }

    const special = SPECIAL_NODES[targetPos]
    const questionText = QUESTIONS[targetPos]

    if (questionText || (special && (special.type === 'green' || special.type === 'blue'))) {
      setModalData({ pos: targetPos, text: questionText || 'Запитання Незнайка!', special })
      updatePlayerState(myTeam, { pos: targetPos })
      logMove(`${player.name} перейшов на ${targetPos} і думає над питанням.`)
    } else if (special && special.type === 'red') {
      logMove(`${player.name} потрапив на червоне поле ${targetPos}. Пропуск ходу.`)
      updatePlayerState(myTeam, { pos: targetPos, isSkipping: true })
      passTurn()
    } else {
      logMove(`${player.name} перейшов на ${targetPos}.`)
      updatePlayerState(myTeam, { pos: targetPos })
      passTurn()
    }
  }

  const handleAnswer = (isCorrect: boolean) => {
    if (!gameState || !myTeam || !modalData) return
    const { pos, special } = modalData
    let finalPos = pos
    let logMsg = ''

    if (!special) {
      logMsg = isCorrect ? 'відповів правильно.' : 'відповів неправильно.'
    } else {
      if (special.type === 'green') {
        if (isCorrect) {
          finalPos = special.target || pos
          logMsg = `відповів правильно і стрибнув на ${finalPos}!`
        } else logMsg = 'відповів неправильно.'
      } else if (special.type === 'blue') {
        if (isCorrect) logMsg = 'відповів правильно і врятувався.'
        else {
          finalPos = special.target || pos
          logMsg = `відповів неправильно і скотився на ${finalPos}.`
        }
      }
    }
    logMove(`${gameState.players[myTeam].name} ${logMsg}`)
    updatePlayerState(myTeam, { pos: finalPos })
    setModalData(null)
    passTurn()
  }

  const passTurn = () => {
    if (!gameState) return
    let nextIndex = (gameState.currentTurnIndex + 1) % 4
    let loops = 0
    while (!gameState.players[TEAMS_ORDER[nextIndex]].isActive && loops < 4) {
      nextIndex = (nextIndex + 1) % 4
      loops++
    }
    update(ref(db, `games/${sessionId}`), { currentTurnIndex: nextIndex })
  }

  const updatePlayerState = (team: TeamName, updates: Partial<Player>) => {
    update(ref(db, `games/${sessionId}/players/${team}`), updates)
  }

  const logMove = (msg: string) => {
    const newLogs = [msg, ...(gameState?.logs || [])].slice(0, 30)
    update(ref(db, `games/${sessionId}`), { logs: newLogs })
  }

  // --- RENDER ---

  // 1. LOGIN SCREEN + ADMIN
  if (!isSessionLocked || !isNameEntered) {
    return (
      <div className="center-screen login-bg">
        <div className="card">
          <h1>Незнайко: Онлайн</h1>

          {!showAdminLogin ? (
            // ЗВИЧАЙНИЙ ВХІД
            <>
              <div style={{ textAlign: 'left', marginBottom: 15 }}>
                <label>Твоє ім'я:</label>
                <input
                  value={myName}
                  onChange={e => setMyName(e.target.value)}
                  placeholder="Іван"
                  className="big-input"
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: 15 }}>
                <label>Код кімнати (наприклад 7-А):</label>
                <input
                  value={inputSessionId}
                  onChange={e => setInputSessionId(e.target.value)}
                  placeholder="TEST"
                  className="big-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <button className="enter-btn" onClick={handleLoginSubmit}>
                УВІЙТИ
              </button>

              <div style={{ marginTop: 20 }}>
                <button className="text-link" onClick={() => setShowAdminLogin(true)}>
                  Вхід для адміна (Вчителя)
                </button>
              </div>
            </>
          ) : (
            // АДМІН ВХІД
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h3 style={{ color: '#c0392b' }}>Режим Адміністратора</h3>
              <p style={{ fontSize: '0.9em' }}>Введіть код кімнати, яку треба скинути</p>

              <div style={{ textAlign: 'left', marginBottom: 15 }}>
                <label>Код кімнати:</label>
                <input
                  value={inputSessionId}
                  onChange={e => setInputSessionId(e.target.value)}
                  placeholder="TEST"
                  className="big-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ textAlign: 'left', marginBottom: 15 }}>
                <label>Пароль адміна:</label>
                <input
                  type="password"
                  value={adminPassInput}
                  onChange={e => setAdminPassInput(e.target.value)}
                  className="big-input"
                />
              </div>

              <button className="enter-btn" style={{ background: '#c0392b' }} onClick={handleAdminReset}>
                ⚠️ СКИНУТИ ГРУ
              </button>

              <button className="text-link" style={{ marginTop: 15 }} onClick={() => setShowAdminLogin(false)}>
                Назад до входу
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loadingError) return <div className="center-screen error">{loadingError}</div>
  if (!gameState) return <div className="center-screen">Завантаження світу...</div>

  // 2. LOBBY
  if (!myTeam) {
    return (
      <div className="lobby">
        <div className="lobby-header">
          <div>
            <h1>Кімната: {sessionId}</h1>
            <p>Привіт, {myName}!</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={leaveSessionOnly} className="logout-btn">
              Змінити кімнату
            </button>
          </div>
        </div>
        <h2>Обери команду:</h2>
        <div className="team-list">
          {TEAMS_ORDER.map(team => {
            const p = gameState.players[team]
            const isTaken = p.isActive && p.uid !== myId
            const isMe = p.uid === myId
            return (
              <button
                key={team}
                disabled={isTaken}
                onClick={() => joinGame(team)}
                className={`team-btn ${isTaken ? 'taken' : 'free'} ${isMe ? 'rejoin' : ''}`}
                style={{ borderColor: getTeamColor(team) }}
              >
                <b>{team}</b>
                <br />
                {isTaken ? (isMe ? '(ПОВЕРНУТИСЬ)' : `(Грає: ${p.name})`) : '(Вільно)'}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 3. MAIN GAME UI
  const currentTeamName = TEAMS_ORDER[gameState.currentTurnIndex]
  const isMyTurn = myTeam === currentTeamName

  return (
    <div className="game-container">
      <div className="sidebar">
        <div className="header-info">
          <div>
            Кімната: <strong>{sessionId}</strong>
            <br />
            Гравець: <strong>{myName}</strong>
          </div>
          <button onClick={leaveSessionOnly} className="leave-btn">
            Вихід
          </button>
        </div>

        <div className="players-list">
          <h3>Команди:</h3>
          {TEAMS_ORDER.map(t => {
            const p = gameState.players[t]
            if (!p.isActive) return null
            const isActiveTurn = t === currentTeamName
            return (
              <div
                key={t}
                className={`player-card ${isActiveTurn ? 'active-turn' : ''}`}
                style={{ borderLeftColor: getTeamColor(t) }}
              >
                <div>
                  {p.name} ({t})
                </div>
                <small>Позиція: {p.pos}</small>
                {p.isSkipping && <span className="badge-skip">Пропуск</span>}
              </div>
            )
          })}
        </div>

        <div className="controls">
          {gameState.winner ? (
            <div className="winner-box">
              🏆 Перемога: <br /> {gameState.players[gameState.winner as TeamName].name}!
            </div>
          ) : (
            <>
              <div className="dice-display">🎲 {gameState.lastDice || '-'}</div>
              <div className="turn-info">
                {isMyTurn ? (
                  <span style={{ color: '#2ecc71' }}>ТВІЙ ХІД!</span>
                ) : (
                  `Хід: ${gameState.players[currentTeamName].name}`
                )}
              </div>
              <button className="roll-btn" disabled={!isMyTurn || !!modalData} onClick={rollDice}>
                КИНУТИ КУБИК
              </button>
            </>
          )}
        </div>

        <div className="game-logs">
          {gameState.logs?.map((l, i) => (
            <div key={i} className="log-entry">
              {l}
            </div>
          ))}
        </div>

        {/* MAP EDIT TOGGLE */}
        <div style={{ marginTop: 'auto' }}>
          <label className="dev-toggle">
            <input type="checkbox" onChange={e => setDevMode(e.target.checked)} /> Режим редагування
          </label>
          {devMode && (
            <button
              onClick={() => {
                console.log(JSON.stringify(coords, null, 2))
                alert('Координати в консолі (F12)')
              }}
              style={{ width: '100%', marginTop: 5, padding: 5, fontSize: '0.8em', cursor: 'pointer' }}
            >
              💾 Експорт JSON
            </button>
          )}
        </div>
      </div>

      <div className="map-area">
        <div
          className="map-wrapper"
          onClick={e => {
            if (!devMode) return
            const rect = e.currentTarget.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            const num = prompt('Номер клітинки?')
            if (num) {
              const newCoords = { ...coords, [num]: { x, y } }
              setCoords(newCoords)
              console.log(`"${num}": { "x": ${x.toFixed(2)}, "y": ${y.toFixed(2)} },`)
            }
          }}
        >
          <img src="/game.jpeg" alt="Map" className="map-img" />
          {TEAMS_ORDER.map((t, idx) => {
            const p = gameState.players[t]
            if (!p.isActive || !coords[p.pos]) return null
            return (
              <div
                key={t}
                className="player-token"
                style={{
                  left: `calc(${coords[p.pos].x}% + ${idx * 5}px)`,
                  top: `calc(${coords[p.pos].y}% + ${idx * 5}px)`,
                  backgroundColor: getTeamColor(t),
                }}
              >
                {t[0]}
              </div>
            )
          })}
          {devMode &&
            Object.entries(coords).map(([num, pos]) => (
              <div key={num} className="debug-dot" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                {num}
              </div>
            ))}
        </div>
      </div>

      {modalData && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modalData.text}</h2>
            <div className="buttons">
              <button className="btn-green" onClick={() => handleAnswer(true)}>
                Правильно
              </button>
              <button className="btn-red" onClick={() => handleAnswer(false)}>
                Неправильно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getTeamColor(team: TeamName) {
  switch (team) {
    case 'ρ (Густина)':
      return '#e74c3c'
    case 'F (Сила)':
      return '#3498db'
    case 'p (Тиск)':
      return '#2ecc71'
    case 'A (Робота)':
      return '#9b59b6'
    default:
      return 'gray'
  }
}
