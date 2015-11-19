(function () {
    "use strict";

    var suites = ["AngularSPList"];
    describes(suites, function () {
        var siteUrl = "http://dev.fxp.net/rbs", listName = "Reservations";
        var $SPList, list;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $SPList = $injector.get("$SPList");
        }));
        beforeEach(function () {
            list = new $SPList({
                siteUrl: siteUrl,
                listName: listName
            });
        });

        it("should be defined in `wizer.sharepoint` module", function () {
            expect($SPList).toBeDefined();
            expect(list).toBeDefined();
        });
    });

})();