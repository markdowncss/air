var resolve = require('resolve');
var copy = require('shallow-copy');
var concatMap = require('concat-map');
var path = require('path');
var parse = require('css').parse;
var fs = require('fs');

var ABS_URL = /^url\(|:\/\//;
var QUOTED = /^['"]|['"]$/g;
var RELATIVE = /^\./;
var SEPARATOR = '/';

module.exports = reworkNPM;

function reworkNPM(opts) {
    opts = opts || {};
    var root = opts.root || process.cwd();
    var prefilter = opts.prefilter || identity;
    var shim = opts.shim || {};
    var alias = opts.alias || {};

    function inline(scope, style) {
        style.rules = concatMap(style.rules, function(rule) {
            return (
                (rule.type === 'import') ? getImport(scope, rule) :
                (rule.rules) ? inline(copy(scope), rule) :
                rule);
        });

        return style;
    }

    function getImport(scope, rule) {
        var file = resolveImport(rule);
        if (!file) {
            return rule;
        }

        if (scope.indexOf(file) !== -1) {
            return [];
        }
        scope.push(file);

        var contents = fs.readFileSync(file, 'utf8');
        contents = prefilter(contents, file);
        contents = parse(contents, { source: path.relative(root, file) });
        return inline(scope, contents.stylesheet).rules;
    }

    function resolveImport(rule) {
        var name = rule.import.replace(QUOTED, '');
        if (!isNpmImport(name)) {
            return null;
        }

        if (!RELATIVE.test(name)) {
            name = resolveAlias(name) || name;
        }

        var source = rule.position.source;
        var dir = source ? path.dirname(path.resolve(root, source)) : root;

        var file = resolve.sync(name, {
            basedir: dir,
            extensions: ['.css'],
            packageFilter: processPackage
        });

        return path.normalize(file);
    }

    function resolveAlias(name) {
        if (hasOwn(alias, name)) {
            return path.resolve(root, alias[name]);
        }

        var segments = name.split(SEPARATOR);
        if (segments.length > 1) {
            var current = segments.pop();
            var parent = resolveAlias(segments.join(SEPARATOR));
            if (parent) {
                return path.join(parent, current);
            }
        }

        return null;
    }

    function processPackage(pkg) {
        pkg.main =
            (hasOwn(shim, pkg.name) && shim[pkg.name]) ||
            pkg.style || 'index.css';
        return pkg;
    }

    return function(style) {
        return inline([], style);
    };
}

function identity(value) {
    return value;
}

function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function isNpmImport(path) {
    // Do not import absolute URLs */
    return !ABS_URL.test(path);
}
