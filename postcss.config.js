const autoprefixer = require('autoprefixer')
const tailwindcss = require('tailwindcss')
const postcssPurgecss = require('@fullhuman/postcss-purgecss')

const purgecss = postcssPurgecss({
  content: ['./public/**/*.html', './src/**/*.vue'],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
})

module.exports = {
  plugins: [
    tailwindcss,
    autoprefixer,
    ...(process.env.NODE_ENV === 'production' ? [purgecss] : []),
  ]
}
