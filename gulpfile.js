const gulp        = require('gulp');
const browserSync = require('browser-sync').create();
const rollup      = require('rollup');
const resolve     = require('rollup-plugin-node-resolve');
const minify      = require('rollup-plugin-minify');
const babel       = require('rollup-plugin-babel');

// Rollup - INCOMPLETE
gulp.task('rollup', async function () {
    const bundle = await rollup.rollup({
      input: './src/index.js',
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
    });

    const isRelease = false;
    await bundle.write({
      file: './build/bundle.js',
      format: 'iife',
      name: 'SpectrumAnalyzer',
      sourcemap: !isRelease
    });
});

gulp.task('js-watch', ['rollup'], function (done) {
    browserSync.reload();
    done();
});

// Static server
gulp.task('default', ['rollup'], function() {
    browserSync.init({
        server: {
            baseDir: "./build"
        }
    });

    gulp.watch('src/**/*.js', ['js-watch']);
});

// Static server
gulp.task('sandbox', function() {
    browserSync.init({
        server: {
            baseDir: "./sandbox"
        }
    });

    gulp.watch('sandbox/*', ['watch-sandbox']);
});

gulp.task('watch-sandbox', function (done) {
    browserSync.reload();
    done();
});
