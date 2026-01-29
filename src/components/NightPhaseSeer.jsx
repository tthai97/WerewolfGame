import React, { useState, useEffect } from "react";

export default function NightPhaseSeer({
  players,
  nightTime,
  onComplete,
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [revealedRole, setRevealedRole] = useState(null);
  const [narration, setNarration] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(nightTime);
  const [showReveal, setShowReveal] = useState(false);
  const [revealTimer, setRevealTimer] = useState(5);

  const seer = players.find((p) => p.role === "seer" && p.alive);
  const others = players.filter((p) => p.alive && (seer ? p.id !== seer.id : true));
  const canAct = !!seer;

  useEffect(() => {
    const roleMsg = "Seer, wake up. Choose a player to reveal.";
    if (!seer) {
      setNarration("🌙 No Seer alive tonight.");
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
  }, [timeLeft, selectedTarget, onComplete]);

  useEffect(() => {
    if (!showReveal || revealTimer <= 0) return;
    const timer = setTimeout(() => setRevealTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [revealTimer, showReveal]);

  function speak(text) {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function handleSelect(targetId) {
    const target = players.find((p) => p.id === targetId);
    setSelectedTarget(targetId);
    setRevealedRole(target.roleLabel);
    setShowReveal(true);
    setRevealTimer(5);
    // Show the reveal to the seer UI only. Do not speak the selected player's name or role aloud.
    setNarration("Reveal shown to the Seer. Waiting for night phase to end.");
  }

  return (
    <div className="game-section night-phase">
      <h2>🔮 Seer - Reveal a Role</h2>
      <p className="narration">{narration}</p>

      {isSpeaking && <div className="speaking-indicator">🔊 Speaking...</div>}

      {showReveal && revealTimer > 0 && (
        <div className="seer-reveal-popup">
          <div className="reveal-content">
            <div className="reveal-title">Role Revealed:</div>
            <div className="reveal-role">{revealedRole}</div>
            <div className="reveal-timer">{revealTimer}s</div>
          </div>
        </div>
      )}

      <div className="target-selection">
        <h3>Select a player to reveal:</h3>
        <div className="players-grid">
          {others.map((p) => (
            <button
              key={p.id}
              className={`target-button ${selectedTarget === p.id ? "selected" : ""}`}
              onClick={() => canAct && handleSelect(p.id)}
              disabled={!canAct || selectedTarget !== null}
            >
              <span className="target-name">{p.name}</span>
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
