/**
 * Parsing pipeline:
 *  1. Request:
 *      - $SPListItem
 *      - fields.beforePost
 *      - converters
 *      - schema.beforePost
 *  2. Response:
 *      - schema.afterGet
 *      - converters
 *      - fields.afterGet
 *      - $SPListItem
 */

(function (wizer, angular, _) {
    "use strict";

    var deprecation = wizer.deprecation;
    var ArgsParser = wizer.utils.ArgsParser;

    if (!angular) return;
    angular
        .module("wizer.sharepoint")
        .factory("$SPList", [
            "$q", "$http", "$SPListDataSource", "$SPListItem", "$SPListItemCollection",
            function ($q, $http, $SPListDataSource, $SPListItem, $SPListItemCollection) {
                return wizer.sharepoint.SPList.extend({
                    // Constructor.
                    init: function (configs) {
                        /**
                         * Init default configurations.
                         */
                        configs = _.defaultsDeep({}, configs, {
                            /**
                             * Some specials field converters.
                             */
                            fieldConverters: {
                                json: [],
                                lookup: [],
                                dateTime: []
                            },
                            /**
                             * Datasource to perform CRUD operations.
                             */
                            dataSource: new $SPListDataSource(this)
                        });

                        // Setup default for fields.
                        _.forEach(configs.fields, function (field) {
                            _.defaultsDeep(field, {
                                /**
                                 * @deprecated use fields.parsers.response instead.
                                 * Called after `fieldConveters`.
                                 * @param value
                                 * @returns {*}
                                 */
                                afterGet: wizer.identity,
                                /**
                                 * @deprecated use fields.parsers.request instead.
                                 * Call before `fieldConverters`.
                                 * @param value
                                 * @returns {*}
                                 */
                                beforePost: wizer.identity
                            });
                        });

                        this.$super.init.call(this, configs);
                    },

                    //region CRUD operations
                    get: function (itemId, httpConfigs) {
                        if (!(itemId > 0))
                            throw new Error("expect itemId to be a positive integer, but got " + itemId);

                        var self = this;
                        return this.dataSource().get(itemId, httpConfigs)
                            .then(function (response) {
                                return self.$$parseGetResponse(response);
                            });
                    },
                    getAll: function (itemIds, httpConfigs) {
                        var self = this;
                        var args = new ArgsParser([
                            {itemIds: "Array", httpConfigs: "Object"},
                            {httpConfigs: "Object"}
                        ]).parse(arguments);

                        return this.dataSource().getAll(args.itemIds, args.httpConfigs)
                            .then(function (response) {
                                return self.$$parseGetAllResponse(response);
                            });
                    },
                    create: function (item, httpConfigs) {
                        var self = this;
                        return this.$$parseClientItem(item)
                            .then(function (parsedItem) {
                                return self.dataSource().add(parsedItem, httpConfigs);
                            })
                            .then(function (response) {
                                return self.$$parseGetResponse(response);
                            });
                    },
                    createAll: function (items, httpConfigs) {
                        var self = this;
                        return $q.all(_.map(items, function (item) {
                            return self.create(item, httpConfigs);
                        }));
                    },
                    update: function (item, httpConfigs) {
                        var self = this;
                        return this.$$parseClientItem(item)
                            .then(function (parsedItem) {
                                return self.dataSource().update(parsedItem, httpConfigs);
                            })
                            .then(function (response) {
                                return self.$$parseGetResponse(response);
                            });
                    },
                    updateAll: function (items, httpConfigs) {
                        var self = this;
                        return $q.all(_.map(items, function (item) {
                            return self.update(item, httpConfigs);
                        }));
                    },
                    remove: function (itemId, httpConfigs) {
                        return this.dataSource().remove(itemId, httpConfigs);
                    },
                    removeAll: function (itemIds, httpConfigs) {
                        var self = this;
                        return $q.all(_.map(itemIds, function (itemId) {
                            return self.remove(itemId, httpConfigs);
                        }));
                    },
                    //endregion

                    // Extra
                    save: function (item, httpConfigs) {
                        return item.Id > 0 ? this.update(item, httpConfigs) : this.create(item, httpConfigs);
                    },
                    saveAll: function (items, httpConfigs) {
                        var self = this;
                        return _.map(items, function (item) {
                            return self.save(item, httpConfigs);
                        });
                    },
                    getByUrl: function (url) {
                        var self = this;
                        return $http.get(url, {
                            headers: {
                                accept: "application/json;odata=verbose"
                            }
                        }).then(function (response) {
                            return self.$$parseGetResponse(response);
                        });
                    },
                    getAllByUrl: function (url) {
                        var self = this;
                        return $http.get(url, {
                            headers: {
                                accept: "application/json;odata=verbose"
                            }
                        }).then(function (response) {
                            return self.$$parseGetAllResponse(response);
                        });
                    },

                    // Overridden
                    /**
                     * TODO: remove this overridden.
                     */
                    $updateFieldParsers: function () {
                        // TODO: remove this line
                        deprecation.migrateToFieldConfigs(this.configs());

                        // call super to make parsers.
                        this.$super.$updateFieldParsers.call(this);
                    },

                    // Utils.
                    /**
                     * Parse the item which was got from server.
                     * All chaining function use the same `serverItem` object.
                     * @param serverItem
                     */
                    $$parseServerItem: function (serverItem) {
                        if (null == serverItem) return $q.when(null);

                        var configs = this.configs();
                        return $q.when()
                            // configs.schema.response.parsing
                            .then(function () {
                                return reduce(configs.schema.response.parsing, function (parseFn) {
                                    return $q.when(parseFn(serverItem)).then(function (result) {
                                        // if parseFn return new object then set that object as new serverItem.
                                        if (result !== undefined) serverItem = result;
                                    });
                                });
                            })
                            // configs.fields.parsers.response
                            .then(function () {
                                // Parse all fields.
                                return $q.all(_.map(configs.fields, function (field) {
                                    // Concat parsing pipe-line.
                                    return reduce(field.parsers.response, function (parseFn) {
                                        return $q.when(parseFn(serverItem[field.name], serverItem)).then(function (result) {
                                            // if parseFn return new value then set that value to serverItem[field.name].
                                            if (undefined !== result) serverItem[field.name] = result;
                                        });
                                    });
                                }));
                            })
                            // configs.schema.response.parsed
                            .then(function () {
                                return reduce(configs.schema.response.parsed, function (parseFn) {
                                    return $q.when(parseFn(serverItem)).then(function (result) {
                                        // if parseFn return new object then set that object as new serverItem.
                                        if (result !== undefined) serverItem = result;
                                    });
                                });
                            })
                            // Return the result.
                            .then(function () {
                                return new $SPListItem(serverItem);
                            });
                    },
                    /**
                     * Parse the item which will be posted to server.
                     * @param clientItem
                     */
                    $$parseClientItem: function (clientItem) {
                        if (null == clientItem) return $q.when(null);

                        var configs = this.configs();

                        // Do NOT modified item that passes by user.
                        clientItem = _.cloneDeep(clientItem);

                        return $q.when()
                            // configs.schema.request.parsing
                            .then(function () {
                                return reduce(configs.schema.request.parsing, function (parseFn) {
                                    return $q.when(parseFn(clientItem)).then(function (result) {
                                        // if parseFn return new object then set that object as new clientItem.
                                        if (result !== undefined) clientItem = result;
                                    });
                                });
                            })
                            // configs.fields.parsers.request
                            .then(function () {
                                // Parse all fields.
                                return $q.all(_.map(configs.fields, function (field) {
                                    // Concat parsing pipe-line.
                                    return reduce(field.parsers.request, function (parseFn) {
                                        return $q.when(parseFn(clientItem[field.name], clientItem)).then(function (result) {
                                            // if parseFn return new value then set that value to clientItem[field.name].
                                            if (result !== undefined) clientItem[field.name] = result;
                                        });
                                    });
                                }));
                            })
                            // configs.schema.request.parsed
                            .then(function () {
                                return reduce(configs.schema.request.parsed, function (parseFn) {
                                    return $q.when(parseFn(clientItem)).then(function (result) {
                                        // if parseFn return new object then set that object as new clientItem.
                                        if (result !== undefined) clientItem = result;
                                    });
                                });
                            })
                            // Return result.
                            .then(function () {
                                return clientItem;
                            });
                    },
                    /**
                     * Parse response object which get from `get`.
                     * @param {Object} response - $http response object.
                     */
                    $$parseGetResponse: function (response) {
                        return this.$$parseServerItem(response.data.d);
                    },
                    /**
                     * Parse response object which get from `getAll`.
                     * @param {Object} response - $http response object.
                     */
                    $$parseGetAllResponse: function (response) {
                        var self = this;
                        return $q
                            .all(_.map(response.data.d.results, function (item) {
                                return self.$$parseServerItem(item);
                            }))
                            .then(function (items) {
                                return $SPListItemCollection.create(items, self, {
                                    current: response.config,
                                    next: response.data.d["__next"]
                                });
                            });
                    }
                });

                /**
                 * Chaining the array with reduce fn (Promise support).
                 * @param {Array<Function>|*} fnArray - an array of function to reduce.
                 * @param {Function} customFn - a function which is called with each function in `fnArray` and the
                 * result of previous action.
                 * @param {*=} thisArg - object which will be bound to context of `customFn`.
                 * @return {Promise} - promise which concat all reduced function.
                 */
                function reduce(fnArray, customFn, thisArg) {
                    return _.reduce(fnArray, function (memo, fn) {
                        return memo.then(function () {
                            return customFn.apply(thisArg, [fn].concat(_.slice(arguments)));
                        });
                    }, $q.when());
                }
            }
        ]);
})(wizer, angular, _);