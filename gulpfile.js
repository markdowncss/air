var gulp        = require('gulp'),
    name        = require('gulp-rename'),
    rework      = require('gulp-rework'),
    reworkNPM   = require('rework-npm'),
    includer    = require('gulp-htmlincluder'),
    classPrefix = require('rework-class-prefix'),
    md          = require('gulp-remarkable');

gulp.task('md', function() {
  return gulp.src('air.md')
    .pipe(md())
    .pipe(name('-markdown.html'))
    .pipe(gulp.dest('example'));
});

gulp.task('html', ['md', 'css'], function() {
  return gulp.src('example/*.html')
    .pipe(includer())
    .pipe(gulp.dest('./'));
});

gulp.task('css', function() {
  return gulp.src('index.css')
    .pipe(rework(reworkNPM(), classPrefix('air-')))
    .pipe(name('air.css'))
    .pipe(gulp.dest('css'));
});

gulp.task('watch', function() {
  gulp.watch(['*.md', '*.css'], function() {
    gulp.start('default');
  });
});

gulp.task('default', ['md', 'css', 'html', 'watch']);
