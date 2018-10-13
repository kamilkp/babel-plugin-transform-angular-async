"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@babel/core");

function functionExpression(path) {
  if (path.container && path.container.__angularAsyncProcessed) {
    return;
  }

  if (path.node.__angularAsyncProcessed) {
    return;
  }

  if (!path.node.async) {
    return;
  }

  let originalFunction = path.node;

  if (_core.types.isFunctionDeclaration(path.node)) {
    originalFunction = _core.types.functionExpression(path.node.id, path.node.params, path.node.body, path.node.generator, path.node.async);
  }

  let callParams = path.node.params;
  let fnParams = path.node.params;

  if (!callParams.every(p => _core.types.isIdentifier(p))) {
    callParams = [_core.types.spreadElement(_core.types.identifier('args'))];
    fnParams = [_core.types.restElement(_core.types.identifier('args'))];
  }

  let directives = [];

  if (_core.types.isBlockStatement(originalFunction.body)) {
    directives = originalFunction.body.directives.slice();
    originalFunction.body.directives = [];
  }

  const member = _core.types.memberExpression(originalFunction, _core.types.identifier('call'));

  const call = _core.types.callExpression(member, [_core.types.thisExpression(), ...callParams]);

  const block = _core.types.blockStatement([_core.types.returnStatement(_core.types.callExpression(_core.types.memberExpression(_core.types.identifier('$q'), _core.types.identifier('when')), [call]))], directives);

  let newExpression;

  if (_core.types.isArrowFunctionExpression(path.node)) {
    newExpression = _core.types.arrowFunctionExpression(fnParams, block);
  } else if (_core.types.isFunctionExpression(path.node)) {
    newExpression = _core.types.functionExpression(path.node.id, fnParams, block, path.node.generator);
  } else {
    newExpression = _core.types.functionDeclaration(path.node.id, fnParams, block, path.node.generator);
  }

  member.__angularAsyncProcessed = true;
  newExpression.__angularAsyncProcessed = true;
  path.replaceWith(newExpression);
}

var _default = {
  FunctionExpression: functionExpression,
  ArrowFunctionExpression: functionExpression,

  ObjectMethod(path) {
    if (path.node.async) {
      path.replaceWith(_core.types.objectProperty(path.node.key, _core.types.functionExpression(path.node.key, path.node.params, path.node.body, path.node.generator, path.node.async)));
    }
  },

  FunctionDeclaration: functionExpression,

  AwaitExpression(path) {
    if (path.node.__angularAsyncProcessed) {
      return;
    }

    const newAwait = _core.types.AwaitExpression(_core.types.callExpression(_core.types.memberExpression(_core.types.identifier('$q'), _core.types.identifier('when')), [path.node.argument]));

    newAwait.__angularAsyncProcessed = true;
    path.replaceWith(newAwait);
  }

};
exports.default = _default;