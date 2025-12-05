/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Match ShelfQuest branding
        shelfquest: {
          primary: '#6366f1',    // Indigo
          secondary: '#8b5cf6',  // Violet
          accent: '#f59e0b',     // Amber
          dark: '#1e1b4b',       // Dark indigo
        }
      }
    },
  },
  plugins: [],
}
