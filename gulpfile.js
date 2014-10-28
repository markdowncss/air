var gulp      = require('gulp'),
    name      = require('gulp-rename'),
    rework    = require('gulp-rework'),
    reworkNPM = require('rework-npm'),
    md        = require('gulp-remarkable');

gulp.task('md', function() {
  return gulp.src('air.md')
    .pipe(md())
    .pipe(name('index.html'))
    .pipe(gulp.dest('./'));
});

gulp.task('css', function() {
  return gulp.src('index.css')
    .pipe(rework(reworkNPM()))
    .pipe(name('air.css'))
    .pipe(gulp.dest('css'));
});

gulp.task('default', ['md', 'css']);
