var Benchmark = require('benchmark');
var xs = require('../index').default;
var most = require('most');
var rx = require('rx');
var rxjs = require('@reactivex/rxjs')
var bacon = require('baconjs');

var runners = require('./runners');
var kefirFromArray = runners.kefirFromArray;

// Create a stream from an Array of n integers
// filter out odds, map remaining evens by adding 1, then reduce by summing
var seed = 100;
var x = seed;
var goingUp = true;
var n = runners.getIntArg(1000000);
var a = new Array(n);
for(var i = 0; i < a.length; ++i) {
  if (x > Number('1e+100')) {
    goingUp = false;
  }
  if (x < 100) {
    goingUp = true;
  }
  if (goingUp) {
    x *= 7;
  } else {
    x /= 7;
  }
  a[i] = Math.sin(x);
}

var suite = Benchmark.Suite('dataflow for ' + n + ' source events');
var options = {
  defer: true,
  onError: function(e) {
    e.currentTarget.failure = e.error;
  }
};

suite
  .add('xstream', function (deferred) {
    var source = xs.fromArray(a);
    var inc = source.filter(isPositive).mapTo(+1);
    var dec = source.filter(isNegative).mapTo(-1);
    var count = xs.merge(inc, dec).fold(addXY, 0);
    var label = xs.of('initial', 'Count is ');
    var view = xs.combine(label, count).map(renderWithArray);
    runners.runXStream(deferred, view);
  }, options)
  .add('most', function (deferred) {
    var source = most.from(a);
    var inc = source.filter(isPositive).map(returnPlus1);
    var dec = source.filter(isNegative).map(returnMinus1);
    var count = most.merge(inc, dec).scan(addXY, 0);
    var label = most.from(['initial', 'Count is ']);
    var view = most.combine(renderWithArgs, label, count);
    runners.runMost(deferred, view.drain());
  }, options)
  .add('rx 5', function (deferred) {
    var source = rxjs.Observable.from(a);
    var inc = source.filter(isPositive).map(returnPlus1);
    var dec = source.filter(isNegative).map(returnMinus1);
    var count = rxjs.Observable.merge(inc, dec).scan(addXY, 0);
    var label = rxjs.Observable.of('initial', 'Count is ');
    var view = rxjs.Observable.combineLatest(label, count, renderWithArgs);
    runners.runRx5(deferred, view);
  }, options)
  .add('rx 4', function (deferred) {
    var source = rx.Observable.from(a);
    var inc = source.filter(isPositive).map(returnPlus1);
    var dec = source.filter(isNegative).map(returnMinus1);
    var count = rx.Observable.merge(inc, dec).scan(addXY, 0);
    var label = rx.Observable.of('initial', 'Count is ');
    var view = rx.Observable.combineLatest(label, count, renderWithArgs);
    runners.runRx(deferred, view);
  }, options)
  .add('bacon', function (deferred) {
    var source = bacon.fromArray(a);
    var inc = source.filter(isPositive).map(returnPlus1);
    var dec = source.filter(isNegative).map(returnMinus1);
    var count = inc.merge(dec).scan(0, addXY);
    var label = bacon.fromArray(['initial', 'Count is ']);
    var view = bacon.combineWith(renderWithArgs, label, count);
    runners.runBacon(deferred, view);
  }, options);

runners.runSuite(suite);

function isNegative(x) {
  return x < 0;
}

function isPositive(x) {
  return x > 0;
}

function addXY(x, y) {
  return x + y;
}

function returnPlus1() {
  return +1;
}

function returnMinus1() {
  return -1;
}

function renderWithArray(labelAndCount) {
  return {
    label: labelAndCount[0],
    count: labelAndCount[1],
  };
}

function renderWithArgs(label, count) {
  return {
    label: label,
    count: count,
  };
}
