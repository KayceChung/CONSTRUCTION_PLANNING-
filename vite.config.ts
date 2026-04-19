import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/CONSTRUCTION_PLANNING-/',
  plugins: [react()],
  server: {
    port: 5174
  }
}))
