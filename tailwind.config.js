/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        matte: {
          900: '#0a0a0a',
          800: '#171717',
          700: '#262626',
        }
      }
    },
  },
  plugins: [],
}
