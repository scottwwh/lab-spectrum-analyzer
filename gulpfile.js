const gulp        = require('gulp');
const browserSync = require('browser-sync').create();
const rollup      = require('rollup');
const resolve     = require('rollup-plugin-node-resolve');
const minify      = require('rollup-plugin-minify');
const babel       = require('rollup-plugin-babel');

// Work-around for delay in Ctrl-C working on Windows
process.on('SIGINT', function() {
  setTimeout(function() {
    gutil.log(gutil.colors.red('Successfully closed ' + process.pid));
    process.exit(1);
  }, 500);
});

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
gulp.task('default', ['build'], function() {
    // All done
});

// Static server
gulp.task('build', ['rollup'], function() {
    // All done
});

// Static server
gulp.task('dev', ['build'], function() {
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

// Static server
gulp.task('blar', function() {
    browserSync.init({
        server: {
            baseDir: "./src"
        }
    });

    gulp.watch('src/*', ['watch-blar']);
});

gulp.task('watch-blar', function (done) {
    browserSync.reload();
    done();
});
