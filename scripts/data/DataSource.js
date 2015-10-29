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