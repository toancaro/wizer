(function (wizer, angular) {
    "use strict";

    if (!angular) return;
    angular.module("wizer.sharepoint")
        .factory("$$SPList", [
            "$q", "$http", "$$SPRestDataSource",
            function ($q, $http, $$SPRestDataSource) {
                return wizer.sharepoint.SPList.extend({
                    // Constructor.
                    init: function(configs) {
                        /**
                         * Init default configurations.
                         */
                        configs = _.defaultsDeep({}, configs, {
                            dataSource: new $$SPRestDataSource({
                                siteUrl: configs.siteUrl,
                                listName: configs.listName
                            })
                        });
                        this.$super.init.call(this, configs);
                    },

                    // CRUD.
                    get: function (itemId, httpConfigs) {
                        return this.dataSource().get(itemId, httpConfigs);
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