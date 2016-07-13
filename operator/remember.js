"use strict";
var RememberOperator = (function () {
    function RememberOperator(_subscribable) {
        this._subscribable = _subscribable;
    }
    RememberOperator.prototype.subscribe = function (listener) {
        return this._subscribable.subscribe(listener);
    };
    return RememberOperator;
}());
exports.RememberOperator = RememberOperator;
//# sourceMappingURL=remember.js.map