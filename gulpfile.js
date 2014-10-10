var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sass = require('gulp-ruby-sass');
var jshint = require('gulp-jshint');

gulp.task('default', ['compress', 'copy', 'sass']);

gulp.task('watch', function() {
    gulp.watch('./src/*.js', ['lint']);
})

gulp.task('sass', function() {
    gulp.src('./src/*.sass')
        .pipe(sass({compass: true}))
        .pipe(gulp.dest('./src'));
    gulp.src('./src/*.sass')
        .pipe(sass({compass: true, style: 'compressed'}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('compress', function() {
    gulp.src('./src/talaria.js')
        .pipe(rename('talaria.min.js'))
        .pipe(uglify({outSourceMap: true}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy', function() {
    gulp.src('./src/talaria.js')
        .pipe(gulp.dest('./dist'));
});

gulp.task('lint', function() {
    gulp.src('./src/*.js')
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
