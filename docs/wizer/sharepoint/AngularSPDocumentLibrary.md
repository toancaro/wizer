# SPList class
Angular service for interacting with SharePoint document library.

## Inheritance hierarchy
- [wizer.Class](https://github.com/nntoanbkit/wizer)
    - [wizer.sharepoint.SPList](https://github.com/nntoanbkit/wizer)
        - [wizer.sharepoint.AngularSPList](https://github.com/nntoanbkit/wizer)
            - wizer.sharepoint.AngularDocumentLibrary
 
## Table of contents

- [Usage](#usage)
- [Configurations](#configurations)
- [Instance methods](#instance-methods)

## Usage

````javascript
angular
    .module("myApp", ["wizer"])
    .controller("MainController", ["$scope", "$SPDocumentLibrary",
        function ($scope, $SPDocumentLibrary) {
            $scope.vm = {};
            
            var bookLibrary = new $SPDocumentLibrary({
                siteUrl: "dev.fanxipan.net",
                listName: "Books"
            });
            
            bookLibrary.uploadDocument(file, {Title: "My Book"})
                .then(function (uploadedBookItem) {
                    $scope.vm.book= uploadedBookItem;
                });
        }
    ]);
````

## Configurations
See AngularSPList configurations.

## Instance methods

### uploadDocument(file[, itemInfo])
Upload a file to this document library and optional update the info of the uploaded file.

**Parameter**

Param                   | Type          | Details
----------------------- | ------------- | ---------------------------------------------------------
file                    | `File`        | A file object which get from `input[type=file]`.
itemInfo *(optional)*   | `Object`      | An object that contains the metadata of the uploaded file.

**Return**

Type        | Details
----------- | ----------------------------------------------
`Promise`   | A promise which will resolve to uploaded item.

**Example**

````javascript
// The document library instance.
var bookLibrary = new $SPDocumentLibrary({
    siteUrl: "http://books.net",
    listName: "Books"
});

// Temporary jQuery ugly resolution.
var file = $("input[type=file]#book")[0].files[0];
bookLibrary
    .uploadDocument(file, {
        Title: "My favourite book",
        Category: "Adventure"
    })
    .then(function (uploadedBookItem) {
        $scope.vm.book = uploadedBookItem;
    });
````
