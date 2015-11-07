var wizer = wizer || {};
wizer.utils = (function (utils, _) {
    "use strict";

    utils.ArgsParser = wizer.Class.extend({
        init: function (overloads) {
            /**
             * Array<Array<Object{argName, argType}>>
             * @type {*|Array}
             */
            this.$$overloads = _.map(overloads, function (overload) {
                return _.map(overload, function (argType, argName) {
                    return {argName: argName, argType: argType};
                });
            });
        },
        parse: function (argsObject) {
            var args = null;
            _.forEach(this.$$overloads, function (overload) {
                args = testOverload(overload);

                // If `args` is not `null` then this `overload`
                // is matched -> break;
                return !args;
            });

            // If no overload is matched then we should throw an error.
            if (!args) throw new Error("No suitable overload was found!");

            return args;

            /**
             * Check if this `overload` is matched for this `argsObject`.
             * @param overload overload to test.
             * @returns {*} an `args` object if matched, otherwise `null`.
             */
            function testOverload(overload) {
                var result = {};
                _.forEach(argsObject, function (value, index) {
                    var arg = overload[index];

                    // If `argsObject` has more arguments than `overload` => this `overload`
                    // is not matched.
                    if (!arg) return notMatched();

                    // If `value` is not `null` or `undefined` then we should check value's type.
                    if (value != null) {
                        var typeCheckFn = _["is" + arg.argType];
                        if (!typeCheckFn(value)) return notMatched();
                    }

                    result[arg.argName] = value;
                });

                return result;

                /**
                 * This `overload` is not match for `argsObject`.
                 */
                function notMatched() {
                    result = null;
                    return false;
                }
            }
        }
    });

    return utils;
})(wizer.utils || {}, _);