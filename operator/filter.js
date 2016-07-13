"use strict";
var FilterOperator = (function () {
    function FilterOperator(predicate, _subscribable) {
        this.predicate = predicate;
        this._subscribable = _subscribable;
    }
    FilterOperator.prototype.subscribe = function (listener) {
        return this._subscribable.subscribe(new FilterListener(this.predicate, listener));
    };
    return FilterOperator;
}());
exports.FilterOperator = FilterOperator;
var FilterListener = (function () {
    function FilterListener(predicate, listener) {
        this.predicate = predicate;
        this.listener = listener;
    }
    FilterListener.prototype.next = function (x) {
        var _a = this, predicate = _a.predicate, listener = _a.listener;
        if (predicate(x))
            listener.next(x);
    };
    FilterListener.prototype.error = function (e) { this.listener.error(e); };
    FilterListener.prototype.complete = function () { this.listener.complete(); };
    return FilterListener;
}());
//# sourceMappingURL=filter.js.map