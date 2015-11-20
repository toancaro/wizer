// Karma configuration
// Generated on Thu Sep 03 2015 14:27:53 GMT+0700 (SE Asia Standard Time)

module.exports = function (config) {
    var useMinified = false;
    var useTestApp = false;

    var files = function () {
        var _files = [];

        _files = _files.concat([
            "bower_components/lodash/lodash.js",
            "bower_components/jquery/dist/jquery.js",
            "bower_components/angular/angular.js",
            "bower_components/angular-mocks/angular-mocks.js"
        ]);

        if (useMinified) {
            _files.push("dist/wizer.min.js");
        } else {
            _files = _files.concat([
                "scripts/angular/bootstrap.js",
                "scripts/core/Class.js",
                "scripts/core/ArrayClass.js",
                "scripts/utils/ArgsParser.js",
                "scripts/sharepoint/1.1. SPListField.js",
                "scripts/sharepoint/1. SPList.js",
                "scripts/**/*.js"
            ]);
        }

        _files.push("tests/utils/testUtilities.js");
        _files.push("tests/unit/**/*.spec.js");

        if (useTestApp) {
            _files.push("dist/wizer.js");
            _files.push("dist/wizer.min.js");
            _files.push("bower_components/bootstrap/dist/css/bootstrap.css");
            _files.push("bower_components/bootstrap/dist/js/bootstrap.js");

            _files.push("tests/app/index.html");
            _files.push("tests/app/main.controller.js");
        }

        return _files;
    }();

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: "..",


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ["jasmine"],


        // list of files / patterns to load in the browser
        files: files,


        // list of files to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},


        // test results reporter to use
        // possible values: "dots", "progress"
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ["clear-screen", "growl", "mocha"],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ["PhantomJS"],
        //browsers: ["IE9", "Chrome", "Firefox"],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        mochaReporter: {
            ignoreSkipped: true
        },

        customLaunchers: {
            IE9: {
                base: "IE",
                "x-ua-compatible": "IE=EmulateIE9"
            },
            IE8: {
                base: "IE",
                "x-ua-compatible": "IE=EmulateIE8"
            }
        }
    })
};
