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
        },
        mergeClone: function (obj) {
            return _.merge.apply(_, [{}, obj].concat(_.rest(arguments)));
        }
    });
})(_);

var wizer = wizer || {};
wizer.utils = (function (utils, _) {
    utils.guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function () {
            return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
                s4() + "-" + s4() + s4() + s4();
        };
    }();

    utils.fileExt = function (fileName) {
        if (fileName && _.isString(fileName)) {
            var index = fileName.lastIndexOf(".");
            if (index >= 0 && index < fileName.length - 1) {
                return fileName.slice(index + 1);
            }
        }
        return "";
    };

    return utils;
})(wizer.utils || {}, _);