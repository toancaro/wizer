(function (testUtils, _) {

    describe("SPList Service", function () {
        var siteUrl = "dev.fxp.net/rbs", listName = "Reservations", itemId = 1001,
            newItem = {testProp: "testProp"}, digestValue = "abcdefghijlkm";
        var $httpBackend, $$SPList, list;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $httpBackend = $injector.get("$httpBackend");
            $$SPList = $injector.get("$$SPList");
            list = new $$SPList({
                siteUrl: siteUrl,
                listName: listName
            });
        }));
        beforeEach(function () {
            $httpBackend.when("GET", /\w*/).respond(null);
            $httpBackend.when("POST", /\w*/).respond(null);
        });

        it("should be defined in `wizer.sharepoint` module", function () {
            expect($$SPList).toBeDefined();
            expect(list).toBeDefined();
        });

        describe("when get single item", function () {
            it("should get successful", function () {
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
        });

        describe("when create single item", function () {
            it("should create successful", function () {
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
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

})(testUtils, _);