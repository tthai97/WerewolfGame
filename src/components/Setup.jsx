import React, { useState, useEffect } from "react";

/*
  Setup component responsibilities:
  - Let user enter totalPlayers
  - Let user set discussionTime (seconds), votingTime (seconds)
  - Let user specify role counts (editable). Ensure sum == totalPlayers.
  - Provide quick-presets (basic Werewolf setup) for convenience.
*/

const DEFAULT_ROLES = [
  { key: "werewolf", label: "Werewolf", default: 1 },
  { key: "seer", label: "Seer", default: 1 },
  { key: "doctor", label: "Doctor", default: 1 },
  { key: "villager", label: "Villager", default: 3 },
];

export default function Setup({ onStart }) {
  const [totalPlayers, setTotalPlayers] = useState(6);
  const [discussionTime, setDiscussionTime] = useState(120); // seconds
  const [votingTime, setVotingTime] = useState(60); // seconds
  const [roles, setRoles] = useState(() =>
    DEFAULT_ROLES.reduce((acc, r) => ({ ...acc, [r.key]: r.default }), {})
  );
  const [error, setError] = useState("");

  useEffect(() => {
    validate();
    // eslint-disable-next-line
  }, [totalPlayers, roles]);

  function validate() {
    const sum = Object.values(roles).reduce((a, b) => a + Number(b), 0);
    if (sum !== Number(totalPlayers)) {
      setError(`Role counts must sum to total players (current sum: ${sum})`);
    } else {
      setError("");
    }
  }

  function changeRole(key, val) {
    setRoles((r) => ({ ...r, [key]: Math.max(0, Number(val)) }));
  }

  function quickPreset(total) {
    // Simple preset logic: 1 werewolf/1 seer/1 doctor/rest villagers
    setTotalPlayers(total);
    setRoles({
      werewolf: 1,
      seer: 1,
      doctor: 1,
      villager: Math.max(0, total - 3),
    });
  }

  function start() {
    const sum = Object.values(roles).reduce((a, b) => a + Number(b), 0);
    if (sum !== Number(totalPlayers)) {
      setError("Please make role counts match total players.");
      return;
    }
    onStart({
      totalPlayers: Number(totalPlayers),
      discussionTime: Number(discussionTime),
      votingTime: Number(votingTime),
      roles: Object.entries(roles).map(([key, count]) => ({
        key,
        count: Number(count),
      })),
    });
  }

  return (
    <div className="card">
      <h2>Game Setup</h2>

      <label>
        Total players:
        <input
          type="number"
          min="1"
          value={totalPlayers}
          onChange={(e) => setTotalPlayers(Number(e.target.value))}
        />
      </label>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <label>
          Discussion (seconds):
          <input
            type="number"
            min="10"
            value={discussionTime}
            onChange={(e) => setDiscussionTime(Number(e.target.value))}
          />
        </label>
        <label>
          Voting (seconds):
          <input
            type="number"
            min="10"
            value={votingTime}
            onChange={(e) => setVotingTime(Number(e.target.value))}
          />
        </label>
      </div>

      <h3>Roles</h3>
      <div className="roles-grid">
        {Object.keys(roles).map((key) => (
          <label key={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)}:
            <input
              type="number"
              min="0"
              value={roles[key]}
              onChange={(e) => changeRole(key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        Quick presets:
        <button onClick={() => quickPreset(6)}>6 players</button>
        <button onClick={() => quickPreset(8)}>8 players</button>
        <button onClick={() => quickPreset(10)}>10 players</button>
      </div>

      {error && <div className="error">{error}</div>}

      <div style={{ marginTop: 12 }}>
        <button onClick={start} disabled={Boolean(error)}>
          Start Game
        </button>
      </div>
    </div>
  );
}