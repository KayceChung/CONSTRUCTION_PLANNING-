import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Modern blue palette - professional and light
        blue: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Brand colors mapped to blue for backward compatibility
        brand: {
          50: '#f0f9ff',    // blue-50
          100: '#e0f2fe',   // blue-100
          200: '#bae6fd',   // blue-200
          500: '#0ea5e9',   // blue-500
          600: '#0284c7',   // blue-600
          700: '#0369a1',   // blue-700
          900: '#0284c7',   // blue-600 (primary)
        }
      }
    }
  },
  plugins: []
} satisfies Config
