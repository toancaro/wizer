(function (angular, wizer, _) {
    "use strict";

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$$SPRestDataSource", [
            "$q", "$http", "$$DataSource",
            function ($q, $http, $$DataSource) {
                var httpConfigs = {
                    create: function () {
                        return {
                            headers: {
                                "accept": "application/json;odata=verbose",
                                "content-type": "application/json;odata=verbose",
                                "X-RequestDigest": $("#__REQUESTDIGEST").val()
                            }
                        }
                    },
                    get: function () {
                        return {
                            headers: {
                                accept: "application/json;odata=verbose"
                            }
                        }
                    }
                };
                var convertPostData = function (listName, itemToPost) {
                    return _.chain({}).extend(itemToPost, {
                        "__metadata": {
                            "type": "SP.Data." + listName + "Item"
                        }
                    }).omit([
                        "Id",
                        "ID"
                    ]).value();
                };

                var dataSourceConfigs = {
                    // Constructor
                    init: function (configs) {
                        this.$super.init.call(this, configs);
                    },

                    // CRUD
                    transport: {
                        create: function (options) {
                            return $http.post(
                                this.getItemUrl(),
                                convertPostData(this.$configs.listName, options.item),
                                _.extendClone(httpConfigs.create(), options.httpConfigs));
                        },
                        read: function(options) {
                            return $http.get(
                                this.getItemUrl(options.itemId),
                                _.extendClone(httpConfigs.get(), options.httpConfigs));
                        }
                    },

                    // Utils
                    /**
                     * Get list Rest url.
                     */
                    getListUrl: function () {
                        return String.format("http://{0}/_api/lists/getByTitle('{1}')", this.$configs.siteUrl, this.$configs.listName);
                    },
                    /**
                     * Get item Rest url.
                     * If !itemId -> get all items Rest url.
                     * @param itemId
                     */
                    getItemUrl: function (itemId) {
                        var url = this.getListUrl() + "/items";
                        url += (itemId > 0) ? String.format("({0})", itemId) : "";
                        return url;
                    }
                };

                return $$DataSource.extend(dataSourceConfigs);
            }
        ]);

})(angular, wizer, _);