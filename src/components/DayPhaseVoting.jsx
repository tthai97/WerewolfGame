import React, { useState, useEffect } from "react";

export default function DayPhaseVoting({
  players,
  discussionTime,
  votingTime,
  onVotingComplete,
  lastNightVictim,
}) {
  const [phase, setPhase] = useState("discussion");
  const [timeLeft, setTimeLeft] = useState(discussionTime);
  const [votes, setVotes] = useState({});
  const [skips, setSkips] = useState([]);
  const [viewingRolePlayer, setViewingRolePlayer] = useState(null);

  // Show all players rows, but only alive players can vote.
  const allPlayers = players;
  const votingPlayers = players.filter((p) => p.alive);
  const allVotersVoted = votingPlayers.every((p) => votes[p.id] !== undefined);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (phase === "discussion") {
            setPhase("voting");
            setTimeLeft(votingTime);
          } else if (phase === "voting") {
            // Time's up, finalize votes
            onVotingComplete(votes, skips);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, discussionTime, votingTime, votes, skips, onVotingComplete]);

  const handleVote = (voterId, targetId) => {
    setVotes((prev) => ({
      ...prev,
      [voterId]: targetId,
    }));
  };

  const handleSkip = (voterId) => {
    setVotes((prev) => {
      const updated = { ...prev };
      delete updated[voterId];
      return updated;
    });
    setSkips((prev) => {
      if (prev.includes(voterId)) {
        return prev.filter((id) => id !== voterId);
      }
      return [...prev, voterId];
    });
  };

  const handleFinalizeVotes = () => {
    onVotingComplete(votes, skips);
  };

  const countVotes = () => {
    const counts = {};
    Object.values(votes).forEach((targetId) => {
      if (targetId) {
        counts[targetId] = (counts[targetId] || 0) + 1;
      }
    });
    return counts;
  };

  const voteCounts = countVotes();
  const voteCount = Object.values(votes).filter(Boolean).length;
  const skipCount = skips.length;
  // Support multiple last-night victims (array) for future roles that can eliminate at night
  const lastNightVictims = Array.isArray(lastNightVictim)
    ? lastNightVictim
    : lastNightVictim
    ? [lastNightVictim]
    : [];
  const isLastNightVictim = (id) => lastNightVictims.some((v) => v && v.id === id);

  return (
    <div className="game-section">
      <div className="phase-header">
        <h2>
          {phase === "discussion"
            ? "☀️ Day Phase - Discussion"
            : "🗳️ Day Phase - Voting"}
        </h2>
        <div className="phase-timer">
          <span className="timer-label">
            {phase === "discussion" ? "Discussion" : "Voting"} Time
          </span>
          <span className="timer-value">{timeLeft}s</span>
        </div>
      </div>

      {/* Moderator controls: skip discussion or finalize voting early */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        {phase === "discussion" && (
          <button className="action-button" onClick={() => { setPhase("voting"); setTimeLeft(votingTime); }}>
            Skip to Voting
          </button>
        )}
        {phase === "voting" && (
          <button className="action-button" onClick={() => onVotingComplete(votes, skips)}>
            Finalize Votes Now
          </button>
        )}
      </div>

      {phase === "discussion" && (
        <div className="discussion-info">
          <p>Discuss who should be eliminated today.</p>
        </div>
      )}

      {phase === "voting" && (
        <div className="voting-info">
          <p>Cast your votes or skip to abstain.</p>
          <div className="vote-summary">
            <span>Votes: {voteCount}</span>
            <span>Skips: {skipCount}</span>
          </div>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <button
              className="action-button"
              onClick={() => setViewingRolePlayer((s) => (s ? null : -1))}
              style={{ fontSize: "0.9em", padding: "0.5em 1em" }}
            >
              {viewingRolePlayer !== null ? "Close Role Viewer" : "View Player Role"}
            </button>
          </div>
        </div>
      )}

      {viewingRolePlayer === -1 && phase === "voting" && (
        <div className="role-viewer">
          <h3>Select a player to view their role</h3>
          <div className="players-grid">
            {allPlayers.map((p) => (
              <button
                key={p.id}
                className="target-button"
                onClick={() => setViewingRolePlayer(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewingRolePlayer && viewingRolePlayer > 0 && phase === "voting" && (
        <div className="role-viewer">
          <div className="reveal-content">
            <div className="reveal-title">{allPlayers.find((p) => p.id === viewingRolePlayer)?.name}'s Role:</div>
            <div className="reveal-role" style={{ fontSize: "2.5em", marginTop: "1rem" }}>
              {allPlayers.find((p) => p.id === viewingRolePlayer)?.roleLabel}
            </div>
            <button
              className="action-button"
              onClick={() => setViewingRolePlayer(-1)}
              style={{ marginTop: "1rem" }}
            >
              Back to Player List
            </button>
          </div>
        </div>
      )}

      <div className="voting-container">
        {allPlayers.map((voter) => (
          <div key={voter.id} className="voter-row">
            <span className="voter-name">{voter.name}:</span>
            <div className="vote-buttons">
              {allPlayers
                .filter((p) => p.alive && p.id !== voter.id)
                .map((target) => (
                  <button
                    key={target.id}
                    className={`vote-button ${
                      votes[voter.id] === target.id ? "selected" : ""
                    }`}
                    onClick={() => phase === "voting" && voter.alive && handleVote(voter.id, target.id)}
                    disabled={phase === "discussion" || !voter.alive}
                  >
                    {target.name}
                    {voteCounts[target.id] && (
                      <span className="vote-count">{voteCounts[target.id]}</span>
                    )}
                  </button>
                ))}
              <button
                className={`skip-button ${skips.includes(voter.id) ? "selected" : ""}`}
                onClick={() => phase === "voting" && voter.alive && handleSkip(voter.id)}
                disabled={phase === "discussion" || !voter.alive}
              >
                Skip
              </button>
              {!voter.alive && <div className="eliminated-badge">✗ Eliminated</div>}
              {isLastNightVictim(voter.id) && (
                <div className="last-night-badge">⚠️ Eliminated Last Night</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {phase === "voting" && allVotersVoted && (
        <button onClick={handleFinalizeVotes} className="action-button">
          Finalize Votes
        </button>
      )}
    </div>
  );
}
