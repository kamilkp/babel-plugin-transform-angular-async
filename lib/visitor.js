"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = require("@babel/core");

function functionExpression(path) {
  if (path.container && path.container.__awrFunctionWrapped) {
    return;
  }

  if (path.node.__awrExpressionWrapped) {
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

  const block = _core.types.blockStatement([_core.types.variableDeclaration('const', [_core.types.variableDeclarator(_core.types.identifier('r'), _core.types.callExpression(_core.types.memberExpression(_core.types.identifier('$q'), _core.types.identifier('when')), [call]))]), _core.types.returnStatement(_core.types.identifier('r'))], directives);

  let expr;

  if (_core.types.isArrowFunctionExpression(path.node)) {
    expr = _core.types.arrowFunctionExpression(fnParams, block);
  } else if (_core.types.isFunctionExpression(path.node)) {
    expr = _core.types.functionExpression(path.node.id, fnParams, block);
  } else {
    expr = _core.types.functionDeclaration(path.node.id, fnParams, block);
  }

  member.__awrFunctionWrapped = true;
  expr.__awrExpressionWrapped = true;
  path.replaceWith(expr);
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
    if (path.container && path.container.type === 'AssignmentExpression' && path.container.left && path.container.left.name && path.container.left.name.startsWith('___awr')) {
      return;
    }

    path.scope.___awrCount = (path.scope.___awrCount || 0) + 1;
    const ident = '___awr' + path.scope.___awrCount;

    const variableDeclaration = _core.types.variableDeclaration('let', [_core.types.variableDeclarator(_core.types.identifier(ident))]);

    const digestExpression = () => _core.types.callExpression(_core.types.memberExpression(_core.types.identifier('$rootScope'), _core.types.identifier('$evalAsync')), []);

    const sequence = _core.types.sequenceExpression([digestExpression(), _core.types.assignmentExpression('=', _core.types.identifier(ident), path.node), digestExpression(), _core.types.identifier(ident)]);

    if (_core.types.isExpression(path.scope.path.node.body)) {
      if (_core.types.isArrowFunctionExpression(path.scope.path.node)) {
        path.scope.path.replaceWith(_core.types.arrowFunctionExpression(path.scope.path.node.params, _core.types.blockStatement([_core.types.returnStatement(path.scope.path.node.body)]), path.scope.path.node.async));
      } else if (_core.types.isFunctionExpression(path.scope.path.node)) {
        path.scope.path.replaceWith(_core.types.functionExpression(path.scope.path.node.identifier, path.scope.path.node.params, _core.types.blockStatement([_core.types.returnStatement(path.scope.path.node.body)]), path.scope.path.node.generator, path.scope.path.node.async));
      } else {
        console.error(path.scope.path.node);
        throw new Error(`Unknown scope type ${path.scope.path.node.type}`);
      }

      return;
    }

    if (_core.types.isBlockStatement(path.scope.path.node.body)) {
      path.scope.path.node.body.body.unshift(variableDeclaration);
    } else if (_core.types.isBlockStatement(path.scope.path.node)) {
      path.scope.path.node.body.unshift(variableDeclaration);
    } else {
      console.error(path.scope.path.node);
      throw new Error(`Unknown enclosing scope node ${path.scope.path.node.type}`);
    }

    path.replaceWith(sequence);
  }

};
exports.default = _default;