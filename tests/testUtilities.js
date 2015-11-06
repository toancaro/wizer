var testUtils = function (testUtils, _, $) {

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

    return testUtils;
}(testUtils || {}, _, $);