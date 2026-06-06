import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#E07A5F',
        'accent-light': '#FDF0EA',
        teal: '#3D8A7A',
        'teal-light': '#EBF5F3',
        cream: '#F8F6F1',
        charcoal: '#2D2926',
        muted: '#7A756F',
        border: '#E8E3DA',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
