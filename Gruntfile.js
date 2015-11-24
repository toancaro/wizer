module.exports = function (grunt) {
    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            options: {
                banner: "/**\n" +
                        " * <%= pkg.name %> <%= pkg.version %>\n" +
                        " * <%= grunt.template.today('yyyy-mm-dd HH:MM:ss') %>\n" +
                        " */\n"
            },
            build: {
                files: [{
                    dest: "dist/wizer.js",
                    src: [
                        "scripts/utils/utilities.js",
                        "scripts/angular/bootstrap.js",
                        "scripts/core/Class.js",
                        "scripts/utils/ArgsParser.js",
                        "scripts/sharepoint/1.1. SPListField.js",
                        "scripts/sharepoint/1. SPList.js",
                        "scripts/sharepoint/SPDocumentLibrary.js",
                        "scripts/**/*.js"
                    ]
                }]
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                banner: "/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today(\"yyyy-mm-dd HH:MM:ss\") %> */"
            },
            build: {
                files: [
                    {dest: "dist/wizer.min.js", src: "dist/wizer.js"}
                ]
            }
        }
    });

    grunt.registerTask("default", ["build"]);
    grunt.registerTask("build", ["concat:build", "uglify:build"]);
};