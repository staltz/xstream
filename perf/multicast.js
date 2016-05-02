var Benchmark = require('benchmark');
var xs = require('../lib/index').default;
var most = require('most');
var rx = require('rx');
var rxjs = require('@reactivex/rxjs')
var kefir = require('kefir');
var bacon = require('baconjs');
var lodash = require('lodash');
var highland = require('highland');

var runners = require('./runners');
var kefirFromArray = runners.kefirFromArray;

// Create a stream from an Array of n integers
// filter out odds, map remaining evens by adding 1, then reduce by summing
var n = runners.getIntArg(100000);
var a = new Array(n);
for(var i = 0; i< a.length; ++i) {
  a[i] = i;
}

var suite = Benchmark.Suite('multicast -> combine(addAll)' + n + ' x 4 integers');
var options = {
  defer: true,
  onError: function(e) {
    e.currentTarget.failure = e.error;
  }
};


function xlater(s) {
  return xs.create({
    start: p => {
      setTimeout(() => { 
        p.next(s);
        p.complete();
      }, 0);
    },
    stop: () => { }
  }).flatten();
}


suite
  .add('xstream', function(deferred) {
    var xs1 = xlater(xs.fromArray(a));
    var xs2 = xs1.map(x => x + 1);
    var xs3 = xs1.map(x => x + 2);
    var xs4 = xs1.map(x => x + 3);
    runners.runXStream(deferred,
      xs.combine(addAll, xs1, xs2, xs3, xs4));
  }, options)
  .add('most', function(deferred) {
    var m1 = most.just(most.from(a)).delay(0).switch().multicast();
    var m2 = m1.map(x => x + 1);
    var m3 = m1.map(x => x + 2);
    var m4 = m1.map(x => x + 3);
    runners.runMost(deferred, 
      most.combineArray(addAll, [m1, m2, m3, m4]).drain());
  }, options)
  .add('rx 5', function(deferred) {
    var rx1 = rxjs.Observable.of(rxjs.Observable.from(a)).delay(0).switchMap(x => x).share();
    var rx2 = rx1.map(x => x + 1);
    var rx3 = rx1.map(x => x + 2);
    var rx4 = rx1.map(x => x + 3);
    runners.runRx5(deferred,
      rxjs.Observable.combineLatest(rx1, rx2, rx3, rx4, addAll));
  }, options);

runners.runSuite(suite);

function add1(x) {
  return x + 1;
}

function even(x) {
  return x % 2 === 0;
}

function sum(x, y) {
  return x + y;
}

function addAll(a, b, c, d) {
  return a + b + c + d;
}