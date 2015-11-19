(function () {
    "use strict";

    var suites = ["AngularSPList", "defining"];
    describes(suites, function () {
        var $SPList;

        beforeEach(module("wizer.sharepoint"));
        beforeEach(inject(function ($injector) {
            $SPList = $injector.get("$SPList");
        }));

        describe("with list instance", function () {
            describe("created by $SPList contructor", function () {
                var roomList, vipRoomList;

                beforeEach(function () {
                    roomList = new $SPList({
                        listName: "Rooms"
                    });
                    vipRoomList = roomList.define({
                        listName: "VIPRooms"
                    });
                });

                it("should create a new data source", function () {
                    expect(vipRoomList.dataSource().$$splist).toBe(vipRoomList);
                });
            });
            describe("created by inherited class", function () {
                var RoomListBase, roomListBase,roomList;

                beforeEach(function () {
                    RoomListBase = $SPList.extend({
                        init: function (configs) {
                            this.$super.init.call(this, configs);
                        }
                    });

                    roomListBase = new RoomListBase({
                        listName: "RoomBase"
                    });
                    roomList = roomListBase.define({
                        siteUrl: "rooms"
                    });
                });

                it("should create a new data source", function () {
                    expect(roomList.dataSource().$$splist).toBe(roomList);
                });
            });
        });
    });

})();