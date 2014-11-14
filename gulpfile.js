var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sass = require('gulp-ruby-sass');
var jshint = require('gulp-jshint');

gulp.task('default', ['compress', 'copy']);

gulp.task('watch', function() {
    gulp.watch('./src/*.js', ['lint']);
});

// FIXME: Note https://github.com/sindresorhus/gulp-ruby-sass/issues/156
gulp.task('sass', function() {
    gulp.src('./lib/*.sass')
        .pipe(sass({compass: true, style: 'expanded'}))
        .pipe(gulp.dest('./lib'));
    gulp.src('./lib/*.sass')
        .pipe(sass({compass: true, style: 'compressed'}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('compress', function() {
    gulp.src('./lib/talaria.js')
        .pipe(rename('talaria.min.js'))
        .pipe(uglify({outSourceMap: true}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy', function() {
    gulp.src('./lib/talaria.js')
        .pipe(gulp.dest('./dist'));
});

gulp.task('lint', function() {
    gulp.src('./lib/*.js')
        .pipe(jshint({'maxdepth': 2,
                      'strict': true,
                      'unused': 'strict',
                      'undef': true,
                      'quotmark': 'single',
                      'latedef': 'nofunc',
                      'immed': true,
                      'eqeqeq': true,
                      'curly': true,
                      'camelcase': true,
                      'bitwise': true}))
        .pipe(jshint.reporter('default'));
});
