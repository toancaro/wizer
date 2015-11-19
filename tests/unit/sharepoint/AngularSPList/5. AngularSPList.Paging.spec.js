(function (testUtils, _) {
    "use strict";

    var suites = ["AngularSPList", "paging"];
    describes(suites, function () {
        var siteUrl = "http://dev.fanxipan.net/roombooking", listName = "Rooms";
        var next1Url = "http://dev.fanxipan.net/roombooking?$next=1";
        var next2Url = "http://dev.fanxipan.net/roombooking?$next=2";
        var $httpBackend, $SPList, list;
        var currentData, next1Data, next2Data;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $httpBackend = $injector.get("$httpBackend");
            $SPList = $injector.get("$SPList");
        }));
        beforeEach(function () {
            list = new $SPList({
                siteUrl: siteUrl,
                listName: listName
            });

            currentData = {
                d: {
                    results: [
                        {
                            "__metadata": {
                                type: "SP.Data.RoomsListItem"
                            },
                            Id: 1,
                            Title: "Meeting Room"
                        },
                        {
                            "__metadata": {
                                type: "SP.Data.RoomsListItem"
                            },
                            Id: 2,
                            Title: "Hall"
                        }
                    ],
                    "__next": next1Url
                }
            };

            next1Data = {
                d: {
                    results: [
                        {
                            "__metadata": {
                                type: "SP.Data.RoomsListItem"
                            },
                            Id: 3,
                            Title: "Room 3"
                        },
                        {
                            "__metadata": {
                                type: "SP.Data.RoomsListItem"
                            },
                            Id: 4,
                            Title: "Room 4"
                        }
                    ],
                    "__next": next2Url
                }
            };
            next2Data = {
                d: {
                    results: [
                        {
                            "__metadata": {
                                type: "SP.Data.RoomsListItem"
                            },
                            Id: 5,
                            Title: "Room 5"
                        }
                    ]
                }
            };
        });
        beforeEach(function () {
            $httpBackend
                .whenGET(testUtils.listItemRegex(siteUrl, listName))
                .respond(currentData);

            $httpBackend.whenGET(next1Url).respond(next1Data);
            $httpBackend.whenGET(next2Url).respond(next2Data);
        });

        describe("get next", function () {
            describe("after `get all`", function () {
                describe("when has next items", function () {
                    var current, nextItems;
                    beforeEach(function () {
                        list.getAll()
                            .then(function (items) {
                                current = items;
                                return current.getNext();
                            })
                            .then(function (items) {
                                nextItems = items;
                            });
                        $httpBackend.flush();
                    });
                    it("should return valid data", function () {
                        expect(current.hasNext()).toBe(true);
                        expect(_.pluck(nextItems, "Id")).toEqual([3, 4]);
                    });
                });
                describe("when NOT has next items", function () {
                    var current, nextItems;
                    beforeEach(function () {
                        currentData.d.__next = null;

                        list.getAll()
                            .then(function (items) {
                                current = items;
                                return current.getNext();
                            })
                            .then(function (items) {
                                nextItems = items;
                            });
                        $httpBackend.flush();
                    });
                    it("should return empty array", function () {
                        expect(current.hasNext()).toBe(false);
                        expect(nextItems).toBeDefined();
                        expect(nextItems.length).toEqual(0);
                    });
                });
            });
            describe("after `get next`", function () {
                describe("when has next items", function () {
                    var currentItems, next1, next2;
                    beforeEach(function () {
                        list.getAll()
                            .then(function (items) {
                                currentItems = items;
                                return currentItems.getNext();
                            })
                            .then(function (items) {
                                next1 = items;
                                return next1.getNext();
                            })
                            .then(function (items) {
                                next2 = items;
                            });
                        $httpBackend.flush();
                    });
                    it("should return valid data", function () {
                        expect(currentItems.hasNext()).toBe(true);
                        expect(next1.hasNext()).toBe(true);
                        expect(next2.hasNext()).toBe(false);

                        expect(_.pluck(next1, "Id")).toEqual([3, 4]);
                        expect(_.pluck(next2, "Id")).toEqual([5]);
                    });
                });
                describe("when NOT has next items", function () {
                    var currentItems, next1, next2, next3;
                    beforeEach(function () {
                        list.getAll()
                            .then(function (items) {
                                currentItems = items;
                                return currentItems.getNext();
                            })
                            .then(function (items) {
                                next1 = items;
                                return next1.getNext();
                            })
                            .then(function (items) {
                                next2 = items;
                                return next2.getNext();
                            })
                            .then(function (items) {
                                next3 = items;
                            });
                        $httpBackend.flush();
                    });
                    it("should return empty array", function () {
                        expect(currentItems.hasNext()).toBe(true);
                        expect(next1.hasNext()).toBe(true);
                        expect(next2.hasNext()).toBe(false);
                        expect(next3.hasNext()).toBe(false);

                        expect(_.pluck(next1, "Id")).toEqual([3, 4]);
                        expect(_.pluck(next2, "Id")).toEqual([5]);
                        expect(next3).toBeDefined();
                        expect(next3.length).toEqual(0);
                    });
                });
            });
            describe("after `get previous`", function () {
                var current, next1, previous, next2;
                beforeEach(function () {
                    list.getAll()
                        .then(function (items) {
                            current = items;
                            return current.getNext();
                        })
                        .then(function (items) {
                            next1 = items;
                            return next1.getPrevious();
                        })
                        .then(function (items) {
                            previous = items;
                            return previous.getNext();
                        })
                        .then(function (items) {
                            next2 = items;
                        });

                    $httpBackend.flush();
                });
                it("should return valid data", function () {
                    expect(current.hasNext()).toBe(true);
                    expect(next1.hasPrevious()).toBe(true);
                    expect(previous.hasNext()).toBe(true);

                    expect(_.pluck(next2, "Id")).toEqual([3, 4]);
                });
            });
        });
        describe("get previous", function () {
            describe("after `get all`", function () {
                var current, previous;
                beforeEach(function () {
                    list.getAll()
                        .then(function (items) {
                            current = items;
                            return current.getPrevious();
                        })
                        .then(function (items) {
                            previous = items;
                        });

                    $httpBackend.flush();
                });
                it("should return empty array", function () {
                    expect(current.hasPrevious()).toBe(false);
                    expect(previous).toBeDefined();
                    expect(previous.length).toBeDefined(0);
                });
            });
            describe("after `get next`", function () {
                var current, next, previous;
                beforeEach(function () {
                    list.getAll()
                        .then(function (items) {
                            current = items;
                            return current.getNext();
                        })
                        .then(function (items) {
                            next = items;
                            return next.getPrevious();
                        })
                        .then(function (items) {
                            previous = items;
                        });

                    $httpBackend.flush();
                });
                it("should return valid data", function () {
                    expect(next.hasPrevious()).toBe(true);
                    expect(previous.hasPrevious()).toBe(false);
                    expect(_.pluck(previous, "Id")).toEqual([1, 2]);
                });
            });
            describe("after `get previous", function () {
                describe("when has previous items", function () {
                    var previous1, previous2;
                    beforeEach(function () {
                        list.getAll()
                            .then(function (items) {
                                return items.getNext()
                                    .then(function (items2) {
                                        return items2.getNext();
                                    })
                                    .then(function (items3) {
                                        return items3.getPrevious();
                                    });
                            })
                            .then(function (items) {
                                previous1 = items;
                                return previous1.getPrevious();
                            })
                            .then(function (items) {
                                previous2 = items;
                            });

                        $httpBackend.flush();
                    });
                    it("should return valid data", function () {
                        expect(previous1.hasPrevious()).toBe(true);
                        expect(previous2.hasPrevious()).toBe(false);

                        expect(_.pluck(previous1, "Id")).toEqual([3, 4]);
                        expect(_.pluck(previous2, "Id")).toEqual([1, 2]);
                    });
                });
                describe("when NOT has previous items", function () {
                    var current, next, previous1, previous2;
                    beforeEach(function () {
                        list.getAll()
                            .then(function (items) {
                                current = items;
                                return current.getNext();
                            })
                            .then(function (items) {
                                next = items;
                                return next.getPrevious();
                            })
                            .then(function (items) {
                                previous1 = items;
                                return previous1.getPrevious();
                            })
                            .then(function (items) {
                                previous2 = items;
                            });

                        $httpBackend.flush();
                    });
                    it("should return empty array", function () {
                        expect(current.hasNext()).toBe(true);
                        expect(next.hasPrevious()).toBe(true);
                        expect(previous1.hasPrevious()).toBe(false);

                        expect(previous2.length).toBe(0);
                    });
                });
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

})(testUtils, _);