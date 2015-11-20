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
                parse: function (field) { return field; }
            });
        }
    });

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