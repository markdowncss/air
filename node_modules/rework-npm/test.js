var test = require('tap').test;
var reworkNPM = require('./');
var fs = require('fs');
var path = require('path');
var rework = require('rework');
var sass = require('node-sass');
var convertSourceMap = require('convert-source-map');
var SourceMapConsumer = require('source-map').SourceMapConsumer;

test('Import relative source file', function(t) {
    var input = '@import "./test";';
    var output = rework(input, { source: 'test/file.css' })
        .use(reworkNPM())
        .toString();
    t.equal(output, '.test {\n  content: "Test file";\n}');
    t.end();
});

test('Import package', function(t) {
    var input = '@import "test";';
    var output = rework(input, { source: 'test/index.css' })
            .use(reworkNPM())
            .toString();
    t.equal(output, '.test {\n  content: "Test package";\n}');
    t.end();
});

test('Import package with custom style file', function(t) {
    var input = '@import "custom";';
    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM())
        .toString();
    t.equal(output, '.custom {\n  content: "Custom package";\n}');
    t.end();
});

test('Import files imported from imported package', function(t) {
    var input = '@import "nested";';
    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM())
        .toString();
    t.equal(output, '.test {\n  content: "From nested test package";\n}');
    t.end();
});

test('Import file with single quotes', function(t) {
    var input = "@import './test';";
    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM())
        .toString();
    t.equal(output, '.test {\n  content: "Test file";\n}');
    t.end();
});

test('Import package in @media', function(t) {
    var input = [
        '@media (min-width: 320px) {',
        '  @import "test";',
        '}',
        '@media (min-width: 640px) {',
        '  @import "test";',
        '}'
    ].join('\n');

    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM())
        .toString();
    t.equal(output, [
        '@media (min-width: 320px) {',
        '  .test {',
        '    content: "Test package";',
        '  }',
        '}',
        '',
        '@media (min-width: 640px) {',
        '  .test {',
        '    content: "Test package";',
        '  }',
        '}'
    ].join('\n'));

    t.end();
});

test('Ignore import from @media if imported in outer scope', function(t) {
    var input =
        '@import "test";\n' +
        '@media (min-width: 320px) { @import "test"; }';

    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM())
        .toString();
    t.equal(output, [
        '.test {',
        '  content: "Test package";',
        '}',
        '',
        '@media (min-width: 320px) {',
        '',
        '}'
    ].join('\n'));

    t.end();
});

test('Skip absolute URLs', function(t) {
    var input = '@import "http://example.com/example.css";';
    var output = rework(input, { source: 'test/index.css' })
            .use(reworkNPM())
            .toString();
    t.equal(output, input);
    t.end();
});

test('Skip imports using url()', function(t) {
    var input = '@import url(test.css);';
    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM())
        .toString();
    t.equal(output, input);
    t.end();
});

test('Include source maps', function(t) {
    var input = '@import "test";',
        output = rework(input, { source: 'test/index.css' })
            .use(reworkNPM())
            .toString({ sourcemap: true });

    var imported = 'test/node_modules/test/index.css';
    var map = new SourceMapConsumer(
        convertSourceMap.fromComment(output).toObject());

    var pos = map.originalPositionFor({ line: 1, column: 0 });
    t.equal(pos.source, imported);
    t.equal(pos.line, 1);
    t.equal(pos.column, 0);

    pos = map.originalPositionFor({ line: 2, column: 2 });
    t.equal(pos.source, imported);
    t.equal(pos.line, 2);
    t.equal(pos.column, 4);

    t.equal(map.sourceContentFor(imported), fs.readFileSync(imported, 'utf8'));

    t.end();
});

test('Include source file names in output', function(t) {
    var input = '@import "test";';
    var output = rework(input, { source: 'test/index.css' })
            .use(reworkNPM());

    var rule = output.obj.stylesheet.rules[0];
    t.equal(
        path.normalize(rule.position.source),
        path.normalize('test/node_modules/test/index.css'));
    t.end();
});

test('Use file names relative to root', function(t) {
    var input = '@import "test";';
    var output = rework(input, { source: 'index.css' })
        .use(reworkNPM({ root: path.join(__dirname, 'test') }));

    var rule = output.obj.stylesheet.rules[0];
    t.equal(
        path.normalize(rule.position.source),
        path.normalize('node_modules/test/index.css'));
    t.end();
});

test('Use shim config option', function(t) {
    var input = '@import "shimmed";';
    var shim = { 'shimmed': 'styles.css' };
    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM({ shim: shim }))
        .toString();

    t.equal(output, '.shimmed {\n  content: "Shimmed package";\n}');
    t.end();
});

test('Use alias config option', function(t) {
    var source = '@import "tree";';
    var alias = { 'tree': 'test/styles/index.css' };
    var output = rework(source, { source: 'test/index.css' })
        .use(reworkNPM({ alias: alias }))
        .toString();

    t.equal(output, '.test {\n  content: "Test file";\n}');
    t.end();
});

test('Import index file in aliased directory', function(t) {
    var source = '@import "util";';
    var alias = { 'util': 'test/styles' };
    var output = rework(source, { source: 'test/index.css' })
        .use(reworkNPM({ alias: alias }))
        .toString();

    t.equal(output, '.test {\n  content: "Test file";\n}');
    t.end();
});

test('Import file in aliased directory', function(t) {
    var source = '@import "util/index";';
    var alias = { 'util': 'test/styles' };
    var output = rework(source, { source: 'test/index.css' })
        .use(reworkNPM({ alias: alias }))
        .toString();
    t.equal(output, '.test {\n  content: "Test file";\n}');
    t.end();
});

test('Allow prefiltering input CSS (e.g. css-whitespace)', function(t) {
    var input = '@import "./styles/index-unfiltered.css";';
    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM({ prefilter: replacer }))
        .toString();
    t.equal(output, '.test {\n  content: "Test file";\n}');
    t.end();

    function replacer(code) {
        return code.replace('$replaceThis', 'content');
    }
});

test('Prefilter nested includes', function(t) {
    var input = '@import "./styles/nested-unfiltered.css";';
    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM({ prefilter: replacer }))
        .toString();
    t.equal(output, '.test {\n  content: "Test file";\n}');
    t.end();

    function replacer(code) {
        return code.replace('$replaceThis', 'content');
    }
});

test('Provide filename as second arg to prefilter', function(t) {
    var input = '@import "sassy";';
    var output = rework(input, { source: 'test/index.css' })
        .use(reworkNPM({ prefilter: renderSass }))
        .toString();

    t.equal(output, '.bashful {\n  color: red;\n}');
    t.end();

    function renderSass(code, file) {
        return path.extname(file) === '.scss'
            ? sass.renderSync({ data: code })
            : code;
    }
});
