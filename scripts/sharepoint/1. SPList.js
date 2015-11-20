var wizer = wizer || {};
wizer.sharepoint = function (sharepoint, _, $) {
    "use strict";

    var SPListField = wizer.sharepoint.SPListField;

    /**
     * Implementation of `define` function.
     * @param listConfigs
     * @returns {void|*}
     */
    function define(listConfigs) {
        var list = this.extend({
            init: function (configs) {
                this.$super.init.call(this, _.defaultsDeep({}, configs, listConfigs));
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
                    afterGet: function (serverItem) {
                        return serverItem;
                    },
                    /**
                     * @deprecated use schema.request.parsed instead.
                     * @param clientItem
                     * @returns {*}
                     */
                    beforePost: function (clientItem) {
                        return clientItem;
                    },
                    /**
                     * Configurations for parsing request.
                     */
                    request: {
                        /**
                         * Invoke right before request are passed through parsing pipe-line.
                         * @param request
                         * @returns {*}
                         */
                        parsing: function (request) { return request; },
                        /**
                         * Invoke after request has been passed through parsing pipe-line and
                         * ready to post to server.
                         * @param parsedRequest
                         * @returns {*}
                         */
                        parsed: function (parsedRequest) { return parsedRequest; }
                    },
                    /**
                     * Configurations for parsing reponse.
                     */
                    response: {
                        /**
                         * Invoke imediately when items are received from server.
                         * @param response
                         * @returns {*}
                         */
                        parsing: function (response) { return response; },
                        /**
                         * Invoke when response has been passed through parsing pipe-line.
                         * @param parsedResponse
                         * @returns {*}
                         */
                        parsed: function (parsedResponse) { return parsedResponse; }
                    }
                }
            });

            // Nomalize the configs.
            this.$normalizeConfigs();
        },
        /**
         * Get new list instance with overwritable configs.
         * @param configs
         */
        define: function (configs) {
            // We dont want to use existing `datasource` of this instance for new object.
            var ctor = this.constructor.define.call(
                this.constructor, _.omit(this.$configs, "dataSource"));

            return new ctor(configs);
        },

        // Getter Setter.
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
            (function normalizeSchema() {
                makeArray(this.$configs.schema.request, "parsing");
                makeArray(this.$configs.schema.request, "parsed");
                makeArray(this.$configs.schema.response, "parsing");
                makeArray(this.$configs.schema.response, "parsed");
            }).call(this);

            /**
             * Field normalize form:
             * Array<Object{name,type,...}>
             */
            (function normalizeFields() {
                this.$configs.fields = SPListField.parseConfigs(this.$configs.fields);
            }).call(this);

            function makeArray(obj, prop) {
                var value = obj[prop];
                obj[prop] = _.isArray(value) ? value : [value];
            }
        }
    });

    // `defined` class inherit all methods, properties AND list configs.
    SPList.define = define;

    // Redefine `extend` method of class.
    defineExtend(SPList);

    sharepoint.SPList = SPList;
    return sharepoint;
}(wizer.sharepoint || {}, _, $);