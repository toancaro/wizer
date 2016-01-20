var Validation;
(function (Validation) {
    var LettersValidator = (function () {
        function LettersValidator() {
        }
        LettersValidator.prototype.isAcceptable = function (s) { throw new Error("Not implemented"); };
        return LettersValidator;
    })();
    Validation.LettersValidator = LettersValidator;
})(Validation || (Validation = {}));
/// <reference path="IStringValidator.ts"/>
/// <reference path="LettersValidator.ts"/>
var Validation;
(function (Validation) {
    var lettersRegexp = /^[A-Za-z]+$/;
    var numberRegexp = /^[0-9]+$/;
})(Validation || (Validation = {}));
var validators = {};
validators["test"] = new Validation.LettersValidator();
