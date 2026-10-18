/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Активируем ручное переключение тем через класс 'dark'
  theme: {
    extend: {
      colors: {
        // Теперь классы типа bg-card-dark будут динамически менять цвет в зависимости от темы!
        'bg-dark': 'var(--bg-main)',
        'card-dark': 'var(--bg-card)',
        'item-dark': 'var(--bg-item)',
        'border-dark': 'var(--border-main)',
        'text-primary-dark': 'var(--text-primary)',
        'text-secondary-dark': 'var(--text-secondary)',
        'accent-green': '#2ED573', // Зеленый и красный оставляем жесткими
        'accent-red': '#FF4757',
        accent: {
          DEFAULT: 'var(--accent-color)',
          light: 'var(--accent-light-color)',
        }
      },
      borderRadius: {
        'card': '16px',
        'card-lg': '20px',
        'pill': '12px'
      }
    },
  },
  plugins: [],
}