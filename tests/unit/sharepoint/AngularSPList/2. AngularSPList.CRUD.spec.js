(function () {
    "use strict";

    var suites = ["AngularSPList", "CRUD operations"];
    describes(suites, function () {
        var siteUrl = "http://dev.fxp.net/rbs", listName = "Reservations", itemId = 1001;
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

        describe("save", function () {
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

})();