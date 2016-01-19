class Greeter {
    static standardGreeting = "Hello, there";
    greeting:string;

    greet() {
        if (this.greeting) {
            return "Hello, " + this.greeting;
        }
        else {
            return Greeter.standardGreeting;
        }
    }
}

var greeter1:Greeter;
greeter1 = new Greeter();
alert(greeter1.greet());

var greeterMaker:typeof Greeter = Greeter;
greeterMaker.standardGreeting = "Hey there!";
var greeter2:Greeter = new greeterMaker();
alert(greeter2.greet());