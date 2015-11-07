(function () {
    "use strict";

    angular
        .module("testApp", ["wizer"])
        .controller("MainController", [
            "$SPList",
            function ($SPList) {
                var self = this;

                var list = new $SPList({
                    siteUrl: "http://sas.sharepoint.net.vn:8686/hsse",
                    listName: "Inspection"
                });

                list.get(65).then(function (inspection) {
                    self.inspection = inspection;
                });
            }
        ]);
})();