var wizer = wizer || {};
wizer.sharepoint = function (sharepoint, _, $) {
    "use strict";

    sharepoint.SPList = wizer.Class.extend({
        // Constructor.
        /**
         * SPList constructor.
         * @param configs
         */
        init: function (configs) {
            /**
             * Validate configs properties.
             */
            (function validateConfigs() {
                if (!configs) throw new Error("Configs must be specified.");

                configs.siteUrl = function checkSiteUrl() {
                    var url = (typeof configs.siteUrl !== "undefined") ? configs.siteUrl : ".";
                    url = $(String.format("<a href='{0}'></a>", url))[0].href;
                    url = _.endsWith(url, "/") ? url.slice(0, url.length - 1) : url;
                    return url;
                }();

                var requiredKeys = [
                    "siteUrl",
                    "listName"
                ];
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
                dataSource: {}
            });
        },

        // Getter Setter.
        dataSource: function (newDataSource) {
            if (newDataSource != null)
                this.$configs.dataSource = newDataSource;
            return this.$configs.dataSource;
        }
    });

    return sharepoint;
}(wizer.sharepoint || {}, _, $);