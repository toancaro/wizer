(function (_) {
    "use strict";

    describe("AngularSPDocumentLibrary", function () {
        var $SPList, $SPDocumentLibrary, list, library;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $SPList = $injector.get("$SPList");
            $SPDocumentLibrary = $injector.get("$SPDocumentLibrary");
        }));
        beforeEach(function () {
            list = new $SPList({listName: "Test"});
            library = new $SPDocumentLibrary({listName: "Test"});
        });

        it("should be defined in `wizer.sharepoint` module", function () {
            expect(_.isFunction($SPDocumentLibrary)).toBe(true);
            expect(library).toBeDefined();
        });
        it("should inherit from $SPList", function () {
            expect(library instanceof $SPList).toBe(true);
        });
    });
})(_);