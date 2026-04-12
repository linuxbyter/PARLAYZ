/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      animation: {
        marquee: 'marquee 55s linear infinite',
      },
      colors: {
        gold: {
          primary: '#F0A500',
          bright: '#FFB800',
          dark: '#B8860B',
          tint: '#2A1F00',
        },
        green: {
          primary: '#4CAF7D',
          glow: '#1E3D2F',
          muted: '#2D5A3D',
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
        badge: {
          tech: '#2A1F00',
          pool: '#1A1A1A',
        },
  },
  plugins: [],
}