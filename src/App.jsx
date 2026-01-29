import React, { useState } from "react";
import Setup from "./components/Setup";
import Game from "./components/Game";
import "./App.css";

export default function App() {
  const [config, setConfig] = useState(null);

  return (
    <div className="app-container">
      <h1>🐺 Werewolf Moderator</h1>
      {!config && <Setup onStart={(c) => setConfig(c)} />}
      {config && <Game config={config} onReset={() => setConfig(null)} />}
      <footer style={{ marginTop: 20, color: "#888", fontSize: "0.9em" }}>
        Built for quick local play. Uses browser speech synthesis for narration.
      </footer>
    </div>
  );
}