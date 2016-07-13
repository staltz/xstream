"use strict";
var FoldOperator = (function () {
    function FoldOperator(f, seed, _subscribable) {
        this.f = f;
        this.seed = seed;
        this._subscribable = _subscribable;
    }
    FoldOperator.prototype.subscribe = function (listener) {
        listener.next(this.seed);
        return this._subscribable.subscribe(new FoldListener(this.f, this.seed, listener));
    };
    return FoldOperator;
}());
exports.FoldOperator = FoldOperator;
var FoldListener = (function () {
    function FoldListener(f, seed, listener) {
        this.f = f;
        this.seed = seed;
        this.listener = listener;
    }
    FoldListener.prototype.next = function (x) {
        var f = this.f;
        this.seed = f(this.seed, x);
        this.listener.next(this.seed);
    };
    FoldListener.prototype.error = function (e) {
        this.listener.error(e);
    };
    FoldListener.prototype.complete = function () {
        this.listener.complete();
    };
    return FoldListener;
}());
//# sourceMappingURL=fold.js.map