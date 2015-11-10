(function (angular, File, utils) {
    "use strict";
    if (!angular) return;

    angular
        .module("wizer.sharepoint")
        .factory("$SPDocumentLibrary", [
            "$http", "$q", "$SPList",
            function ($http, $q, $SPList) {
                return $SPList.extend({
                    // Constructor.
                    init: function (configs) {
                        this.$super.init.call(this, configs);
                    },

                    // Methods.
                    uploadDocument: function (file, itemInfo) {
                        var self = this;

                        return this.$$uploadFile(file)
                            // Get item all fields.
                            .then(function (item) {
                                return getItemAllFields(item);
                            })
                            // Update item info.
                            .then(function (item) {
                                return updateItemInfo(item, itemInfo);
                            });

                        /**
                         * Get all fields of item.
                         * @param item
                         */
                        function getItemAllFields(item) {
                            return $http
                                .get(item.ListItemAllFields.__deferred.uri, {
                                    headers: {accept: "application/json;odata=verbose"}
                                })
                                .then(function (data) {
                                    return data.data.d;
                                });
                        }

                        /**
                         * Update item info.
                         * @param item
                         * @param itemInfo
                         * @returns {*}
                         */
                        function updateItemInfo(item, itemInfo) {
                            return !!itemInfo ? self.update(_.extend(itemInfo, {Id: item.Id})) : self.get(item.Id);
                        }
                    },

                    // Utils.
                    $$uploadFile: function (file) {
                        if (!(file instanceof File))
                            throw new Error("Expect a file, but got " + file);

                        var fileName = utils.guid() + "." + utils.fileExt(file.name);
                        var url = this.$configs.siteUrl + String.format("/_api/web/lists/getByTitle('{0}')/rootFolder/files/add(overwrite=true, url='{1}')", this.$configs.listName, fileName);

                        return getBufferFromFile(file).then(function (buffer) {
                            return uploadFile(url, buffer);
                        });

                        /**
                         * Get buffer from File object.
                         * @param file
                         * @returns {Function|promise}
                         */
                        function getBufferFromFile(file) {
                            if (!FileReader)
                                throw new Error("This browser does not support the FileReader API.");

                            var dfd = $q.defer();
                            var reader = new FileReader();

                            reader.onloadend = function (args) {
                                dfd.resolve(args.target.result);
                            };
                            reader.onerror = function (args) {
                                dfd.reject(args.target.error);
                            };

                            reader.readAsArrayBuffer(file);
                            return dfd.promise;
                        }

                        /**
                         * Upload buffer.
                         * @param url
                         * @param buffer
                         * @returns {Function|promise}
                         */
                        function uploadFile(url, buffer) {
                            var dfd = $q.defer();

                            $.ajax({
                                url: url,
                                type: "POST",
                                data: buffer,
                                processData: false,
                                headers: {
                                    "Accept": "application/json;odata=verbose",
                                    "X-RequestDigest": $("#__REQUESTDIGEST").val()
                                },
                                success: function (data) {
                                    dfd.resolve(data.d);
                                },
                                error: function (xhr) {
                                    dfd.reject(xhr);
                                }
                            });

                            return dfd.promise;
                        }
                    }
                });
            }
        ]);
})(angular, File, wizer.utils);