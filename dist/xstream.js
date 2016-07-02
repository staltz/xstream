(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xstream = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var empty = {};
function noop() { }
function copy(a) {
    var l = a.length;
    var b = Array(l);
    for (var i = 0; i < l; ++i) {
        b[i] = a[i];
    }
    return b;
}
exports.emptyIL = {
    _n: noop,
    _e: noop,
    _c: noop,
};

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
function compose2(f1, f2) {
    return function composedFn(arg) {
        return f1(f2(arg));
    };
}
function and(f1, f2) {
    return function andFn(t) {
        return f1(t) && f2(t);
    };
}
var MergeProducer = (function () {
    function MergeProducer(s) {
        var q = this;
        q.type = 'merge';
        q.out = null;
        q.insArr = s;
        q.ac = s.length;
    }
    MergeProducer.prototype._start = function (out) {
        var q = this;
        q.out = out;
        var s = q.insArr;
        var L = s.length;
        for (var i = 0; i < L; i++) {
            s[i]._add(q);
        }
    };
    MergeProducer.prototype._stop = function () {
        var q = this;
        var s = q.insArr;
        var L = s.length;
        for (var i = 0; i < L; i++) {
            s[i]._remove(q);
        }
        q.out = null;
        q.ac = L;
    };
    MergeProducer.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        u._n(t);
    };
    MergeProducer.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    MergeProducer.prototype._c = function () {
        if (--this.ac === 0) {
            var u = this.out;
            if (!u)
                return;
            u._c();
        }
    };
    return MergeProducer;
}());
exports.MergeProducer = MergeProducer;
var CombineListener = (function () {
    function CombineListener(i, u, p) {
        var q = this;
        q.i = i;
        q.out = u;
        q.p = p;
        p.ils.push(q);
    }
    CombineListener.prototype._n = function (t) {
        var q = this;
        var p = q.p, out = q.out;
        if (!out)
            return;
        if (p.up(t, q.i)) {
            out._n(p.vals);
        }
    };
    CombineListener.prototype._e = function (err) {
        var out = this.out;
        if (!out)
            return;
        out._e(err);
    };
    CombineListener.prototype._c = function () {
        var p = this.p;
        if (!p.out)
            return;
        if (--p.Nc === 0) {
            p.out._c();
        }
    };
    return CombineListener;
}());
exports.CombineListener = CombineListener;
var CombineProducer = (function () {
    function CombineProducer(s) {
        var q = this;
        q.type = 'combine';
        q.out = null;
        q.ils = [];
        q.insArr = s;
        var n = q.Nc = q.Nn = s.length;
        var vals = q.vals = new Array(n);
        for (var i = 0; i < n; i++) {
            vals[i] = empty;
        }
    }
    CombineProducer.prototype.up = function (t, i) {
        var q = this;
        var v = q.vals[i];
        var Nn = !q.Nn ? 0 : v === empty ? --q.Nn : q.Nn;
        q.vals[i] = t;
        return Nn === 0;
    };
    CombineProducer.prototype._start = function (out) {
        var q = this;
        q.out = out;
        var s = q.insArr;
        var n = s.length;
        if (n === 0) {
            out._n([]);
            out._c();
        }
        else {
            for (var i = 0; i < n; i++) {
                s[i]._add(new CombineListener(i, out, q));
            }
        }
    };
    CombineProducer.prototype._stop = function () {
        var q = this;
        var s = q.insArr;
        var n = q.Nc = q.Nn = s.length;
        var vals = q.vals = new Array(n);
        for (var i = 0; i < n; i++) {
            s[i]._remove(q.ils[i]);
            vals[i] = empty;
        }
        q.out = null;
        q.ils = [];
    };
    return CombineProducer;
}());
exports.CombineProducer = CombineProducer;
var FromArrayProducer = (function () {
    function FromArrayProducer(a) {
        this.type = 'fromArray';
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
var FromPromiseProducer = (function () {
    function FromPromiseProducer(p) {
        var q = this;
        q.type = 'fromPromise';
        q.on = false;
        q.p = p;
    }
    FromPromiseProducer.prototype._start = function (out) {
        var q = this;
        q.on = true;
        q.p.then(function (v) {
            if (q.on) {
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
var PeriodicProducer = (function () {
    function PeriodicProducer(p) {
        var q = this;
        q.type = 'periodic';
        q.id = -1;
        q.i = 0;
        q.period = p;
    }
    PeriodicProducer.prototype._start = function (stream) {
        var q = this;
        function f() { stream._n(q.i++); }
        q.id = setInterval(f, q.period);
    };
    PeriodicProducer.prototype._stop = function () {
        var q = this;
        if (q.id !== -1)
            clearInterval(q.id);
        q.id = -1;
        q.i = 0;
    };
    return PeriodicProducer;
}());
exports.PeriodicProducer = PeriodicProducer;
var DebugOperator = (function () {
    function DebugOperator(arg, s) {
        var q = this;
        q.type = 'debug';
        q.out = null;
        q.s = null;
        q.l = null;
        q.ins = s;
        if (typeof arg === 'string') {
            q.l = arg;
        }
        else {
            q.s = arg;
        }
    }
    DebugOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.ins._add(q);
    };
    DebugOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.out = null;
    };
    DebugOperator.prototype._n = function (t) {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        var s = q.s, l = q.l;
        if (s) {
            try {
                s(t);
            }
            catch (e) {
                u._e(e);
            }
        }
        else if (l) {
            console.log(l + ':', t);
        }
        else {
            console.log(t);
        }
        u._n(t);
    };
    DebugOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    DebugOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return DebugOperator;
}());
exports.DebugOperator = DebugOperator;
var DropOperator = (function () {
    function DropOperator(m, s) {
        var q = this;
        q.type = 'drop';
        q.out = null;
        q.dropped = 0;
        q.max = m;
        q.ins = s;
    }
    DropOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.ins._add(q);
    };
    DropOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.out = null;
        q.dropped = 0;
    };
    DropOperator.prototype._n = function (t) {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        if (q.dropped++ >= q.max)
            u._n(t);
    };
    DropOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    DropOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return DropOperator;
}());
exports.DropOperator = DropOperator;
var OtherIL = (function () {
    function OtherIL(u, o) {
        this.out = u;
        this.op = o;
    }
    OtherIL.prototype._n = function (t) {
        this.op.end();
    };
    OtherIL.prototype._e = function (err) {
        this.out._e(err);
    };
    OtherIL.prototype._c = function () {
        this.op.end();
    };
    return OtherIL;
}());
var EndWhenOperator = (function () {
    function EndWhenOperator(o, s) {
        var q = this;
        q.type = 'endWhen';
        q.out = null;
        q.o = o;
        q.ins = s;
        q.oil = exports.emptyIL;
    }
    EndWhenOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.o._add(q.oil = new OtherIL(out, q));
        q.ins._add(q);
    };
    EndWhenOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.o._remove(q.oil);
        q.out = null;
        q.oil = null;
    };
    EndWhenOperator.prototype.end = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    EndWhenOperator.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        u._n(t);
    };
    EndWhenOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    EndWhenOperator.prototype._c = function () {
        this.end();
    };
    return EndWhenOperator;
}());
exports.EndWhenOperator = EndWhenOperator;
var FilterOperator = (function () {
    function FilterOperator(p, s) {
        var q = this;
        q.type = 'filter';
        q.out = null;
        q.passes = p;
        q.ins = s;
    }
    FilterOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.ins._add(q);
    };
    FilterOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.out = null;
    };
    FilterOperator.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        try {
            if (this.passes(t))
                u._n(t);
        }
        catch (e) {
            u._e(e);
        }
    };
    FilterOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    FilterOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return FilterOperator;
}());
exports.FilterOperator = FilterOperator;
var FlattenListener = (function () {
    function FlattenListener(u, o) {
        this.out = u;
        this.op = o;
    }
    FlattenListener.prototype._n = function (t) {
        this.out._n(t);
    };
    FlattenListener.prototype._e = function (err) {
        this.out._e(err);
    };
    FlattenListener.prototype._c = function () {
        this.op.inner = null;
        this.op.less();
    };
    return FlattenListener;
}());
var FlattenOperator = (function () {
    function FlattenOperator(s) {
        var q = this;
        q.type = 'flatten';
        q.inner = null;
        q.il = null;
        q.open = true;
        q.out = null;
        q.ins = s;
    }
    FlattenOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.ins._add(q);
    };
    FlattenOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.inner = null;
        q.il = null;
        q.open = true;
        q.out = null;
    };
    FlattenOperator.prototype.less = function () {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        if (!q.open && !q.inner)
            u._c();
    };
    FlattenOperator.prototype._n = function (s) {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        var inner = q.inner, il = q.il;
        if (inner && il)
            inner._remove(il);
        (q.inner = s)._add(q.il = new FlattenListener(u, q));
    };
    FlattenOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    FlattenOperator.prototype._c = function () {
        this.open = false;
        this.less();
    };
    return FlattenOperator;
}());
exports.FlattenOperator = FlattenOperator;
var FoldOperator = (function () {
    function FoldOperator(f, e, s) {
        var q = this;
        q.type = 'fold';
        q.out = null;
        q.f = f;
        q.seed = e;
        q.acc = e;
        q.ins = s;
    }
    FoldOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        out._n(q.acc);
        q.ins._add(q);
    };
    FoldOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.out = null;
        q.acc = q.seed;
    };
    FoldOperator.prototype._n = function (t) {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        try {
            u._n(q.acc = q.f(q.acc, t));
        }
        catch (e) {
            u._e(e);
        }
    };
    FoldOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    FoldOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return FoldOperator;
}());
exports.FoldOperator = FoldOperator;
var LastOperator = (function () {
    function LastOperator(s) {
        var q = this;
        q.type = 'last';
        q.out = null;
        q.has = false;
        q.val = empty;
        q.ins = s;
    }
    LastOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.ins._add(q);
    };
    LastOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.out = null;
        q.has = false;
        q.val = empty;
    };
    LastOperator.prototype._n = function (t) {
        this.has = true;
        this.val = t;
    };
    LastOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    LastOperator.prototype._c = function () {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        if (q.has) {
            u._n(q.val);
            u._c();
        }
        else {
            u._e('TODO show proper error');
        }
    };
    return LastOperator;
}());
exports.LastOperator = LastOperator;
var MapFlattenInner = (function () {
    function MapFlattenInner(u, o) {
        this.out = u;
        this.op = o;
    }
    MapFlattenInner.prototype._n = function (r) {
        this.out._n(r);
    };
    MapFlattenInner.prototype._e = function (err) {
        this.out._e(err);
    };
    MapFlattenInner.prototype._c = function () {
        this.op.inner = null;
        this.op.less();
    };
    return MapFlattenInner;
}());
var MapFlattenOperator = (function () {
    function MapFlattenOperator(m) {
        var q = this;
        q.type = m.type + "+flatten";
        q.ins = m.ins;
        q.inner = null;
        q.il = null;
        q.open = true;
        q.out = null;
        q.mapOp = m;
    }
    MapFlattenOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.mapOp.ins._add(q);
    };
    MapFlattenOperator.prototype._stop = function () {
        var q = this;
        q.mapOp.ins._remove(q);
        q.inner = null;
        q.il = null;
        q.open = true;
        q.out = null;
    };
    MapFlattenOperator.prototype.less = function () {
        var q = this;
        if (!q.open && !q.inner) {
            var u = q.out;
            if (!u)
                return;
            u._c();
        }
    };
    MapFlattenOperator.prototype._n = function (v) {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        var inner = q.inner, il = q.il;
        if (inner && il)
            inner._remove(il);
        try {
            (q.inner = q.mapOp.project(v))._add(q.il = new MapFlattenInner(u, q));
        }
        catch (e) {
            u._e(e);
        }
    };
    MapFlattenOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    MapFlattenOperator.prototype._c = function () {
        this.open = false;
        this.less();
    };
    return MapFlattenOperator;
}());
exports.MapFlattenOperator = MapFlattenOperator;
var MapOperator = (function () {
    function MapOperator(p, s) {
        var q = this;
        q.type = 'map';
        q.out = null;
        q.project = p;
        q.ins = s;
    }
    MapOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.ins._add(q);
    };
    MapOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.out = null;
    };
    MapOperator.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        try {
            u._n(this.project(t));
        }
        catch (e) {
            u._e(e);
        }
    };
    MapOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    MapOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return MapOperator;
}());
exports.MapOperator = MapOperator;
var FilterMapOperator = (function (_super) {
    __extends(FilterMapOperator, _super);
    function FilterMapOperator(p, project, ins) {
        _super.call(this, project, ins);
        this.type = 'filter+map';
        this.passes = p;
    }
    FilterMapOperator.prototype._n = function (v) {
        if (this.passes(v)) {
            _super.prototype._n.call(this, v);
        }
        ;
    };
    return FilterMapOperator;
}(MapOperator));
exports.FilterMapOperator = FilterMapOperator;
var ReplaceErrorOperator = (function () {
    function ReplaceErrorOperator(f, s) {
        var q = this;
        q.type = 'replaceError';
        q.out = empty;
        q.fn = f;
        q.ins = s;
    }
    ReplaceErrorOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.ins._add(q);
    };
    ReplaceErrorOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.out = null;
    };
    ReplaceErrorOperator.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        u._n(t);
    };
    ReplaceErrorOperator.prototype._e = function (err) {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        try {
            q.ins._remove(q);
            (q.ins = q.fn(err))._add(q);
        }
        catch (e) {
            u._e(e);
        }
    };
    ReplaceErrorOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return ReplaceErrorOperator;
}());
exports.ReplaceErrorOperator = ReplaceErrorOperator;
var StartWithOperator = (function () {
    function StartWithOperator(s, v) {
        var q = this;
        q.type = 'startWith';
        q.out = exports.emptyIL;
        q.ins = s;
        q.value = v;
    }
    StartWithOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.out._n(q.value);
        q.ins._add(out);
    };
    StartWithOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q.out);
        q.out = null;
    };
    return StartWithOperator;
}());
exports.StartWithOperator = StartWithOperator;
var TakeOperator = (function () {
    function TakeOperator(m, s) {
        var q = this;
        q.type = 'take';
        q.out = null;
        q.taken = 0;
        q.max = m;
        q.ins = s;
    }
    TakeOperator.prototype._start = function (out) {
        var q = this;
        q.out = out;
        q.ins._add(q);
    };
    TakeOperator.prototype._stop = function () {
        var q = this;
        q.ins._remove(q);
        q.out = null;
        q.taken = 0;
    };
    TakeOperator.prototype._n = function (t) {
        var q = this;
        var u = q.out;
        if (!u)
            return;
        if (q.taken++ < q.max - 1) {
            u._n(t);
        }
        else {
            u._n(t);
            u._c();
        }
    };
    TakeOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    TakeOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return TakeOperator;
}());
exports.TakeOperator = TakeOperator;
var Stream = (function () {
    function Stream(producer) {
        var q = this;
        q._prod = producer;
        q._ils = [];
        q._stopID = empty;
        q._target = null;
        q._err = null;
    }
    Stream.prototype._n = function (t) {
        var a = this._ils;
        var L = a.length;
        if (L == 1)
            a[0]._n(t);
        else {
            var b = copy(a);
            for (var i = 0; i < L; i++)
                b[i]._n(t);
        }
    };
    Stream.prototype._e = function (err) {
        var q = this;
        if (q._err)
            return;
        q._err = err;
        var a = q._ils;
        var L = a.length;
        if (L == 1)
            a[0]._e(err);
        else {
            var b = copy(a);
            for (var i = 0; i < L; i++)
                b[i]._e(err);
        }
        q._x();
    };
    Stream.prototype._c = function () {
        var a = this._ils;
        var L = a.length;
        if (L == 1)
            a[0]._c();
        else {
            var b = copy(a);
            for (var i = 0; i < L; i++)
                b[i]._c();
        }
        this._x();
    };
    Stream.prototype._x = function () {
        var q = this;
        if (q._ils.length === 0)
            return;
        if (q._prod)
            q._prod._stop();
        q._err = null;
        q._ils = [];
    };
    
    Stream.prototype.addListener = function (listener) {
        if (typeof listener.next !== 'function'
            || typeof listener.error !== 'function'
            || typeof listener.complete !== 'function') {
            throw new Error('stream.addListener() requires all three next, error, ' +
                'and complete functions.');
        }
        listener._n = listener.next;
        listener._e = listener.error;
        listener._c = listener.complete;
        this._add(listener);
    };
    
    Stream.prototype.removeListener = function (listener) {
        this._remove(listener);
    };
    Stream.prototype._add = function (il) {
        var q = this;
        var ta = q._target;
        if (ta)
            return ta._add(il);
        var a = q._ils;
        a.push(il);
        if (a.length === 1) {
            if (q._stopID !== empty) {
                clearTimeout(q._stopID);
                q._stopID = empty;
            }
            var p = q._prod;
            if (p)
                p._start(q);
        }
    };
    Stream.prototype._remove = function (il) {
        var q = this;
        var ta = q._target;
        if (ta)
            return ta._remove(il);
        var a = q._ils;
        var i = a.indexOf(il);
        if (i > -1) {
            a.splice(i, 1);
            var p_1 = q._prod;
            if (p_1 && a.length <= 0) {
                q._err = null;
                q._stopID = setTimeout(function () { return p_1._stop(); });
            }
            else if (a.length === 1) {
                q._pruneCycles();
            }
        }
    };
    
    
    
    
    Stream.prototype._pruneCycles = function () {
        var q = this;
        if (q._hasNoSinks(q, [])) {
            q._remove(q._ils[0]);
        }
    };
    
    
    
    
    Stream.prototype._hasNoSinks = function (x, trace) {
        var q = this;
        if (trace.indexOf(x) !== -1) {
            return true;
        }
        else if (x.out === q) {
            return true;
        }
        else if (x.out) {
            return q._hasNoSinks(x.out, trace.concat(x));
        }
        else if (x._ils) {
            for (var i = 0, N = x._ils.length; i < N; i++) {
                if (!q._hasNoSinks(x._ils[i], trace.concat(x))) {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    };
    Stream.prototype.ctor = function () {
        return this instanceof MemoryStream ? MemoryStream : Stream;
    };
    
    Stream.create = function (producer) {
        if (producer) {
            if (typeof producer.start !== 'function'
                || typeof producer.stop !== 'function') {
                throw new Error('producer requires both start and stop functions');
            }
            internalizeProducer(producer); 
        }
        return new Stream(producer);
    };
    
    Stream.createWithMemory = function (producer) {
        if (producer) {
            internalizeProducer(producer); 
        }
        return new MemoryStream(producer);
    };
    
    Stream.never = function () {
        return new Stream({ _start: noop, _stop: noop });
    };
    
    Stream.empty = function () {
        return new Stream({
            _start: function (il) { il._c(); },
            _stop: noop,
        });
    };
    
    Stream.throw = function (error) {
        return new Stream({
            _start: function (il) { il._e(error); },
            _stop: noop,
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
        return new Stream(new FromArrayProducer(array));
    };
    
    Stream.fromPromise = function (promise) {
        return new Stream(new FromPromiseProducer(promise));
    };
    
    Stream.periodic = function (period) {
        return new Stream(new PeriodicProducer(period));
    };
    
    Stream.merge = function () {
        var streams = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            streams[_i - 0] = arguments[_i];
        }
        return new Stream(new MergeProducer(streams));
    };
    Stream.prototype._map = function (project) {
        var q = this;
        var p = q._prod;
        var ctor = q.ctor();
        if (p instanceof FilterOperator) {
            return new ctor(new FilterMapOperator(p.passes, project, p.ins));
        }
        if (p instanceof FilterMapOperator) {
            return new ctor(new FilterMapOperator(p.passes, compose2(project, p.project), p.ins));
        }
        if (p instanceof MapOperator) {
            return new ctor(new MapOperator(compose2(project, p.project), p.ins));
        }
        return new ctor(new MapOperator(project, q));
    };
    
    Stream.prototype.map = function (project) {
        return this._map(project);
    };
    
    Stream.prototype.mapTo = function (projectedValue) {
        var s = this.map(function () { return projectedValue; });
        var op = s._prod;
        op.type = op.type.replace('map', 'mapTo');
        return s;
    };
    
    Stream.prototype.filter = function (passes) {
        var p = this._prod;
        if (p instanceof FilterOperator) {
            return new Stream(new FilterOperator(and(passes, p.passes), p.ins));
        }
        return new Stream(new FilterOperator(passes, this));
    };
    
    Stream.prototype.take = function (amount) {
        return new (this.ctor())(new TakeOperator(amount, this));
    };
    
    Stream.prototype.drop = function (amount) {
        return new Stream(new DropOperator(amount, this));
    };
    
    Stream.prototype.last = function () {
        return new Stream(new LastOperator(this));
    };
    
    Stream.prototype.startWith = function (initial) {
        return new MemoryStream(new StartWithOperator(this, initial));
    };
    
    Stream.prototype.endWhen = function (other) {
        return new (this.ctor())(new EndWhenOperator(other, this));
    };
    
    Stream.prototype.fold = function (accumulate, seed) {
        return new MemoryStream(new FoldOperator(accumulate, seed, this));
    };
    
    Stream.prototype.replaceError = function (replace) {
        return new (this.ctor())(new ReplaceErrorOperator(replace, this));
    };
    
    Stream.prototype.flatten = function () {
        var p = this._prod;
        return new Stream(p instanceof MapOperator && !(p instanceof FilterMapOperator) ?
            new MapFlattenOperator(p) :
            new FlattenOperator(this));
    };
    
    Stream.prototype.compose = function (operator) {
        return operator(this);
    };
    
    Stream.prototype.remember = function () {
        var _this = this;
        return new MemoryStream({
            _start: function (il) {
                var p = _this._prod;
                if (p)
                    p._start(il);
            },
            _stop: function () {
                var p = _this._prod;
                if (p)
                    p._stop();
            },
        });
    };
    
    Stream.prototype.debug = function (labelOrSpy) {
        return new (this.ctor())(new DebugOperator(labelOrSpy, this));
    };
    
    Stream.prototype.imitate = function (target) {
        if (target instanceof MemoryStream) {
            throw new Error('A MemoryStream was given to imitate(), but it only ' +
                'supports a Stream. Read more about this restriction here: ' +
                'https://github.com/staltz/xstream#faq');
        }
        this._target = target;
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
    
    Stream.combine = function combine() {
        var streams = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            streams[_i - 0] = arguments[_i];
        }
        return new Stream(new CombineProducer(streams));
    };
    return Stream;
}());
exports.Stream = Stream;
var MemoryStream = (function (_super) {
    __extends(MemoryStream, _super);
    function MemoryStream(producer) {
        _super.call(this, producer);
        this._v = empty;
        this._has = false;
    }
    MemoryStream.prototype._n = function (x) {
        this._v = x;
        this._has = true;
        _super.prototype._n.call(this, x);
    };
    MemoryStream.prototype._add = function (il) {
        if (this._has) {
            il._n(this._v);
        }
        _super.prototype._add.call(this, il);
    };
    MemoryStream.prototype._x = function () {
        this._has = false;
        _super.prototype._x.call(this);
    };
    MemoryStream.prototype.map = function (project) {
        return this._map(project);
    };
    MemoryStream.prototype.mapTo = function (projectedValue) {
        return _super.prototype.mapTo.call(this, projectedValue);
    };
    MemoryStream.prototype.take = function (amount) {
        return _super.prototype.take.call(this, amount);
    };
    MemoryStream.prototype.endWhen = function (other) {
        return _super.prototype.endWhen.call(this, other);
    };
    MemoryStream.prototype.replaceError = function (replace) {
        return _super.prototype.replaceError.call(this, replace);
    };
    MemoryStream.prototype.debug = function (labelOrSpy) {
        return _super.prototype.debug.call(this, labelOrSpy);
    };
    return MemoryStream;
}(Stream));
exports.MemoryStream = MemoryStream;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Stream;

},{}],2:[function(require,module,exports){
"use strict";
var core_1 = require('./core');
exports.Stream = core_1.Stream;
exports.MemoryStream = core_1.MemoryStream;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = core_1.Stream;

},{"./core":1}]},{},[2])(2)
});