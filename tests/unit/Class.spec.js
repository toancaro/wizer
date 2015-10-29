(function (wizer) {

    describe("Class", function () {
        var Class = wizer.Class;

        describe("when define a class", function () {
            var Person;
            beforeEach(function () {
                Person = Class.extend({
                    canTalk: true,
                    init: function (name) {
                        this.name = name;
                    },
                    sayName: function () {
                        return this.canTalk ? this.name : "...";
                    }
                });
            });

            it("should define a class", function () {
                expect(_.isFunction(Person)).toBe(true);
            });
            it("should use init as constructor", function () {
                var person = new Person("Person's Name");
                expect(person).toBeDefined();
                expect(person.name).toEqual("Person's Name");
            });
            it("should have object function", function () {
                var person = new Person("Person's Name");
                expect(_.isFunction(person.sayName)).toBe(true);
                expect(person.sayName()).toEqual("Person's Name");
            });
            it("should have object property", function () {
                var person = new Person();
                expect(person.canTalk).toBe(true);
            });
        });
        describe("when inherit a class", function () {
            var Person, Student, NerdyStudent,
                name = "Student's Name", school = "Student's School", hasGlasses = true;

            beforeEach(function () {
                Person = Class.extend({
                    canTalk: true,
                    init: function (name) {
                        this.name = name;
                    },
                    sayName: function () {
                        return this.canTalk ? this.name : "...";
                    }
                });
                Student = Person.extend({
                    canDoHardWork: false,
                    init: function (name, school) {
                        this.$super.init.call(this, name);
                        this.school = school;
                    },
                    getStudentCode: function () {
                        return "Student's Code";
                    }
                });
                NerdyStudent = Student.extend({
                    hasBigHead: true,
                    init: function (name, school, hasGlasses) {
                        this.$super.init.call(this, name, school);
                        this.hasGlasses = hasGlasses;
                    },
                    sayName: function () {
                        return "Nerdy: " + name;
                    },
                    getStudentCode: function () {
                        return "Nerdy " + this.$super.getStudentCode();
                    }
                });
            });

            it("should define inherit class", function () {
                expect(_.isFunction(Student)).toBeDefined();
            });
            it("should work with `instanceof`", function () {
                var nerdy = new NerdyStudent();
                expect(nerdy instanceof NerdyStudent).toBe(true);
                expect(nerdy instanceof Student).toBe(true);
                expect(nerdy instanceof Person).toBe(true);
                expect(nerdy instanceof Class).toBe(true);
            });
            it("should inherit `instance` properties", function () {
                var nerdy = new NerdyStudent(name, school, hasGlasses);

                expect(nerdy).toBeDefined();
                expect(nerdy.name).toEqual(name);
                expect(nerdy.school).toEqual(school);
                expect(nerdy.hasGlasses).toEqual(hasGlasses);
            });
            it("should inherit `prototype` properties", function () {
                var nerdy = new NerdyStudent();

                expect(nerdy.canTalk).toBe(true);
                expect(nerdy.canDoHardWork).toBe(false);
                expect(nerdy.hasBigHead).toBe(true);
            });
            it("should inherit methods", function () {
                var student = new Student(name, school);
                expect(student.sayName()).toEqual(name);
            });
            it("should override parent's methods", function () {
                var nerdy = new NerdyStudent(name, school, hasGlasses);
                expect(nerdy.sayName()).toEqual("Nerdy: " + name);
            });
            it("should be able to call parent's methods", function () {
                var nerdy = new NerdyStudent();
                expect(nerdy.getStudentCode()).toEqual("Nerdy Student's Code");
            });
        });
    });

})(wizer);