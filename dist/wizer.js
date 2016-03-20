/**
 * wizer 0.2.0
 * 2016-03-21 02:37:18
 */
(function (_) {
    "use strict";

    /**
     * String format.
     */
    if (!String.format) {
        String.format = function (format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function (match, number) {
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
        },
        mergeClone: function (obj) {
            return _.merge.apply(_, [{}, obj].concat(_.rest(arguments)));
        }
    });
})(_);

var wizer = wizer || {};

wizer.identity = function (value) {
    return value;
};

wizer.utils = (function (utils, _) {
    utils.guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return function () {
            return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
                s4() + "-" + s4() + s4() + s4();
        };
    }();

    utils.fileExt = function (fileName) {
        if (fileName && _.isString(fileName)) {
            var index = fileName.lastIndexOf(".");
            if (index >= 0 && index < fileName.length - 1) {
                return fileName.slice(index + 1);
            }
        }
        return "";
    };

    utils.fileNameWithoutExt = function (fileName) {
        if (fileName && _.isString(fileName)) {
            var index = fileName.lastIndexOf(".");
            if (index > -1) {
                return fileName.slice(0, index);
            }
            return fileName;
        }
        return "";
    };

    return utils;
})(wizer.utils || {}, _);
wizer.constants = (function (constants) {
    constants.spListFieldType = {
        JSON: "json",
        DATE_TIME: "datetime",
        LOOKUP: "lookup",
        MULTI_LOOKUP: "multilookup",
        PERSON: "person",
        PEOPLE: "people"
    };

    return constants;
})(wizer.constants || {});
wizer.deprecation = (function (deprecation) {
    _.set(deprecation, "warning.enable", true);
    _.set(deprecation, "warning.verbose", false);

    /**
     * Output warning message to console.
     */
    var warn = function () {
        var msg = [];

        return function (message) {
            if (!deprecation.warning.enable) return;
            if (!checkExistance(message) || deprecation.warning.verbose) {
                console.warn("wizer warning: " + message);
            }
        };

        /**
         * Check if message is already in store.
         */
        function checkExistance(message) {
            if (!_.contains(msg, message)) {
                msg.push(message);
                return false;
            }

            return true;
        }
    }();

    /**
     * Migrate:
     *  - schema.beforePost
     *  - schema.afterGet
     *  - fields.beforePost
     *  - fields.afterGet
     *  - converters
     *  - select
     *  - expand
     * @param configs - normalized list configs.
     */
    deprecation.migrateToFieldConfigs = function (configs) {
        var SPListField = wizer.sharepoint.SPListField;

        if (_.isFunction(configs.schema.afterGet) && configs.schema.afterGet !== wizer.identity) {
            warn("`$SPList.configs.schema.afterGet` is deprecated, consider using `$SPList.configs.schema.response.parsing` instead. More info: https://github.com/nntoanbkit/wizer/blob/feature/docs/docs/migration/migration.md");

            if (!_.contains(configs.schema.response.parsing, configs.schema.afterGet)) {
                configs.schema.response.parsing.push(configs.schema.afterGet);
            }
        }

        if (_.any(_.flatten(_.map(configs.fieldConverters, _.identity)))) {
            warn("`$SPList.configs.fieldConverters` is deprecated, consider using `$SPList.configs.fields.type` instead. More info: https://github.com/nntoanbkit/wizer/blob/feature/docs/docs/migration/migration.md");
            _.forEach(configs.fieldConverters, function (fieldNames, converterName) {
                converterName = converterName.toLowerCase();
                _.forEach(fieldNames, function (name) {
                    var field = getField(name);

                    if ("lookup" === converterName) {
                        field.type = "custom";

                        /**
                         * Only need to strip `results` path of multi-lookup
                         */
                        field.parsers.response = [function (value) {
                            return _.isArray(value && value.results) ? value.results : value;
                        }];

                        /**
                         * Have to mix single and multi lookup.
                         *  - single:
                         *      - value = undefined -> do not save that field
                         *      - value = null -> erase that field
                         *  - multi
                         *      - value = [{empty}] -> erase that field
                         *      -> noway to prevent from modifying this field.
                         */
                        field.parsers.request = [function (value, request) {
                            delete request[field.name];
                            if (undefined === value) return;

                            // multi loookup
                            if (_.isArray(value)) {
                                request[field.name + "Id"] = {results: _.pluck(value, "Id")};
                            }
                            // single loopup
                            else {
                                request[field.name + "Id"] = _.get(value, "Id", null);
                            }
                        }];
                    }
                    else {
                        field.type = converterName;
                    }
                });
            });
        }

        _.forEach(configs.fields, function (field) {
            if (field.afterGet !== wizer.identity && _.isFunction(field.afterGet)) {
                warn("`$SPList.configs.fields.afterGet` is deprecated, consider using `$SPList.configs.fields.parsers.response` instead. More info: https://github.com/nntoanbkit/wizer/blob/feature/docs/docs/migration/migration.md");

                if (!_.contains(field.parsers.response, field.afterGet)) {
                    field.parsers.response.push(field.afterGet);
                }
            }

            if (field.beforePost !== wizer.identity && _.isFunction(field.beforePost)) {
                warn("`$SPList.configs.fields.beforePost` is deprecated, consider using `$SPList.configs.fields.parsers.request` instead. More info: https://github.com/nntoanbkit/wizer/blob/feature/docs/docs/migration/migration.md");

                if (!_.contains(field.parsers.request, field.beforePost)) {
                    field.parsers.request.unshift(field.beforePost);
                }
            }
        });

        if (_.isFunction(configs.schema.beforePost) && configs.schema.beforePost !== wizer.identity) {
            warn("`$SPList.configs.schema.beforePost` is deprecated, consider using `$SPList.configs.schema.request.parsed` instead. More info: https://github.com/nntoanbkit/wizer/blob/feature/docs/docs/migration/migration.md");

            if (!_.contains(configs.schema.request.parsed, configs.schema.beforePost)) {
                configs.schema.request.parsed.push(configs.schema.beforePost);
            }
        }

        if (_.any(configs.select)) {
            warn("`$SPList.configs.select` is deprecated, consider using `$SPList.configs.fields` instead. More info: https://github.com/nntoanbkit/wizer/blob/feature/docs/docs/migration/migration.md");

            _.forEach(configs.select, function (select) {
                var name = select.split("/")[0];
                var expandName = select.split("/")[1];
                var field = getField(name);

                if (expandName) {
                    field.expand = field.expand || [];
                    field.expand.push(expandName);
                }
            });
        }

        if (_.any(configs.expand)) {
            warn("`$SPList.configs.expand` is deprecated, consider using `$SPList.configs.fields` instead. More info: https://github.com/nntoanbkit/wizer/blob/feature/docs/docs/migration/migration.md");

            _.forEach(configs.expand, function (expand) {
                var field = getField(expand);
                field.type = field.type || "lookup";
            });
        }

        /**
         * Get the field from `configs` object or create if not exist.
         * @param fieldName
         */
        function getField(fieldName) {
            var field = _.find(configs.fields, "name", fieldName);
            if (!field ) {
                field = new SPListField(fieldName);
                configs.fields.push(field);
            }

            return field;
        }
    };

    return deprecation;
})(wizer.deprecation || {});
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

                    // `__proto__` is not supported in IE < 11
                    //this.$super = proto.__proto__;
                    this.$super = Object.getPrototypeOf(proto);

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
        ctor.prototype.constructor = ctor;
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
wizer.utils = (function (utils, _) {
    "use strict";

    utils.ArgsParser = wizer.Class.extend({
        init: function (overloads) {
            /**
             * Array<Array<Object{argName, argType}>>
             * @type {*|Array}
             */
            this.$$overloads = _.map(overloads, function (overload) {
                return _.map(overload, function (argType, argName) {
                    return {argName: argName, argType: argType};
                });
            });
        },
        parse: function (argsObject) {
            var args = null;
            _.forEach(this.$$overloads, function (overload) {
                args = testOverload(overload);

                // If `args` is not `null` then this `overload`
                // is matched -> break;
                return !args;
            });

            // If no overload is matched then we should throw an error.
            if (!args) throw new Error("No suitable overload was found!");

            return args;

            /**
             * Check if this `overload` is matched for this `argsObject`.
             * @param overload overload to test.
             * @returns {*} an `args` object if matched, otherwise `null`.
             */
            function testOverload(overload) {
                var result = {};
                _.forEach(argsObject, function (value, index) {
                    var arg = overload[index];

                    // If `argsObject` has more arguments than `overload` => this `overload`
                    // is not matched.
                    if (!arg) return notMatched();

                    // If `value` is not `null` or `undefined` then we should check value's type.
                    if (value != null) {
                        var typeCheckFn = _["is" + arg.argType];
                        if (!typeCheckFn(value)) return notMatched();
                    }

                    result[arg.argName] = value;
                });

                return result;

                /**
                 * This `overload` is not match for `argsObject`.
                 */
                function notMatched() {
                    result = null;
                    return false;
                }
            }
        }
    });

    return utils;
})(wizer.utils || {}, _);
var wizer = wizer || {};
wizer.sharepoint = function (sharepoint, _) {
    "use strict";

    var SPListField = wizer.Class.extend({
        /**
         * Create a new field with name and field configs.
         * @param {String} name - name of the field.
         * @param {Object} configs - optional field configurations.
         */
        init: function (name, configs) {
            if (!_.isString(name))
                throw new Error("Expect name is a string, but got " + name);

            this.name = name;
            _.defaultsDeep(this, configs, {
                /**
                 * Type of value of this field.
                 * The avaible options are:
                 *  - lookup
                 *  - multilookup
                 *  - datetime
                 *  - json
                 *  - "" (default value)
                 */
                type: "",
                /**
                 * Get this field from server but does not update its value when save.
                 * @type {Boolean}
                 */
                readonly: false,
                /**
                 * Expand if this is lookup field.
                 * If value is `true` then default lookup field is `Id` and `Title`.
                 * @type {Boolean|String|Array<String>}
                 */
                expand: false,
                /**
                 * Parsing configurations.
                 */
                parsers: {
                    /**
                     * Parse value of request object.
                     * @param {*} value - the value of this field of request object.
                     * @param {Object} request - the request object.
                     * @returns {Promise|*} - if the return value is `undefined` or promise which resolve to
                     * `undefined` then the field is left intact. Otherwise, new value will be assigned to this field.
                     * It's use full when you want to delete/rename some properties of request object.
                     */
                    request: null,
                    /**
                     * Parse value of request object.
                     * @param {*} value - the value of this field of reponse object.
                     * @param {Object} reponse - the reponse object.
                     * @returns {Promise|*} - if the return value is `undefined` or promise which resolve to
                     * `undefined` then the field is left intact. Otherwise, new value will be assigned to this field.
                     * It's use full when you want to delete/rename some properties of reponse object.
                     */
                    response: null
                }
            });

            // Normalize configs
            this.$normalizeConfigs();
        },

        // Protected methods
        $normalizeConfigs: function () {
            makeArray(this.parsers, "request");
            makeArray(this.parsers, "response");

            function makeArray(obj, prop) {
                obj[prop] = function () {
                    var value = obj[prop];

                    if (_.isArray(value)) return value;
                    if (null != value) return [value];
                    return [];
                }();
            }
        }
    });

    /**
     * Normalize SPList fields configurations.
     * @param fieldConfigs
     * @returns {*}
     */
    SPListField.parseConfigs = function (fieldConfigs) {
        if (_.isArray(fieldConfigs)) {
            return _.map(fieldConfigs, function (field) {
                if (_.isString(field)) return new SPListField(field);
                if (_.isObject(field)) return new SPListField(field.name, field);
            });
        }

        if (_.isObject(fieldConfigs)) {
            return _.map(fieldConfigs, function (config, key) {
                return new SPListField(key, config);
            });
        }

        return [];
    };

    sharepoint.SPListField = SPListField;
    return sharepoint;
}(wizer.sharepoint || {}, _);
var wizer = wizer || {};
wizer.sharepoint = function (sharepoint, _) {
    "use strict";

    var fieldType = wizer.constants.spListFieldType;
    var SPListField = wizer.sharepoint.SPListField;

    //region Utils methods
    /**
     * Implementation of `define` function.
     * @param listConfigs
     * @returns {void|*}
     */
    function define(listConfigs) {
        var list = this.extend({
            init: function (configs) {
                var mergedConfigs = _.merge(
                    {},
                    listConfigs,
                    configs,
                    function (objectValue, sourceValue, key, object, source) {
                        if (_.isArray(sourceValue)) return sourceValue;
                    });

                this.$super.init.call(this, mergedConfigs);
            }
        });

        list.define = define;
        return list;
    }

    /**
     * Redefine the `extend` function of `SPList` class and all its sub-classes.
     * @param klass
     */
    function defineExtend(klass) {
        var oldExtend = klass.extend;
        klass.extend = function (klassConfigs) {
            var newClass = oldExtend.call(klass, klassConfigs);

            newClass.define = define;
            defineExtend(newClass);

            return newClass;
        }
    }

    //endregion

    var SPList = wizer.Class.extend({
        // Constructor.
        /**
         * SPList constructor.
         * @param configs
         */
        init: function (configs) {
            // Validate configs properties.
            (function validateConfigs() {
                if (!configs) throw new Error("Configs must be specified.");

                configs.siteUrl = function checkSiteUrl() {
                    var url = (typeof configs.siteUrl !== "undefined") ? configs.siteUrl : ".";
                    url = $(String.format("<a href='{0}'></a>", url))[0].href;
                    url = _.endsWith(url, "/") ? url.slice(0, url.length - 1) : url;
                    return url;
                }();

                var requiredKeys = [
                    "listName"
                ];
                _.forEach(requiredKeys, function (keyName) {
                    if (!configs[keyName])
                        throw new Error(String.format("Config's '{0}' field is mandatory.", keyName))
                });
            })();

            // The merged configs object from all Sub class defined by `define` method.
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
                 * Fields configuration.
                 * Details below...
                 */
                fields: {},
                /**
                 * Configs for request and reponse.
                 */
                schema: {
                    /**
                     * @deprecated use schema.response.parsing instead.
                     * @param serverItem
                     * @returns {*}
                     */
                    afterGet: wizer.identity,
                    /**
                     * @deprecated use schema.request.parsed instead.
                     * @param clientItem
                     * @returns {*}
                     */
                    beforePost: wizer.identity,
                    /**
                     * Configurations for parsing request.
                     */
                    request: {
                        /**
                         * Invoke right before request are passed through parsing pipe-line.
                         * @param request
                         * @returns {*} - `undefined` to preserve old request item, otherwise new return value
                         * will be considered to be new request object.
                         */
                        parsing: null,
                        /**
                         * Invoke after request has been passed through parsing pipe-line and
                         * ready to post to server.
                         * @param parsedRequest
                         * @returns {*} - `undefined` to preserve old request item, otherwise new return value
                         * will be considered to be new request object.
                         */
                        parsed: null
                    },
                    /**
                     * Configurations for parsing reponse.
                     */
                    response: {
                        /**
                         * Invoke imediately when items are received from server.
                         * @param response
                         * @returns {*} - `undefined` to preserve old response item, otherwise new return value
                         * will be considered to be new resonse object.
                         */
                        parsing: null,
                        /**
                         * Invoke when response has been passed through parsing pipe-line.
                         * @param parsedResponse
                         * @returns {*} - `undefined` to preserve old response item, otherwise new return value
                         * will be considered to be new resonse object.
                         */
                        parsed: null
                    }
                }
            });

            // We dont want to change `this.$configs` object due to extend (define) functionality of SPList.
            this.configs(_.cloneDeep(this.$configs));
        },

        // Methods.
        /**
         * Get new list instance with overwritable configs.
         * @param configs
         */
        define: function (configs) {
            // We dont want to use existing `datasource` of this instance for new object.
            var ctor = this.constructor.define.call(
                this.constructor,
                _.omit(this.$configs, "dataSource")
            );

            return new ctor(configs);
        },

        // Getter Setter.
        /**
         * Save configurations to $$configs.
         * @param newConfigs
         * @returns {*}
         */
        configs: function (newConfigs) {
            if (arguments.length > 0 && newConfigs !== this.$$configs) {
                this.$$configs = newConfigs;

                // update configs.
                this.$normalizeConfigs();
                this.$updateFieldParsers();
            }
            return this.$$configs;
        },
        dataSource: function (newDataSource) {
            if (newDataSource != null)
                this.$configs.dataSource = newDataSource;
            return this.$configs.dataSource;
        },

        // Protected methods.
        /**
         * Transform list configurations to standard form.
         */
        $normalizeConfigs: function () {
            var configs = this.configs();

            // Normalize schema.
            makeArray(configs.schema.request, "parsing");
            makeArray(configs.schema.request, "parsed");
            makeArray(configs.schema.response, "parsing");
            makeArray(configs.schema.response, "parsed");

            // Nomalize field configs.
            configs.fields = SPListField.parseConfigs(configs.fields);

            function makeArray(obj, prop) {
                obj[prop] = function () {
                    var value = obj[prop];

                    if (_.isArray(value)) return value;
                    if (null != value) return [value];
                    return [];
                }();

            }
        },
        /**
         * Update field parsers corresponding to its type.
         */
        $updateFieldParsers: function () {
            _.forEach(this.configs().fields, function (field) {
                // Do not save `*` field.
                if (/\*/.test(field.name)) field.readonly = true;

                switch (field.type) {
                    case fieldType.JSON:
                        updateJsonType(field);
                        break;
                    case fieldType.DATE_TIME:
                        updateDateTimeType(field);
                        break;
                    case fieldType.LOOKUP:
                        updateLookupType(field);
                        break;
                    case fieldType.MULTI_LOOKUP:
                        updateMultiLookupType(field);
                        break;
                    case fieldType.PERSON:
                        updateLookupType(field);
                        break;
                    case fieldType.PEOPLE:
                        updateMultiLookupType(field);
                        break;
                }

                if (field.readonly) {
                    updateReadonly(field);
                }
            });

            // Type.
            function updateJsonType(field) {
                field.parsers.request.unshift(function (fieldValue) {
                    return JSON.stringify(fieldValue);
                });
                field.parsers.response.unshift(function (fieldValue) {
                    if (_.isString(fieldValue) && fieldValue !== "")
                        return JSON.parse(fieldValue);

                    return null;
                });
            }

            function updateDateTimeType(field) {
                field.parsers.request.unshift(function (fieldValue) {
                    return fieldValue && fieldValue.toJSON();
                });
                field.parsers.response.unshift(function (fieldValue) {
                    if (_.isString(fieldValue) && fieldValue !== "")
                        return new Date(fieldValue);

                    return null;
                });
            }

            function updateLookupType(field) {
                // Default expand to `Id` and `Title` if not set.
                field.expand = field.expand || true;
                field.parsers.request.unshift(function (fieldValue, request) {
                    delete request[field.name];

                    // if undefined then do not save this field <-> leave it as old value.
                    if (undefined === fieldValue) return;
                    request[field.name + "Id"] = _.get(fieldValue, "Id", null);
                });
            }

            function updateMultiLookupType(field) {
                // Default expand to `Id` and `Title` if not set.
                field.expand = field.expand || true;

                field.parsers.response.unshift(function (fieldValue) {
                    return _.get(fieldValue, "results", []);
                });
                field.parsers.request.unshift(function (fieldValue, request) {
                    delete request[field.name];

                    // if undefined then do not save this field <-> leave it as old value.
                    if (undefined === fieldValue) return;
                    request[field.name + "Id"] = {
                        results: _.pluck(fieldValue, "Id")
                    };
                });
            }

            // Readonly.
            function updateReadonly(field) {
                field.parsers.request = [function (fieldValue, request) {
                    delete request[field.name];
                }];
            }
        }
    });

    //region Clas methods
    // `defined` class inherit all methods, properties AND list configs.
    SPList.define = define;

    // Redefine `extend` method of class.
    defineExtend(SPList);
    //endregion

    sharepoint.SPList = SPList;
    return sharepoint;
}(wizer.sharepoint || {}, _);
(function (angular, wizer) {
    "use strict";

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$DataSource", [
            function () {
                return wizer.data.DataSource.extend({
                    init: function (configs) {
                        this.$super.init.call(this, configs);
                    }
                });
            }
        ]);

})(angular, wizer);
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
                        if (!(itemId > 0) && !(httpConfigs && httpConfigs.url))
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
                        return $q.all(_.map(items, function (item) {
                            return self.save(item, httpConfigs);
                        }));
                    },
                    getByUrl: function (url) {
                        return this.get(null, {url: url});
                    },
                    getAllByUrl: function (url) {
                        return this.getAll({url: url});
                    },
                    //endregion

                    //region Files and Folders
                    /**
                     * Get folder in this list.
                     * @param {String} folderName - relative folder url to this list. Pass "." for getting root folder.
                     */
                    getFolder: function (folderName) {
                        var url = this.dataSource().$$getListUrl() + "/RootFolder";
                        if ("." !== folderName) {
                            url += "/Folders/GetByUrl('" + folderName + "')";
                        }

                        return $http.get(url, {
                            headers: {
                                accept: "application/json;odata=verbose"
                            }
                        }).then(function (data) {
                            return data.data.d;
                        });
                    },
                    /**
                     * Get root folder of this list.
                     * @returns {*}
                     */
                    getRootFolder: function () {
                        return this.getFolder(".");
                    },
                    /**
                     * Check if this list has the specified folder.
                     * @param folderName
                     */
                    hasFolder: function (folderName) {
                        return this.getFolder(folderName)
                            .then(function (folder) {
                                return {
                                    hasFolder: true,
                                    folder: folder
                                };
                            })
                            .catch(function () {
                                return {hasFolder: false};
                            });
                    },
                    /**
                     * Create a new folder under the `RootFolder`.
                     * @param {String} folderName - name of new folder.
                     */
                    createFolder: function (folderName) {
                        var url = this.dataSource().$$getListUrl() + "/RootFolder/Folders/Add('" + folderName + "')";
                        return $http.post(url, null, {
                            headers: {
                                accept: "application/json;odata=verbose",
                                "X-REQUESTDIGEST": $("#__REQUESTDIGEST").val()
                            }
                        }).then(function (data) {
                            return data.data.d;
                        });
                    },
                    /**
                     * Get folder by `folderName` if that folder existed, otherwise create new folder.
                     * @param folderName
                     */
                    ensureFolder: function (folderName) {
                        if ("." === folderName) return this.getRootFolder();

                        var _this = this;
                        return this.hasFolder(folderName)
                            .then(function (result) {
                                if (result.hasFolder) return result.folder;
                                return _this.createFolder(folderName);
                            });
                    },
                    //endregion

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

                    //region Utils.
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
                    //endregion
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
                        var url = _.get(options, "httpConfigs.url", this.$$getItemUrl());

                        return this.$validatePostData(options.item)
                            .then(function (validatedData) {
                                return $http.post(
                                    url,
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
(function (angular, wizer, _) {
    "use strict";

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$SPListItem", [
            function () {
                return wizer.Class.extend({
                    /**
                     * Clone constructor. Copy all properties of `item` into this object.
                     * @param {Object} item - item to copy.
                     */
                    init: function (item) {
                        _.extend(this, item);
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
        .factory("$SPListItemCollection", [
            "$q",
            function ($q) {
                var $SPListItemCollection = wizer.ArrayClass.extend({
                    // Constructor.
                    init: function (items, splist, meta) {
                        if (null == splist) throw new Error("splist is required");

                        this.$super.init.apply(this, items);
                        this.$$splist = splist;

                        /**
                         * Object contains data for paging.
                         *  - previous: array of `httpConfigs` objects for retrieving previous items.
                         *  - current: `httpConfigs` object for retrieving current items.
                         *  - next: url or `httpConfigs` object for retrieving next items.
                         */
                        this.$$meta = _.extendClone(meta);
                    },

                    // Methods.
                    /**
                     * Determine if have next items.
                     * @return {Boolean} - true if have next items.
                     */
                    hasNext: function () {
                        return !!this.$$meta.next;
                    },
                    /**
                     * Determine if have previous items.
                     * @return {Boolean} - true if have previous items.
                     */
                    hasPrevious: function () {
                        return _.any(this.$$meta.previous);
                    },

                    /**
                     * Get next items (if available).
                     * @return {Promise} - Promise resolve to next items or empty array.
                     */
                    getNext: function () {
                        if (!this.hasNext()) {
                            var empty = $SPListItemCollection.create([], this.$$splist, {
                                // backup for `getNext` mutiple times when no more item to get.
                                previous: _.union(
                                    this.$$meta.previous,
                                    !!this.$$meta.current ? [this.$$meta.current] : []),
                                //previous: (this.$$meta.previous || []).concat(this.$$meta.current || []),
                                current: null,
                                next: null
                            });
                            return $q.when(empty);
                        }

                        var self = this;
                        return getNextItems()
                            .then(function (collection) {
                                collection.$$meta.previous= _.union(
                                    self.$$meta.previous,
                                    !!self.$$meta.current ? [self.$$meta.current] : []);
                                return collection;
                            });

                        /**
                         * Get next items by calling $$meta.next.
                         * Depends on its value (url or httpConfigs) to invoke
                         * corresponding function.
                         * @returns {Promise}
                         */
                        function getNextItems() {
                            // If next is url.
                            if (_.isString(self.$$meta.next)) {
                                return self.$$splist.getAllByUrl(self.$$meta.next);
                            }
                            // or it should be httpConfigs object.
                            else {
                                return self.$$splist.getAll(self.$$meta.next);
                            }
                        }
                    },
                    /**
                     * Get previous items (if avaiable).
                     * @return {Promise} - Promise resolve to previous items or empty array.
                     */
                    getPrevious: function () {
                        if (!this.hasPrevious()) {
                            var empty = $SPListItemCollection.create([], this.$$splist, {
                                previous: null,
                                current: null,
                                // backup for `getPrevious` mutiple times when no more item to get.
                                next: this.$$meta.current || this.$$meta.next
                            });
                            return $q.when(empty);
                        }

                        var self = this;
                        return this.$$splist.getAll(_.last(this.$$meta.previous))
                            .then(function (collection) {
                                collection.$$meta.previous = _.initial(self.$$meta.previous);
                                return collection;
                            });
                    },

                    // Getters/Setters.
                    pageIndexStart: function () {
                        if (this.length === 0) return 0;
                        return this.$$getPreviousItemCount() + 1;
                    },
                    pageIndexEnd: function () {
                        if (this.length === 0) return 0;
                        return this.$$getPreviousItemCount() + this.length;
                    },

                    // Utils.
                    /**
                     * Get total of previous items.
                     */
                    $$getPreviousItemCount: function () {
                        return _.reduce(this.$$meta.previous, function (memo, config) {
                            return memo + getTopParam(config);
                        }, 0);

                        /**
                         * Get value of $top param from request config.
                         * @param config - the config used to make the request.
                         */
                        function getTopParam(config) {
                            // First try to get $top from `params`.
                            var $top = 0;
                            try {
                                $top = parseInt(config.params.$top);
                            } catch (e) {}

                            if ($top) return $top;

                            // Else try to get from url.
                            var pattern = /\?.*\$top *=( *\d* *)/;
                            try {
                                var matches = pattern.exec(decodeURIComponent(config.url));
                                $top = parseInt(matches[1].trim());
                            } catch(e) {}

                            return $top;
                        }
                    }
                });

                /**
                 * Create a new $SPListItemCollection instance.
                 * @param {Array} items - init items of this collection.
                 * @param {$SPList|*} splist - SPList instance, use to retrieve next, previous...
                 * @param {Object} meta - metadata, contains info: previous, current, next links...
                 */
                $SPListItemCollection.create = function (items, splist, meta) {
                    return new $SPListItemCollection(items, splist, meta);
                };

                return $SPListItemCollection;
            }
        ]);

})(angular, wizer, _);
(function (angular, File, utils) {
    "use strict";
    if (!angular) return;

    angular
        .module("wizer.sharepoint")
        .factory("$SPDocumentLibrary", [
            "$http", "$q", "$SPList",
            function ($http, $q, $SPList) {
                return $SPList.extend({
                    // Constructor.
                    init: function (configs) {
                        this.$super.init.call(this, configs);
                    },

                    // Methods.
                    /**
                     * Upload a file and its property to this document library, optional specify a folder.
                     * @param {File} file - a file object to upload to server.
                     * @param {Object} itemInfo - object hash contains properties of file item.
                     * @param {String} folderName - optional, name of folder in this document library, if folder does
                     * not exist, new folder will be created.
                     * @returns {Object} - created doc lib item.
                     */
                    uploadDocument: function (file, itemInfo, folderName) {
                        folderName = folderName || ".";
                        var self = this;

                        return this.$$uploadFile(file, folderName)
                            // Get item all fields.
                            .then(function (item) {
                                return getItemAllFields(item);
                            })
                            // Update item info.
                            .then(function (item) {
                                return updateItemInfo(item, itemInfo);
                            });

                        /**
                         * Get all fields of item.
                         * @param item
                         */
                        function getItemAllFields(item) {
                            return $http
                                .get(item.ListItemAllFields.__deferred.uri, {
                                    headers: {accept: "application/json;odata=verbose"}
                                })
                                .then(function (data) {
                                    return data.data.d;
                                });
                        }

                        /**
                         * Update item info.
                         * @param item
                         * @param itemInfo
                         * @returns {*}
                         */
                        function updateItemInfo(item, itemInfo) {
                            return !!itemInfo ? self.update(_.extend(itemInfo, {Id: item.Id})) : self.get(item.Id);
                        }
                    },

                    // Utils.
                    /**
                     * Upload file to this document library. Optional specify a folder to upload to.
                     * @param {File} file - File object to upload.
                     * @param {String} folderName - optional, folder to upload to, new folder will be created if not existed.
                     * @returns {Object} - created doc lib item.
                     */
                    $$uploadFile: function (file, folderName) {
                        if (!(file instanceof File))
                            throw new Error("Expect a file, but got " + file);

                        var _this = this, buffer, url;

                        return $q.when()
                            // Get buffer.
                            .then(function () {
                                return getBufferFromFile(file).then(function (_buffer_) {
                                    buffer = _buffer_;
                                });
                            })
                            // Get url.
                            .then(function () {
                                return _this.ensureFolder(folderName).then(function (folder) {
                                    var fileName = String.format("{0}_{1}.{2}",
                                        utils.fileNameWithoutExt(file.name),
                                        new Date().valueOf(),
                                        utils.fileExt(file.name)
                                    );

                                    url = folder.Files["__deferred"].uri + "/add(overwrite=true, url='" + fileName + "')";
                                });
                            })
                            // Upload file.
                            .then(function () {
                                return uploadFile(url, buffer);
                            });

                        /**
                         * Get buffer from File object.
                         * @param file
                         * @returns {Function|promise}
                         */
                        function getBufferFromFile(file) {
                            if (!FileReader)
                                throw new Error("This browser does not support the FileReader API.");

                            var dfd = $q.defer();
                            var reader = new FileReader();

                            reader.onloadend = function (args) {
                                dfd.resolve(args.target.result);
                            };
                            reader.onerror = function (args) {
                                dfd.reject(args.target.error);
                            };

                            reader.readAsArrayBuffer(file);
                            return dfd.promise;
                        }

                        /**
                         * Upload buffer.
                         * @param url
                         * @param buffer
                         * @returns {Function|promise}
                         */
                        function uploadFile(url, buffer) {
                            var dfd = $q.defer();

                            $.ajax({
                                url: url,
                                type: "POST",
                                data: buffer,
                                processData: false,
                                headers: {
                                    "Accept": "application/json;odata=verbose",
                                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                                },
                                success: function (data) {
                                    dfd.resolve(data.d);
                                },
                                error: function (xhr) {
                                    dfd.reject(xhr);
                                }
                            });

                            return dfd.promise;
                        }
                    }
                });
            }
        ]);
})(angular, File, wizer.utils);
var wizer = (function (wizer) {
    "use strict";

    var nativeFns = [
        "concat",
        "join",
        "pop",
        "push",
        "shift",
        "slice",
        "splice",
        "unshift"
    ];

    var configs = {
        init: function () {
            this.push.apply(this, arguments);
        }
    };

    _.forEach(nativeFns, function (fnName) {
        configs[fnName] = function () {
            return Array.prototype[fnName].apply(this, arguments);
        }
    });

    wizer.ArrayClass = wizer.Class.extend(configs);

    return wizer;
})(wizer || {});
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
            }
        });
        if (configs.data) configs.data = _.clone(configs.data);

        this.$configs = configs;
    };

    // Utils
    /**
     * Get all data from data source.
     * Return `data` in case of local data source, `Promise` if remote data source.
     */
    dataSourceConfigs.data = function () {
        if (this.$configs.data) return this.$configs.data;
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
                // If set to `this` object -> all instances will share the same `$configs`.
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