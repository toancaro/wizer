(function (testUtils, _) {
    "use strict";

    var suites = ["AngularSPList", "CRUD operations", "get", "single"];
    describes(suites, function () {
        var siteUrl = "http://dev.fanxipan.net/roombooking", listName = "Rooms", itemId = 1001;
        var $httpBackend, $SPList, $SPListItem;
        var list, select, expand;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $httpBackend = $injector.get("$httpBackend");
            $SPList = $injector.get("$SPList");
            $SPListItem = $injector.get("$SPListItem");
        }));
        beforeEach(function () {
            select = ["Id", "Title"];
            expand = ["Author"];
            list = new $SPList({
                siteUrl: siteUrl,
                listName: listName,
                select: select,
                expand: expand
            });
        });
        beforeEach(function () {
            $httpBackend
                .whenGET(testUtils.listItemRegex(siteUrl, listName, itemId))
                .respond({
                    d: {
                        "__metadata": {
                            type: "SP.Data." + listName + "ListItem"
                        },
                        Id: itemId,
                        Title: "Meeting Room"
                    }
                });
        });

        it("should send a valid request", function () {
            list.get(itemId);

            $httpBackend.expectGET(
                function (url) {
                    return testUtils.listItemRegex(siteUrl, listName, itemId).test(url);
                },
                function (headers) {
                    return _.isEqual(headers, {
                        accept: "application/json;odata=verbose"
                    });
                });

            $httpBackend.flush();
        });

        describe("query string", function () {
            it("should include default query", function () {
                list.get(itemId);
                $httpBackend.expectGET(function (url) {
                    return _.contains(decodeURIComponent(url), "$select=" + select.join(",")) &&
                        _.contains(decodeURIComponent(url), "$expand=" + expand.join(","));
                });
                $httpBackend.flush();
            });
            it("should overwrite default query", function () {
                list.get(itemId, {
                    params: {
                        $select: "custom_select",
                        $expand: "custom_expand"
                    }
                });
                $httpBackend.expect("GET", function (url) {
                    return _.contains(decodeURIComponent(url), "$select=custom_select") &&
                        _.contains(decodeURIComponent(url), "$expand=custom_expand");
                });
                $httpBackend.flush();
            });
            it("should add user query", function () {
                list.get(itemId, {
                    params: {
                        $extra: "extra_query"
                    }
                });
                $httpBackend.expect("GET", function (url) {
                    return _.contains(decodeURIComponent(url), "$extra=extra_query");
                });
                $httpBackend.flush();
            });
        });
        describe("response object", function () {
            var listItem;
            beforeEach(function () {
                list.get(itemId).then(function (item) {
                    listItem = item;
                });
                $httpBackend.flush();
            });

            it("should be instance of `$SPListItem`", function () {
                expect(listItem instanceof $SPListItem).toBe(true);
            });
            it("should contains correct data", function () {
                expect(listItem.Id).toEqual(itemId);
                expect(listItem.Title).toEqual("Meeting Room");
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

})(testUtils, _);