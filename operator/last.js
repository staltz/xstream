"use strict";
var LastOperator = (function () {
    function LastOperator(_subscribable) {
        this._subscribable = _subscribable;
    }
    LastOperator.prototype.subscribe = function (listener) {
        return this._subscribable.subscribe(new LastListener(listener));
    };
    return LastOperator;
}());
exports.LastOperator = LastOperator;
var LastListener = (function () {
    function LastListener(listener) {
        this.listener = listener;
        this.value = void 0;
        this.has = false;
    }
    LastListener.prototype.next = function (x) {
        this.has = true;
        this.value = x;
    };
    LastListener.prototype.error = function (e) { this.listener.error(e); };
    LastListener.prototype.complete = function () {
        if (this.has) {
            this.listener.next(this.value);
        }
        this.listener.complete();
    };
    return LastListener;
}());
//# sourceMappingURL=last.js.map