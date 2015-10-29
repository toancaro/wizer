var wizer = wizer || {};
wizer.sharepoint = function(sharepoint){
    "use strict";

    sharepoint.SPDocumentLibrary = sharepoint.SPList.extend({
        init: function() {

        }
    });

    return sharepoint;
}(wizer.sharepoint || {});