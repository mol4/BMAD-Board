/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        jira: {
          blue: '#0052CC',
          'blue-dark': '#0747A6',
          'gray-50': '#F4F5F7',
          'gray-100': '#EBECF0',
          'gray-200': '#DFE1E6',
          'gray-300': '#C1C7D0',
          'gray-400': '#B3BAC5',
          'gray-500': '#97A0AF',
          'gray-600': '#7A869A',
          'gray-700': '#5E6C84',
          'gray-800': '#253858',
          'gray-900': '#172B4D',
          'gray-950': '#091E42',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
