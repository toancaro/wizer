interface SearchFunc {
    (source: string, subString: string): boolean;
}

var mySearch: SearchFunc;
mySearch = function(source: string, subString: string) {
    var result = source.search(subString);
    return result != -1;
};

var mySearch: SearchFunc;
mySearch = function(src: string, sub: string) {
    var result = src.search(sub);
    return result != -1;
};