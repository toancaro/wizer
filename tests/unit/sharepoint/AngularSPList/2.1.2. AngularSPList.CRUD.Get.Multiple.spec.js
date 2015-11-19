(function () {
    "use strict";

    var suites = ["AngularSPList", "CRUD operations", "get", "multiple"];
    describes(suites, function () {
        var siteUrl = "http://dev.fanxipan.net/roombooking", listName = "Rooms";
        var $httpBackend, $SPList, $SPListItem, $SPListItemCollection;
        var list, select, expand;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $httpBackend = $injector.get("$httpBackend");
            $SPList = $injector.get("$SPList");
            $SPListItem = $injector.get("$SPListItem");
            $SPListItemCollection = $injector.get("$SPListItemCollection");
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
                .whenGET(testUtils.listItemRegex(siteUrl, listName))
                .respond({
                    d: {
                        results: [
                            {
                                "__metadata": {
                                    type: "SP.Data.RoomsListItem"
                                },
                                Id: 1,
                                Title: "Meeting Room"
                            },
                            {
                                "__metadata": {
                                    type: "SP.Data.RoomsListItem"
                                },
                                Id: 2,
                                Title: "Hall"
                            }
                        ],
                        "__next": "http://dev.fanxipan.net/process/roombooking/_api/lists/getByTitle('Rooms')/items?%24skiptoken=Paged%3dTRUE%26p_ID%3d1&%24select=Id%2cTitle&%24top=1"
                    }
                });
        });

        it("should send a valid request", function () {
            list.getAll();

            $httpBackend.expectGET(
                function (url) {
                    return testUtils.listItemRegex(siteUrl, listName).test(url);
                },
                function (headers) {
                    return _.isEqual(headers, {
                        accept: "application/json;odata=verbose"
                    });
                });

            $httpBackend.flush();
        });
        it("should use user url in httpConfigs", function () {
            var customUrl = "http://custom_url";

            list.getAll({
                url: customUrl,
                params: {
                    $select: null,
                    $expand: null
                }
            });

            $httpBackend.expectGET(customUrl).respond({
                d: {
                    results: []
                }
            });
            $httpBackend.flush();
        });

        describe("query string", function () {
            it("should include default query", function () {
                list.getAll();
                $httpBackend.expectGET(function (url) {
                    return _.contains(decodeURIComponent(url), "$select=" + select.join(",")) &&
                        _.contains(decodeURIComponent(url), "$expand=" + expand.join(","));
                });
                $httpBackend.flush();
            });
            it("should overwrite default query", function () {
                list.getAll({
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
                list.getAll({
                    params: {
                        $extra: "extra_query"
                    }
                });
                $httpBackend.expect("GET", function (url) {
                    return _.contains(decodeURIComponent(url), "$extra=extra_query");
                });
                $httpBackend.flush();
            });
            it("should include `id query` in empty $filter", function () {
                list.getAll([1, 2]);
                $httpBackend.expect("GET", function (url) {
                    return _.contains(decodeURIComponent(url), "$filter=(Id+eq+1)+or+(Id+eq+2)")
                });
                $httpBackend.flush();
            });
            it("should include `id query` in NON empty $filter", function () {
                list.getAll([1, 2], {
                    params: {
                        $filter: "Test eq 1"
                    }
                });
                $httpBackend.expect("GET", function (url) {
                    return _.contains(decodeURIComponent(url), "$filter=(Test+eq+1)+and+((Id+eq+1)+or+(Id+eq+2))")
                });
                $httpBackend.flush();
            });
        });
        describe("response object", function () {
            var listItems;
            beforeEach(function () {
                list.getAll().then(function (items) {
                    listItems = items;
                });
                $httpBackend.flush();
            });

            it("should be instance of `$SPListItemCollection`", function () {
                expect(listItems instanceof $SPListItemCollection).toBe(true);
            });
            it("should contains only `$SPListItem` item", function () {
                _.forEach(listItems, function (item) {
                    expect(item instanceof $SPListItem).toBe(true);
                });
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

})(testUtils, _);