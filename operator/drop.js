"use strict";
var DropOperator = (function () {
    function DropOperator(amount, _subscribable) {
        this.amount = amount;
        this._subscribable = _subscribable;
    }
    DropOperator.prototype.subscribe = function (listener) {
        return this._subscribable.subscribe(new DropListener(this.amount, listener));
    };
    return DropOperator;
}());
exports.DropOperator = DropOperator;
var DropListener = (function () {
    function DropListener(amount, listener) {
        this.amount = amount;
        this.listener = listener;
    }
    DropListener.prototype.next = function (x) {
        if (--this.amount < 0)
            this.listener.next(x);
    };
    DropListener.prototype.error = function (e) { this.listener.error(e); };
    DropListener.prototype.complete = function () { this.listener.complete(); };
    return DropListener;
}());
//# sourceMappingURL=drop.js.map