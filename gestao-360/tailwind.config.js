/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores oficiais da marca Ipeconect
        primary: {
          50: '#eef1f8',
          100: '#dce4f2',
          200: '#bccae6',
          300: '#8098C8',  // Azul claro oficial
          400: '#6378ad',
          500: '#46548C',  // Azul principal oficial
          600: '#3A4A81',  // Azul escuro oficial
          700: '#313f6e',
          800: '#29345b',
          900: '#222b4c',
          950: '#161c33',
        },
        accent: {
          50: '#fef8ee',
          100: '#F0DCCC',  // Pessego claro oficial
          200: '#f9d8a1',
          300: '#f3c172',
          400: '#E8A14A',  // Laranja oficial
          500: '#d48a2e',
          600: '#bc7022',
          700: '#9c551e',
          800: '#7f441f',
          900: '#68391d',
        },
        sidebar: {
          bg: '#222b4c',
          hover: '#29345b',
          active: '#3A4A81',
          text: '#8098C8',
          'text-active': '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
