var wizer = (function (wizer) {
    "use strict";

    var nativeFns = [
        "concat",
        "join",
        "pop",
        "push",
        "shift",
        "slice",
        "splice",
        "unshift"
    ];

    var configs = {
        init: function () {
            this.push.apply(this, arguments);
        }
    };

    _.forEach(nativeFns, function (fnName) {
        configs[fnName] = function () {
            return Array.prototype[fnName].apply(this, arguments);
        }
    });

    wizer.ArrayClass = wizer.Class.extend(configs);

    return wizer;
})(wizer || {});