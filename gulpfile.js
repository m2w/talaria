var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sass = require('gulp-ruby-sass');
var jshint = require('gulp-jshint');

gulp.task('default', ['compress', 'sass']);

gulp.task('watch', function() {
    gulp.watch('./src/*.js', ['lint']);
})

gulp.task('sass', function() {
    gulp.src('./src/*.scss')
        .pipe(sass({compass: true}))
        .pipe(gulp.dest('./src'));
    gulp.src('./src/*.scss')
        .pipe(sass({compass: true, style: 'compressed'}))
        .pipe(gulp.dest('./dist'));
});

gulp.task('compress', function(){
    gulp.src('./src/*.js')
        .pipe(uglify({outSourceMap: true}))
        .pipe(gulp.dest('dist'));
});

gulp.task('lint', function() {
    gulp.src('./src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
