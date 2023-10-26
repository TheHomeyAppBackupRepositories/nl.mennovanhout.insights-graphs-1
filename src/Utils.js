"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundColor = exports.generateId = void 0;
const generateId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
    let counter = 0;
    while (counter < 30) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};
exports.generateId = generateId;
const backgroundColor = (arg) => {
    switch (arg) {
        case 'darkmode':
            return '#222329';
        case 'lightmode':
            return '#ffffff';
        default:
            return 'transparent';
    }
};
exports.backgroundColor = backgroundColor;
