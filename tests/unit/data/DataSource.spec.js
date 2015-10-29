(function (wizer) {
    "use strict";

    describe("DataSource", function () {
        var DataSource = wizer.data.DataSource;

        it("should be defined in `wizer.data`", function () {
            expect(_.isFunction(DataSource)).toBe(true);
        });
        it("should create datasource object with `$configs`", function () {
            var ds = new DataSource();
            expect(ds.$configs).toBeDefined();
        });

        describe("when use local data", function () {
            var ds, data;
            beforeEach(function () {
                data = ["item 1", "item 2"];
                ds = new DataSource({
                    data: data
                });
            });

            it("`data()` should return all data", function () {
                var allData = ds.data();
                expect(allData.length).toEqual(data.length);
                expect(allData).not.toBe(data);
            });
            it("`add()` should add item to the end of data source", function () {
                ds.add("new item");
                expect(ds.data().length).toEqual(data.length + 1);
                expect(_.last(ds.data())).toEqual("new item");
            });
        });
    });

})(wizer);