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