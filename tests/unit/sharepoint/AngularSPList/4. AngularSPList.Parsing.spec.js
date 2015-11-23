(function () {
    "use strict";

    var SPListField = wizer.sharepoint.SPListField;

    var suites = ["AngularSPList", "[deprecated] parsing"];
    describes(suites, function () {
        var $q, $rootScope, $SPList, baseList, list, listConfigs;
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

            baseList = new $SPList({listName: "Test"});

            $rootScope.$digest();
        });

        describe("response", function () {
            it("should use: schema -> converters -> fields configs", function () {
                expect(parsedServerItem.orderField).toEqual(2);
            });

            describe("using schema", function () {
                it("[deprecated] should use `afterGet`", function () {
                    expect(parsedServerItem.newProperty).toEqual("New Property");
                });
                it("[deprecated] should use `afterGet` as promise", function () {
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
            describe("[deprecated] using converter", function () {
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
            describe("[deprecated] using field's `afterGet`", function () {
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
                    expect(parsedClientItem.multiLookupFieldId).toEqual({results: _.pluck(multiLookupData, "Id")});
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

    suites = ["AngularSPList", "parsing (common)"];
    fdescribes(suites, function () {
        testSchema("response", "parsing");
        testSchema("response", "parsed");
        testFieldParsers("response");
        testOrder("response");

        testSchema("request", "parsing");
        testSchema("request", "parsed");
        testFieldParsers("request");
        testOrder("request");

        /**
         * Test parsing pipeline functionality.
         * @param schemaType
         * @param parseType
         */
        function testSchema(schemaType, parseType) {
            describe(schemaType, function () {
                var $q, $rootScope, $SPList, list, configs, pipeline;

                beforeEach(module("wizer"));
                beforeEach(inject(function ($injector) {
                    $q = $injector.get("$q");
                    $rootScope = $injector.get("$rootScope");
                    $SPList = $injector.get("$SPList");
                }));
                beforeEach(function () {
                    pipeline = [];
                    configs = {};

                    _.set(configs, "schema." + schemaType + "." + parseType, pipeline);
                    list = new $SPList(_.extend(configs, {listName: "Test"}));
                });

                describe("use schema", function () {
                    describe(parseType, function () {
                        it("should take correct " + schemaType + " object", function () {
                            var raw = {Id: 1, Title: "Test item"};
                            var track = jasmine.createSpyObj("track", ["first"]);

                            push([
                                function (item) {
                                    expect(item).toEqual(raw);
                                    track.first();
                                }
                            ]);

                            parseItem(raw);
                            $rootScope.$digest();

                            expect(track.first).toHaveBeenCalled();
                        });
                        it("should pass result to next parse function", function () {
                            var raw = {Id: 1, Title: "Test item"};
                            var track = jasmine.createSpyObj("track", ["first", "second", "third"]);

                            push([
                                function (item) {
                                    item.ModifiedBy = "Jubei";
                                    track.first();

                                    // this function return `undefined` -> pass old raw object
                                    // to next function.
                                    return undefined;
                                },
                                function (item) {
                                    expect(item).toEqual(_.extend({}, raw, {
                                        ModifiedBy: "Jubei"
                                    }));
                                    track.second();

                                    // return new object, pass this object to next parse function.
                                    return {Id: 2};
                                },
                                function (item) {
                                    expect(item).toEqual({Id: 2});
                                    track.third();
                                }
                            ]);

                            parseItem(raw);
                            $rootScope.$digest();

                            expect(track.first).toHaveBeenCalled();
                            expect(track.second).toHaveBeenCalled();
                            expect(track.third).toHaveBeenCalled();
                        });
                        it("should accept parse result as `Promise`", function () {
                            var raw = {Id: 1, Title: "Test item"};
                            var track = jasmine.createSpyObj("track", ["first", "second"]);

                            push([
                                function (item) {
                                    item.ModifiedBy = "Jubei";
                                    track.first();

                                    return $q.when(item);
                                },
                                function (item) {
                                    expect(item).toEqual(_.extend({}, raw, {
                                        ModifiedBy: "Jubei"
                                    }));
                                    track.second();
                                }
                            ]);

                            parseItem(raw);
                            $rootScope.$digest();

                            expect(track.first).toHaveBeenCalled();
                            expect(track.second).toHaveBeenCalled();
                        });
                        it("should return correct parsed value", function () {
                            var raw = {Id: 1, Title: "Test item"};
                            var track = jasmine.createSpyObj("track", ["first"]);

                            push([
                                function (item) {
                                    return $q.when({Id: 2});
                                }
                            ]);

                            parseItem(raw).then(function (parsedResponse) {
                                // this is because `parsedResponse` is SPListItem instance.
                                expect(parsedResponse).toEqual(jasmine.objectContaining({Id: 2}));
                                track.first();
                            });

                            $rootScope.$digest();
                            expect(track.first).toHaveBeenCalled();
                        });
                    });
                });

                /**
                 * Push funtions to pipe-line.
                 * @param fnArray
                 */
                function push(fnArray) {
                    _.forEach(fnArray, function (fn) {
                        pipeline.push(fn);
                    });
                }

                /**
                 * Invoke corresponding method for parsing items.
                 * @param item
                 * @returns {*}
                 */
                function parseItem(item) {
                    return schemaType === "response"
                        ? list.$$parseServerItem(item)
                        : list.$$parseClientItem(item);
                }
            });
        }

        /**
         * Test parsing pipeline for field configs.parsers.
         * @param parserType
         */
        function testFieldParsers(parserType) {
            describe(parserType, function () {
                var $q, $rootScope, $SPList, list, configs;

                beforeEach(module("wizer"));
                beforeEach(inject(function ($injector) {
                    $q = $injector.get("$q");
                    $rootScope = $injector.get("$rootScope");
                    $SPList = $injector.get("$SPList");
                }));
                beforeEach(function () {
                    configs = {};
                    list = new $SPList(_.extend(configs, {listName: "Test"}));
                });

                describe("use field's parsers", function () {
                    it("should take correct " + parserType + " property value", function () {
                        var data = {name: "Jubei"};
                        var track = jasmine.createSpyObj("track", ["first"]);

                        setFields("name", [
                            function (name) {
                                expect(name).toEqual("Jubei");
                                track.first();
                            }
                        ]);

                        parseItem(data);
                        $rootScope.$digest();

                        expect(track.first).toHaveBeenCalled();
                    });
                    it("should pass result to next parse function", function () {
                        var data = {name: "Jubei"};
                        var track = jasmine.createSpyObj("track", ["first", "second", "third"]);

                        setFields("name", [
                            function (name) {
                                track.first();

                                // return `undefined` to preserve the old value.
                                return undefined;
                            },
                            function (name) {
                                expect(name).toEqual("Jubei");
                                track.second();

                                // return not `undefined` value to update property value.
                                return "Leonard";
                            },
                            function (name) {
                                expect(name).toEqual("Leonard");
                                track.third();
                            }
                        ]);

                        parseItem(data);
                        $rootScope.$digest();

                        expect(track.first).toHaveBeenCalled();
                        expect(track.second).toHaveBeenCalled();
                        expect(track.third).toHaveBeenCalled();
                    });
                    it("should accept parse result as `Promise`", function () {
                        var data = {name: "Jubei"};
                        var track = jasmine.createSpyObj("track", ["first", "second"]);

                        setFields("name", [
                            function (name) {
                                track.first();
                                return $q.when("Leonard");
                            },
                            function (name) {
                                expect(name).toEqual("Leonard");
                                track.second();
                            }
                        ]);

                        parseItem(data);
                        $rootScope.$digest();

                        expect(track.first).toHaveBeenCalled();
                        expect(track.second).toHaveBeenCalled();
                    });
                    it("should return correct parse value", function () {
                        var data = {name: "Jubei"};
                        var track = jasmine.createSpyObj("track", ["first"]);

                        setFields("name", [
                            function (name) {
                                return "Leonard";
                            }
                        ]);

                        parseItem(data).then(function (parsedData) {
                            expect(parsedData.name).toEqual("Leonard");
                            track.first();
                        });

                        $rootScope.$digest();
                        expect(track.first).toHaveBeenCalled();
                    });
                    it("should update passed " + parserType + " object", function () {
                        var data = {name: "Jubei"};
                        var track = jasmine.createSpyObj("track", ["first", "second"]);

                        setFields("name", [
                            function (name, dataObject) {
                                // Not modify anything yet.
                                expect(dataObject).toEqual(data);

                                // Modify the dataObject
                                delete dataObject.name;
                                dataObject.newName = "Leonard";

                                track.first();
                            },
                            function (name, dataObject) {
                                expect(dataObject.hasOwnProperty("name")).toBe(false);
                                expect(dataObject.newName).toEqual("Leonard");

                                track.second();
                            }
                        ]);

                        parseItem(data);

                        $rootScope.$digest();
                        expect(track.first).toHaveBeenCalled();
                        expect(track.second).toHaveBeenCalled();
                    });
                });

                /**
                 * Set `parsers` field value of configs.
                 * @param fieldName
                 * @param parseFns
                 */
                function setFields(fieldName, parseFns) {
                    var field = _.find(list.$configs.fields, "name", fieldName);
                    if (!field) {
                        field = new SPListField(fieldName);
                        list.$configs.fields.push(field);
                    }

                    _.set(field, "parsers." + parserType, parseFns);
                }

                /**
                 * Invoke corresponding parse method.
                 * @param item
                 */
                function parseItem(item) {
                    return (parserType === "response")
                        ? list.$$parseServerItem(item)
                        : list.$$parseClientItem(item);
                }
            });
        }

        /**
         * Test order of invoking parser functions.
         * The right order should be:
         *  + schema.{objectType}.parsing -> configs.fields.parser.{objectType} -> schema.{objectType}.parsed
         * @param objectType
         */
        function testOrder(objectType) {
            describe(objectType, function () {
                var $q, $rootScope, $SPList, baseList, list, orderSpy;

                beforeEach(module("wizer"));
                beforeEach(inject(function ($injector) {
                    $q = $injector.get("$q");
                    $rootScope = $injector.get("$rootScope");
                    $SPList = $injector.get("$SPList");
                }));
                beforeEach(function () {
                    orderSpy = jasmine.createSpy("order");
                    baseList = new $SPList({listName: "Test"});
                });

                describe("order", function () {
                    it(String.format("should be: schema.{0}.parsing -> configs.fields.parser.{0} -> schema.{0}.parsed", objectType), function () {
                        list = createList({
                            parsing: function (item) {
                                orderSpy("parsing");
                            },
                            fields: {
                                name: function (name) {
                                    orderSpy("field");
                                }
                            },
                            parsed: function (item) {
                                orderSpy("parsed");
                            }
                        });

                        parseItem({});
                        $rootScope.$digest();

                        expect(orderSpy.calls.count()).toEqual(3);
                        expect(orderSpy.calls.allArgs()).toEqual([["parsing"], ["field"], ["parsed"]]);
                    });
                    it("should pass correct data between functions", function () {
                        var data = {name: "Jubei"};
                        var track = jasmine.createSpyObj("track", ["first", "second", "third", "fourth", "fifth"]);

                        list = createList({
                            parsing: function (item) {
                                expect(item).toEqual(data);
                                item.name = "Leonard";

                                track.first();
                            },
                            fields: {
                                name: function (name) {
                                    expect(name).toEqual("Leonard");
                                    track.second();
                                },
                                job: function (job) {
                                    expect(job).toBeUndefined();
                                    track.third();

                                    return "Developer";
                                }
                            },
                            parsed: function (item) {
                                expect(item.name).toEqual("Leonard");
                                expect(item.job).toEqual("Developer");

                                track.fourth();
                                return {name: "Another name"};
                            }
                        });

                        parseItem(data).then(function (parsedData) {
                            expect(parsedData.name).toEqual("Another name");
                            track.fifth();
                        });

                        $rootScope.$digest();

                        expect(track.first).toHaveBeenCalled();
                        expect(track.second).toHaveBeenCalled();
                        expect(track.third).toHaveBeenCalled();
                        expect(track.fourth).toHaveBeenCalled();
                        expect(track.fifth).toHaveBeenCalled();
                    });
                });

                /**
                 * Create a custom list with special configs.
                 * @param data
                 * @returns {*|void|Object|*|void|*}
                 */
                function createList(data) {
                    var configs = {};

                    _.set(configs, String.format("schema.{0}.parsing", objectType), data.parsing);
                    _.set(configs, String.format("schema.{0}.parsed", objectType), data.parsed);

                    _.forEach(data.fields, function (value, key) {
                        _.set(configs, String.format("fields.{0}.parsers.{1}", key, objectType), value);
                    });

                    return baseList.define(configs);
                }

                /**
                 * Invoke corresponding function to parse item.
                 * @param item
                 * @returns {*}
                 */
                function parseItem(item) {
                    return (objectType === "response")
                        ? list.$$parseServerItem(item)
                        : list.$$parseClientItem(item);
                }
            });
        }
    });
})();