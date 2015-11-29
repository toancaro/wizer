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
                    _.cloneDeep(listConfigs),
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