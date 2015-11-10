var testUtils = function (testUtils, _, $, global) {

    testUtils.listItemRegex = function (siteUrl, listName, itemId) {
        var regexStr = String.format("{0}/_api/lists/getByTitle\\('{1}'\\)/items", siteUrl, listName);
        regexStr += (itemId > 0) ? String.format("\\({0}\\)", itemId) : "";

        return new RegExp(regexStr);
    };
    testUtils.listItemPostData = function (listName, itemToPost) {
        return _.chain({}).extend(itemToPost, {
            "__metadata": {
                "type": "SP.Data." + listName + "ListItem"
            }
        }).omit([
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
        describesImpl(suites, fn, "describe");
    };
    global.fdescribes = function (suites, fn) {
        describesImpl(suites, fn, "fdescribe");
    };
    global.xdescribes = function (suites, fn) {
        describesImpl(suites, fn, "xdescribe");
    };

    function describesImpl(suites, fn, descName) {
        function recDesc (internal_suites) {
            if (!_.any(internal_suites)) {
                return fn();
            } else {
                return global[descName](internal_suites.shift(), function() {
                    recDesc(internal_suites);
                });
            }
        }
        recDesc(suites);
    }


    return testUtils;
}(testUtils || {}, _, $, window);