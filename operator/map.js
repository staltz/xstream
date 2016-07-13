"use strict";
var MapOperator = (function () {
    function MapOperator(project, _subscribable) {
        this.project = project;
        this._subscribable = _subscribable;
    }
    MapOperator.prototype.subscribe = function (listener) {
        return this._subscribable.subscribe(new MapListener(this.project, listener));
    };
    return MapOperator;
}());
exports.MapOperator = MapOperator;
var MapListener = (function () {
    function MapListener(project, listener) {
        this.project = project;
        this.listener = listener;
    }
    MapListener.prototype.next = function (x) {
        var f = this.project;
        this.listener.next(f(x));
    };
    MapListener.prototype.error = function (e) { this.listener.error(e); };
    MapListener.prototype.complete = function () { this.listener.complete(); };
    return MapListener;
}());
//# sourceMappingURL=map.js.map