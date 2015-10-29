(function(_) {
    "use strict";

    /**
     * String format.
     */
    if (!String.format) {
        String.format = function(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
    }

    /**
     * Lodash mixins.
     */
    _.mixin({
        extendClone: function (obj) {
            return _.extend.apply(_, [{}, obj].concat(_.rest(arguments)));
        }
    });
})(_);