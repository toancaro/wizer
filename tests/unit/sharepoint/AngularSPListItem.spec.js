(function () {

    describe("$SPListItem", function () {
        var $SPListItem, item, listItem;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $SPListItem = $injector.get("$SPListItem");
        }));
        beforeEach(function () {
            item = {
                Id: 1,
                Title: "Test list item"
            };
            listItem = new $SPListItem(item);
        });

        it("should be defined in `wizer.sharepoint` module", function () {
            expect(_.isFunction($SPListItem)).toBe(true);
            expect(listItem).toBeDefined();
        });
        it("should copy all data from passed item", function () {
            _.forEach(item, function (value, key) {
                expect(listItem.hasOwnProperty(key)).toBe(true);
            });
        });
    });

})(testUtils, _);