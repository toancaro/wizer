(function (angular, wizer, _) {
    "use strict";

    var ArgsParser = wizer.utils.ArgsParser;

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$SPListDataSource", [
            "$q", "$http", "$DataSource",
            function ($q, $http, $DataSource) {
                var convertPostData = function (listName, itemToPost, updatingItem) {
                    return _.chain({}).extend(itemToPost, {
                        "__metadata": {
                            "type": "SP.Data." + listName + "ListItem"
                        }
                    }).omit(updatingItem ? "" : [
                        "Id",
                        "ID"
                    ]).value();
                };
                var dataSourceConfigs = function () {
                    var dsConfigs = {};

                    // Constructor.
                    _.set(dsConfigs, "init", function (splist, configs) {
                        this.$$splist = splist;
                        this.$super.init.call(this, configs);
                    });

                    // Transport.
                    /**
                     * Configs for creating item to the list.
                     */
                    _.set(dsConfigs, "transport.create", function (options) {
                        return $http.post(
                            this.$$getItemUrl(),
                            convertPostData(this.$$splist.$configs.listName, options.item),
                            _.extendClone(this.$$defaultHttpConfigs().create(), options.httpConfigs)
                        );
                    });
                    /**
                     * Configs for getting item from the list.
                     */
                    _.set(dsConfigs, "transport.read", function (options) {
                        return $http.get(
                            this.$$getItemUrl(options.itemId),
                            _.mergeClone(this.$$defaultHttpConfigs().get(), options.httpConfigs)
                        );
                    });
                    /**
                     * Configs for updating exsting item to the list.
                     */
                    _.set(dsConfigs, "transport.update", function (options) {
                        var itemId = _.get(options, "item.Id");
                        if (!(itemId > 0))
                            return $q.reject(String.format("Invalid itemId. Expect positive interger, but get {0}", itemId));

                        return $http.post(
                            this.$$getItemUrl(itemId),
                            convertPostData(this.$$splist.$configs.listName, options.item, true),
                            _.extendClone(this.$$defaultHttpConfigs().update(), options.httpConfigs)
                        );
                    });
                    /**
                     * Configs for removing item from the list.
                     */
                    _.set(dsConfigs, "transport.remove", function (options) {
                        return $http.post(
                            this.$$getItemUrl(options.itemId),
                            undefined,
                            _.extendClone(this.$$defaultHttpConfigs().remove(), options.httpConfigs)
                        );
                    });

                    // CRUD.
                    /**
                     * (itemId[, httpConfigs])
                     */
                    _.set(dsConfigs, "get", function (itemId, httpConfigs) {
                        return this.$$invokeTransport("read", {
                            itemId: itemId,
                            httpConfigs: httpConfigs
                        });
                    });
                    /**
                     * ([[itemIds][, httpConfigs]])
                     */
                    _.set(dsConfigs, "getAll", function (itemIds, httpConfigs) {
                        var args = new ArgsParser([
                            {itemIds: "Array", httpConfigs: "Object"},
                            {httpConfigs: "Object"}
                        ]).parse(arguments);
                        if (args.itemIds) {

                        }

                        return this.$$invokeTransport("read", {
                            httpConfigs: httpConfigs
                        });
                    });
                    /**
                     * (item[, httpConfigs])
                     */
                    _.set(dsConfigs, "add", function (item, httpConfigs) {
                        var createConfigs = _.get(this, "transport.create");
                        if (!createConfigs) return $q.reject("No create transport configurations");

                        if (_.isFunction(createConfigs)) {
                            return $q.when(createConfigs.call(this, {
                                item: item,
                                httpConfigs: httpConfigs
                            }));
                        }
                    });
                    /**
                     * (item[, httpConfigs])
                     */
                    _.set(dsConfigs, "update", function (item, httpConfigs) {
                        var updateConfigs = _.get(this, "transport.update");
                        if (!updateConfigs) return $q.reject("No update transport configurations");

                        if (_.isFunction(updateConfigs)) {
                            return $q.when(updateConfigs.call(this, {
                                item: item,
                                httpConfigs: httpConfigs
                            }));
                        }
                    });
                    /**
                     * (itemId[, httpConfigs])
                     */
                    _.set(dsConfigs, "remove", function (itemId, httpConfigs) {
                        var removeConfigs = _.get(this, "transport.remove");
                        if (!removeConfigs) return $q.reject("No remove transport configurations");

                        if (_.isFunction(removeConfigs)) {
                            return $q.when(removeConfigs.call(this, {
                                itemId: itemId,
                                httpConfigs: httpConfigs
                            }));
                        }
                    });

                    // Utils
                    /**
                     * Get list Rest url.
                     */
                    _.set(dsConfigs, "$$getListUrl", function () {
                        return String.format("{0}/_api/lists/getByTitle('{1}')", this.$$splist.$configs.siteUrl, this.$$splist.$configs.listName);
                    });
                    /**
                     * Get item Rest url.
                     * If !itemId -> get all items Rest url.
                     * @param itemId
                     */
                    _.set(dsConfigs, "$$getItemUrl", function (itemId) {
                        var url = this.$$getListUrl() + "/items";
                        url += (itemId > 0) ? String.format("({0})", itemId) : "";
                        return url;
                    });
                    /**
                     * Get the transport configurations.
                     * @param transportName
                     * @returns {*|{headers}}
                     */
                    _.set(dsConfigs, "$$getTransport", function (transportName) {
                        var transportConfigs = _.get(this, "transport." + transportName);
                        if (!transportConfigs)
                            throw new Error(String.format("No {0} transport configurations.", transportName));

                        return transportConfigs;
                    });
                    /**
                     * Call the transport configurations.
                     * @param transportName
                     * @returns {*}
                     */
                    _.set(dsConfigs, "$$invokeTransport", function (transportName) {
                        var transport = this.$$getTransport(transportName);
                        if (_.isFunction(transport)) {
                            return $q.when(transport.apply(this, _.rest(arguments)));
                        }
                    });
                    /**
                     * Get default `httpConfigs`.
                     */
                    _.set(dsConfigs, "$$defaultHttpConfigs", function () {
                        var self = this;
                        return {
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
                                return _.extend(getQueryConfigs(), {
                                    headers: {
                                        accept: "application/json;odata=verbose"
                                    }
                                });
                            },
                            update: function () {
                                return _.extend(getQueryConfigs(), {
                                    headers: {
                                        "accept": "application/json;odata=verbose",
                                        "content-type": "application/json;odata=verbose",
                                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                                        "IF-MATCH": "*",
                                        "X-HTTP-Method": "MERGE"
                                    }
                                });
                            },
                            remove: function () {
                                return {
                                    headers: {
                                        "accept": "application/json;odata=verbose",
                                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                                        "IF-MATCH": "*",
                                        "X-HTTP-Method": "DELETE"
                                    }
                                }
                            }
                        };

                        function getQueryConfigs() {
                            var configs = {};

                            if (_.any(self.$$splist.$configs.select))
                                _.set(configs, "params.$select", self.$$splist.$configs.select.join(","));
                            if (_.any(self.$$splist.$configs.expand))
                                _.set(configs, "params.$expand", self.$$splist.$configs.expand.join(","));

                            return configs;
                        }
                    });

                    return dsConfigs;
                }();

                return $DataSource.extend(dataSourceConfigs);
            }
        ]);

})(angular, wizer, _);