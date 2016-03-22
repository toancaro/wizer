(function (wizer, testUtils, _) {
    "use strict";

    var SPListField = wizer.sharepoint.SPListField;

    describe("SPListField", function () {
        it("should be defined in `wizer.sharepoint` namespace", function () {
            expect(_.isFunction(SPListField)).toBe(true);
        });

        describe("when parse configs", function () {
            describe("when parse array", function () {
                it("should parse string element", function () {
                    var configs = SPListField.parseConfigs(["title"]);
                    expect(configs).toEqual([
                        jasmine.objectContaining({name: "title"})
                    ]);
                });
                it("should parse object element", function () {
                    var configs = SPListField.parseConfigs([
                        {name: "author", type: "lookup"}
                    ]);
                    expect(configs).toEqual([
                        jasmine.objectContaining({name: "author", type: "lookup"})
                    ]);
                })
            });
            describe("when parse object", function () {
                it("should parse correctly", function () {
                    var configs = SPListField.parseConfigs({
                        author: {type: "lookup"}
                    });
                    expect(configs).toEqual([
                        jasmine.objectContaining({name: "author", type: "lookup"})
                    ]);
                });
            });
        });
    });
})(wizer, testUtils, _);