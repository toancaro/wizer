(function (wizer, _) {
    "use strict";

    describe("ArrayClass", function () {
        var ArrayClass = wizer.ArrayClass;
        var array;

        beforeEach(function () {
            array = new ArrayClass(1, 2, 3);
        });

        it("should be defined in `wizer` namespace", function () {
            expect(_.isFunction(ArrayClass)).toBe(true);
        });

        describe("when init an array", function () {
            it("should create an valid array", function () {
                expect(array.length).toEqual(3);
                _.forEach(array, function (element, index) {
                    expect(element).toEqual(index + 1);
                });
            });
        });
        describe("array instance", function () {
            it("should have `push` method", function () {
                var length = array.push(4);

                expect(array.length).toEqual(4);
                expect(array[3]).toEqual(4);
                expect(length).toEqual(array.length);
            });
            it("should have `pop` method", function () {
                var popped = array.pop();

                expect(array.length).toEqual(2);
                expect(array[3]).toBe(undefined);
                expect(popped).toBe(3);
            });
        });
    });

})(wizer, _);