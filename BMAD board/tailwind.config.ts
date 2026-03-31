import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        jira: {
          blue: '#0052CC',
          'blue-light': '#DEEBFF',
          'blue-dark': '#003884',
          purple: '#6554C0',
          green: '#36B37E',
          'green-light': '#E3FCEF',
          yellow: '#FFAB00',
          'yellow-light': '#FFFAE6',
          red: '#FF5630',
          'red-light': '#FFEBE6',
          gray: {
            50: '#FAFBFC',
            100: '#F4F5F7',
            200: '#EBECF0',
            300: '#DFE1E6',
            400: '#C1C7D0',
            500: '#97A0AF',
            600: '#6B778C',
            700: '#505F79',
            800: '#344563',
            900: '#172B4D',
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
