(function (angular) {
    "use strict";

    if (!angular) return;
    angular.module("wizer.data", []);
    angular.module("wizer.sharepoint", ["wizer.data"]);
    angular.module("wizer", ["wizer.data", "wizer.sharepoint"]);

})(angular);