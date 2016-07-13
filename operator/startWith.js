"use strict";
var StartWithOperator = (function () {
    function StartWithOperator(value, _subscribable) {
        this.value = value;
        this._subscribable = _subscribable;
    }
    StartWithOperator.prototype.subscribe = function (listener) {
        listener.next(this.value);
        return this._subscribable.subscribe(listener);
    };
    return StartWithOperator;
}());
exports.StartWithOperator = StartWithOperator;
//# sourceMappingURL=startWith.js.map