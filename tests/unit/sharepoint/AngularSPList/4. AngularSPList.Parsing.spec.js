(function () {
    "use strict";

    var suites = ["AngularSPList", "parsing"];
    describes(suites, function () {
        var $q, $rootScope, $SPList, list, listConfigs;
        var serverItem, clientItem, parsedServerItem, parsedClientItem;
        var jsonData, dateTimeData, singleLookupData, multiLookupData;
        var roomName, facilities;

        beforeEach(module("wizer"));
        beforeEach(inject(function ($injector) {
            $q = $injector.get("$q");
            $rootScope = $injector.get("$rootScope");
            $SPList = $injector.get("$SPList");
        }));
        beforeEach(function () {
            jsonData = {
                name: "Jubei",
                job: "Developer",
                age: "25",
                address: {
                    country: "Vietnam",
                    city: "Hanoi"
                }
            };
            dateTimeData = new Date();
            singleLookupData = {
                Id: 1,
                Title: "Single lookup item 1"
            };
            multiLookupData = [
                {Id: 1, Title: "Multi lookup item 1"},
                {Id: 2, Title: "Multi lookup item 2"},
                {Id: 3, Title: "Multi lookup item 3"}
            ];

            roomName = "Room 001";
            facilities = [
                {Id: 1, Title: "Facility 1"},
                {Id: 2, Title: "Facility 2"}
            ];

            serverItem = {
                // Converter fields.
                jsonField: JSON.stringify(jsonData),
                dateTimeField: dateTimeData.toJSON(),
                singleLookupField: singleLookupData,
                multiLookupField: {results: multiLookupData},
                // Default fields.
                roomName: roomName,
                facilities: [1, 2],
                // Use to test order of parsers.
                orderField: null
            };
            clientItem = {
                redundantField: "This field should be deleted"
            };

            listConfigs = {
                listName: "Room",
                siteUrl: "TestUrl",
                schema: {
                    afterGet: function (serverItem) {
                        serverItem.newProperty = "New Property";
                        if (serverItem.orderField === null) {
                            serverItem.orderField = "1";
                        }
                    },
                    beforePost: function (clientItem) {
                        delete clientItem.redundantField;
                        if (clientItem.orderField === "1") {
                            clientItem.orderField = null;
                        }
                    }
                },
                fieldConverters: {
                    json: ["jsonField", "orderField"],
                    dateTime: ["dateTimeField"],
                    lookup: ["singleLookupField", "multiLookupField"]
                },
                fields: {
                    roomName: {
                        afterGet: function (roomName) {
                            return roomName + "--Changed";
                        },
                        beforePost: function (roomName) {
                            return roomName.slice(0, roomName.indexOf("--Changed"));
                        }
                    },
                    facilities: {
                        afterGet: function () {
                            return $q.when(facilities)
                        },
                        beforePost: function (facilities) {
                            return $q.when(_.pluck(facilities, "Id"));
                        }
                    },
                    orderField: {
                        afterGet: function (order) {
                            if (order === 1) return 2;
                        },
                        beforePost: function (order) {
                            if (order === 2) return 1;
                        }
                    }
                }
            };

            list = new $SPList(listConfigs);
            list.$$parseServerItem(serverItem)
                .then(function (parsedItem) {
                    parsedServerItem = parsedItem;
                    return list.$$parseClientItem(_.extend({}, parsedItem, clientItem));
                })
                .then(function (parsedItem) {
                    parsedClientItem = parsedItem;
                });

            $rootScope.$digest();
        });

        describe("server item", function () {
            it("should use: schema -> converters -> fields configs", function () {
                expect(parsedServerItem.orderField).toEqual(2);
            });

            describe("using schema", function () {
                it("should use `afterGet`", function () {
                    expect(parsedServerItem.newProperty).toEqual("New Property");
                });
                it("should use `afterGet` as promise", function () {
                    list.$configs.schema.afterGet = function (serverItem) {
                        return $q.when().then(function () {
                            serverItem.newProperty = "Modified";
                        });
                    };
                    list.$$parseServerItem({}).then(function (parsedItem) {
                        expect(parsedItem.newProperty).toEqual("Modified");
                    });
                    $rootScope.$digest();
                });
            });
            describe("using converter", function () {
                it("should parse `json` field", function () {
                    expect(parsedServerItem.jsonField).toEqual(jsonData);
                });
                it("should parse `dateTime` field", function () {
                    expect(parsedServerItem.dateTimeField).toEqual(dateTimeData);
                });
                it("should parse `single-lookup` field", function () {
                    expect(parsedServerItem.singleLookupField).toEqual(singleLookupData);
                });
                it("should parse `multi-lookup` field", function () {
                    expect(parsedServerItem.multiLookupField).toEqual(multiLookupData);
                });
            });
            describe("using field's `afterGet`", function () {
                it("should call `afterGet` function", function () {
                    expect(parsedServerItem.roomName).toEqual("Room 001--Changed");
                });
                it("should accept `Promise` result", function () {
                    expect(parsedServerItem.facilities).toEqual(facilities);
                });
            });
        });
        describe("client item", function () {
            it("should use: fields configs -> converters -> schema", function () {
                expect(parsedClientItem.orderField).toEqual(null);
            });

            describe("using field's `beforePost`", function () {
                it("should call `beforePost` function", function () {
                    expect(parsedClientItem.roomName).toEqual("Room 001");
                });
                it("should accept `Promise` result", function () {
                    expect(parsedClientItem.facilities).toEqual([1, 2]);
                });
            });
            describe("using converter", function () {
                it("should parse `json` field", function () {
                    expect(parsedClientItem.jsonField).toEqual(JSON.stringify(jsonData));
                });
                it("should parse `dateTime` field", function () {
                    expect(parsedClientItem.dateTimeField).toEqual(dateTimeData.toJSON());
                });
                it("should parse `single-lookup` field", function () {
                    expect(parsedClientItem.singleLookupFieldId).toEqual(singleLookupData.Id);
                    expect(parsedClientItem.hasOwnProperty("singleLookupField")).toBe(false);
                });
                it("should parse `multi-lookup` field", function () {
                    expect(parsedClientItem.multiLookupFieldId).toEqual({ results: _.pluck(multiLookupData, "Id")});
                    expect(parsedClientItem.hasOwnProperty("multiLookupField")).toBe(false);
                });
            });
            describe("using schema", function () {
                it("should use `beforePost`", function () {
                    expect(typeof (parsedClientItem.redundantField)).toEqual("undefined");
                });
                it("should use `beforePost` as promise", function () {
                    list.$configs.schema.beforePost = function (clientItem) {
                        return $q.when().then(function () {
                            delete clientItem.redundantField;
                        });
                    };
                    list.$$parseClientItem({redundantField: "This field should be deleted"})
                        .then(function (parsedItem) {
                            expect(typeof (parsedItem.redundantField)).toEqual("undefined");
                        });

                    $rootScope.$digest();
                });
            });
        });
    });
})();