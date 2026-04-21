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
          400: '#B8A070',
          500: '#A89060',
          600: '#8B7355',
        },
        polymarket: {
          green: '#00D27D',
          red: '#F23F43',
        },
        matte: {
          900: '#0D0D0D',
          800: '#141414',
          700: '#1A1A1A',
        }
      }
    },
  },
  plugins: [],
}
