import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Snipeify/', // ✅ Must match your GitHub repo name exactly
  plugins: [react()],
})
