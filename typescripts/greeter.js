/// <reference path="IStringValidator.ts"/>
/// <reference path="LettersValidator.ts"/>
var Validation;
(function (Validation) {
    var lettersRegexp = /^[A-Za-z]+$/;
    var numberRegexp = /^[0-9]+$/;
})(Validation || (Validation = {}));

var validators = {};
validators["test"] = new Validation.LettersValidator();
//# sourceMappingURL=greeter.js.map
