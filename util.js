"use strict";
function append(x, a) {
    var l = a.length;
    var b = new Array(l + 1);
    for (var i = 0; i < l; ++i) {
        b[i] = a[i];
    }
    b[l] = x;
    return b;
}
exports.append = append;
function remove(i, a) {
    if (i < 0) {
        throw new TypeError('i must be >= 0');
    }
    var l = a.length;
    if (l === 0 || i >= l) {
        return a;
    }
    if (l === 1) {
        return [];
    }
    return unsafeRemove(i, a, l - 1);
}
exports.remove = remove;
function unsafeRemove(i, a, l) {
    var b = new Array(l);
    var j;
    for (j = 0; j < i; ++j) {
        b[j] = a[j];
    }
    for (j = i; j < l; ++j) {
        b[j] = a[j + 1];
    }
    return b;
}
function findIndex(x, a) {
    for (var i = 0, l = a.length; i < l; ++i) {
        if (x === a[i]) {
            return i;
        }
    }
    return -1;
}
exports.findIndex = findIndex;
function copy(a) {
    var l = a.length;
    var b = new Array(l);
    for (var i = 0; i < l; ++i) {
        b[i] = a[i];
    }
    return b;
}
exports.copy = copy;
function forEach(f, a) {
    var l = a.length;
    for (var i = 0; i < l; ++i) {
        f(a[i], i);
    }
}
exports.forEach = forEach;
//# sourceMappingURL=util.js.map