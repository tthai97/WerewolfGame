import React, { useState, useEffect } from "react";

export default function NightPhaseBodyguard({
  players,
  lastProtected,
  nightTime,
  onComplete,
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [narration, setNarration] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(nightTime);

  const bodyguard = players.find((p) => p.role === "bodyguard" && p.alive);
  // Allow protecting any alive player including the bodyguard themself
  const others = players.filter((p) => p.alive);
  const canAct = !!bodyguard;

  useEffect(() => {
    const roleMsg = "Bodyguard, wake up. Choose a player to protect.";
    if (!bodyguard) {
      setNarration("🌙 No Bodyguard alive tonight.");
    } else {
      setNarration("🌙 " + roleMsg);
    }
    speak(roleMsg);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(selectedTarget);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  function speak(text) {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function handleSelect(targetId) {
    setSelectedTarget(targetId);
    // Record protection but do not announce the protected player's name aloud.
    setNarration("Protection recorded. Waiting for night phase to end.");
  }

  return (
    <div className="game-section night-phase">
      <h2>🛡️ Bodyguard - Protect Someone</h2>
      <p className="narration">{narration}</p>

      {isSpeaking && <div className="speaking-indicator">🔊 Speaking...</div>}

      {lastProtected && (
        <p style={{ color: "#ffd700", marginBottom: "1rem" }}>
          ⚠️ You protected {players.find((p) => p.id === lastProtected)?.name} last night. You cannot choose them again.
        </p>
      )}

      <div className="target-selection">
        <h3>Select a player to protect:</h3>
        <div className="players-grid">
          {others.map((p) => (
            <button
              key={p.id}
              className={`target-button ${selectedTarget === p.id ? "selected" : ""}`}
              onClick={() => canAct && handleSelect(p.id)}
              disabled={!canAct || lastProtected === p.id}
            >
              <span className="target-name">{p.name}</span>
              {lastProtected === p.id && <span className="disabled-label">Last night</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="timer-display">
        <div className="timer-text">
          Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
        <button onClick={() => onComplete(selectedTarget)} className="action-button">
          Skip to Next Phase
        </button>
      </div>
    </div>
  );
}
