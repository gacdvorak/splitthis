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
        dark: {
          bg: '#0E0E0E',
          card: '#242424',
          border: '#2a2a2a',
          text: '#FFFFFF',
          secondary: '#A8A8A8',
        },
        brand: {
          primary: '#50F97D',
        },
        destructive: '#DB7974',
        action: {
          primary: '#0046DA',
          secondary: '#303030',
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
