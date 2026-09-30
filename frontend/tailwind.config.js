/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060b17',
        panel: '#0c1424',
        panel2: '#101b30',
        line: '#1b2a45',
        accent: '#22d3ee',
      },
    },
  },
  plugins: [],
};