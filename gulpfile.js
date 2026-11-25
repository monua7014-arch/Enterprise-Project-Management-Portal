'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The following exception occurred while processing Sass. Informational -- Thanks to modern CSS, pseudo-elements like :first-line are no longer required`);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

build.initialize(require('gulp'));
