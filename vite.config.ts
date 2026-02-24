import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set VITE_BASE=/ if deploying to root domain repo (username.github.io)
// Default: /healthflow-demo/ for a project repo
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/healthflow-demo/',
})
