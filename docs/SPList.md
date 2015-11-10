# SPList class
Represent a list on a Microsoft SharePoint Foundation Web site. SPList instances use SharePoint REST service to interact with the real list on the web site.
 
## Table of contents

- [Usage](#usage)
- [Configurations](#configurations)
    - [siteUrl](#configssiteurl-optional)
    - [listName](#configslistname)
    - [schema](#configsschema-optional)
    - [schema.afterGet](#configsschemaafterget-optional)
    - [schema.beforePost](#configsschemabeforepost-optional)
    - [fieldConverters](#configsfieldconverters-optional)
    - [fieldConverters.json](#configsfieldconvertersjson-optional)
    - [fieldConverters.dateTime](#configsfieldconvertersdatetime-optional)
    - [fieldConverters.lookup](#configsfieldconverterslookup-optional)
- [Instance methods](#instance-methods)
    - [get](#getitemid-httpconfigs)
    - [create](#createitem-httpconfigs)
    - [update](#updateitem-httpconfigs)
    - [remove](#removeitemid-httpconfigs)
    - [define](#definelistconfigs)

## Usage

````javascript
angular
    .module("myApp", ["wizer"])
    .controller("MainController", ["$scope", "$SPList",
        function ($scope, $SPList) {
            $scope.vm = {};
            
            var roomList = new $SPList({
                siteUrl: "dev.fanxipan.net",
                listName: "Rooms"
            });
            
            roomList.getAll().then(function (allRooms) {
                $scope.vm.allRooms = allRooms;
            });
        }
    ]);
````

## Configurations
Create a new instance of SPList class.

````javascript
var list = new $SPList(configs);
````
 
The `configs` object has the following properties:

### configs.siteUrl *(optional)*

**Type:** `String`

The url of the web where the the list is on. Can be set to both relative or absolute path.

````javascript
// Absolute path.
var list = new $SPList({
    siteUrl: "http://dev.fanxipan.net/hsse"
});

// Relative path (suppose that if you are currently on "http://dev.fanxipan.net").
var list = new $SPList({
    siteUrl: "hsse"
});

// If you leave `siteUrl` blank, the current site will be used.
// The below list points to "http://dev.fanxipan.net"
var list = new $SPList();
````

### configs.listName

**Type:** `String`

The display name of the SharePoint list.

### configs.schema *(optional)*

**Type:** `Object`

Use to transform `request` and `response` object.

### configs.schema.afterGet *(optional)*

**Type:** `Function`

**Params:**
 - serverItem (`Object`) - An object receive from server.

**Return:** (`Object` | `Promise`) - The modified `serverItem` or a new object or a `Promise` object which resolve to a modifed object.

This is useful if you want to modify the response data **before** any other modifiers.

````javascript
var list = new $SPList({
    schema: {
        afterGet: function (serverItem) {
            // Store the value when this item is retrieved.
            serverItem.retrieveAt = new Date();
            return serverItem;
        }
    }
});
````

### configs.schema.beforePost *(optional)*

**Type:** `Function`

**Params:**
 - clientItem (`Object`) - An object that is going to pass to server.

**Return:** (`Object` | `Promise`) - The modified `clientItem` or a new object or a `Promise` object which resolve to a modifed object.

This is useful if you want to modify the response data **after** any other modifiers.

````javascript
var list = new $SPList({
    schema: {
        beforePost: function (clientItem) {
            // Delete this field to prevent it from posting to server.
            delete clientItem.retrieveAt;
            return clientItem;
        }
    }
});
````

### configs.fieldConverters *(optional)*

**Type:** `Object`

The configurations of some common field convertions. The convertion is **dual directions**: both get and post data operations.

### configs.fieldConverters.json *(optional)*

**Type:** `String` | `Array<String>`

Store the field(s) which field value will be parsed to object when getting from server or stringfied when posting to server.

````javascript
var list = new $SPList({
    fieldConverters: {
        json: ["complexData"]
    }
});

// Suppose that you have the following object on the server:
var serverData = {
    id: 1,
    complexData: "{ 'name': 'Jubei', 'job': 'Developer'}"
};

// Then get that object with the list instance:
list.get(1).then(function (item) {
    expect(item.complexData).toEqual({ name: "Jubei", job: "Developer"});
});
````

### configs.fieldConverters.dateTime *(optional)*

**Type:** `String` | `Array<String>`

The value of these field(s) will take part in DateTime conversion.

### configs.fieldConverters.lookup *(optional)*

**Type:** `String` | `Array<String>`

Converter lookup values, including *Person and Group* type.

````javascript
// Define your list class
var list = new $SPList({
    fieldConverters: {
        lookup: ["Author", "Modifiers"]
    },
    select: [
        "Author/Id", "Author/Title",
        "Modifiers/Id", "Modifiers/Title"
    ],
    expand: [
        "Author", "Modifiers"
    ]
});

// Suppose these are server objects before parsing
var serverData = {
    Id: 237,
    Author: {
        Id: 1,
        Title: "Author 1"
    },
    Modifiers: {
        results: [
            { Id: 2, Title: "Modifier 1" },
            { Id: 3, Title: "Modifier 2" }
        ]
    }
};

// Then the data after parsing is like this:
list.get(237).then(function (item) {
    expect(item).toEqual({
        Id: 237,
        
        // Single lookup: nothing changed.
        Author: {
            Id: 1,
            Title: "Author 1"
        },
        
        // Multiple lookup: the `results` path is removed
        Modifiers: [
            { Id: 2, Title: "Modifier 1" },
            { Id: 3, Title: "Modifier 2" }
        ]
    });
});

// If you post the data got above then the request body will look like this:
expect(postBody).toEqual({
    Id: 237,
    AuthorId: 1,
    ModifiersId: {
        results: [2, 3]
    }
});
````

## Instance methods

### get(itemId[, httpConfigs])
Get the item with specified id on the list.

**Parameters**

Param                       | Type          | Details
--------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------
itemId                      | `Number`      | The id of the item want to retrieve.
httpConfigs *(optional)*    | `Object`      | The httpConfigs object used by `$http` service. Set this object will overwrite the default configurations.

**Return**

Type        | Details
----------- | -----------------------------------------------------------------------
`Promise`   | A promise object which will resolve to a list item when get successful.

### create(item[, httpConfigs])
Create a new item on the list.

**Parameter**

Param                       | Type          | Details
--------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------
item                        | `Object`      | The item to add to the list.<br/> **Note:** The `Id`, `ID` properties of `item` object will be ignored if presence.
httpConfigs *(optional)*    | `Object`      | The httpConfigs object used by `$http` service. Set this object will overwrite the default configurations.

**Return**

Type        | Details
----------- | ---------------------------------------------------------------------------------
`Promise`   | A promise object which will resolve to newly created item when create successful.

### update(item[, httpConfigs])
Update an existing item on the list.

**Parameter**

Param                       | Type          | Details
--------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------
item                        | `Object`      | The item to update.<br/> **Note:** The `item` object must have `Id` property to work correctly.
httpConfigs *(optional)*    | `Object`      | The httpConfigs object used by `$http` service. Set this object will overwrite the default configurations.

**Return**

Type        | Details
----------- | ---------------------------------------------------------------------------
`Promise`   | A promise object which will resolve to updated item when update successful.

### remove(itemId[, httpConfigs])
Remove (delete) an existing item from the list.

**Parameter**

Param                       | Type          | Details
--------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------
itemId                      | `Number`      | The `Id` of the item to be removed.
httpConfigs *(optional)*    | `Object`      | The httpConfigs object used by `$http` service. Set this object will overwrite the default configurations.

**Return**

Type        | Details
----------- | -----------------------------------------------------------
`Promise`   | A promise object which will resolve when remove successful.

### define(listConfigs)
Create new list instance with new list configurations. Old configs options if overritten if new ones are presences.

**Parameter**

Param           | Type          | Details
--------------- | ------------- | --------------------------------------------------
listConfigs     | `Object`      | New [list configurations object](#configurations).

**Return**

Type        | Details
----------- | ----------------------------------------
`Object`    | A list instance with new configurations.

**Example**

````javascript
// The base list instance.
var roomList = new $SPList({
    siteUrl: "http://rooms.net",
    listName: "Rooms"
});

// Inherit all functionalities of `roomList` but point to another list ("VIPRooms").
var vipRoomList = roomList.define({
    listName: "VIPRooms"
});
````
