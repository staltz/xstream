(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xstream = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var MapOperator_1 = require('./operator/MapOperator');
var MapToOperator_1 = require('./operator/MapToOperator');
var FilterOperator_1 = require('./operator/FilterOperator');
var TakeOperator_1 = require('./operator/TakeOperator');
var DropOperator_1 = require('./operator/DropOperator');
var DebugOperator_1 = require('./operator/DebugOperator');
var FoldOperator_1 = require('./operator/FoldOperator');
var LastOperator_1 = require('./operator/LastOperator');
var ReplaceErrorOperator_1 = require('./operator/ReplaceErrorOperator');
var StartWithOperator_1 = require('./operator/StartWithOperator');
var EndWhenOperator_1 = require('./operator/EndWhenOperator');
var FlattenOperator_1 = require('./operator/FlattenOperator');
var MapFlattenOperator_1 = require('./operator/MapFlattenOperator');
var FlattenConcOperator_1 = require('./operator/FlattenConcOperator');
var MapFlattenConcOperator_1 = require('./operator/MapFlattenConcOperator');
var CombineProducer_1 = require('./factory/CombineProducer');
var FromArrayProducer_1 = require('./factory/FromArrayProducer');
var FromPromiseProducer_1 = require('./factory/FromPromiseProducer');
var PeriodicProducer_1 = require('./factory/PeriodicProducer');
var MergeProducer_1 = require('./factory/MergeProducer');
var empty_1 = require('./utils/empty');
var noop_1 = require('./utils/noop');
var internalizeProducer_1 = require('./utils/internalizeProducer');
var Stream = (function () {
    function Stream(producer) {
        this._stopID = empty_1.empty;
        this.combine = function combine(project) {
            var streams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                streams[_i - 1] = arguments[_i];
            }
            streams.unshift(this);
            return Stream.combine.apply(Stream, [project].concat(streams));
        };
        this._prod = producer;
        this._ils = [];
    }
    Stream.create = function (producer) {
        if (producer) {
            internalizeProducer_1.internalizeProducer(producer); // mutates the input
        }
        return new Stream(producer);
    };
    Stream.createWithMemory = function (producer) {
        if (producer) {
            internalizeProducer_1.internalizeProducer(producer); // mutates the input
        }
        return new MemoryStream(producer);
    };
    Stream.prototype.shamefullySendNext = function (value) {
        this._n(value);
    };
    Stream.prototype.shamefullySendError = function (error) {
        this._e(error);
    };
    Stream.prototype.shamefullySendComplete = function () {
        this._c();
    };
    Stream.prototype._n = function (t) {
        var len = this._ils.length;
        if (len === 1) {
            this._ils[0]._n(t);
        }
        else {
            for (var i = 0; i < len; i++) {
                this._ils[i]._n(t);
            }
        }
    };
    Stream.prototype._e = function (err) {
        var len = this._ils.length;
        if (len === 1) {
            this._ils[0]._e(err);
        }
        else {
            for (var i = 0; i < len; i++) {
                this._ils[i]._e(err);
            }
        }
        this._x();
    };
    Stream.prototype._c = function () {
        var len = this._ils.length;
        if (len === 1) {
            this._ils[0]._c();
        }
        else {
            for (var i = 0; i < len; i++) {
                this._ils[i]._c();
            }
        }
        this._x();
    };
    Stream.prototype._x = function () {
        if (this._ils.length === 0)
            return;
        if (this._prod)
            this._prod._stop();
        this._ils = [];
    };
    Stream.prototype.addListener = function (listener) {
        listener._n = listener.next;
        listener._e = listener.error;
        listener._c = listener.complete;
        this._add(listener);
    };
    Stream.prototype.removeListener = function (listener) {
        this._remove(listener);
    };
    Stream.prototype._add = function (il) {
        this._ils.push(il);
        if (this._ils.length === 1) {
            if (this._stopID !== empty_1.empty) {
                clearTimeout(this._stopID);
                this._stopID = empty_1.empty;
            }
            if (this._prod)
                this._prod._start(this);
        }
    };
    Stream.prototype._remove = function (il) {
        var _this = this;
        var i = this._ils.indexOf(il);
        if (i > -1) {
            this._ils.splice(i, 1);
            if (this._prod && this._ils.length <= 0) {
                this._stopID = setTimeout(function () { return _this._prod._stop(); });
            }
        }
    };
    Stream.never = function () {
        return new Stream({ _start: noop_1.noop, _stop: noop_1.noop });
    };
    Stream.empty = function () {
        return new Stream({
            _start: function (il) { il._c(); },
            _stop: noop_1.noop,
        });
    };
    Stream.throw = function (err) {
        return new Stream({
            _start: function (il) { il._e(err); },
            _stop: noop_1.noop,
        });
    };
    Stream.of = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        return Stream.fromArray(items);
    };
    Stream.fromArray = function (array) {
        return new Stream(new FromArrayProducer_1.FromArrayProducer(array));
    };
    Stream.fromPromise = function (promise) {
        return new Stream(new FromPromiseProducer_1.FromPromiseProducer(promise));
    };
    Stream.periodic = function (period) {
        return new Stream(new PeriodicProducer_1.PeriodicProducer(period));
    };
    Stream.merge = function () {
        var streams = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            streams[_i - 0] = arguments[_i];
        }
        return new Stream(new MergeProducer_1.MergeProducer(streams));
    };
    Stream.prototype.map = function (project) {
        return new Stream(new MapOperator_1.MapOperator(project, this));
    };
    Stream.prototype.mapTo = function (projectedValue) {
        return new Stream(new MapToOperator_1.MapToOperator(projectedValue, this));
    };
    Stream.prototype.filter = function (predicate) {
        return new Stream(new FilterOperator_1.FilterOperator(predicate, this));
    };
    Stream.prototype.take = function (amount) {
        return new Stream(new TakeOperator_1.TakeOperator(amount, this));
    };
    Stream.prototype.drop = function (amount) {
        return new Stream(new DropOperator_1.DropOperator(amount, this));
    };
    Stream.prototype.last = function () {
        return new Stream(new LastOperator_1.LastOperator(this));
    };
    Stream.prototype.startWith = function (x) {
        return new Stream(new StartWithOperator_1.StartWithOperator(this, x));
    };
    Stream.prototype.endWhen = function (other) {
        return new Stream(new EndWhenOperator_1.EndWhenOperator(other, this));
    };
    Stream.prototype.fold = function (accumulate, init) {
        return new Stream(new FoldOperator_1.FoldOperator(accumulate, init, this));
    };
    Stream.prototype.replaceError = function (replace) {
        return new Stream(new ReplaceErrorOperator_1.ReplaceErrorOperator(replace, this));
    };
    Stream.prototype.flatten = function () {
        return new Stream(this._prod instanceof MapOperator_1.MapOperator ?
            new MapFlattenOperator_1.MapFlattenOperator(this._prod) :
            new FlattenOperator_1.FlattenOperator(this));
    };
    Stream.prototype.flattenConcurrently = function () {
        return new Stream(this._prod instanceof MapOperator_1.MapOperator ?
            new MapFlattenConcOperator_1.MapFlattenConcOperator(this._prod) :
            new FlattenConcOperator_1.FlattenConcOperator(this));
    };
    Stream.prototype.merge = function (other) {
        return Stream.merge(this, other);
    };
    Stream.prototype.compose = function (operator) {
        return operator(this);
    };
    Stream.prototype.remember = function () {
        return new MemoryStream(this._prod);
    };
    Stream.prototype.imitate = function (other) {
        other._add(this);
    };
    Stream.prototype.debug = function (spy) {
        if (spy === void 0) { spy = null; }
        return new Stream(new DebugOperator_1.DebugOperator(spy, this));
    };
    Stream.combine = function combine(project) {
        var streams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            streams[_i - 1] = arguments[_i];
        }
        return new Stream(new CombineProducer_1.CombineProducer(project, streams));
    };
    return Stream;
}());
exports.Stream = Stream;
var MemoryStream = (function (_super) {
    __extends(MemoryStream, _super);
    function MemoryStream(producer) {
        _super.call(this, producer);
        this._has = false;
    }
    MemoryStream.prototype._n = function (x) {
        this._val = x;
        this._has = true;
        _super.prototype._n.call(this, x);
    };
    MemoryStream.prototype._add = function (listener) {
        if (this._has) {
            listener._n(this._val);
        }
        _super.prototype._add.call(this, listener);
    };
    return MemoryStream;
}(Stream));
exports.MemoryStream = MemoryStream;

},{"./factory/CombineProducer":2,"./factory/FromArrayProducer":3,"./factory/FromPromiseProducer":4,"./factory/MergeProducer":5,"./factory/PeriodicProducer":6,"./operator/DebugOperator":8,"./operator/DropOperator":9,"./operator/EndWhenOperator":10,"./operator/FilterOperator":11,"./operator/FlattenConcOperator":12,"./operator/FlattenOperator":13,"./operator/FoldOperator":14,"./operator/LastOperator":15,"./operator/MapFlattenConcOperator":16,"./operator/MapFlattenOperator":17,"./operator/MapOperator":18,"./operator/MapToOperator":19,"./operator/ReplaceErrorOperator":20,"./operator/StartWithOperator":21,"./operator/TakeOperator":22,"./utils/empty":23,"./utils/internalizeProducer":25,"./utils/noop":27}],2:[function(require,module,exports){
"use strict";
var emptyListener_1 = require('../utils/emptyListener');
var invoke_1 = require('../utils/invoke');
var Proxy = (function () {
    function Proxy(i, prod) {
        this.i = i;
        this.prod = prod;
        prod.proxies.push(this);
    }
    Proxy.prototype._n = function (t) {
        var prod = this.prod;
        var vals = prod.vals;
        prod.hasVal[this.i] = true;
        vals[this.i] = t;
        if (!prod.ready) {
            prod.up();
        }
        if (prod.ready) {
            try {
                prod.out._n(invoke_1.invoke(prod.project, vals));
            }
            catch (e) {
                prod.out._e(e);
            }
        }
    };
    Proxy.prototype._e = function (err) {
        this.prod.out._e(err);
    };
    Proxy.prototype._c = function () {
        var prod = this.prod;
        if (--prod.ac === 0) {
            prod.out._c();
        }
    };
    return Proxy;
}());
exports.Proxy = Proxy;
var CombineProducer = (function () {
    function CombineProducer(project, streams) {
        this.project = project;
        this.streams = streams;
        this.out = emptyListener_1.emptyListener;
        this.proxies = [];
        this.ready = false;
        this.vals = new Array(streams.length);
        this.hasVal = new Array(streams.length);
        this.ac = streams.length;
    }
    CombineProducer.prototype.up = function () {
        for (var i = this.hasVal.length - 1; i >= 0; i--) {
            if (!this.hasVal[i]) {
                return;
            }
        }
        this.ready = true;
    };
    CombineProducer.prototype._start = function (out) {
        this.out = out;
        var streams = this.streams;
        for (var i = streams.length - 1; i >= 0; i--) {
            streams[i]._add(new Proxy(i, this));
        }
    };
    CombineProducer.prototype._stop = function () {
        var streams = this.streams;
        for (var i = streams.length - 1; i >= 0; i--) {
            streams[i]._remove(this.proxies[i]);
        }
        this.out = null;
        this.ac = streams.length;
        this.proxies = [];
        this.ready = false;
        this.vals = new Array(streams.length);
        this.hasVal = new Array(streams.length);
    };
    return CombineProducer;
}());
exports.CombineProducer = CombineProducer;

},{"../utils/emptyListener":24,"../utils/invoke":26}],3:[function(require,module,exports){
"use strict";
var FromArrayProducer = (function () {
    function FromArrayProducer(a) {
        this.a = a;
    }
    FromArrayProducer.prototype._start = function (out) {
        var a = this.a;
        for (var i = 0, l = a.length; i < l; i++) {
            out._n(a[i]);
        }
        out._c();
    };
    FromArrayProducer.prototype._stop = function () {
    };
    return FromArrayProducer;
}());
exports.FromArrayProducer = FromArrayProducer;

},{}],4:[function(require,module,exports){
"use strict";
var FromPromiseProducer = (function () {
    function FromPromiseProducer(p) {
        this.p = p;
        this.on = false;
    }
    FromPromiseProducer.prototype._start = function (out) {
        var prod = this;
        this.on = true;
        this.p.then(function (v) {
            if (prod.on) {
                out._n(v);
                out._c();
            }
        }, function (e) {
            out._e(e);
        }).then(null, function (err) {
            setTimeout(function () { throw err; });
        });
    };
    FromPromiseProducer.prototype._stop = function () {
        this.on = false;
    };
    return FromPromiseProducer;
}());
exports.FromPromiseProducer = FromPromiseProducer;

},{}],5:[function(require,module,exports){
"use strict";
var emptyListener_1 = require('../utils/emptyListener');
var MergeProducer = (function () {
    function MergeProducer(streams) {
        this.streams = streams;
        this.out = emptyListener_1.emptyListener;
        this.ac = streams.length;
    }
    MergeProducer.prototype._start = function (out) {
        this.out = out;
        var streams = this.streams;
        for (var i = streams.length - 1; i >= 0; i--) {
            streams[i]._add(this);
        }
    };
    MergeProducer.prototype._stop = function () {
        var streams = this.streams;
        for (var i = streams.length - 1; i >= 0; i--) {
            streams[i]._remove(this);
        }
        this.out = null;
        this.ac = streams.length;
    };
    MergeProducer.prototype._n = function (t) {
        this.out._n(t);
    };
    MergeProducer.prototype._e = function (err) {
        this.out._e(err);
    };
    MergeProducer.prototype._c = function () {
        if (--this.ac === 0) {
            this.out._c();
        }
    };
    return MergeProducer;
}());
exports.MergeProducer = MergeProducer;

},{"../utils/emptyListener":24}],6:[function(require,module,exports){
"use strict";
var PeriodicProducer = (function () {
    function PeriodicProducer(period) {
        this.period = period;
        this.intervalID = -1;
        this.i = 0;
    }
    PeriodicProducer.prototype._start = function (stream) {
        var self = this;
        function intervalHandler() { stream._n(self.i++); }
        this.intervalID = setInterval(intervalHandler, this.period);
    };
    PeriodicProducer.prototype._stop = function () {
        if (this.intervalID !== -1)
            clearInterval(this.intervalID);
        this.intervalID = -1;
        this.i = 0;
    };
    return PeriodicProducer;
}());
exports.PeriodicProducer = PeriodicProducer;

},{}],7:[function(require,module,exports){
"use strict";
var Stream_1 = require('./Stream');
exports.Stream = Stream_1.Stream;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Stream_1.Stream;

},{"./Stream":1}],8:[function(require,module,exports){
"use strict";
var DebugOperator = (function () {
    function DebugOperator(spy, ins) {
        if (spy === void 0) { spy = null; }
        this.spy = spy;
        this.ins = ins;
        this.out = null;
    }
    DebugOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    DebugOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
    };
    DebugOperator.prototype._n = function (t) {
        if (this.spy) {
            try {
                this.spy(t);
            }
            catch (e) {
                this.out._e(e);
            }
        }
        else {
            console.log(t);
        }
        this.out._n(t);
    };
    DebugOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    DebugOperator.prototype._c = function () {
        this.out._c();
    };
    return DebugOperator;
}());
exports.DebugOperator = DebugOperator;

},{}],9:[function(require,module,exports){
"use strict";
var DropOperator = (function () {
    function DropOperator(max, ins) {
        this.max = max;
        this.ins = ins;
        this.out = null;
        this.dropped = 0;
    }
    DropOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    DropOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
        this.dropped = 0;
    };
    DropOperator.prototype._n = function (t) {
        if (this.dropped++ >= this.max)
            this.out._n(t);
    };
    DropOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    DropOperator.prototype._c = function () {
        this.out._c();
    };
    return DropOperator;
}());
exports.DropOperator = DropOperator;

},{}],10:[function(require,module,exports){
"use strict";
var emptyListener_1 = require('../utils/emptyListener');
var OtherListener = (function () {
    function OtherListener(out, op) {
        this.out = out;
        this.op = op;
    }
    OtherListener.prototype._n = function (t) {
        this.op.end();
    };
    OtherListener.prototype._e = function (err) {
        this.out._e(err);
    };
    OtherListener.prototype._c = function () {
        this.op.end();
    };
    return OtherListener;
}());
exports.OtherListener = OtherListener;
var EndWhenOperator = (function () {
    function EndWhenOperator(o, // o = other
        ins) {
        this.o = o;
        this.ins = ins;
        this.out = null;
        this.oli = emptyListener_1.emptyListener; // oli = other listener
    }
    EndWhenOperator.prototype._start = function (out) {
        this.out = out;
        this.o._add(this.oli = new OtherListener(out, this));
        this.ins._add(this);
    };
    EndWhenOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.o._remove(this.oli);
        this.out = null;
        this.oli = null;
    };
    EndWhenOperator.prototype.end = function () {
        this.out._c();
    };
    EndWhenOperator.prototype._n = function (t) {
        this.out._n(t);
    };
    EndWhenOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    EndWhenOperator.prototype._c = function () {
        this.end();
    };
    return EndWhenOperator;
}());
exports.EndWhenOperator = EndWhenOperator;

},{"../utils/emptyListener":24}],11:[function(require,module,exports){
"use strict";
var FilterOperator = (function () {
    function FilterOperator(predicate, ins) {
        this.predicate = predicate;
        this.ins = ins;
        this.out = null;
    }
    FilterOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    FilterOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
    };
    FilterOperator.prototype._n = function (t) {
        try {
            if (this.predicate(t))
                this.out._n(t);
        }
        catch (e) {
            this.out._e(e);
        }
    };
    FilterOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    FilterOperator.prototype._c = function () {
        this.out._c();
    };
    return FilterOperator;
}());
exports.FilterOperator = FilterOperator;

},{}],12:[function(require,module,exports){
"use strict";
var Inner = (function () {
    function Inner(out, op) {
        this.out = out;
        this.op = op;
    }
    Inner.prototype._n = function (t) {
        this.out._n(t);
    };
    Inner.prototype._e = function (err) {
        this.out._e(err);
    };
    Inner.prototype._c = function () {
        this.op.less();
    };
    return Inner;
}());
exports.Inner = Inner;
var FlattenConcOperator = (function () {
    function FlattenConcOperator(ins) {
        this.ins = ins;
        this.active = 1; // number of outers and inners that have not yet ended
        this.out = null;
    }
    FlattenConcOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    FlattenConcOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.active = 1;
        this.out = null;
    };
    FlattenConcOperator.prototype.less = function () {
        if (--this.active === 0) {
            this.out._c();
        }
    };
    FlattenConcOperator.prototype._n = function (s) {
        this.active++;
        s._add(new Inner(this.out, this));
    };
    FlattenConcOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    FlattenConcOperator.prototype._c = function () {
        this.less();
    };
    return FlattenConcOperator;
}());
exports.FlattenConcOperator = FlattenConcOperator;

},{}],13:[function(require,module,exports){
"use strict";
var Inner = (function () {
    function Inner(out, op) {
        this.out = out;
        this.op = op;
    }
    Inner.prototype._n = function (t) {
        this.out._n(t);
    };
    Inner.prototype._e = function (err) {
        this.out._e(err);
    };
    Inner.prototype._c = function () {
        this.op.curr = null;
        this.op.less();
    };
    return Inner;
}());
exports.Inner = Inner;
var FlattenOperator = (function () {
    function FlattenOperator(ins) {
        this.ins = ins;
        this.curr = null; // Current inner Stream
        this.inner = null; // Current inner InternalListener
        this.open = true;
        this.out = null;
    }
    FlattenOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    FlattenOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.curr = null;
        this.inner = null;
        this.open = true;
        this.out = null;
    };
    FlattenOperator.prototype.cut = function () {
        var _a = this, curr = _a.curr, inner = _a.inner;
        if (curr && inner) {
            curr._remove(inner);
        }
    };
    FlattenOperator.prototype.less = function () {
        if (!this.open && !this.curr) {
            this.out._c();
        }
    };
    FlattenOperator.prototype._n = function (s) {
        this.cut();
        (this.curr = s)._add(this.inner = new Inner(this.out, this));
    };
    FlattenOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    FlattenOperator.prototype._c = function () {
        this.open = false;
        this.less();
    };
    return FlattenOperator;
}());
exports.FlattenOperator = FlattenOperator;

},{}],14:[function(require,module,exports){
"use strict";
var FoldOperator = (function () {
    function FoldOperator(f, seed, ins) {
        this.f = f;
        this.seed = seed;
        this.ins = ins;
        this.out = null;
        this.acc = seed;
    }
    FoldOperator.prototype._start = function (out) {
        this.out = out;
        out._n(this.acc);
        this.ins._add(this);
    };
    FoldOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
        this.acc = this.seed;
    };
    FoldOperator.prototype._n = function (t) {
        try {
            this.out._n(this.acc = this.f(this.acc, t));
        }
        catch (e) {
            this.out._e(e);
        }
    };
    FoldOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    FoldOperator.prototype._c = function () {
        this.out._c();
    };
    return FoldOperator;
}());
exports.FoldOperator = FoldOperator;

},{}],15:[function(require,module,exports){
"use strict";
var empty_1 = require('../utils/empty');
var LastOperator = (function () {
    function LastOperator(ins) {
        this.ins = ins;
        this.out = null;
        this.has = false;
        this.val = empty_1.empty;
    }
    LastOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    LastOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
        this.has = false;
        this.val = empty_1.empty;
    };
    LastOperator.prototype._n = function (t) {
        this.has = true;
        this.val = t;
    };
    LastOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    LastOperator.prototype._c = function () {
        var out = this.out;
        if (this.has) {
            out._n(this.val);
            out._c();
        }
        else {
            out._e('TODO show proper error');
        }
    };
    return LastOperator;
}());
exports.LastOperator = LastOperator;

},{"../utils/empty":23}],16:[function(require,module,exports){
"use strict";
var Inner = (function () {
    function Inner(out, op) {
        this.out = out;
        this.op = op;
    }
    Inner.prototype._n = function (t) {
        this.out._n(t);
    };
    Inner.prototype._e = function (err) {
        this.out._e(err);
    };
    Inner.prototype._c = function () {
        this.op.less();
    };
    return Inner;
}());
exports.Inner = Inner;
var MapFlattenConcOperator = (function () {
    function MapFlattenConcOperator(mapOp) {
        this.mapOp = mapOp;
        this.active = 1; // number of outers and inners that have not yet ended
        this.out = null;
    }
    MapFlattenConcOperator.prototype._start = function (out) {
        this.out = out;
        this.mapOp.ins._add(this);
    };
    MapFlattenConcOperator.prototype._stop = function () {
        this.mapOp.ins._remove(this);
        this.active = 1;
        this.out = null;
    };
    MapFlattenConcOperator.prototype.less = function () {
        if (--this.active === 0) {
            this.out._c();
        }
    };
    MapFlattenConcOperator.prototype._n = function (v) {
        this.active++;
        try {
            this.mapOp.project(v)._add(new Inner(this.out, this));
        }
        catch (e) {
            this.out._e(e);
        }
    };
    MapFlattenConcOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    MapFlattenConcOperator.prototype._c = function () {
        this.less();
    };
    return MapFlattenConcOperator;
}());
exports.MapFlattenConcOperator = MapFlattenConcOperator;

},{}],17:[function(require,module,exports){
"use strict";
var Inner = (function () {
    function Inner(out, op) {
        this.out = out;
        this.op = op;
    }
    Inner.prototype._n = function (t) {
        this.out._n(t);
    };
    Inner.prototype._e = function (err) {
        this.out._e(err);
    };
    Inner.prototype._c = function () {
        this.op.curr = null;
        this.op.less();
    };
    return Inner;
}());
exports.Inner = Inner;
var MapFlattenOperator = (function () {
    function MapFlattenOperator(mapOp) {
        this.mapOp = mapOp;
        this.curr = null; // Current inner Stream
        this.inner = null; // Current inner InternalListener
        this.open = true;
        this.out = null;
    }
    MapFlattenOperator.prototype._start = function (out) {
        this.out = out;
        this.mapOp.ins._add(this);
    };
    MapFlattenOperator.prototype._stop = function () {
        this.mapOp.ins._remove(this);
        this.curr = null;
        this.inner = null;
        this.open = true;
        this.out = null;
    };
    MapFlattenOperator.prototype.cut = function () {
        var _a = this, curr = _a.curr, inner = _a.inner;
        if (curr && inner) {
            curr._remove(inner);
        }
    };
    MapFlattenOperator.prototype.less = function () {
        if (!this.open && !this.curr) {
            this.out._c();
        }
    };
    MapFlattenOperator.prototype._n = function (v) {
        this.cut();
        try {
            (this.curr = this.mapOp.project(v))._add(this.inner = new Inner(this.out, this));
        }
        catch (e) {
            this.out._e(e);
        }
    };
    MapFlattenOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    MapFlattenOperator.prototype._c = function () {
        this.open = false;
        this.less();
    };
    return MapFlattenOperator;
}());
exports.MapFlattenOperator = MapFlattenOperator;

},{}],18:[function(require,module,exports){
"use strict";
var MapOperator = (function () {
    function MapOperator(project, ins) {
        this.project = project;
        this.ins = ins;
        this.out = null;
    }
    MapOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    MapOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
    };
    MapOperator.prototype._n = function (t) {
        try {
            this.out._n(this.project(t));
        }
        catch (e) {
            this.out._e(e);
        }
    };
    MapOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    MapOperator.prototype._c = function () {
        this.out._c();
    };
    return MapOperator;
}());
exports.MapOperator = MapOperator;

},{}],19:[function(require,module,exports){
"use strict";
var MapToOperator = (function () {
    function MapToOperator(val, ins) {
        this.val = val;
        this.ins = ins;
        this.out = null;
    }
    MapToOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    MapToOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
    };
    MapToOperator.prototype._n = function (t) {
        this.out._n(this.val);
    };
    MapToOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    MapToOperator.prototype._c = function () {
        this.out._c();
    };
    return MapToOperator;
}());
exports.MapToOperator = MapToOperator;

},{}],20:[function(require,module,exports){
"use strict";
var empty_1 = require('../utils/empty');
var ReplaceErrorOperator = (function () {
    function ReplaceErrorOperator(fn, ins) {
        this.fn = fn;
        this.ins = ins;
        this.out = empty_1.empty;
    }
    ReplaceErrorOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    ReplaceErrorOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
    };
    ReplaceErrorOperator.prototype._n = function (t) {
        this.out._n(t);
    };
    ReplaceErrorOperator.prototype._e = function (err) {
        try {
            this.ins._remove(this);
            (this.ins = this.fn(err))._add(this);
        }
        catch (e) {
            this.out._e(e);
        }
    };
    ReplaceErrorOperator.prototype._c = function () {
        this.out._c();
    };
    return ReplaceErrorOperator;
}());
exports.ReplaceErrorOperator = ReplaceErrorOperator;

},{"../utils/empty":23}],21:[function(require,module,exports){
"use strict";
var emptyListener_1 = require('../utils/emptyListener');
var StartWithOperator = (function () {
    function StartWithOperator(ins, value) {
        this.ins = ins;
        this.value = value;
        this.out = emptyListener_1.emptyListener;
    }
    StartWithOperator.prototype._start = function (out) {
        this.out = out;
        this.out._n(this.value);
        this.ins._add(out);
    };
    StartWithOperator.prototype._stop = function () {
        this.ins._remove(this.out);
        this.out = null;
    };
    return StartWithOperator;
}());
exports.StartWithOperator = StartWithOperator;

},{"../utils/emptyListener":24}],22:[function(require,module,exports){
"use strict";
var TakeOperator = (function () {
    function TakeOperator(max, ins) {
        this.max = max;
        this.ins = ins;
        this.out = null;
        this.taken = 0;
    }
    TakeOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    TakeOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
        this.taken = 0;
    };
    TakeOperator.prototype._n = function (t) {
        var out = this.out;
        if (this.taken++ < this.max - 1) {
            out._n(t);
        }
        else {
            out._n(t);
            out._c();
            this._stop();
        }
    };
    TakeOperator.prototype._e = function (err) {
        this.out._e(err);
    };
    TakeOperator.prototype._c = function () {
        this.out._c();
    };
    return TakeOperator;
}());
exports.TakeOperator = TakeOperator;

},{}],23:[function(require,module,exports){
"use strict";
exports.empty = {};

},{}],24:[function(require,module,exports){
"use strict";
var noop_1 = require('./noop');
exports.emptyListener = {
    _n: noop_1.noop,
    _e: noop_1.noop,
    _c: noop_1.noop,
};

},{"./noop":27}],25:[function(require,module,exports){
"use strict";
// mutates the input
function internalizeProducer(producer) {
    producer._start =
        function _start(il) {
            il.next = il._n;
            il.error = il._e;
            il.complete = il._c;
            this.start(il);
        };
    producer._stop = producer.stop;
}
exports.internalizeProducer = internalizeProducer;

},{}],26:[function(require,module,exports){
"use strict";
function invoke(f, args) {
    switch (args.length) {
        case 0: return f();
        case 1: return f(args[0]);
        case 2: return f(args[0], args[1]);
        case 3: return f(args[0], args[1], args[2]);
        case 4: return f(args[0], args[1], args[2], args[3]);
        case 5: return f(args[0], args[1], args[2], args[3], args[4]);
        default: return f.apply(void 0, args);
    }
}
exports.invoke = invoke;

},{}],27:[function(require,module,exports){
"use strict";
/* tslint:disable:no-empty */
function noop() { }
exports.noop = noop;
;

},{}]},{},[7])(7)
});