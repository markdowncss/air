# rework-npm

[![Build Status](https://travis-ci.org/reworkcss/rework-npm.svg?branch=master)](https://travis-ci.org/reworkcss/rework-npm)

Import CSS styles from NPM modules using
[rework](https://github.com/reworkcss/rework).

This lets you use `@import` CSS using the same rules you use for `require` in
Node. Specify the CSS file for a module using the `style` field in
`package.json` and use `@import "my-module";`, or specify the file name in the
module, like `@import "my-module/my-file";`. You can also require files relative
to the current file using `@import "./my-file";`.

An `@import` will be processed so that the file referenced will have been
imported in the current scope at the point of the `@import`. If a file has been
previously imported in the current scope, that file will not be imported again.
New scopes are created in a block such as a `@media` block. Child blocks will
not duplicate imports that have been imported in the parent block, but may
duplicate imports that are imported in a sibling block (since they may not have
effect otherwise).

You can use source maps to show which file a definition originated from when
debugging in a browser. To include inline source maps, use
`.toString({ sourcemap: true })` on the rework object when generating the
output.

Note that to get correct import paths you must set the `source` option to the
source file name when parsing the CSS source (usually with rework). If the
`source` path is relative, it is resolved to the `root` option (defaults to the
current directory). The `source` path is used to find the directory to start in
when finding dependencies.

## Example

```js
var rework = require('rework'),
    reworkNPM = require('rework-npm');

var output = rework('@import "test";', { source: 'my-file.css' })
    .use(reworkNPM())
    .toString();

console.log(output);
```

## Reference

### `reworkNPM([opts])`

Creates a new plugin for rework that will import files from NPM.

## Options

### root
The root directory for the source files. This is used for source maps to make
imported file names relative to this directory, and for finding the absolute
path for the top level source file.

Example:

```js
// Uses `<dir>/src/index.css` as the file path for the top level file. Also all
// file paths in the source map will be relative to the `<dir>/src` folder.
rework('@import "./abc";', { source: 'index.css' })
    .use(reworkNPM({ root: path.join(__dirname, 'src') }))
    .toString();
```

### shim
If you need to import packages that do not specify a `style` property in their
`package.json` or provide their styles in `index.css`, you can provide a shim
config option to access them. This is specified as a hash whose keys are the
names of packages to shim and whose values are the path, relative to that
package's `package.json` file, where styles can be found.

Example:

```js
// Imports the `dist/leaflet.css` file from the `leaflet` package
rework('@import "leaflet";', { source: 'index.css' })
    .use(reworkNPM({ shim: { 'leaflet': 'dist/leaflet.css' } }))
    .toString();
```

### alias

You can provide aliases for arbitrary import paths, including files and
directories. When importing a file, it will search all directories in the path
for aliases also. Note that relative imports are never aliased.

This is specified as an object where the keys are the name of the import path to
alias, and the values are the file or directory path for the destination,
relative to the `root` option.

Example:

```js
// Imports the `styles/util.css` file
rework('@import "util";', { source: 'index.css' })
    .use(reworkNPM({ alias: { 'util': 'styles/util.css' } }))
    .toString();
```

```js
// Imports the `styles/index.css` file if there is a `styles` directory,
// otherwise the `styles.css` file.
rework('@import "util";', { source: 'index.css' })
    .use(reworkNPM({ alias: { 'util': 'styles' } }))
    .toString();
```

```js
// Imports the `styles/other.css` file
rework('@import "util/other";', { source: 'index.css' })
    .use(reworkNPM({ alias: { 'util': 'styles' } }))
    .toString();
```

### prefilter
A function that will be called before an imported file is parsed. This function
will be called with the file contents and the full file path. This option can be
used to convert other languages such as SCSS to CSS before importing.

Example:

```js
// Process SCSS files
rework('@import "./some-file.scss";', { source: 'index.css' })
    .use(reworkNPM({ prefilter: compile }))
    .toString();

function compile(src, file) {
    if (path.extname(file) === '.scss') {
        return compileScss(src);
    }

    return src;
}
```
