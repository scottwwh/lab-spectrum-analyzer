import resolve from 'rollup-plugin-node-resolve';
import minify from 'rollup-plugin-minify';
import babel from 'rollup-plugin-babel';

// rollup src\index.js --format iife -o bundle.js
// rollup.config.js
export default {
  entry: 'src/index.js',
  format: 'iife',
  moduleName: 'SpectrumAnalyzer',
  globals: {
    three: 'Three'
  },
  plugins: [
    resolve({
      jsnext: true,
      module: true,
      browser: true,
    }),

    babel({
      // if this option is true, babel does some minification of files once they reach a certain size
      compact: false,
      
      // exclude node modules AND any folders that you keep .glsl files in
      // alternatively you could just 'include' relevant folders instead
      exclude: ["node_modules/**", "src/shaders/**"],
      
      babelrc: false,
      presets: ['es2015-loose-rollup'],
    }),    

    minify({
      iife: {
        dest: 'build/bundle.min.js',
        mangle: true,
      }
    })
  ],

  dest: 'build/bundle.js' // equivalent to --output
};