import resolve from 'rollup-plugin-node-resolve';

// rollup src\index.js --format iife -o bundle.js
// rollup.config.js
export default {
  entry: 'src/index.js',
  format: 'iife',
  plugins: [
    resolve({
      module: true,
      modulesOnly: true,
      jsnext: true
    })
  ],
  dest: 'build/bundle.js' // equivalent to --output
};