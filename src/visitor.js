import { types as t } from '@babel/core';

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
  if (t.isFunctionDeclaration(path.node)) {
    originalFunction = t.functionExpression(
      path.node.id,
      path.node.params,
      path.node.body,
      path.node.generator,
      path.node.async
    );
  }

  let callParams = path.node.params;
  let fnParams = path.node.params;
  if (!callParams.every(p => t.isIdentifier(p))) {
    callParams = [t.spreadElement(t.identifier('args'))];
    fnParams = [t.restElement(t.identifier('args'))];
  }

  let directives = [];

  if (t.isBlockStatement(originalFunction.body)) {
    directives = originalFunction.body.directives.slice();
    originalFunction.body.directives = [];
  }

  const member = t.memberExpression(originalFunction, t.identifier('call'));
  const call = t.callExpression(
    member,
    [
      t.thisExpression(),
      ...callParams
    ]
  );

  const block = t.blockStatement([
    t.returnStatement(
      t.callExpression(
        t.memberExpression(
          t.identifier('$q'),
          t.identifier('when')
        ), [
          call
        ]
      )
    )
  ], directives);

  let newExpression;
  if (t.isArrowFunctionExpression(path.node)) {
    newExpression = t.arrowFunctionExpression(fnParams, block);
  } else if (t.isFunctionExpression(path.node)) {
    newExpression = t.functionExpression(path.node.id, fnParams, block, path.node.generator);
  } else {
    newExpression = t.functionDeclaration(path.node.id, fnParams, block, path.node.generator);
  }

  member.__angularAsyncProcessed = true;
  newExpression.__angularAsyncProcessed = true;

  path.replaceWith(newExpression)
}

export default {
  FunctionExpression: functionExpression,
  ArrowFunctionExpression: functionExpression,
  ObjectMethod(path) {
    if (path.node.async) {
      path.replaceWith(
        t.objectProperty(
          path.node.key,
          t.functionExpression(
            path.node.key,
            path.node.params,
            path.node.body,
            path.node.generator,
            path.node.async
          )
        )
      )
    }
  },
  FunctionDeclaration: functionExpression,
  AwaitExpression(path) {
    if (path.node.__angularAsyncProcessed) {
      return;
    }

    const newAwait = t.AwaitExpression(
      t.callExpression(
        t.memberExpression(
          t.identifier('$q'),
          t.identifier('when')
        ),
        [
          path.node.argument
        ]
      )
    );
    newAwait.__angularAsyncProcessed = true;

    path.replaceWith(newAwait);
  }
};
