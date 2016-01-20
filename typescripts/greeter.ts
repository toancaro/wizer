import validation = require("IStringValidator");
import LettersValidator = require("LettersValidator");

var strings = ['Hello', '98052', '101'];
var validators: { [s: string]: validation.IStringValidator; } = {};
validators['Letters only'] = new LettersValidator();

strings.forEach(s => {
    for (var name in validators) {
        console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
    }
});
