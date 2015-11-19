(function (angular, wizer, _) {
    "use strict";

    if (!angular) return;
    angular
        .module("wizer.data")
        .factory("$SPListItemCollection", [
            "$q",
            function ($q) {
                var $SPListItemCollection = wizer.ArrayClass.extend({
                    // Constructor.
                    init: function (items, splist, meta) {
                        if (null == splist) throw new Error("splist is required");

                        this.$super.init.apply(this, items);
                        this.$$splist = splist;

                        /**
                         * Object contains data for paging.
                         *  - previous: array of `httpConfigs` objects for retrieving previous items.
                         *  - current: `httpConfigs` object for retrieving current items.
                         *  - next: url or `httpConfigs` object for retrieving next items.
                         */
                        this.$$meta = _.extendClone(meta);
                    },

                    // Methods.
                    /**
                     * Determine if have next items.
                     * @return {Boolean} - true if have next items.
                     */
                    hasNext: function () {
                        return !!this.$$meta.next;
                    },
                    /**
                     * Determine if have previous items.
                     * @return {Boolean} - true if have previous items.
                     */
                    hasPrevious: function () {
                        return _.any(this.$$meta.previous);
                    },

                    /**
                     * Get next items (if available).
                     * @return {Promise} - Promise resolve to next items or empty array.
                     */
                    getNext: function () {
                        if (!this.hasNext()) {
                            var empty = $SPListItemCollection.create([], this.$$splist, {
                                // backup for `getNext` mutiple times when no more item to get.
                                previous: _.union(
                                    this.$$meta.previous,
                                    !!this.$$meta.current ? [this.$$meta.current] : []),
                                //previous: (this.$$meta.previous || []).concat(this.$$meta.current || []),
                                current: null,
                                next: null
                            });
                            return $q.when(empty);
                        }

                        var self = this;
                        return getNextItems()
                            .then(function (collection) {
                                collection.$$meta.previous= _.union(
                                    self.$$meta.previous,
                                    !!self.$$meta.current ? [self.$$meta.current] : []);
                                return collection;
                            });

                        /**
                         * Get next items by calling $$meta.next.
                         * Depends on its value (url or httpConfigs) to invoke
                         * corresponding function.
                         * @returns {Promise}
                         */
                        function getNextItems() {
                            // If next is url.
                            if (_.isString(self.$$meta.next)) {
                                return self.$$splist.getAllByUrl(self.$$meta.next);
                            }
                            // or it should be httpConfigs object.
                            else {
                                return self.$$splist.getAll(self.$$meta.next);
                            }
                        }
                    },
                    /**
                     * Get previous items (if avaiable).
                     * @return {Promise} - Promise resolve to previous items or empty array.
                     */
                    getPrevious: function () {
                        if (!this.hasPrevious()) {
                            var empty = $SPListItemCollection.create([], this.$$splist, {
                                previous: null,
                                current: null,
                                // backup for `getPrevious` mutiple times when no more item to get.
                                next: this.$$meta.current || this.$$meta.next
                            });
                            return $q.when(empty);
                        }

                        var self = this;
                        return this.$$splist.getAll(_.last(this.$$meta.previous))
                            .then(function (collection) {
                                collection.$$meta.previous = _.initial(self.$$meta.previous);
                                return collection;
                            });
                    },

                    // Getters/Setters.
                    pageIndexStart: function () {
                        if (this.length === 0) return 0;
                        return this.$$getPreviousItemCount() + 1;
                    },
                    pageIndexEnd: function () {
                        if (this.length === 0) return 0;
                        return this.$$getPreviousItemCount() + this.length;
                    },

                    // Utils.
                    /**
                     * Get total of previous items.
                     */
                    $$getPreviousItemCount: function () {
                        return _.reduce(this.$$meta.previous, function (memo, config) {
                            return memo + getTopParam(config);
                        }, 0);

                        /**
                         * Get value of $top param from request config.
                         * @param config - the config used to make the request.
                         */
                        function getTopParam(config) {
                            // First try to get $top from `params`.
                            var $top = 0;
                            try {
                                $top = parseInt(config.params.$top);
                            } catch (e) {}

                            if ($top) return $top;

                            // Else try to get from url.
                            var pattern = /\?.*\$top *=( *\d* *)/;
                            try {
                                var matches = pattern.exec(decodeURIComponent(config.url));
                                $top = parseInt(matches[1].trim());
                            } catch(e) {}

                            return $top;
                        }
                    }
                });

                /**
                 * Create a new $SPListItemCollection instance.
                 * @param {Array} items - init items of this collection.
                 * @param {$SPList|*} splist - SPList instance, use to retrieve next, previous...
                 * @param {Object} meta - metadata, contains info: previous, current, next links...
                 */
                $SPListItemCollection.create = function (items, splist, meta) {
                    return new $SPListItemCollection(items, splist, meta);
                };

                return $SPListItemCollection;
            }
        ]);

})(angular, wizer, _);