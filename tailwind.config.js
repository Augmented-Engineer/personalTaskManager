/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Тёмная тема (Color.kt)
        'bg-dark': '#13131A',
        'card-dark': '#1C1C27',
        'item-dark': '#242433',
        'border-dark': '#2E2E40',
        'text-primary-dark': '#FFFFFF',
        'text-secondary-dark': '#8D8D9D',

        // Светлая тема (Color.kt)
        'bg-light': '#F5F6FA',
        'card-light': '#FFFFFF',
        'item-light': '#ECEFF5',
        'border-light': '#DCDDE1',
        'text-primary-light': '#1E272E',
        'text-secondary-light': '#718093',

        // Статусные цвета (Color.kt)
        'accent-green': '#2ED573',
        'accent-red': '#FF4757',
        'indicator-track': '#2E2E40',

        // Динамический акцент (ThemeManager.kt)
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