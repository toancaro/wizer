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