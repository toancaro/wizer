(function (wizer) {

    describe("Model", function () {
        var personId = 1001, personName = "Person's Name";
        var Model = wizer.data.Model, Person;
        var person;

        beforeEach(function () {
            Person = Model.define({
                id: "personId",
                fields: {
                    name: {
                        from: "personName"
                    },
                    fullName: {
                        from: "personName",
                        parse: function (name) {
                            return "Full Name: " + name;
                        }
                    },
                    defaultProperty: {
                        defaultValue: "DefaultValue"
                    },
                    parseFalseProperty: {
                        from: "personName",
                        defaultValue: "Parse's default value",
                        parse: function () {
                            return undefined;
                        }
                    }
                }
            });
            person = new Person({
                personId: personId,
                personName: personName,
                originalValue: "original"
            });
        });

        it("should be defined in `wizer.data`", function () {
            expect(_.isFunction(Model)).toBe(true);
        });
        it("should use config to define model", function () {
            expect(person).toBeDefined();
            expect(person.$configs).toBeDefined();
            expect(person.$configs.id).toEqual("personId");
            expect(person.$configs.fields.name.from).toEqual("personName");
            expect(person.$configs.fields.name.defaultValue).toBe(undefined);
        });

        describe("when inherit model", function () {
            var Student, student;
            beforeEach(function () {
                Student = Person.define({
                    id: "studentId",
                    fields: {
                        name: {
                            defaultValue: "<<no name>>"
                        }
                    }
                });
                student = new Student();
            });

            it("should override base configs", function () {
                expect(student.$configs.id).toEqual("studentId");
                expect(student.$configs.fields.name.defaultValue).toEqual("<<no name>>");
            });
            it("should also preserve another configs", function () {
                expect(student.$configs.fields.name.from).toEqual("personName");
            });
            it("should work with `instanceof`", function () {
                expect(student instanceof Student).toBe(true);
                expect(student instanceof Person).toBe(true);
                expect(student instanceof Model).toBe(true);
            });
        });
        describe("when call `get` function", function () {
            it("should get from `from` field", function () {
                expect(person.get("name")).toEqual(personName);
            });
            it("should use `parse` to convert value", function () {
                expect(person.get("fullName")).toEqual("Full Name: " + personName);
            });
            it("should use original value if no config for property avaiable", function () {
                expect(person.get("originalValue")).toEqual("original");
            });

            describe("should return `defaultValue` when", function () {
                it("original value is `undefined`", function () {
                    expect(person.get("defaultProperty")).toEqual("DefaultValue");
                });
                it("`parse` function return `undefined`", function () {
                    expect(person.get("parseFalseProperty")).toEqual("Parse's default value");
                });
            });
        });
        describe("when call `set` method", function () {
            it("should set data to local storage", function () {
                person.set("name", "local person name");
                expect(person.get("name")).toEqual("local person name");
            });
            it("should get value from `original` when local value is set to `undefined`", function () {
                person.set("name", "local");
                expect(person.get("name")).toEqual("local");
                person.set("name", undefined);
                expect(person.get("name")).toEqual(personName);
            });
        });
    });

})(wizer);