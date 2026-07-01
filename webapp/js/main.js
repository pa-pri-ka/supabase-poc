import { someFunction } from './imported.js';

export const main = () => {
    alert(someFunction());
};
window.main = main;
