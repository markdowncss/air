'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var _ = require('lodash');
var rework = require('rework');
var lastIsObject = _.compose(_.isPlainObject, _.last);

module.exports = function () {
	var args = [].slice.call(arguments);
	var options = lastIsObject(args) ? args.pop() : {};
	var plugins = args;

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-rework', 'Streaming not supported'));
			return;
		}

		try {
			var ret = rework(file.contents.toString(), {source: file.path});
			plugins.forEach(ret.use.bind(ret));
			file.contents = new Buffer(ret.toString(options));
			cb(null, file);
		} catch (err) {
			cb(new gutil.PluginError('gulp-rework', err, {fileName: err.filename || file.path}));
		}
	});
};
