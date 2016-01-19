var Greeter = (function () {
    function Greeter() {
    }
    Greeter.prototype.greet = function () {
        if (this.greeting) {
            return "Hello, " + this.greeting;
        }
        else {
            return Greeter.standardGreeting;
        }
    };
    Greeter.standardGreeting = "Hello, there";
    return Greeter;
})();
var greeter1;
greeter1 = new Greeter();
alert(greeter1.greet());
var greeterMaker = Greeter;
greeterMaker.standardGreeting = "Hey there!";
var greeter2 = new greeterMaker();
alert(greeter2.greet());
//# sourceMappingURL=greeter.js.map