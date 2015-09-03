var wizer = (function (wizer, _) {
    "use strict";

    var extend = function (prototype) {
        // `this` here is the super class.
        var proto = _.isFunction(this) ? Object.create(this.prototype) : {};

        // Forced to use `_.extend` to define properties on `proto` object,
        // not on its `__proto__`.
        var defaults = {
            init: function () {
                // do nothing...
            }
        };
        _.extend(proto, defaults, prototype);

        // Need to modify every functions on `proto` object
        // to make sure `this.$super` point to correct parent.
        _.forEach(_.functions(proto), function (fn) {
            if (proto.hasOwnProperty(fn)) {
                var oldFn = proto[fn];
                proto[fn] = function () {
                    // Store old value of `$super`, then set its new value
                    // to current parent.
                    var oldSuper = this.$super;
                    this.$super = proto.__proto__;

                    var result = oldFn.apply(this, _.slice(arguments));

                    // Delete or restore `$super`.
                    if (oldSuper === undefined) {
                        delete this.$super;
                    } else {
                        this.$super = oldSuper;
                    }

                    // Return result of original function.
                    return result;
                }
            }
        });

        var ctor = function () {
            //this.__proto__.$super = proto.__proto__;
            proto.init.apply(this, _.slice(arguments));
        };
        ctor.prototype = proto;
        ctor.extend = extend;

        return ctor;
    };

    /**
     * Class is base class of all wizer objects.
     */
    wizer.Class = extend();
    return wizer;
})(wizer || {}, _);