/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: { primary: '#F0A500' },
        green: { primary: '#4CAF7D' },
        bg: { primary: '#0a0a0a', card: '#141414' },
      },
    },
  },
  plugins: [],
}