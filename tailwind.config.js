/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          primary: '#B8860B',
          bright: '#C9A84C',
          muted: '#2A1F00',
          border: '#8B6914',
        },
        green: {
          primary: '#4CAF7D',
          glow: '#1E3D2F',
          muted: '#2D5A3D',
        },
        red: {
          primary: '#E05252',
          glow: '#3D1E1E',
        },
        bg: {
          primary: '#0a0a0a',
          card: '#141414',
          cardHover: '#1a1a1a',
        },
        border: {
          default: '#222222',
          subtle: '#1e1e1e',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8B8B8B',
          muted: '#555555',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}