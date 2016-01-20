/// <reference path="IStringValidator.ts"/>
/// <reference path="LettersValidator.ts"/>

module Validation {
    var lettersRegexp = /^[A-Za-z]+$/;
    var numberRegexp = /^[0-9]+$/;
}

var validators: { [s: string]: Validation.IStringValidator } = {};
validators["test"] = new Validation.LettersValidator();