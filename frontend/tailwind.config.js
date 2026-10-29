/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          bg: '#080E1E',
          panel: '#0D1528',
          surface: '#111C32',
          border: '#243149',
          text: '#E8EEF8',
          muted: '#94A3B8',
          accent: '#38BDF8',
          intel: '#818CF8',
          success: '#34D399',
          warning: '#FBBF24',
          threat: '#FB7185',
        },
        brand: {
          primary: '#38BDF8',
          lime: '#34D399',
          bg: '#080E1E',
          card: '#0D1528',
          white: '#E8EEF8',
        },
        soc: {
          bg: '#080E1E',
          card: '#0D1528',
          cardBorder: '#243149',
          header: '#0D1528',
          cyan: '#38BDF8',
          blue: '#818CF8',
          accent: '#38BDF8',
          crimson: '#FB7185',
          amber: '#FBBF24',
          emerald: '#34D399',
          slate: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(56, 189, 248, 0.25)',
        'glow-intel': '0 0 20px rgba(129, 140, 248, 0.25)',
        'glow-threat': '0 0 20px rgba(251, 113, 133, 0.3)',
        'obsidian-panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px #243149',
        'obsidian-elevated': '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px #243149',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
