/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F0',
        sand: '#EDE2D3',
        clay: '#B98A5E',
        espresso: '#3C2A21',
        gold: '#C6A15B',
        night: '#1B1611',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -10px rgba(60,42,33,0.25)',
      },
    },
  },
  plugins: [],
};
