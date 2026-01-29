import React, { useState, useEffect } from "react";

export default function NightPhaseWerewolves({
  players,
  nightTime,
  onComplete,
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [narration, setNarration] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(nightTime);

  const werewolves = players.filter((p) => p.role === "werewolf" && p.alive);
  // Hide all werewolves from the target list, not just the first one
  const villagers = players.filter((p) => p.alive && p.role !== "werewolf");

  const canAct = werewolves.length > 0;

  useEffect(() => {
    const roleMsg = "Werewolves, wake up. Choose who to eliminate.";
    if (!canAct) {
      setNarration("🌙 No Werewolves alive tonight.");
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
    // Record selection but do not speak the selected player's name
    setNarration("Selection recorded. Waiting for night phase to end.");
  }

  return (
    <div className="game-section night-phase">
      <h2>🐺 Werewolves - Choose Your Victim</h2>
      <p className="narration">{narration}</p>

      {isSpeaking && <div className="speaking-indicator">🔊 Speaking...</div>}

      <div className="target-selection">
        <h3>Select a player to eliminate:</h3>
        <div className="players-grid">
          {villagers.map((p) => (
            <button
              key={p.id}
              className={`target-button ${selectedTarget === p.id ? "selected" : ""}`}
              onClick={() => canAct && handleSelect(p.id)}
              disabled={!canAct}
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
