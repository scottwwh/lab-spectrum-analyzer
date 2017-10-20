const gulp        = require('gulp');
const rollup      = require('rollup');
const browserSync = require('browser-sync').create();

// Rollup - INCOMPLETE
gulp.task('rollup', async function () {
    const bundle = await rollup.rollup({
      input: './src/index.js',
      plugins: []
    });

    const isRelease = false;
    await bundle.write({
      file: './build/bundle.js',
      format: 'iife',
      name: 'SpectrumAnalyzer',
      sourcemap: !isRelease
    });
});

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./build"
        }
    });
});

gulp.task('default', ['browser-sync'], function() {
  console.log('HELLO!');
});