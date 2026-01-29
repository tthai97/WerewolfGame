# WerewolfGame
- Create a new React app (Vite recommended) or add these files to your repo.
  - With Vite:
    - npm create vite@latest werewolf -- --template react
    - cd werewolf
    - Replace src/ with the files above
    - npm install
    - npm run dev
  - With Create React App:
    - npx create-react-app werewolf
    - replace src/ files
    - npm start

Notes and optional improvements
- Speech: I used the browser SpeechSynthesis API for quick narration (no audio files required). If you prefer recorded audio cues, replace speak() with HTMLAudioElement plays for mp3 files.
- Moderation: Manual mode lets you step through phases yourself. In automatic mode the narrator will advance.
- Security / UX: In many browsers speech synthesis requires user interaction (click) before allowed. The app provides "Play prompt" button to ensure speech permission is granted.
- Role mechanics: This sample assigns roles randomly and keeps them hidden. You can add a "secret reveal" per-player passphrase or QR code if playing remotely.
- Multiplayer extension: If you want networked players (each sees own role) we can add a server + per-player links and WebSocket messages.

