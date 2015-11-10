(function (wizer) {
    var SPList = wizer.sharepoint.SPList;

    describe("SPList", function () {
        var SPList = wizer.sharepoint.SPList;
        var siteUrl = "http://rooms.net";

        it("should be defined in `wizer.sharepoint` namespace", function () {
            expect(_.isFunction(SPList)).toBe(true);
        });

        describe("with list instance", function () {
            describe("created by `define` method", function () {
                var roomList, vipRoomList, myVipRoomList;

                beforeEach(function () {
                    roomList = new SPList({
                        siteUrl: siteUrl,
                        listName: "Rooms"
                    });
                    vipRoomList = roomList.define({
                        listName: "VIPRooms"
                    });
                    myVipRoomList = vipRoomList.define({
                        listName: "MyVIPRooms",
                        type: "my"
                    });
                });

                it("should preserve old configs", function () {
                    expect(vipRoomList.$configs.siteUrl).toEqual(siteUrl);
                });
                it("should overwrite by new configs", function () {
                    expect(vipRoomList.$configs.listName).toEqual("VIPRooms");
                });
                it("should work for multi-level inheritance", function () {
                    expect(myVipRoomList.$configs.siteUrl).toEqual(siteUrl);
                    expect(myVipRoomList.$configs.listName).toEqual("MyVIPRooms");
                    expect(myVipRoomList.$configs.type).toEqual("my");
                });
            });
            describe("created by `extend` method", function () {
                var RoomList, VIPRoomList, vipRoomList, roomList;

                beforeEach(function () {
                    RoomList = SPList.extend({
                        init: function (configs) {
                            this.$super.init.call(this, _.defaultsDeep({}, configs, {
                                siteUrl: siteUrl,
                                listName: "Rooms"
                            }));
                        }
                    });
                    VIPRoomList = RoomList.extend({
                        init: function (configs) {
                            this.$super.init.call(this, _.defaultsDeep({}, configs, {
                                listName: "VIPRooms"
                            }));
                        }
                    });

                    roomList = new RoomList();
                    vipRoomList = new VIPRoomList();
                });

                it("should create a valid object", function () {
                    expect(roomList.$configs.siteUrl).toEqual(siteUrl);
                    expect(roomList.$configs.listName).toEqual("Rooms");
                });
                it("should overwrite by new configs", function () {
                    expect(vipRoomList.$configs.listName).toEqual("VIPRooms");
                });
                it("should preserve old configs", function () {
                    expect(vipRoomList.$configs.siteUrl).toEqual(siteUrl);
                });
            });
            describe("created by `defined class`", function () {
                var RoomList, VIPRoomList, vipRoomList;

                beforeEach(function () {
                    RoomList = SPList.extend({
                        init: function (configs) {
                            this.$super.init.call(this, _.defaultsDeep({}, configs, {
                                siteUrl: siteUrl,
                                listName: "Rooms"
                            }));
                        }
                    });
                    VIPRoomList = RoomList.define({
                        listName: "VIPRooms"
                    });

                    vipRoomList = new VIPRoomList();
                });

                it("should create a valid instance", function () {
                    expect(vipRoomList.$configs.siteUrl).toEqual(siteUrl);
                    expect(vipRoomList.$configs.listName).toEqual("VIPRooms");
                });
            });
        });
    });
})(wizer);