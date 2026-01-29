import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace '/WerewolfGame/' with '/<repo-name>/' or '/' if using a custom domain or root.
export default defineConfig({
  base: '/WerewolfGame/',
  plugins: [react()],
})