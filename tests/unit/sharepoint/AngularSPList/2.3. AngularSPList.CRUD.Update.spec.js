(function () {
    "use strict";

    var suites = ["AngularSPList", "CRUD operations", "update"];
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
                .whenGET(/ListItemEntityTypeFullName/)
                .respond({
                d: {
                    ListItemEntityTypeFullName: "SP.Data." + listName + "ListItem"
                }
            });

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

            $httpBackend
                .whenPOST(testUtils.listItemRegex(siteUrl, listName, itemId))
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

        it("should send valid request", function () {
            testUtils.updateFormDigest(digestValue);
            list.update(item);

            $httpBackend.expectPOST(
                function (url) {
                    return testUtils.listItemRegex(siteUrl, listName, itemId).test(url);
                },
                function (data) {
                    return _.isEqual(JSON.parse(data), testUtils.listItemPostData(listName, item));
                },
                function (headers) {
                    return _.isEqual(headers, {
                        "accept": "application/json;odata=verbose",
                        "content-type": "application/json;odata=verbose",
                        "X-RequestDigest": digestValue,
                        "IF-MATCH": "*",
                        "X-HTTP-Method": "MERGE"
                    });
                });

            $httpBackend.flush();
        });
        it("should send GET request to get created item", function () {
            var httpConfigs = {
                params: {
                    $select: "select_something"
                }
            };

            list.update(item, httpConfigs);
            $httpBackend.expectGET(
                function (url) {
                    return testUtils.listItemRegex(siteUrl, listName, itemId).test(url);
                },
                function (header) {
                    return _.isEqual(header, {
                        accept: "application/json;odata=verbose"
                    });
                }
            );

            $httpBackend.flush();
        });

        describe("response object", function () {
            it("should resolve to correct object", function () {
                list.update({Id: itemId})
                    .then(function (item) {
                        expect(item.Id).toEqual(itemId);
                        expect(item.Title).toEqual("Meeting Room");
                    });

                $httpBackend.flush();
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

})(testUtils, _);