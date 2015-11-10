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