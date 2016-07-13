"use strict";
var TakeOperator = (function () {
    function TakeOperator(amount, _subscribable) {
        this.amount = amount;
        this._subscribable = _subscribable;
    }
    TakeOperator.prototype.subscribe = function (listener) {
        return this._subscribable.subscribe(new TakeListener(this.amount, listener));
    };
    return TakeOperator;
}());
exports.TakeOperator = TakeOperator;
var TakeListener = (function () {
    function TakeListener(amount, listener) {
        this.amount = amount;
        this.listener = listener;
    }
    TakeListener.prototype.next = function (x) {
        if (--this.amount >= 0)
            this.listener.next(x);
    };
    TakeListener.prototype.error = function (e) { this.listener.error(e); };
    TakeListener.prototype.complete = function () { this.listener.complete(); };
    return TakeListener;
}());
//# sourceMappingURL=take.js.map