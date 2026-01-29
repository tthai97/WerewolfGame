import React, { useState } from "react";

export default function RoleAssignment({ players, onComplete }) {
  const [revealedPlayer, setRevealedPlayer] = useState(null);
  const [allRevealed, setAllRevealed] = useState({});

  function handlePlayerClick(player) {
    setRevealedPlayer(revealedPlayer?.id === player.id ? null : player);
  }

  function handleConfirmViewed(playerId) {
    setAllRevealed((prev) => ({ ...prev, [playerId]: true }));
  }

  const allPlayersViewed = players.every((p) => allRevealed[p.id]);

  return (
    <div className="game-section role-assignment">
      <h2>🔐 Role Assignment</h2>
      <p className="narration">
        Each player will now secretly view their role. Click on your name to see your role, then click OK.
      </p>

      <div className="role-cards-grid">
        {players.map((player) => (
          <div key={player.id} className="role-card-container">
            <div
              className={`role-card ${revealedPlayer?.id === player.id ? "revealed" : ""} ${
                allRevealed[player.id] ? "confirmed" : ""
              }`}
              onClick={() => handlePlayerClick(player)}
            >
              <div className="role-card-content">
                {revealedPlayer?.id === player.id ? (
                  <>
                    <div className="role-display">{player.roleLabel}</div>
                    <div className="role-description">
                      {getRoleDescription(player.roleLabel)}
                    </div>
                  </>
                ) : (
                  <div className="role-card-name">{player.name}</div>
                )}
              </div>
            </div>

            {revealedPlayer?.id === player.id && !allRevealed[player.id] && (
              <button
                className="confirm-button"
                onClick={() => {
                  handleConfirmViewed(player.id);
                  setRevealedPlayer(null);
                }}
              >
                OK, I saw my role
              </button>
            )}

            {allRevealed[player.id] && (
              <div className="viewed-badge">✓ Viewed</div>
            )}
          </div>
        ))}
      </div>

      {allPlayersViewed && (
        <div className="role-assignment-actions">
          <button className="start-button" onClick={onComplete}>
            All Players Ready - Start Game
          </button>
        </div>
      )}

      {!allPlayersViewed && (
        <p className="progress-text">
          {Object.keys(allRevealed).length} of {players.length} players have viewed their role
        </p>
      )}
    </div>
  );
}

function getRoleDescription(roleLabel) {
  const descriptions = {
    Werewolf: "Eliminate a player each night",
    Seer: "Discover a player's role each night",
    Bodyguard: "Protect one player each night",
    Witch: "Save or poison once per game",
    Hunter: "Eliminate someone when eliminated",
    Villager: "Work together to find the werewolves",
  };
  return descriptions[roleLabel] || "Help the village";
}
