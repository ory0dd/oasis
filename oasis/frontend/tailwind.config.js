/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: 'rgba(var(--accent-rgb), <alpha-value>)',
        emerald: {
          50: 'rgba(var(--accent-rgb), <alpha-value>)',
          100: 'rgba(var(--accent-rgb), <alpha-value>)',
          200: 'rgba(var(--accent-rgb), <alpha-value>)',
          300: 'rgba(var(--accent-rgb), <alpha-value>)',
          400: 'rgba(var(--accent-rgb), <alpha-value>)',
          500: 'rgba(var(--accent-rgb), <alpha-value>)',
          600: 'rgba(var(--accent-rgb), <alpha-value>)',
          700: 'rgba(var(--accent-rgb), <alpha-value>)',
          800: 'rgba(var(--accent-rgb), <alpha-value>)',
          900: 'rgba(var(--accent-rgb), <alpha-value>)',
          950: 'rgba(var(--accent-rgb), <alpha-value>)',
          DEFAULT: 'rgba(var(--accent-rgb), <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin-slow 20s linear infinite',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
