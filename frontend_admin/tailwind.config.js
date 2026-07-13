/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        // Meme palette "ecologie" que le frontend citoyen, + un bleu marine
        // pour la barre laterale sombre du tableau de bord admin.
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d'
        },
        secondary: {
          500: '#0ea5e9',
          600: '#0284c7'
        },
        sidebar: {
          DEFAULT: '#0f172a',
          light: '#1e293b'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
