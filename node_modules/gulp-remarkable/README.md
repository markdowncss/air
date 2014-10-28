# Gulp Remarkable

A [gulp](http://gulpjs.com) wrapper for the [remarkable](https://github.com/jonschlinkert/remarkable)
[CommonMark](http://commonmark.org) parser.

## Installation

```
npm install --save gulp-remarkable
```

## Usage

```js
var gulp = require('gulp'),
    name = require('gulp-rename'),
    md   = require('gulp-remarkable');

gulp.task('md', function() {
  return gulp.src('file.md')
    .pipe(md())
    .pipe(name('file.html'))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['md']);
```

## License

MIT

## Acknowledgements

* Markdown parsing done by remarkable: <https://github.com/jonschlinkert/remarkable>
* Markdown spec defined by CommonMark: <http://commonmark.org>

## Coming Soon

- [ ] Remarkable options for type.
- [ ] Remarkable options for highlight.js.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

Crafted with <3 by [John Otander](http://johnotander.com) ([@4lpine](https://twitter.com/4lpine)).
