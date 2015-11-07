(function (angular, wizer) {
    "use strict";

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$DataSource", [
            function () {
                return wizer.data.DataSource.extend({
                    init: function (configs) {
                        this.$super.init.call(this, configs);
                    }
                });
            }
        ]);

})(angular, wizer);