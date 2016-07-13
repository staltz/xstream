"use strict";
var util_1 = require('../util');
var EndWhenOperator = (function () {
    function EndWhenOperator(signal, _subscribable) {
        this.signal = signal;
        this._subscribable = _subscribable;
    }
    EndWhenOperator.prototype.subscribe = function (listener) {
        var subscription = this._subscribable.subscribe(listener);
        var signal = this.signal.subscribe(new EndWhenListener(listener, subscription));
        return new EndWhenSubscription(subscription, signal);
    };
    return EndWhenOperator;
}());
exports.EndWhenOperator = EndWhenOperator;
var EndWhenListener = (function () {
    function EndWhenListener(listener, subscription) {
        this.listener = listener;
        this.subscription = subscription;
    }
    EndWhenListener.prototype.next = function (x) {
        this.subscription.unsubscribe();
        this.listener.complete();
    };
    EndWhenListener.prototype.error = function (e) {
        this.subscription.unsubscribe();
        this.listener.error(e);
    };
    EndWhenListener.prototype.complete = function () {
        this.subscription.unsubscribe();
        this.listener.complete();
    };
    return EndWhenListener;
}());
var EndWhenSubscription = (function () {
    function EndWhenSubscription() {
        var subscriptions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            subscriptions[_i - 0] = arguments[_i];
        }
        this.subscriptions = subscriptions;
    }
    EndWhenSubscription.prototype.unsubscribe = function () {
        util_1.forEach(unsubscribe, this.subscriptions);
    };
    return EndWhenSubscription;
}());
exports.EndWhenSubscription = EndWhenSubscription;
function unsubscribe(sub) {
    sub.unsubscribe();
}
//# sourceMappingURL=endWhen.js.map