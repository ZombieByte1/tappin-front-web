/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class', // Habilita modo oscuro basado en clase
  theme: {
    extend: {
      colors: {
        primary: '#FDB913', // Amarillo principal de Tappin
        // Modo Oscuro
        'dark-bg': '#1b1c1e',
        'dark-card': '#2a2b2e',
        'dark-text': '#ffffff',
        'dark-text-secondary': '#9ca3af',
        // Modo Claro
        'light-bg': '#fffefe',
        'light-card': '#ffffff',
        'light-text': '#1f2937',
        'light-text-secondary': '#6b7280',
      },
    },
  },
  plugins: [],
}

