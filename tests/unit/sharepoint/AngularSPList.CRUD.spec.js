(function (testUtils, _) {

    var suites = ["AngularSPList", "CRUD operations"];
    describes(suites, function () {
        var siteUrl = "http://dev.fxp.net/rbs", listName = "Reservations", itemId = 1001,
            newItem = {testProp: "testProp"}, digestValue = "abcdefghijlkm";
        var $httpBackend, $SPList, list, select, expand;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $httpBackend = $injector.get("$httpBackend");
            $SPList = $injector.get("$SPList");
        }));
        beforeEach(function () {
            select = [
                "Id",
                "Title",
                "Author/Id", "Author/Title"
            ];
            expand = [
                "Author"
            ];
            list = new $SPList({
                siteUrl: siteUrl,
                listName: listName,
                select: select,
                expand: expand
            });
        });
        beforeEach(function () {
            $httpBackend.when("GET", /ListItemEntityTypeFullName/).respond({
                d: {
                    ListItemEntityTypeFullName: "SP.Data." + listName + "ListItem"
                }
            });
            $httpBackend.when("GET", /\w*/).respond(null);
            $httpBackend.when("POST", /\w*/).respond(null);
        });

        it("should be defined in `wizer.sharepoint` module", function () {
            expect($SPList).toBeDefined();
            expect(list).toBeDefined();
        });

        describe("when get single item", function () {
            it("should send valid request", function () {
                list.get(itemId, {
                    params: {
                        test: 1
                    }
                });
                $httpBackend.expect("GET", function (url) {
                    return testUtils.listItemRegex(siteUrl, listName, itemId).test(url);
                }, function (data) {
                    return data === undefined;
                }, function (headers) {
                    return _.isEqual(headers, {
                        accept: "application/json;odata=verbose"
                    });
                });
                $httpBackend.flush();
            });
            it("should include default query", function () {
                list.get(itemId, {
                    params: {
                        $randomParam: "test"
                    }
                });
                $httpBackend.expect("GET", function (url) {
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
        });
        describe("when get multiple item", function () {
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
        describe("when create single item", function () {
            it("should send valid request", function () {
                testUtils.updateFormDigest(digestValue);
                list.create(newItem);

                $httpBackend.expect("POST", function (url) {
                    return testUtils.listItemRegex(siteUrl, listName).test(url);
                }, function (data) {
                    return _.isEqual(JSON.parse(data), testUtils.listItemPostData(listName, newItem));
                }, function (headers) {
                    return _.isEqual(headers, {
                        "accept": "application/json;odata=verbose",
                        "content-type": "application/json;odata=verbose",
                        "X-RequestDigest": digestValue
                    });
                });
                $httpBackend.flush();
            });
            it("should NOT include default query", function () {
                list.create(newItem);

                $httpBackend.expect("POST", function (url) {
                    return !_.contains(decodeURIComponent(url), "$select=") && !_.contains(decodeURIComponent(url), "$expand=");
                });
                $httpBackend.flush();
            });
        });
        describe("when update single item", function () {
            it("should send valid request", function () {
                testUtils.updateFormDigest(digestValue);
                var updatingItem = _.extendClone(newItem, {Id: itemId});
                list.update(updatingItem);

                $httpBackend.expect("POST", function (url) {
                    return testUtils.listItemRegex(siteUrl, listName, itemId).test(url);
                }, function (data) {
                    return _.isEqual(JSON.parse(data), testUtils.listItemPostData(listName, updatingItem, true));
                }, function (headers) {
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
            it("should include default query", function () {
                list.update({Id: itemId});
                $httpBackend.expect("POST", function (url) {
                    return _.contains(decodeURIComponent(url), "$select=" + select.join(",")) &&
                        _.contains(decodeURIComponent(url), "$expand=" + expand.join(","));
                });
                $httpBackend.flush();
            });
            it("should overwrite default query", function () {
                list.update({Id: itemId}, {
                    params: {
                        $select: "custom_select",
                        $expand: "custom_expand"
                    }
                });
                $httpBackend.expect("POST", function (url) {
                    return _.contains(decodeURIComponent(url), "$select=custom_select") &&
                        _.contains(decodeURIComponent(url), "$expand=custom_expand");
                });
                $httpBackend.flush();
            });
        });
        describe("when remove single item", function () {
            it("should send valid request", function () {
                testUtils.updateFormDigest(digestValue);
                list.remove(itemId);

                $httpBackend.expect("POST", function (url) {
                    return testUtils.listItemRegex(siteUrl, listName, itemId).test(url);
                }, function (data) {
                    return data === undefined;
                }, function (headers) {
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

                $httpBackend.expect("POST", function (url) {
                    return !_.contains(decodeURIComponent(url), "$select=") && !_.contains(decodeURIComponent(url), "$expand=");
                });
                $httpBackend.flush();
            });
        });
        describe("when save single item", function () {
            it("should call update if `item.Id` is presence", function () {
                spyOn(list, "update");
                spyOn(list, "create");

                list.save({Id: 1});

                expect(list.update).toHaveBeenCalled();
                expect(list.create).not.toHaveBeenCalled();
            });
            it("should call update if `item.Id` is NOT presence", function () {
                spyOn(list, "update");
                spyOn(list, "create");

                list.save({});

                expect(list.create).toHaveBeenCalled();
                expect(list.update).not.toHaveBeenCalled();
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

})(testUtils, _);