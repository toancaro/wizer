module.exports = function (grunt) {
    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            options: {
                banner: "/**\n" +
                        " * <%= pkg.name %> <%= pkg.version %>\n" +
                        " * <%= grunt.template.today('yyyy-mm-dd') %>\n" +
                        " */\n"
            },
            build: {
                files: [{
                    dest: "dist/wizer.js",
                    src: [
                        "scripts/angular/bootstrap.js",
                        "scripts/Class.js",
                        "scripts/utils/ArgsParser.js",
                        "scripts/sharepoint/SPList.js",
                        "scripts/sharepoint/SPDocumentLibrary.js",
                        "scripts/**/*.js"
                    ]
                }]
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                banner: "/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today(\"yyyy-mm-dd\") %> */"
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