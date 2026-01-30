import React, { useState, useEffect } from "react";
import RoleAssignment from "./RoleAssignment";
import DayPhaseVoting from "./DayPhaseVoting";
import NightPhaseWerewolves from "./NightPhaseWerewolves";
import NightPhaseSeer from "./NightPhaseSeer";
import NightPhaseBodyguard from "./NightPhaseBodyguard";
import NightPhaseWitch from "./NightPhaseWitch";
// Hunter acts only when they die; no separate night phase

export default function Game({ config, onReset }) {
  const [gameState, setGameState] = useState("roleAssignment");
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState("");
  
  // Night phase tracking
  const [nightQueue, setNightQueue] = useState([]);
  const [currentNightRole, setCurrentNightRole] = useState(null);
  const [lastNightVictim, setLastNightVictim] = useState(null);
  const [bodyguardProtects, setBodyguardProtects] = useState({});
  const [isBodyguardProtected, setIsBodyguardProtected] = useState(false);
  const [witchActions, setWitchActions] = useState(["save", "poison"]);
  const [isWitchProtected, setIsWitchProtected] = useState(false);
  const [pendingNightDeaths, setPendingNightDeaths] = useState([]);
  const [nightStartPlayers, setNightStartPlayers] = useState([]);
  
  // Day phase tracking
  const [dayVotes, setDayVotes] = useState({});
  const [hunterShot, setHunterShot] = useState(null);
  const [hunterShotCause, setHunterShotCause] = useState(null);
  const [hunterShotTimeLeft, setHunterShotTimeLeft] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  // Apply pending deaths when entering hunterShot state
  useEffect(() => {
    if (gameState === "hunterShot" && pendingNightDeaths.length > 0) {
      const allDeaths = [...pendingNightDeaths];
      
      // Also include werewolf kill if not protected
      if (lastNightVictim) {
        // const wasProtected = bodyguardProtects[round] === lastNightVictim.id;
        const isBodyguardAlive = players.some((p) => p.alive && p.role === "bodyguard");
        const isWitchAlive = players.some((p) => p.alive && p.role === "witch");
        const wasProtectedByBodyguard = bodyguardProtects[round] === lastNightVictim.id;
        const wasProtectedByWitch = isWitchAlive && isWitchProtected;
        console.log(`🌙 Night victim: ${lastNightVictim.name}`);
        console.log(`Bodyguard alive: ${isBodyguardAlive} | Bodyguard protected: ${wasProtectedByBodyguard}`);
        console.log(`Witch alive: ${isWitchAlive} | Witch protected: ${wasProtectedByWitch}`);
        if (!wasProtectedByBodyguard && !wasProtectedByWitch) {
          allDeaths.push(lastNightVictim.id);
        }
      }
      
      const finalDeaths = Array.from(new Set(allDeaths));
      
      if (finalDeaths.length > 0) {
        setPlayers((prev) =>
          prev.map((p) => (finalDeaths.includes(p.id) ? { ...p, alive: false } : p))
        );
      }
      
      setPendingNightDeaths([]);
    }
  }, [gameState, pendingNightDeaths, lastNightVictim, bodyguardProtects, round, isBodyguardProtected, isWitchProtected, players]);

  // Auto-select for hunterShot if timeout expires
  useEffect(() => {
    if (gameState !== "hunterShot" || !hunterShot) return;
    
    // Speak when entering hunterShot
    const hunterMsg = `${hunterShot.name} is the Hunter! You were eliminated. Choose one more player to eliminate with you.`;
    const utterance = new SpeechSynthesisUtterance(hunterMsg);
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    
    console.log(`🏹 HUNTER SHOT: ${hunterShot.name} (${hunterShotCause === "night" ? "eliminated at night" : "voted out during day"})`);
    
    const totalSeconds = config.nightTime || 30;
    setHunterShotTimeLeft(totalSeconds);
    
    const timer = setInterval(() => {
      setHunterShotTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time expired, auto-select
          const choices = players.filter((p) => p.alive && p.id !== hunterShot.id);
          if (choices.length === 0) {
            handleHunterShot(null);
            return 0;
          }
          const rand = choices[Math.floor(Math.random() * choices.length)];
          console.log(`🏹 Hunter ${hunterShot.name} auto-selected: ${rand.name} (timeout)`);
          handleHunterShot(rand.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, hunterShot]);


  function initializeGame() {
    const roleList = [];
    config.roles.forEach((role) => {
      for (let i = 0; i < role.count; i++) {
        roleList.push({ key: role.key, label: role.label });
      }
    });

    const shuffled = roleList.sort(() => Math.random() - 0.5);
    const newPlayers = config.playerNames.map((name, idx) => ({
      id: idx + 1,
      name,
      role: shuffled[idx].key,
      roleLabel: shuffled[idx].label,
      alive: true,
    }));

    // Console logs for game start
    console.log("🎮 WEREWOLF GAME STARTED");
    console.log("⚙️ Game Settings:", {
      nightTime: config.nightTime,
      discussionTime: config.discussionTime,
      votingTime: config.votingTime,
      totalPlayers: config.playerNames.length,
      roles: config.roles,
    });
    console.log("👥 Player Roles:");
    newPlayers.forEach((p) => {
      console.log(`  ${p.name} -> ${p.roleLabel} (${p.role})`);
    });

    setPlayers(newPlayers);
    setGameState("roleAssignment");
  }

  function handleRoleAssignmentComplete() {
    startNight();
  }

  function startNight() {
    setGameState("night");
    buildNightQueue();
    setDayVotes({});
    setNightStartPlayers(players);
    setPendingNightDeaths([]);
  }

  function buildNightQueue() {
    // Build night queue based on roles that have players assigned
    // Hunter has no night action; they act only if eliminated
    const roleList = ["werewolf", "seer", "bodyguard", "witch"];
    const sequence = roleList.filter((role) => players.some((p) => p.role === role));
    setNightQueue(sequence);
    setCurrentNightRole(sequence.length > 0 ? sequence[0] : null);
    setLastNightVictim(null);
  }

  function handleNightRoleComplete(action, targetId) {
    let accumulatedPoisons = [...pendingNightDeaths];
    let isWitchProtectedLocal;

    if (currentNightRole === "werewolf" && targetId) {
      const victim = players.find((p) => p.id === targetId);
      console.log(`🐺 Werewolves selected: ${victim?.name}`);
      setLastNightVictim(victim);
    } else if (currentNightRole === "werewolf") {
      console.log(`🐺 Werewolves skipped`);
    }
    
    if (currentNightRole === "bodyguard" && targetId) {
      const target = players.find((p) => p.id === targetId);
      console.log(`🛡️ Bodyguard selected: ${target?.name}`);
      if (lastNightVictim && targetId === lastNightVictim.id) {
        setIsBodyguardProtected(true);
        console.log(`💚 Bodyguard protected: ${target?.name}`);
        console.log(`💚 Bodyguard protected: ${isBodyguardProtected}`);
      }
      setBodyguardProtects((prev) => ({
        ...prev,
        [round]: targetId,
      }));
    } else if (currentNightRole === "bodyguard") {
      console.log(`🛡️ Bodyguard skipped`);
    }

    if (currentNightRole === "witch" && action && action !== "skip") {
      const target = players.find((p) => p.id === targetId);
      console.log(`🧙 Witch action: ${action} on ${target?.name}`);
      setWitchActions((prev) => prev.filter((a) => a !== action));
      if (action === "save") {
        // Save protects the target, canceling werewolf kill if they were targeted
        if (lastNightVictim && targetId === lastNightVictim.id) {
          isWitchProtectedLocal = true;
          setLastNightVictim(null);
          setIsWitchProtected(true);
          console.log(`💚 Witch saved: ${target?.name}`);
          console.log(`💚 Witch saved: ${lastNightVictim}`);
        }
      } else if (action === "poison") {
        // Accumulate poison target locally
        accumulatedPoisons.push(targetId);
      }
    } else if (currentNightRole === "witch") {
      console.log(`🧙 Witch skipped`);
    }

    if (currentNightRole === "seer" && targetId) {
      const target = players.find((p) => p.id === targetId);
      console.log(`🔮 Seer selected: ${target?.name} (${target?.roleLabel})`);
    } else if (currentNightRole === "seer") {
      console.log(`🔮 Seer skipped`);
    }

    // Move to next role or day
    const nextIndex = nightQueue.indexOf(currentNightRole) + 1;
    if (nextIndex < nightQueue.length) {
      setCurrentNightRole(nightQueue[nextIndex]);
      // Update pending deaths with accumulated poisons
      setPendingNightDeaths(accumulatedPoisons);
    } else {
      // Build final deaths list: include accumulated poisons
      let finalDeaths = [...accumulatedPoisons];

      // Apply werewolf kill if not saved
      if (lastNightVictim) {
        // const wasProtected = bodyguardProtects[round] === lastNightVictim.id;
        const isBodyguardAlive = players.some((p) => p.alive && p.role === "bodyguard");
        const isWitchAlive = players.some((p) => p.alive && p.role === "witch");
        const wasProtectedByBodyguard = bodyguardProtects[round] === lastNightVictim.id;
        const wasProtectedByWitch = isWitchAlive && isWitchProtectedLocal;
        console.log(`🌙 Night victim: ${lastNightVictim.name}`);
        console.log(`Bodyguard alive: ${isBodyguardAlive} | Bodyguard protected: ${wasProtectedByBodyguard}`);
        console.log(`Witch alive: ${isWitchAlive} | Witch protected: ${wasProtectedByWitch}`);
        if (!wasProtectedByBodyguard && !wasProtectedByWitch) {
          finalDeaths.push(lastNightVictim.id);
        } else {
          console.log(`${lastNightVictim.name} was protected by the Bodyguardor Witch!`);
          setMessage(`${lastNightVictim.name} was protected by the Bodyguardor Witch!`);
        }

        // const aliveWolves = players.some((p) => p.alive && p.role === "werewolf").length;
        // const isBodyguardAlive = players.some((p) => p.alive && p.role === "bodyguard");
        // const isWitchAlive = players.some((p) => p.alive && p.role === "witch");
        // const isBodyguardProtectedSucceed = isBodyguardAlive && isBodyguardProtected;
        // const isWitchProtectedSucceed = isWitchAlive && isWitchProtected;
        // console.log(`🌙 Night victim: ${lastNightVictim.name}`);
        // console.log(`Bodyguard alive: ${isBodyguardAlive} | Bodyguard protected: ${isBodyguardProtected}`);
        // console.log(`Witch alive: ${isWitchAlive} | Witch protected: ${isWitchProtected}`);
        // setIsWitchProtected(true);
        // console.log(`💚 Witch saved hihi: ${isWitchProtected}`);
        // console.log(`💚 isBodyguardProtected hihi: ${isBodyguardProtected}`);
        // if (!isBodyguardProtectedSucceed && !isWitchProtectedSucceed) {
        //   finalDeaths.push(lastNightVictim.id);
        // } else {
        //   console.log(`${lastNightVictim.name} was protected by the Bodyguard (${isBodyguardProtectedSucceed}) or Witch (${isWitchProtectedSucceed})!`);
        //   setMessage(`${lastNightVictim.name} was protected by the Bodyguard (${isBodyguardProtectedSucceed}) or Witch (${isWitchProtectedSucceed})!`);
        // }
      }

      // Remove duplicates
      finalDeaths = Array.from(new Set(finalDeaths));
      console.log(`🌙 Night phase complete. Deaths: ${finalDeaths.length > 0 ? finalDeaths.map((id) => players.find((p) => p.id === id)?.name).join(", ") : "None"}`);

      // Check if Hunter died BEFORE applying deaths
      let hunterDied = null;
      if (finalDeaths.length > 0) {
        hunterDied = finalDeaths.find((id) => {
          const original = nightStartPlayers.find((p) => p.id === id);
          return original && original.role === "hunter";
        });
      }

      if (finalDeaths.length > 0) {
        // Apply all deaths at once
        setPlayers((prev) =>
          prev.map((p) => (finalDeaths.includes(p.id) ? { ...p, alive: false } : p))
        );

        // If Hunter died, trigger hunterShot
        if (hunterDied) {
          const hunter = nightStartPlayers.find((p) => p.id === hunterDied);
          setHunterShot(hunter);
          setHunterShotCause("night");
          // DO NOT clear pendingNightDeaths here; let useEffect handle it
          setGameState("hunterShot");
          return;
        }
      }

      // Clear pending deaths and proceed to day
      setPendingNightDeaths([]);
      startDay();
    }
  }

  function startDay() {
    setGameState("day");
  }

  function handleDayVote(votes, skips) {
    setDayVotes(votes);
    const voteCount = Object.values(votes).filter(Boolean).length;
    const skipCount = skips.length;

    if (voteCount > skipCount) {
      // Execute by vote
      const voteCounts = {};
      Object.values(votes).forEach((vote) => {
        if (vote) {
          voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        }
      });

      let targetId = Object.keys(voteCounts)[0];
      const maxVotes = Math.max(...Object.values(voteCounts));
      const tied = Object.keys(voteCounts).filter((id) => voteCounts[id] === maxVotes);
      
      if (tied.length > 1) {
        targetId = tied[Math.floor(Math.random() * tied.length)];
      }

      const victim = players.find((p) => p.id === Number(targetId));
      if (victim) {
        // Check if Hunter
        if (victim.role === "hunter") {
          setHunterShot(victim);
          setHunterShotCause("day");
          setGameState("hunterShot");
          return;
        }

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === victim.id ? { ...p, alive: false } : p
          )
        );
        setMessage(`${victim.name} was eliminated by vote.`);
      }
    } else {
      setMessage("Votes did not pass. No one was eliminated.");
    }

    setGameState("results");
  }

  function handleHunterShot(targetId) {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === targetId) return { ...p, alive: false };
        if (p.id === hunterShot.id) return { ...p, alive: false };
        return p;
      })
    );
    const target = players.find((p) => p.id === targetId);
    const message = `Hunter ${hunterShot.name} eliminated ${target?.name} before dying.`;
    setMessage(message);
    console.log(`🏹 Hunter ${hunterShot.name} selected: ${target?.name || "no one"}`);
    
    // Decide next phase based on cause
    const cause = hunterShotCause;
    // clear hunterShot state
    setHunterShot(null);
    setHunterShotCause(null);

    if (cause === "night") {
      // After night-triggered hunter shot, proceed to Day
      startDay();
    } else {
      // After day-triggered hunter shot (voted), proceed to Night
      startNight();
    }
  }

  function nextRound() {
    if (checkGameOver()) {
      setGameState("gameover");
      return;
    }
    setRound((prev) => prev + 1);
    startNight();
  }

  function checkGameOver() {
    const aliveWolves = players.filter((p) => p.alive && p.role === "werewolf").length;
    const aliveVillagers = players.filter((p) => p.alive && p.role !== "werewolf").length;

    if (aliveWolves === 0) {
      setWinner("villagers");
      return true;
    }
    if (aliveWolves >= aliveVillagers) {
      setWinner("werewolves");
      return true;
    }
    return false;
  }

  const renderContent = () => {
    switch (gameState) {
      case "roleAssignment":
        return (
          <RoleAssignment players={players} onComplete={handleRoleAssignmentComplete} />
        );

      case "night":
        if (!currentNightRole) {
          return (
            <div className="game-section">
              <h2>🌙 Night Phase Complete</h2>
              <button onClick={() => startDay()} className="action-button">
                Proceed to Day
              </button>
            </div>
          );
        }

        if (currentNightRole === "werewolf") {
          return (
            <NightPhaseWerewolves
              players={players}
              nightTime={config.nightTime}
              onComplete={(targetId) => handleNightRoleComplete("kill", targetId)}
            />
          );
        }

        if (currentNightRole === "seer") {
          return (
            <NightPhaseSeer
              players={players}
              nightTime={config.nightTime}
              onComplete={(targetId) => handleNightRoleComplete("reveal", targetId)}
            />
          );
        }

        if (currentNightRole === "bodyguard") {
          return (
            <NightPhaseBodyguard
              players={players}
              lastProtected={bodyguardProtects[round]}
              nightTime={config.nightTime}
              onComplete={(targetId) => handleNightRoleComplete("protect", targetId)}
            />
          );
        }

        if (currentNightRole === "witch") {
          return (
            <NightPhaseWitch
              players={players}
              victim={lastNightVictim}
              nightTime={config.nightTime}
              witchActions={witchActions}
              onComplete={(action, targetId) => handleNightRoleComplete(action, targetId)}
            />
          );
        }

      case "day":
        return (
          <DayPhaseVoting
            players={players}
            discussionTime={config.discussionTime}
            votingTime={config.votingTime}
            onVotingComplete={handleDayVote}
            lastNightVictim={lastNightVictim}
          />
        );

      case "hunterShot":
        return (
          <div className="game-section">
            <h2>🏹 Hunter's Final Shot</h2>
            <p className="narration">
              <strong>{hunterShot?.name}</strong> is the <strong>Hunter</strong>!
              <br />
              You were eliminated. Choose one more player to eliminate with you.
            </p>
            <div className="players-grid">
              {players
                .filter((p) => p.alive && p.id !== hunterShot?.id)
                .map((p) => (
                  <button
                    key={p.id}
                    className="target-button"
                    onClick={() => handleHunterShot(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
            </div>
            <div className="timer-display">
              <div className="timer-text">
                Time left: {Math.floor(hunterShotTimeLeft / 60)}:{String(hunterShotTimeLeft % 60).padStart(2, "0")}
              </div>
              <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#999" }}>
                If no selection is made, a random player will be chosen.
              </p>
            </div>
          </div>
        );

      case "results":
        return (
          <div className="game-section">
            <h2>📊 Round {round} Results</h2>
            {message && <p className="message">{message}</p>}
            <div className="status-board">
              <h3>Player Status</h3>
              <div className="status-list">
                {players.map((p) => (
                  <div key={p.id} className={`status-item ${!p.alive ? "dead" : "alive"}`}>
                    <span className="status-name">{p.name}</span>
                        <span className="status-indicator">
                          {p.alive ? "✓ Alive" : "✗ Eliminated"}
                        </span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={nextRound} className="action-button">
              Next Round
            </button>
          </div>
        );

      case "gameover":
        return (
          <div className="game-section gameover">
            <h2>Game Over!</h2>
            <p className="winner-text">
              {winner === "werewolves" ? "🐺 Werewolves win!" : "👥 Villagers win!"}
            </p>
            <div className="status-board">
              <h3>Final Roles</h3>
              <div className="status-list">
                {players.map((p) => (
                  <div key={p.id} className={`status-item ${!p.alive ? "dead" : "alive"}`}>
                    <span className="status-name">{p.name}</span>
                    <span className="status-role">{p.roleLabel}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={onReset} className="action-button">
              New Game
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🐺 Werewolf Game</h1>
        {gameState !== "roleAssignment" && (
          <div className="game-info">
            <span>Round {round}</span>
            <span>Phase: {gameState}</span>
          </div>
        )}
      </div>
      {renderContent()}
    </div>
  );
}