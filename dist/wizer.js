/**
 * wizer 0.1.1
 * 2015-10-30
 */
(function (angular) {
    "use strict";

    if (!angular) return;
    angular.module("wizer.data", []);
    angular.module("wizer.sharepoint", ["wizer.data"]);
    angular.module("wizer", ["wizer.data", "wizer.sharepoint"]);

})(angular);
var wizer = (function (wizer, _) {
    "use strict";

    var extend = function (prototype) {
        // `this` here is the super class.
        var proto = _.isFunction(this) ? Object.create(this.prototype) : {};

        // Forced to use `_.extend` to define properties on `proto` object,
        // not on its `__proto__`.
        var defaults = {
            init: function () {
                // do nothing...
            }
        };
        _.extend(proto, defaults, prototype);

        // Need to modify every functions on `proto` object
        // to make sure `this.$super` point to correct parent.
        _.forEach(_.functions(proto), function (fn) {
            if (proto.hasOwnProperty(fn)) {
                var oldFn = proto[fn];
                proto[fn] = function () {
                    // Store old value of `$super`, then set its new value
                    // to current parent.
                    var oldSuper = this.$super;
                    this.$super = proto.__proto__;

                    var result = oldFn.apply(this, _.slice(arguments));

                    // Delete or restore `$super`.
                    if (oldSuper === undefined) {
                        delete this.$super;
                    } else {
                        this.$super = oldSuper;
                    }

                    // Return result of original function.
                    return result;
                }
            }
        });

        var ctor = function () {
            proto.init.apply(this, _.slice(arguments));
        };
        ctor.prototype = proto;
        ctor.extend = extend;

        return ctor;
    };

    /**
     * Class is base class of all wizer objects.
     */
    wizer.Class = extend();
    return wizer;
})(wizer || {}, _);
var wizer = wizer || {};
wizer.sharepoint = function(sharepoint, _){
    "use strict";

    sharepoint.SPList = wizer.Class.extend({
        // Constructor.
        /**
         * SPList constructor.
         * @param configs
         */
        init: function(configs) {
            /**
             * Validate configs properties.
             */
            (function validateConfigs() {
                var requiredKeys = [
                    "siteUrl",
                    "listName"
                ];
                if (!configs) throw new Error("Configs must be specified.");
                _.forEach(requiredKeys, function (keyName) {
                    if (!configs[keyName])
                        throw new Error(String.format("Config's '{0}' field is mandatory.", keyName))
                });
            })();

            this.$configs = _.defaultsDeep({}, configs, {
                /**
                 * Required field.
                 * Eg: microsoft.com
                 */
                siteUrl: null,
                /**
                 * Required field.
                 * Eg: Customer
                 */
                listName: null,
                /**
                 * `DataSource` for CRUD operations.
                 */
                dataSource: {

                }
            });
        },

        // CRUD operations.
        /**
         * Get single item by id
         * @param itemId
         * @param configs
         */
        get: function (itemId, configs) {
            console.log(arguments);
        },
        /**
         * Get multiple items.
         * Can pass $filter to filter item.
         * @param itemIds
         * @param configs
         */
        getAll: function (itemIds, configs) {

        },
        /**
         * Create single item.
         * @param item
         * @param configs
         */
        create: function (item, configs) {

        },
        /**
         * Create multiple items.
         * @param items
         * @param configs
         */
        createAll: function (items, configs) {

        },
        /**
         * Update single item.
         * @param item
         * @param configs
         */
        update: function (item, configs) {

        },
        /**
         * Update multiple items.
         * @param items
         * @param configs
         */
        updateAll: function (items, configs) {

        },
        /**
         * Remove single item by id.
         * @param itemId
         * @param configs
         */
        remove: function (itemId, configs) {

        },
        /**
         * Remove multiple items by item ids.
         * @param itemIds
         * @param configs
         */
        removeAll: function (itemIds, configs) {

        },

        // Getter Setter.
        dataSource: function (newDataSource) {
            if (newDataSource != null)
                this.$configs.dataSource = newDataSource;
            return this.$configs.dataSource;
        }
    });

    return sharepoint;
}(wizer.sharepoint || {}, _);
var wizer = wizer || {};
wizer.sharepoint = function(sharepoint){
    "use strict";

    sharepoint.SPDocumentLibrary = sharepoint.SPList.extend({
        init: function() {

        }
    });

    return sharepoint;
}(wizer.sharepoint || {});
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
                    }
                });
            }
        ]);
})(wizer, angular);
var wizer = wizer || {};
wizer.data = function (data, _, undefined) {
    "use strict";

    var dataSourceConfigs = {};

    // Constructor.
    /**
     * Create data source object with specified configurations.
     * @param opt_configs
     */
    dataSourceConfigs.init = function (opt_configs) {
        var configs = _.defaultsDeep({}, opt_configs, {
            /**
             * Local data, take precedence over `transport`.
             * If presence, must be set to an `Array`.
             * A clone version of data will be set to this property.
             */
            data: undefined,
            /**
             * Use to convert `request` into format needed by server.
             */
            requestSchema: {},
            /**
             * Use to convert `response` into format needed by client.
             */
            responseSchema: {
                /**
                 * Local data, take precedence over `transport`.
                 * If presence, must be set to an `Array`.
                 */
                data: undefined,
                /**
                 * Use to convert `request` into format needed by server.
                 */
                requestSchema: {},
                /**
                 * Use to convert `response` into format needed by client.
                 */
                parse: function (response) {
                    return response;
                }
            },
            /**
             * Configurations to work with remote resources.
             */
            transport: {
                /**
                 * Configurations for creating new item(s).
                 */
                create: {},
                /**
                 * Configurations for reading item(s) from resources.
                 */
                read: {},
                /**
                 * Configurations for updating existing item(s).
                 */
                update: {},
                /**
                 * Configurations for deleting existing item(s).
                 */
                remove: {}
            }
        });
        if (configs.data) configs.data = _.clone(configs.data);

        this.$configs = configs;
    };

    //<editor-fold desc="CRUD">
    /**
     * Add an item to this data source.
     * The `id` property of item will be ignored if presence.
     * @param item
     */
    dataSourceConfigs.add = function (item) {
        if (this.$configs.data) return this.$configs.data.push(item);
    };
    /**
     * Get item from data source with specified `id`.
     * @param id
     */
    dataSourceConfigs.get = function (id) {
    };
    /**
     * Update an existing item in data source.
     * The `id` property must be presence in `item`.
     * @param item
     */
    dataSourceConfigs.update = function (item) {
    };
    /**
     * Delete an item with specified `id`.
     * @param id
     */
    dataSourceConfigs.remove = function (id) {
    };
    //</editor-fold>

    // Utils
    /**
     * Get all data from data source.
     * Return `data` in case of local data source, `Promise` if remote data source.
     */
    dataSourceConfigs.data = function () {
        if (this.$configs.data) return this.$configs.data;
    };

    // Abstracts.
    /**
     * Send request to remote resources.
     * @param data
     * @param params
     * @param headers
     * @param method
     * @param url
     */
    dataSourceConfigs.sendRequest = function (data, params, headers, method, url) {
        throw new Error("Sub class must implement this method.");
    };

    /**
     * Define `DataSource` base class.
     * @type {Object|void|*}
     */
    data.DataSource = wizer.Class.extend(dataSourceConfigs);
    return data;
}(wizer.data || {}, _);
var wizer = wizer || {};
wizer.data = function (data, _, undefined) {
    "use strict";

    /**
     * Model inheritance.
     * Inherit all configs from base model. Sub-model can override configs
     * of super-model if needed.
     * @param opt_configs
     * @returns {void|Object|*}
     */
    var define = function (opt_configs) {
        var configs = _.defaultsDeep({}, opt_configs, {
            /**
             * The `id` field of model. Can be set to `String` or `Function`.
             * When set to `Function`, the function must return the name of the `id` field.
             * Default: 'id'.
             */
            id: "id",
            /**
             * Hash object, each property of this object describe a field in model.
             * If name of field contains invalid char for JavaScript identifier,
             * that name should be enclosed in a qoute.
             */
            fields: {}
        });
        _.forEach(configs.fields, function (value, key) {
            configs.fields[key] = _.defaultsDeep({}, value, {
                /**
                 * Default value if actual value is `undefined`
                 */
                defaultValue: undefined,
                /**
                 * The original field where data of this field get from.
                 * Can be set to a `String` or `Function`.
                 * If not set, value will be get from `key` property.
                 */
                from: undefined,
                /**
                 * A function to parse value, apply before any other properties.
                 * @param value
                 * @returns {*}
                 */
                parse: function (value) {
                    return value;
                }
            });
        });

        var model = this.extend({
            init: function (data) {
                // `data` is unique to each instance so set it to `this`, not `__proto__`.
                this.$$data = data;

                // Use `$$local` to store unique data set to this instance. When data in `$$local`
                // is present, `get` method won't parse data from `$$data`
                this.$$local = {};

                // Must be set to `__proto__` to differentiate from parent $configs.
                this["__proto__"].$configs = _.defaultsDeep(configs, this.$super.$configs);
            }
        });
        model.define = define;

        return model;
    };

    /**
     * Model is base class of all `model` objects.
     */
    var Model = wizer.Class.extend({
        /**
         * Use `get` to get data from `$$local` or `$$data`.
         * @param name
         * @returns {*}
         */
        get: function (name) {
            if (!this.$$data) return;
            if (this.$$local[name] !== undefined) return this.$$local[name];

            var field = this.$configs.fields[name];

            // if no configs for this field, return original value.
            if (!field) return this.$$data[name];

            var key = field.from || name;
            var parsedValue = field.parse(this.$$data[key]);
            return parsedValue === undefined ? field.defaultValue : parsedValue;
        },
        /**
         * Set data to `$$local` object.
         * If `value` is `undefined`, clear that data field in `$$local`.
         * @param name
         * @param value
         */
        set: function (name, value){
            if (value === undefined) {
                delete this.$$local[name];
            } else {
                this.$$local[name] = value;
            }
            return value;
        }
    });
    Model.define = define;

    data.Model = Model;
    return data;
}(wizer.data || {}, _);
(function(_) {
    "use strict";

    /**
     * String format.
     */
    if (!String.format) {
        String.format = function(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
    }

    /**
     * Lodash mixins.
     */
    _.mixin({
        extendClone: function (obj) {
            return _.extend.apply(_, [{}, obj].concat(_.rest(arguments)));
        }
    });
})(_);