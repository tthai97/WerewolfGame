import React, { useState, useEffect } from "react";

export default function GameNarrator({
  phase,
  config,
  players,
  message,
  currentNightRole,
  onPlayerAction,
  onPlayerVote,
  onPhaseComplete,
  onVotingComplete,
}) {
  const [currentNarration, setCurrentNarration] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phaseStep, setPhaseStep] = useState(0);
  const [seerReveal, setSeerReveal] = useState(null); // { playerId, role }
  const [seerRevealTimer, setSeerRevealTimer] = useState(null);

  const aliveCount = players.filter((p) => p.alive).length;
  const werewolfCount = players.filter(
    (p) => p.alive && p.role === "werewolf"
  ).length;
  const villagerCount = aliveCount - werewolfCount;

  // Determine timer based on phase
  const getTimer = () => {
    switch (phase) {
      case "night":
        return config.nightTime || 30;
      case "day":
        return config.discussionTime || 120;
      case "voting":
        return config.votingTime || 60;
      default:
        return 10;
    }
  };

  useEffect(() => {
    setTimeLeft(getTimer());
    initializePhase();
    // eslint-disable-next-line
  }, [phase]);

  useEffect(() => {
    if (timeLeft <= 0 && phaseStep > 0) {
      handlePhaseComplete();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, phaseStep]);

  function initializePhase() {
    if (phase === "night") {
      if (currentNightRole) {
        const narration = `🌙 ${currentNightRole.label}, it's your turn. Choose your action.`;
        speak(narration);
      } else {
        speak(`🌙 All night actions complete. Morning is coming.`);
      }
      setPhaseStep(1);
    } else if (phase === "day") {
      const narrations = [
        `☀️ Morning arrives. The town wakes up.`,
        message || `Everyone discusses and debates.`,
      ];
      speak(narrations[0]);
      setPhaseStep(1);
    } else if (phase === "voting") {
      speak(`Now it's time to vote. Everyone votes for who to eliminate.`);
      setPhaseStep(1);
    }
  }

  function speak(text) {
    setCurrentNarration(text);
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function handlePhaseComplete() {
    window.speechSynthesis.cancel();
    if (phase === "voting") {
      onVotingComplete();
    } else {
      onPhaseComplete();
    }
  }

  const renderPhaseContent = () => {
    if (phase === "night") {
      if (!currentNightRole) {
        return (
          <div className="game-section">
            <h2>🌙 Night Phase Complete</h2>
            <p className="narration">All night actions have been completed.</p>
            <div className="timer-display">
              <button onClick={onPhaseComplete} className="action-button">
                Proceed to Day
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="game-section">
          <h2>🌙 Night Phase - {currentNightRole.label}</h2>
          <p className="narration">{currentNarration}</p>

          <div className="phase-info">
            <p>
              🐺 Werewolves: {werewolfCount} | 👥 Villagers: {villagerCount}
            </p>
          </div>

          <div className="players-grid">
            {currentNightRole.players
              .filter((p) => p.alive)
              .map((p) => (
                <div key={p.id} className="player-card active-turn">
                  <div className="player-number">{p.name}</div>

                {/* Seer Reveal Display */}
                {currentNightRole.role === "seer" &&
                  seerReveal &&
                  seerReveal.playerId === p.id && (
                    <div className="seer-reveal-popup">
                      <div className="reveal-content">
                        <div className="reveal-title">Role Revealed:</div>
                        <div className="reveal-role">{seerReveal.role}</div>
                        <div className="reveal-timer">
                          {seerRevealTimer > 0 && `${seerRevealTimer}s`}
                        </div>
                      </div>
                    </div>
                  )}

                {!p.hasActed ? (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const targetPlayer = players.find(
                          (pl) => pl.id === Number(e.target.value)
                        );
                        onPlayerAction(p.id, e.target.value);

                        // If Seer, show the reveal
                        if (currentNightRole.role === "seer" && targetPlayer) {
                          setSeerReveal({
                            playerId: p.id,
                            targetId: Number(e.target.value),
                            role: targetPlayer.roleLabel,
                          });
                          setSeerRevealTimer(5);

                          // Start countdown
                          const interval = setInterval(() => {
                            setSeerRevealTimer((prev) => {
                              if (prev <= 1) {
                                clearInterval(interval);
                                return 0;
                              }
                              return prev - 1;
                            });
                          }, 1000);
                        }
                      }
                    }}
                    className="action-select"
                    autoFocus
                  >
                    <option value="">Select target...</option>
                    {players.map((target) =>
                      target.alive && target.id !== p.id ? (
                        <option key={target.id} value={target.id}>
                          {target.name}
                        </option>
                      ) : null
                    )}
                  </select>
                ) : (
                  <div className="acted-badge">✓ Action Set</div>
                )}
              </div>
            ))}
          </div>

          <div className="timer-display">
            <div className="timer-text">
              Phase ends in: {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
          </div>
        </div>
      );
    } else if (phase === "day") {
      return (
        <div className="game-section">
          <h2>☀️ Day Phase - Discussion</h2>
          <p className="narration">{currentNarration}</p>

          <div className="status-board">
            <h3>Player Status</h3>
            <div className="status-list">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`status-item ${!p.alive ? "dead" : "alive"}`}
                >
                  <span className="status-name">{p.name}</span>
                  <span className="status-indicator">
                    {p.alive ? "✓ Alive" : "✗ Eliminated"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="phase-info">
            <p>
              🐺 Werewolves: {werewolfCount} | 👥 Villagers: {villagerCount}
            </p>
          </div>

          <div className="timer-display">
            <div className="timer-text">
              Discussion time: {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
            {phaseStep > 0 && (
              <button onClick={() => onPhaseComplete()} className="action-button">
                Move to Voting
              </button>
            )}
          </div>
        </div>
      );
    } else if (phase === "voting") {
      return (
        <div className="game-section">
          <h2>🗳️ Voting Phase</h2>
          <p className="narration">Everyone votes now!</p>

          <div className="players-grid">
            {players.map((p) => (
              <div
                key={p.id}
                className={`player-card ${!p.alive ? "eliminated" : ""} ${
                  p.hasActed ? "has-voted" : ""
                }`}
              >
                <div className="player-number">{p.name}</div>
                {p.alive && (
                  <div>
                    {!p.hasActed ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onPlayerVote(p.id, e.target.value);
                          }
                        }}
                        className="action-select"
                      >
                        <option value="">Vote for...</option>
                        {players.map((target) =>
                          target.alive && target.id !== p.id ? (
                            <option key={target.id} value={target.id}>
                              {target.name}
                            </option>
                          ) : null
                        )}
                      </select>
                    ) : (
                      <div className="voted-badge">✓ Voted</div>
                    )}
                  </div>
                )}
                {!p.alive && <div className="eliminated-badge">✗ Eliminated</div>}
              </div>
            ))}
          </div>

          <div className="timer-display">
            <div className="timer-text">
              Voting time: {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
            {phaseStep > 0 && (
              <button onClick={onVotingComplete} className="action-button">
                Execute Vote
              </button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="narrator-container">
      {isSpeaking && <div className="speaking-indicator">🔊 Speaking...</div>}
      {renderPhaseContent()}
    </div>
  );
}
