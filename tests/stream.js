"use strict";
var index_1 = require('../src/index');
var assert = require('assert');
describe('Stream', function () {
    it('can be subscribed and unsubscribed with one observer', function (done) {
        var stream = index_1.default.interval(100);
        var i = 0;
        var observer = {
            next: function (x) {
                assert.equal(x, i);
                i += 1;
                if (i === 2) {
                    stream.unsubscribe(observer);
                    done();
                }
            },
            error: done.fail,
            complete: done.fail,
        };
        stream.subscribe(observer);
    });
});
