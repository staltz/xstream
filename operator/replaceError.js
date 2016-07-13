"use strict";
var ReplaceErrorOperator = (function () {
    function ReplaceErrorOperator(f, _subscribable) {
        this.f = f;
        this._subscribable = _subscribable;
        this._subscription = void 0;
    }
    ReplaceErrorOperator.prototype.subscribe = function (listener) {
        return new ReplaceErrorSubscription(this.f, this._subscribable, listener);
    };
    return ReplaceErrorOperator;
}());
exports.ReplaceErrorOperator = ReplaceErrorOperator;
var ReplaceErrorSubscription = (function () {
    function ReplaceErrorSubscription(f, subscribable, listener) {
        this.f = f;
        this.listener = listener;
        this.subscription = subscribable.subscribe(this);
    }
    ReplaceErrorSubscription.prototype.next = function (x) {
        this.listener.next(x);
    };
    ReplaceErrorSubscription.prototype.error = function (e) {
        this.subscription.unsubscribe();
        var f = this.f;
        this.subscription = f(e).subscribe(this);
    };
    ReplaceErrorSubscription.prototype.complete = function () {
        this.listener.complete();
    };
    ReplaceErrorSubscription.prototype.unsubscribe = function () {
        this.subscription.unsubscribe();
    };
    return ReplaceErrorSubscription;
}());
//# sourceMappingURL=replaceError.js.map