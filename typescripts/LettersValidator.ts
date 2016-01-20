import validation = require("./IStringValidator");

class LettersValidator implements validation.IStringValidator {
    isAcceptable(s: string): boolean { throw new Error("Not implemented"); }
}

export = LettersValidator;