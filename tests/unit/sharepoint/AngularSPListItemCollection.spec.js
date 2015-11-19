(function () {

    describe("AngularSPListItemCollection", function () {
        var $SPListItemCollection;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $SPListItemCollection = $injector.get("$SPListItemCollection");
        }));

        it("should be defined in `wizer.sharepoint` module", function () {
            expect(_.isFunction($SPListItemCollection)).toBe(true);
        });

        describe("methods", function () {
            describe("pageIndexStart", function () {
                it("should return 0 when collection contains no element", function () {
                    var collection = new $SPListItemCollection([], {});
                    expect(collection.pageIndexStart()).toBe(0);
                });
                it("should return correct start index of page", function () {
                    var collection = new $SPListItemCollection([1, 2, 3], {}, {
                        previous: [
                            {params: {$top: 10}}
                        ]
                    });

                    expect(collection.pageIndexStart()).toEqual(11);
                });
            });
            describe("pageIndexEnd", function () {
                it("should return 0 when collection contains no element", function () {
                    var collection = new $SPListItemCollection([], {});
                    expect(collection.pageIndexEnd()).toBe(0);
                });
                it("should return correct end index of page", function () {
                    var collection = new $SPListItemCollection([1, 2, 3, 4, 5, 6], {}, {
                        previous: [
                            {params: {$top: 10}},
                            {url: "?$top=15"}
                        ]
                    });

                    expect(collection.pageIndexEnd()).toEqual(31);
                });
            });
            describe("$$getPreviousItemCount", function () {
                it("should get `$top` from params object", function () {
                    var collection = new $SPListItemCollection([], {}, {
                        previous: [
                            {params: {$top: 2}},
                            {params: {$top: 3}},
                            {params: {$top: 4}}
                        ]
                    });
                    expect(collection.$$getPreviousItemCount()).toBe(9);
                });
                it("should get `$top` from url", function () {
                    var collection = new $SPListItemCollection([], {}, {
                        previous: [
                            {url: "http://example.com?$select=Id&  $top  =  25   "},
                            {url: "http://example.com?   $top  = 4  &$select=Id,Title"},
                            {url: "http://example.com?$select=Id&   $top  =    6  &$expand=Author"}
                        ]
                    });
                    expect(collection.$$getPreviousItemCount()).toBe(35);
                });
                it("should decode url before parsing", function () {
                    var collection = new $SPListItemCollection([], {}, {
                        previous: [
                            {url: "http://dev.fanxipan.net/process/roombooking/_api/lists/getByTitle('Requests')/items?%24skiptoken=Paged%3dTRUE%26p_ID%3d1&%24expand=Room%2cDevices%2cRequester%2cServices&%24filter=Code+ne+null&%24select=Id%2cUniqueId%2cTitle%2cYear%2cCode%2cRequester%2fId%2cRequester%2fTitle%2cRequesterJobTitle%2cRequesterDepartment%2cRequesterPhone%2cUses%2cOtherRequirements%2cNumOfParticipants%2cVisitorType%2cStartTime%2cEndTime%2cDevices%2fId%2cDevices%2fTitle%2cServices%2fId%2cServices%2fTitle%2cRoom%2fId%2cRoom%2fTitle%2cStatus%2cSupportStatus&%24top=10"},
                        ]
                    });
                    expect(collection.$$getPreviousItemCount()).toBe(10);
                });
            });
        });
    });

})(testUtils, _);
