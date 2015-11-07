var testUtils = function (testUtils, _, $, global) {

    testUtils.listItemRegex = function (siteUrl, listName, itemId) {
        var regexStr = String.format("{0}/_api/lists/getByTitle\\('{1}'\\)/items", siteUrl, listName);
        regexStr += (itemId > 0) ? String.format("\\({0}\\)", itemId) : "";

        return new RegExp(regexStr);
    };
    testUtils.listItemPostData = function (listName, itemToPost, updatingItem) {
        return _.chain({}).extend(itemToPost, {
            "__metadata": {
                "type": "SP.Data." + listName + "ListItem"
            }
        }).omit(updatingItem ? "" : [
            "Id",
            "ID"
        ]).value();
    };
    testUtils.updateFormDigest = function (digestValue) {
        var digestDiv = $("#__REQUESTDIGEST");
        if (!_.any(digestDiv)) {
            digestDiv = $("<input type='hidden' id='__REQUESTDIGEST' />");
            $("body").append(digestDiv);
        }

        digestDiv.val(digestValue);
    };

    global.describes = function (suites, fn) {
        function recDesc (internal_suites) {
            if (!_.any(internal_suites)) {
                return fn();
            } else {
                return describe(internal_suites.shift(), function() {
                    recDesc(internal_suites);
                });
            }
        }
        recDesc(suites);
    };

    return testUtils;
}(testUtils || {}, _, $, window);