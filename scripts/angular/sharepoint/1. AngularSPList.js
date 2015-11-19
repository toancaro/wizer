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

(function (wizer, angular) {
    "use strict";

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
                             * Fields configuration.
                             * Details below...
                             */
                            fields: {},
                            /**
                             * Some specials field converters.
                             */
                            fieldConverters: {
                                json: [],
                                lookup: [],
                                dateTime: []
                            },
                            /**
                             * Configs for request and reponse.
                             */
                            schema: {
                                afterGet: function (serverItem) {
                                    return serverItem;
                                },
                                beforePost: function (clientItem) {
                                    return clientItem;
                                }
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
                                 * Called after `fieldConveters`.
                                 * @param value
                                 * @returns {*}
                                 */
                                afterGet: function (value) {
                                    return value;
                                },
                                /**
                                 * Call before `fieldConverters`.
                                 * @param value
                                 * @returns {*}
                                 */
                                beforePost: function (value) {
                                    return value;
                                }
                            });
                        });

                        this.$super.init.call(this, configs);
                    },

                    // CRUD.
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

                    // Utils.
                    /**
                     * Parse the item which was got from server.
                     * @param serverItem
                     */
                    $$parseServerItem: function (serverItem) {
                        if (serverItem == null) return $q.when(null);

                        var self = this;
                        return $q.when()
                            // Parse schema.
                            .then(function () {
                                return $q.when(self.$configs.schema.afterGet(serverItem));
                            })
                            // Parse converters.
                            .then(function () {
                                // Converters.
                                _.forEach(self.$$getConvertKeys("json"), function (keyName) {
                                    if (typeof(serverItem[keyName]) !== "string") return;
                                    serverItem[keyName] = JSON.parse(serverItem[keyName]);
                                });
                                _.forEach(self.$$getConvertKeys("dateTime"), function (keyName) {
                                    if (typeof(serverItem[keyName]) !== "string") return;
                                    serverItem[keyName] = new Date(serverItem[keyName]);
                                });
                                _.forEach(self.$$getConvertKeys("lookup"), function (keyName) {
                                    // If is multi-lookup then remove the `results` path.
                                    if (!!_.get(serverItem, "[" + keyName + "].results")) {
                                        serverItem[keyName] = serverItem[keyName].results;
                                    }
                                });
                            })
                            // Parse fields configs.
                            .then(function () {
                                return $q.all(_.map(self.$configs.fields, function (field, fieldName) {
                                    /**
                                     * If `serverItem` does not have this property then no need
                                     * to parse anything.
                                     */
                                    if (typeof (serverItem[fieldName]) === "undefined") return;

                                    return $q.when(field.afterGet(serverItem[fieldName]))
                                        .then(function (newValue) {
                                            serverItem[fieldName] = newValue;
                                        });
                                }));
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
                        if (typeof (clientItem) === "undefined") return $q.when(null);

                        var self = this;

                        // Do NOT modified item that passes by user.
                        clientItem = _.cloneDeep(clientItem);

                        return $q.when()
                            // Field's configs.
                            .then(function () {
                                return _.map(self.$configs.fields, function (field, fieldName) {
                                    /**
                                     * If `clientItem` does not have this property then no need
                                     * to parse anything.
                                     */
                                    if (typeof (clientItem[fieldName]) === "undefined") return;

                                    return $q.when(field.beforePost(clientItem[fieldName]))
                                        .then(function (newValue) {
                                            clientItem[fieldName] = newValue;
                                        });
                                });
                            })
                            // Converters.
                            .then(function () {
                                // Converters.
                                _.forEach(self.$$getConvertKeys("json"), function (keyName) {
                                    var value = clientItem[keyName];
                                    if (value == null) return;

                                    clientItem[keyName] = JSON.stringify(value);
                                });
                                _.forEach(self.$$getConvertKeys("dateTime"), function (keyName) {
                                    var value = clientItem[keyName];
                                    if (!_.isDate(value)) return;

                                    clientItem[keyName] = value.toJSON();
                                });
                                _.forEach(self.$$getConvertKeys("lookup"), function (keyName) {
                                    var value = clientItem[keyName];
                                    // Single lookup.
                                    if (!_.isArray(value)) {
                                        // Must set this field explicity to `null` to remove its data.
                                        clientItem[keyName + "Id"] = (value && value.Id) || null;
                                    }
                                    // Multi lookup
                                    else {
                                        clientItem[keyName + "Id"] = {results: _.pluck(value, "Id")};
                                    }

                                    // Must delete this field to prevent posting redundant data to server.
                                    delete clientItem[keyName];
                                });
                            })
                            // Schema.
                            .then(function () {
                                return $q.when(self.$configs.schema.beforePost(clientItem));
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
                    },
                    /**
                     * Get the converter data by name.
                     * @param converterName
                     */
                    $$getConvertKeys: function (converterName) {
                        var data = _.get(this, "$configs.fieldConverters." + converterName);

                        if (!data) return [];
                        if (!_.isArray(data)) return [data];
                        return data;
                    }
                });
            }
        ]);
})(wizer, angular);