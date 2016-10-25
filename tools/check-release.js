#!/usr/bin/env node

/** This script checks whether xstream should be released with
 * a new version according to ComVer https://github.com/staltz/comver.
 * It has two modes: REPORT and ORACLE.
 *
 * It runs in REPORT mode if no additional command line argument was given.
 * For instance, `node check-release.js`. It will display a human readable
 * report about a new release possibility.
 *
 * It runs in ORACLE mode if `--oracle` or `-o` was given as option, e.g.
 * `node check-release.js --oracle`,
 * it will exit with a status code answering whether the
 * package should be released with a new version.
 * 0 means no new release is necessary
 * 2 means it should have a new minor version _.x release
 * 3 means it should have a new major version x._ release
 */

var conventionalChangelog = require('conventional-changelog');
var fs = require('fs');

var status = {increment: 0, commits: []};

function incrementName(code) {
  if (code === 1) {
    return 'patch';
  } else if (code === 2) {
    return 'minor';
  } else if (code === 3) {
    return 'major';
  } else {
    return '';
  }
}

function isCommitBreakingChange(commit) {
  return (typeof commit.footer === 'string'
    && commit.footer.indexOf('BREAKING CHANGE') !== -1);
}

function showReportHeaderPositive() {
  console.log(
    'RELEASES TO DO\n\n' +
    'We checked all recent commits, and discovered that according\n' +
    'to ComVer (https://github.com/staltz/comver) you should\n' +
    'release a new version of xstream.\n');
}

function showReportHeaderNegative() {
  console.log(
    'Nothing to release.\n\n' +
    'We checked all recent commits, and discovered that you do\n' +
    'not need to release a new version, according to ComVer.\n')
}

function showReport(status) {
  if (status.increment > 0) {
    showReportHeaderPositive();

    console.log('xstream needs a new ' +
      incrementName(status.increment).toUpperCase() +
      ' version released because:');
    status.commits.forEach(function (commit) {
      console.log('  . ' + commit.header);
      if (isCommitBreakingChange(commit)) {
        console.log('    BREAKING CHANGE');
      }
    });
    console.log('');
  } else {
    showReportHeaderNegative();
  }
}

conventionalChangelog({
  preset: 'angular',
  append: true,
  transform: function (commit, cb) {
    var toPush = null;
    if (commit.type === 'fix' || commit.type === 'feat') {
      status.increment = Math.max(status.increment, 2);
      toPush = commit;
    }
    if (isCommitBreakingChange(commit)) {
      status.increment = Math.max(status.increment, 3);
      toPush = commit;
    }
    if (toPush) {
      status.commits.push(commit);
    }
    if (commit.header === 'chore(package): release new version') {
      status.increment = 0;
      status.commits = [];
    }
    cb();
  },
}, {}, { reverse: true })
  .on('end', function () {
    if (process.argv[2] === '--oracle' || process.argv[2] === '-o') {
      return process.exit(status.increment);
    } else {
      showReport(status);
    }
  }).resume();