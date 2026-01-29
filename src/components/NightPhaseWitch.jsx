import React, { useState, useEffect } from "react";

export default function NightPhaseWitch({
  players,
  victim,
  nightTime,
  witchActions,
  onComplete,
}) {
  const [action, setAction] = useState(null);
  const [targetChoice, setTargetChoice] = useState(null);
  const [narration, setNarration] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(nightTime);

  const witch = players.find((p) => p.role === "witch" && p.alive);
  const canSave = witchActions.includes("save");
  const canPoison = witchActions.includes("poison");
  // Allow the Witch to target themselves, but only save alive players
  const saveTargets = players.filter((p) => p.alive);
  const poisonTargets = players.filter((p) => p.alive);
  const canAct = !!witch;

  useEffect(() => {
    let msg = "Witch, wake up. ";
    if (victim) {
      msg += `A player was targeted for elimination. `;
    }
    if (canSave && canPoison) {
      msg += "You may save or poison.";
    } else if (canSave) {
      msg += "You may save someone.";
    } else if (canPoison) {
      msg += "You may poison someone.";
    } else {
      msg += "Your potions are used.";
    }
    
    // UI display shows "No Witch" if absent, but always speak the full instruction
    if (!witch) {
      setNarration("🌙 No Witch alive tonight.");
    } else {
      setNarration("🌙 " + msg);
    }
    speak(msg);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(action, targetChoice);
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

  function handleAction(actionType, targetId) {
    setAction(actionType);
    setTargetChoice(targetId);
    const msg = actionType === "save" ? "Save action recorded." : actionType === "poison" ? "Poison action recorded." : "Skipping potions.";
    setNarration(msg);
    // Record action but wait for timeout or skip button
  }

  return (
    <div className="game-section night-phase">
      <h2>🧪 Witch - Use Your Potions</h2>
      <p className="narration">{narration}</p>

      {isSpeaking && <div className="speaking-indicator">🔊 Speaking...</div>}

      {victim && (
        <div className="phase-info">
          <p>⚠️ {victim.name} is targeted for elimination.</p>
        </div>
      )}

      {!canSave && !canPoison && (
        <div style={{ color: "#ff6b6b", marginBottom: "1rem" }}>
          Your potions have been used. You have no actions left.
        </div>
      )}

      {(canSave || canPoison) && (
        <div className="witch-actions">
          {canSave && (
            <div className="action-group">
              <h3>💚 Save Someone</h3>
              <div className="players-grid">
                {saveTargets.map((p) => (
                  <button
                    key={p.id}
                    className="target-button"
                    onClick={() => canAct && handleAction("save", p.id)}
                    disabled={!canAct}
                  >
                    <span className="target-name">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {canPoison && (
            <div className="action-group">
              <h3>💀 Poison Someone</h3>
              <div className="players-grid">
                {poisonTargets.map((p) => (
                  <button
                    key={p.id}
                    className="target-button danger"
                    onClick={() => canAct && handleAction("poison", p.id)}
                    disabled={!canAct}
                  >
                    <span className="target-name">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              className="action-button"
              onClick={() => { setAction("skip"); setTargetChoice(null); setNarration("Skipping both potions."); }}
              style={{ flex: 1, minWidth: "150px" }}
            >
              Skip Both Potions
            </button>
            <button
              className="action-button"
              onClick={() => onComplete(action, targetChoice)}
              style={{ flex: 1, minWidth: "150px", backgroundColor: "#ff9800" }}
            >
              Skip to Next Phase
            </button>
          </div>
        </div>
      )}

      <div className="timer-display">
        <div className="timer-text">
          Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
