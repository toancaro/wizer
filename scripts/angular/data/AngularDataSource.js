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
                    },
                    update: function (item, httpConfigs) {
                        var updateConfigs = _.get(this, "transport.update");
                        if (!updateConfigs) return $q.reject("No update transport configurations");

                        if (_.isFunction(updateConfigs)) {
                            return $q.when(updateConfigs.call(this, {
                                item: item,
                                httpConfigs: httpConfigs
                            }));
                        }
                    },
                    remove: function (itemId, httpConfigs) {
                        var removeConfigs = _.get(this, "transport.remove");
                        if (!removeConfigs) return $q.reject("No remove transport configurations");

                        if (_.isFunction(removeConfigs)) {
                            return $q.when(removeConfigs.call(this, {
                                itemId: itemId,
                                httpConfigs: httpConfigs
                            }));
                        }
                    }
                });
            }
        ]);

})(angular, wizer, _);