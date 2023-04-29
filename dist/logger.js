'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Logger = void 0;
class Logger {
  constructor(active) {
    this.active = active;
  }
  log(message) {
    if (this.active) {
      console.log(message);
    }
  }
}
exports.Logger = Logger;
