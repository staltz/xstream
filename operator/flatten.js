"use strict";
var FlattenOperator = (function () {
    function FlattenOperator(_subscribable) {
        this._subscribable = _subscribable;
    }
    FlattenOperator.prototype.subscribe = function (listener) {
        var sub = void 0;
        return this._subscribable.subscribe({
            next: function (value) {
                if (sub)
                    sub.unsubscribe();
                sub = value.subscribe(listener);
            },
            error: function (err) {
                listener.error(err);
            },
            complete: function () {
                listener.complete();
            }
        });
    };
    return FlattenOperator;
}());
exports.FlattenOperator = FlattenOperator;
//# sourceMappingURL=flatten.js.map