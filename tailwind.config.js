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
        brand: {
          forest: '#123B35',
          forestDark: '#0C2622',
          forestLight: '#1B4E47',
          teal: '#167D70',
          tealHover: '#12675C',
          tealLight: '#2EC4B1',
          mint: '#DDF5E9',
          mintLight: '#F2FAF5',
          surface: '#F7F8F5',
          slate: '#2B3441',
          danger: '#C43D4B',
          dangerLight: '#FDF2F3',
          live: '#10B981',
          recent: '#0284C7',
          stale: '#F59E0B',
          offline: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(18, 59, 53, 0.08), 0 1px 4px -1px rgba(18, 59, 53, 0.04)',
        'card': '0 4px 20px -2px rgba(18, 59, 53, 0.10), 0 2px 6px -1px rgba(18, 59, 53, 0.05)',
        'floating': '0 10px 30px -4px rgba(18, 59, 53, 0.18), 0 4px 10px -2px rgba(18, 59, 53, 0.08)',
      }
    },
  },
  plugins: [],
}
