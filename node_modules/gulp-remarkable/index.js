'use strict';

var through     = require('through2');
var remarkable  = require('remarkable');

module.exports = function(options) {
  return through.obj(function(file, encoding, callback) {
    if (!file.isBuffer()) {
      callback();
    }

    var md = new remarkable('full');
    var src = file.contents.toString();
    var html = md.render(src);

    file.contents = new Buffer(html);
    this.push(file);
    callback();
  });
};
