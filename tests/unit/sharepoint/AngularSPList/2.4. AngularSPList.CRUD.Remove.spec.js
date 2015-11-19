(function () {
    "use strict";

    var suites = ["AngularSPList", "CRUD operations", "remove"];
    describes(suites, function () {
        var siteUrl = "http://dev.fanxipan.net/roombooking", listName = "Rooms";
        var itemId = 1001, digestValue = "abc123";
        var $httpBackend, $SPList, list, item;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $httpBackend = $injector.get("$httpBackend");
            $SPList = $injector.get("$SPList");
        }));
        beforeEach(function () {
            list = new $SPList({
                siteUrl: siteUrl,
                listName: listName,
                select: ["Id", "Title"],
                expand: ["Author"]
            });
            item = {
                Id: itemId,
                Title: "Item title"
            }
        });
        beforeEach(function () {
            $httpBackend
                .whenPOST(testUtils.listItemRegex(siteUrl, listName, itemId))
                .respond(null);
        });


        it("should send valid request", function () {
            testUtils.updateFormDigest(digestValue);
            list.remove(itemId);

            $httpBackend.expectPOST(
                function (url) {
                    return testUtils.listItemRegex(siteUrl, listName, itemId).test(url);
                },
                function (data) {
                    return data === undefined;
                },
                function (headers) {
                    return _.isEqual(headers, {
                        "accept": "application/json;odata=verbose",
                        "X-RequestDigest": digestValue,
                        "IF-MATCH": "*",
                        "X-HTTP-Method": "DELETE"
                    });
                });

            $httpBackend.flush();
        });
        it("should NOT include default query", function () {
            list.remove(itemId);

            $httpBackend.expectPOST(function (url) {
                return !_.contains(decodeURIComponent(url), "$select=") && !_.contains(decodeURIComponent(url), "$expand=");
            });
            $httpBackend.flush();
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

})(testUtils, _);