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
                    /**
                     * Upload a file and its property to this document library, optional specify a folder.
                     * @param {File} file - a file object to upload to server.
                     * @param {Object} itemInfo - object hash contains properties of file item.
                     * @param {String} folderName - optional, name of folder in this document library, if folder does
                     * not exist, new folder will be created.
                     * @returns {Object} - created doc lib item.
                     */
                    uploadDocument: function (file, itemInfo, folderName) {
                        folderName = folderName || ".";
                        var self = this;

                        return this.$$uploadFile(file, folderName)
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
                    /**
                     * Upload file to this document library. Optional specify a folder to upload to.
                     * @param {File} file - File object to upload.
                     * @param {String} folderName - optional, folder to upload to, new folder will be created if not existed.
                     * @returns {Object} - created doc lib item.
                     */
                    $$uploadFile: function (file, folderName) {
                        if (!(file instanceof File))
                            throw new Error("Expect a file, but got " + file);

                        var _this = this, buffer, url;

                        return $q.when()
                            // Get buffer.
                            .then(function () {
                                return getBufferFromFile(file).then(function (_buffer_) {
                                    buffer = _buffer_;
                                });
                            })
                            // Get url.
                            .then(function () {
                                return _this.ensureFolder(folderName).then(function (folder) {
                                    var fileName = String.format("{0}_{1}.{2}",
                                        utils.fileNameWithoutExt(file.name),
                                        new Date().valueOf(),
                                        utils.fileExt(file.name)
                                    );

                                    url = folder.Files["__deferred"].uri + "/add(overwrite=true, url='" + fileName + "')";
                                });
                            })
                            // Upload file.
                            .then(function () {
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