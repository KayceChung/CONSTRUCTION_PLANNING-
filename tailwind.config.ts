import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#1e3a5f',
          500: '#3f76b4',
          400: '#60a5fa',
          100: '#eff6ff'
        }
      }
    }
  },
  plugins: []
} satisfies Config
