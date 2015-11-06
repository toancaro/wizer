(function (wizer, angular) {
    "use strict";

    if (!angular) return;
    angular.module("wizer.sharepoint")
        .factory("$SPList", [
            "$q", "$http", "$SPListDataSource",
            function ($q, $http, $SPListDataSource) {
                return wizer.sharepoint.SPList.extend({
                    // Constructor.
                    init: function(configs) {
                        /**
                         * Init default configurations.
                         */
                        configs = _.defaultsDeep({}, configs, {
                            dataSource: new $SPListDataSource(this)
                        });
                        this.$super.init.call(this, configs);
                    },
                    // CRUD.
                    get: function (itemId, httpConfigs) {
                        return this.dataSource().get(itemId, httpConfigs);
                    },
                    getAll: function (itemIds, httpConfigs) {
                        return this.dataSource().getAll(itemIds, httpConfigs);
                    },
                    create: function (item, httpConfigs) {
                        return this.dataSource().add(item, httpConfigs);
                    },
                    update: function (item, httpConfigs) {
                        return this.dataSource().update(item, httpConfigs);
                    },
                    remove: function (itemId, httpConfigs) {
                        return this.dataSource().remove(itemId, httpConfigs);
                    }
                });
            }
        ]);
})(wizer, angular);