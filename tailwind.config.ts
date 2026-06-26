import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06b6d4',
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          DEFAULT: '#2563eb',
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success:  { DEFAULT: '#10b981', light: '#d1fae5' },
        warning:  { DEFAULT: '#f59e0b', light: '#fef3c7' },
        danger:   { DEFAULT: '#ef4444', light: '#fee2e2' },
        sidebar:  { DEFAULT: '#0c1829', surface: '#162035' },
        surface:  { DEFAULT: '#ffffff', 2: '#f8fafc', 3: '#f1f5f9' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        glow:    '0 0 40px rgba(6,182,212,0.18)',
        'glow-sm':'0 0 16px rgba(6,182,212,0.14)',
        card:    '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover':'0 4px 24px rgba(6,182,212,0.14)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #06b6d4, #2563eb)',
        'gradient-dark':    'linear-gradient(135deg, #0c1829, #162035)',
        'gradient-card':    'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))',
        'grid-pattern': `linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)`,
      },
    },
  },
  plugins: [],
}

export default config
