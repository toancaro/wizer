(function (angular, wizer, _) {
    "use strict";

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$SPListItem", [
            function () {
                return wizer.Class.extend({
                    /**
                     * Clone constructor. Copy all properties of `item` into this object.
                     * @param {Object} item - item to copy.
                     */
                    init: function (item) {
                        _.extend(this, item);
                    }
                });
            }
        ]);

})(angular, wizer, _);