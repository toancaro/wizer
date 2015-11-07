// spec.js
describe('Protractor Demo App', function() {
    it("should work", function () {
        browser.get("http://dev.fanxipan.net/process");
        selectWindow(1);
        element(by.tagName("input")).sendKeys1("abc");
        expect(browser.getTitle()).toEqual("Test");
    });
    xit("should work", function () {
        browser.get("http://dev.fanxipan.net/process");
        expect(browser.getTitle()).toEqual("V?n phòng ?i?n t?");
    });
});

/**
 * [selectWindow Focus the browser to the index window. Implementation by http://stackoverflow.com/questions/21700162/protractor-e2e-testing-error-object-object-object-has-no-method-getwindowha]
 * @param  {Number} index [Is the index of the window. E.g., 0=browser, 1=FBpopup]
 * @return {[!webdriver.promise.Promise.<void>]}       [Promise resolved when the index window is focused.]
 */
function selectWindow(index) {

    // wait for handels[index] to exists
    browser.driver.wait(function() {
        return browser.driver.getAllWindowHandles().then(function (handles) {
            /**
             * Assume that handles.length >= 1 and index >=0.
             * So when i call selectWindow(index) i return
             * true if handles contains that window.
             */
            if(handles.length > index) {
                return true;
            }
        });
    });
    // here i know that the requested window exists

    // switch to the window
    return browser.driver.getAllWindowHandles().then(function (handles) {
        return browser.driver.switchTo().window(handles[index]);
    });
};