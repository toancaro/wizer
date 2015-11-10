(function (wizer, angular) {
    "use strict";

    var ArgsParser = wizer.utils.ArgsParser;

    if (!angular) return;
    angular
        .module("wizer.sharepoint")
        .factory("$SPList", [
            "$q", "$http", "$SPListDataSource",
            function ($q, $http, $SPListDataSource) {
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
                        var self = this;
                        return this.dataSource().get(itemId, httpConfigs)
                            .then(function (item) {
                                return self.$$parseServerItem(item);
                            });
                    },
                    getAll: function (itemIds, httpConfigs) {
                        var self = this;
                        var args = new ArgsParser([
                            {itemIds: "Array", httpConfigs: "Object"},
                            {httpConfigs: "Object"}
                        ]).parse(arguments);

                        return this.dataSource().getAll(args.itemIds, args.httpConfigs)
                            .then(function (items) {
                                return $q.all(_.map(items, function (item) {
                                    return self.$$parseServerItem(item);
                                }));
                            });
                    },
                    create: function (item, httpConfigs) {
                        var self = this;
                        return this.$$parseClientItem(item)
                            .then(function (parsedItem) {
                                return self.dataSource().add(parsedItem, httpConfigs);
                            })
                            .then(function (createdItem) {
                                return self.$$parseServerItem(createdItem);
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
                            .then(function () {
                                return self.get(item.Id, httpConfigs);
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
                                return _.map(self.$configs.fields, function (field, fieldName) {
                                    /**
                                     * If `serverItem` does not have this property then no need
                                     * to parse anything.
                                     */
                                    if (typeof (serverItem[fieldName]) === "undefined") return;

                                    return $q.when(field.afterGet(serverItem[fieldName]))
                                        .then(function (newValue) {
                                            serverItem[fieldName] = newValue;
                                        });
                                });
                            })
                            // Return the result.
                            .then(function () {
                                return serverItem;
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
                                    if (value == null) return;

                                    // Single lookup.
                                    if (!_.isArray(value)) {
                                        clientItem[keyName + "Id"] = value.Id;
                                        delete clientItem[keyName];
                                    }
                                    // Multi lookup
                                    else {
                                        clientItem[keyName + "Id"] = {results: _.pluck(value, "Id")};
                                        delete clientItem[keyName];
                                    }
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