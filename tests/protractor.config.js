exports.config = {
    framework: "jasmine2",
    seleniumAddress: "http://localhost:4444/wd/hub",
    specs: ["e2e/**/*.spec.js"],
    capabilities: {
        browserName: "chrome",
        chromeOptions: {
            args: [
                //'--profile-directory="Default"'
                "--user-data-dir=C:/chrometest"
                //"--profile-directory=\"Profile 6\""
            ]
        }
    },
    params: {
        login: {
            user: "fanxipan\\toannn",
            password: "abc123-"
        }
    }
    //multiCapabilities: [
    //    {browserName: "firefox"},
    //    {browserName: "chrome"}
    //]
};