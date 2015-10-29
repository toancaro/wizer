(function (angular, wizer, _) {
    "use strict";

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$$DataSource", [
            "$q",
            function ($q) {
                return wizer.data.DataSource.extend({
                    init: function (configs) {
                        this.$super.init.call(this, configs);
                    },
                    get: function (itemId, httpConfigs) {
                        var readConfigs = _.get(this, "transport.read");
                        if (!readConfigs) return $q.reject("No read transport configurations");

                        if (_.isFunction(readConfigs)) {
                            return $q.when(readConfigs.call(this, {
                                itemId: itemId,
                                httpConfigs: httpConfigs
                            }));
                        }
                    },
                    add: function (item, httpConfigs) {
                        var createConfigs = _.get(this, "transport.create");
                        if (!createConfigs) return $q.reject("No create transport configurations");

                        if (_.isFunction(createConfigs)) {
                            return $q.when(createConfigs.call(this, {
                                item: item,
                                httpConfigs: httpConfigs
                            }));
                        }
                    }
                });
            }
        ]);

})(angular, wizer, _);