import React, { useState, useEffect } from "react";

const DEFAULT_ROLES = [
  { key: "werewolf", label: "Werewolf", default: 1 },
  { key: "seer", label: "Seer", default: 1 },
  { key: "bodyguard", label: "Bodyguard", default: 1 },
  { key: "witch", label: "Witch", default: 1 },
  { key: "hunter", label: "Hunter", default: 0 },
  { key: "villager", label: "Villager", default: 3 },
];

export default function Setup({ onStart }) {
  // Load saved settings from localStorage if present
  const saved = JSON.parse(window.localStorage.getItem("werewolf_setup_v1") || "null");
  const [playerNames, setPlayerNames] = useState(
    saved?.playerNames?.join(", ") || "Alice, Bob, Carol, David, Emma, Frank"
  );
  const [discussionTime, setDiscussionTime] = useState(saved?.discussionTime ?? 120);
  const [votingTime, setVotingTime] = useState(saved?.votingTime ?? 60);
  const [nightTime, setNightTime] = useState(saved?.nightTime ?? 30);
  const [roles, setRoles] = useState(() => {
    if (saved?.roles) return saved.roles;
    return DEFAULT_ROLES.reduce((acc, r) => ({ ...acc, [r.key]: r.default }), {});
  });
  const [error, setError] = useState("");

  const totalPlayers = playerNames
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean).length;

  useEffect(() => {
    validate();
    // eslint-disable-next-line
  }, [totalPlayers, roles, playerNames]);

  function validate() {
    const sum = Object.values(roles).reduce((a, b) => a + Number(b), 0);
    if (sum !== Number(totalPlayers)) {
      setError(`Role counts must sum to total players (current sum: ${sum})`);
    } else {
      const names = playerNames.split(",").map((n) => n.trim()).filter(Boolean);
      if (names.length !== Number(totalPlayers)) {
        setError(
          `Number of names (${names.length}) must match total players (${totalPlayers})`
        );
      } else {
        setError("");
      }
    }
  }

  function changeRole(key, val) {
    setRoles((r) => ({ ...r, [key]: Math.max(0, Number(val)) }));
  }

  function quickPreset(total) {
    setPlayerNames(
      Array.from({ length: total }, (_, i) => `Player ${i + 1}`).join(", ")
    );
    setRoles({
      werewolf: Math.ceil(total / 6),
      seer: 1,
      bodyguard: 1,
      witch: 1,
      hunter: 0,
      villager: Math.max(0, total - Math.ceil(total / 6) - 3),
    });
  }

  function start() {
    const sum = Object.values(roles).reduce((a, b) => a + Number(b), 0);
    if (sum !== Number(totalPlayers)) {
      setError("Please make role counts match total players.");
      return;
    }

    const names = playerNames.split(",").map((n) => n.trim()).filter(Boolean);
    if (names.length !== Number(totalPlayers)) {
      setError(
        `Number of names (${names.length}) must match total players (${totalPlayers})`
      );
      return;
    }

    onStart({
      totalPlayers: Number(totalPlayers),
      playerNames: names,
      discussionTime: Number(discussionTime),
      votingTime: Number(votingTime),
      nightTime: Number(nightTime),
      roles: Object.entries(roles).map(([key, count]) => ({
        key,
        label: DEFAULT_ROLES.find((r) => r.key === key).label,
        count: Number(count),
      })),
    });
  }

  // persist settings so reload keeps previous values
  useEffect(() => {
    try {
      const payload = {
        playerNames: playerNames.split(",").map((n) => n.trim()).filter(Boolean),
        discussionTime,
        votingTime,
        nightTime,
        roles,
      };
      window.localStorage.setItem("werewolf_setup_v1", JSON.stringify(payload));
    } catch (e) {
      // ignore storage errors
    }
  }, [playerNames, discussionTime, votingTime, nightTime, roles]);

  return (
    <div className="setup-card">
      <div className="setup-content">
        <h2>🐺 Werewolf Game Setup</h2>

        <div className="form-section">
          <label>
            Player Names (comma-separated):
            <textarea
              value={playerNames}
              onChange={(e) => setPlayerNames(e.target.value)}
              rows="3"
              placeholder="Alice, Bob, Carol, David, Emma, Frank"
              style={{
                width: "100%",
                fontFamily: "inherit",
                marginTop: "0.5em",
                padding: "0.5em",
                border: "1px solid #666",
                borderRadius: "4px",
                backgroundColor: "#2d2d4a",
                color: "rgba(255, 255, 255, 0.87)",
              }}
            />
          </label>
          <p style={{ fontSize: "0.9em", color: "#aaa", marginTop: "0.5em" }}>
            Total Players: <strong>{totalPlayers}</strong>
          </p>
        </div>

        <div className="form-section">
          <h3>⏱️ Game Timers</h3>
          <label>
            Night Time (seconds):
            <input
              type="number"
              min="5"
              max="120"
              value={nightTime}
              onChange={(e) => setNightTime(Number(e.target.value))}
            />
          </label>

          <label>
            Discussion Time (seconds):
            <input
              type="number"
              min="10"
              max="300"
              value={discussionTime}
              onChange={(e) => setDiscussionTime(Number(e.target.value))}
            />
          </label>

          <label>
            Voting Time (seconds):
            <input
              type="number"
              min="10"
              max="300"
              value={votingTime}
              onChange={(e) => setVotingTime(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="form-section">
          <h3>👥 Roles Configuration</h3>
          {DEFAULT_ROLES.map((role) => (
            <label key={role.key}>
              {role.label}:
              <input
                type="number"
                min="0"
                value={roles[role.key]}
                onChange={(e) => changeRole(role.key, e.target.value)}
              />
            </label>
          ))}
        </div>

        <div className="form-section">
          <h3>⚡ Quick Presets</h3>
          <div className="preset-buttons">
            <button onClick={() => quickPreset(4)}>4 Players</button>
            <button onClick={() => quickPreset(6)}>6 Players</button>
            <button onClick={() => quickPreset(8)}>8 Players</button>
            <button onClick={() => quickPreset(10)}>10 Players</button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="start-button"
          onClick={start}
          disabled={Boolean(error)}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}