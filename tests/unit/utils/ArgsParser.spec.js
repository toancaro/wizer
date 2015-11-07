(function (wizer) {
    "use strict";

    describe("ArgsParser", function () {
        var ArgsParser = wizer.utils.ArgsParser, itemIds = [1], httpConfigs = {headers: {}};
        var parser, testFunction;

        beforeEach(function () {
            parser = new ArgsParser([
                {itemIds: "Array", httpConfigs: "Object"},
                {httpConfigs: "Object"}
            ]);
            testFunction = function (itemIds, httpConfigs) {
                return arguments;
            };
        });

        it("should be define in `wizer.utils` namespace", function () {
            expect(ArgsParser).toBeDefined();
        });
        it("should work with full params", function () {
            var args = parser.parse(testFunction(itemIds, httpConfigs));
            expect(args).not.toBeNull();
            expect(args.itemIds).toEqual(itemIds);
            expect(args.httpConfigs).toEqual(httpConfigs);
        });
        it("should work with `not` full params (1)", function () {
            var args = parser.parse(testFunction(itemIds));
            expect(args).not.toBeNull();
            expect(args.itemIds).toEqual(itemIds);
            expect(args.httpConfigs).toEqual(undefined);
        });
        it("should work with `not` full params (2)", function () {
            var args = parser.parse(testFunction(httpConfigs));
            expect(args).not.toBeNull();
            expect(args.itemIds).toEqual(undefined);
            expect(args.httpConfigs).toEqual(httpConfigs);
        });
        it("should work with no params", function () {
            var args = parser.parse(testFunction());
            expect(args).not.toBeNull();
            expect(args.itemIds).toEqual(undefined);
            expect(args.httpConfigs).toEqual(undefined);
        });
        it("should reserve location for `undefined` param (1)", function () {
            var args = parser.parse(testFunction(undefined, httpConfigs));
            expect(args).not.toBeNull();
            expect(args.itemIds).toEqual(undefined);
            expect(args.httpConfigs).toEqual(httpConfigs);
        });
        it("should reserve location for `undefined` param (2)", function () {
            var args = parser.parse(testFunction(null, undefined));
            expect(args).not.toBeNull();
            expect(args.itemIds).toEqual(null);
            expect(args.httpConfigs).toEqual(undefined);
        });
    });

})(wizer);