// rollup src\index.js --format iife -o bundle.js
// rollup.config.js
export default {
  entry: 'src/index.js',
  format: 'iife',
  dest: 'build/bundle.js' // equivalent to --output
};