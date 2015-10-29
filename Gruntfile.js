module.exports = function (grunt) {
    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        concat: {
            build: {
                files: [{
                    dest: "dist/wizer.js",
                    src: [
                        "scripts/angular/bootstrap.js",
                        "scripts/Class.js",
                        "scripts/sharepoint/SPList.js",
                        "scripts/sharepoint/SPDocumentLibrary.js",
                        "scripts/**/*.js"
                    ]
                }]
            }
        },
        uglify: {
            options: {
                sourceMap: true
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