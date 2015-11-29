(function (angular, wizer, _) {
    "use strict";

    var ArgsParser = wizer.utils.ArgsParser;

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$SPListDataSource", [
            "$q", "$http", "$DataSource",
            function ($q, $http, $DataSource) {
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
                        var self = this;
                        return this.$validatePostData(options.item)
                            .then(function (validatedData) {
                                return $http.post(
                                    self.$$getItemUrl(),
                                    validatedData,
                                    _.extendClone(
                                        self.$$defaultHttpConfigs().create(),
                                        options.httpConfigs
                                    )
                                )
                            })
                            .then(function (response) {
                                return self.get(response.data.d.Id, options.httpConfigs);
                            });
                    });
                    /**
                     * Configs for getting item from the list.
                     */
                    _.set(dsConfigs, "transport.read", function (options) {
                        var httpConfigs = _.mergeClone(
                            this.$$defaultHttpConfigs().get(),
                            options.httpConfigs);

                        var url = httpConfigs.url || this.$$getItemUrl(options.itemId);

                        return $http.get(url, httpConfigs);
                    });
                    /**
                     * Configs for updating exsting item to the list.
                     */
                    _.set(dsConfigs, "transport.update", function (options) {
                        var self = this;
                        var url = function () {
                            var url = _.get(options, "httpConfigs.url");
                            if (!!url) return url;

                            var itemId = _.get(options, "item.Id");
                            if (!(itemId > 0))
                                throw new Error(String.format("Invalid itemId. Expect positive integer, but get {0}", itemId));

                            return self.$$getItemUrl(itemId);
                        }();

                        return this.$validatePostData(options.item)
                            .then(function (validatedData) {
                                return $http.post(
                                    url,
                                    validatedData,
                                    _.extendClone(
                                        self.$$defaultHttpConfigs().update(),
                                        options.httpConfigs))
                            })
                            // Because successful update will not return anything so that we have to get data manually.
                            .then(function () {
                                return self.get(_.get(options, "item.Id"), options.httpConfigs);
                            });
                    });
                    /**
                     * Configs for removing item from the list.
                     */
                    _.set(dsConfigs, "transport.remove", function (options) {
                        var self = this;
                        var url = _.get(options, "httpConfigs.url", this.$$getItemUrl(options.itemId));
                        return $q.when()
                            .then(function () {
                                return $http.post(
                                    url,
                                    undefined,
                                    _.extendClone(
                                        self.$$defaultHttpConfigs().remove(),
                                        options.httpConfigs))
                            })
                            .then(function (data) {
                                return data.data;   // should be nothing ("").
                            });
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
                        if (_.any(args.itemIds)) {
                            httpConfigs = httpConfigs || {};

                            var idQuery = _.reduce(args.itemIds, function (memo, id, index) {
                                memo += String.format("(Id eq {0})", id);
                                memo += (index < args.itemIds.length - 1) ? " or " : "";
                                return memo;
                            }, "");

                            var filter = _.get(httpConfigs, "params.$filter", "");
                            filter = (!!filter) ? String.format("({0}) and ({1})", filter, idQuery) : idQuery;

                            _.set(httpConfigs, "params.$filter", filter);
                        }

                        return this.$$invokeTransport("read", {
                            httpConfigs: httpConfigs
                        });
                    });
                    /**
                     * (item[, httpConfigs])
                     */
                    _.set(dsConfigs, "add", function (item, httpConfigs) {
                        return this.$$invokeTransport("create", {
                            item: item,
                            httpConfigs: httpConfigs
                        });
                    });
                    /**
                     * (item[, httpConfigs])
                     */
                    _.set(dsConfigs, "update", function (item, httpConfigs) {
                        return this.$$invokeTransport("update", {
                            item: item,
                            httpConfigs: httpConfigs
                        });
                    });
                    /**
                     * (itemId[, httpConfigs])
                     */
                    _.set(dsConfigs, "remove", function (itemId, httpConfigs) {
                        return this.$$invokeTransport("remove", {
                            itemId: itemId,
                            httpConfigs: httpConfigs
                        });
                    });

                    // Protected methods.
                    _.set(dsConfigs, "$validatePostData", function (data) {
                        var self = this;
                        return getListItemEntityTypeFullName().then(function (fullName) {
                            return _.chain({})
                                .extend(data, {"__metadata": {"type": fullName}})
                                .omit(["Id", "ID"])
                                .value();
                        });

                        function getListItemEntityTypeFullName() {
                            return $q.when()
                                .then(function () {
                                    return $http.get(self.$$getListUrl() + "?$select=ListItemEntityTypeFullName", {
                                        cache: true,
                                        headers: {
                                            accept: "application/json;odata=verbose"
                                        }
                                    });
                                })
                                .then(function (response) {
                                    return _.get(response, "data.d.ListItemEntityTypeFullName");
                                });
                        }
                    });

                    // Utils
                    /**
                     * Get list Rest url.
                     */
                    _.set(dsConfigs, "$$getListUrl", function () {
                        return String.format("{0}/_api/lists/getByTitle('{1}')", this.$$splist.configs().siteUrl, this.$$splist.configs().listName);
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
                     * Call the transport configurations.
                     * @param transportName
                     * @returns {*}
                     */
                    _.set(dsConfigs, "$$invokeTransport", function (transportName) {
                        var self = this;
                        var transport = getTransport(transportName);

                        if (_.isFunction(transport)) {
                            return $q.when(transport.apply(this, _.rest(arguments)));
                        }

                        /**
                         * Get the transport configurations.
                         * @param transportName
                         * @returns {*|{headers}}
                         */
                        function getTransport(transportName) {
                            var transportConfigs = _.get(self, "transport." + transportName);
                            if (!transportConfigs)
                                throw new Error(String.format("No {0} transport configurations.", transportName));

                            return transportConfigs;
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
                                return _.extend({
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

                        /**
                         * Update $select and $expand params.
                         * @returns {{}}
                         */
                        function getQueryConfigs() {
                            var configs = {}, select = [], expand = [];

                            _.forEach(self.$$splist.configs().fields, function (field) {
                                // If field is expandable then it need custom select.
                                if (!!field.expand) {
                                    var props = function () {
                                        if (field.expand === true) {
                                            return ["Id", "Title"];
                                        } else if (_.isArray(field.expand)) {
                                            return field.expand;
                                        }
                                        return [];
                                    }();
                                    _.forEach(props, function (prop) {
                                        select.push(String.format("{0}/{1}", field.name, prop));
                                    });

                                    expand.push(field.name);
                                }
                                else {
                                    select.push(field.name);
                                }
                            });

                            if (_.any(select)) _.set(configs, "params.$select", select.join(","));
                            if (_.any(expand)) _.set(configs, "params.$expand", expand.join(","));

                            return configs;
                        }
                    });

                    return dsConfigs;
                }();

                return $DataSource.extend(dataSourceConfigs);
            }
        ]);

})(angular, wizer, _);