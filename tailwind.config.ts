import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        pastel: {
          sky: '#B8E4F9',
          pink: '#F9C8DA',
          mint: '#C8F0E8',
          lav: '#DDD0F9',
          yellow: '#FFF0C8',
          skyDark: '#2a6a9a',
          pinkDark: '#9a3a5a',
          mintDark: '#2a7a5a',
          lavDark: '#4a3a9a',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
