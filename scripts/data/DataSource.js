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