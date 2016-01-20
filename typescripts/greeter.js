define(["require", "exports", "LettersValidator"], function (require, exports, LettersValidator) {
    var strings = ['Hello', '98052', '101'];
    var validators = {};
    validators['Letters only'] = new LettersValidator();
    strings.forEach(function (s) {
        for (var name in validators) {
            console.log('"' + s + '" ' + (validators[name].isAcceptable(s) ? ' matches ' : ' does not match ') + name);
        }
    });
});
//# sourceMappingURL=greeter.js.map