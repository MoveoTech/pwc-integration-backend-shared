"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeGenerator = exports.arrayEquals = void 0;
const arrayEquals = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
};
exports.arrayEquals = arrayEquals;
const codeGenerator = () => {
    var code = '';
    var digits = '0123456789';
    for (var i = 0; i < 20; i++) {
        var randomIndex = Math.floor(Math.random() * digits.length);
        code += digits.charAt(randomIndex);
    }
    return code.toString();
};
exports.codeGenerator = codeGenerator;
//# sourceMappingURL=utils.js.map