"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _visitor = _interopRequireDefault(require("./visitor"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * babel-plugin-transform-angular-async
 * Author: Kamil Pękala (kamilkp@gmail.com)
 */
function _default() {
  return {
    visitor: _visitor.default
  };
}

;