var wizer = wizer || {};
wizer.sharepoint = function (sharepoint, _, $) {
    "use strict";

    function define(listConfigs) {
        var list = this.extend({
            init: function (configs) {
                this.$super.init.call(this, _.defaultsDeep({}, configs, listConfigs));
            }
        });

        list.define = define;
        return list;
    }

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
                 * `DataSource` for CRUD operations.
                 */
                dataSource: {}
            });
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
        }
    });

    // `defined` class inherit all methods, properties AND list configs.
    SPList.define = define;

    // Redefine `extend` method of class.
    defineExtend(SPList);

    sharepoint.SPList = SPList;
    return sharepoint;
}(wizer.sharepoint || {}, _, $);