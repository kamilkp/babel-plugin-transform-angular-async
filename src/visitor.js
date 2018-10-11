import { types as t } from '@babel/core';

function functionExpression(path) {
  if (path.container && path.container.__awrFunctionWrapped) {
    return;
  }

  if (path.node.__awrExpressionWrapped) {
    return;
  }

  if (path.node.async) {
    const member = t.memberExpression(path.node, t.identifier('call'));
    const call = t.callExpression(
      member,
      [
        t.thisExpression(),
        t.spreadElement(t.identifier('args'))
      ]
    );

    const arg = [t.restElement(t.identifier('args'))];
    const block = t.blockStatement([
      t.variableDeclaration(
        'const', [
          t.variableDeclarator(
            t.identifier('r'),
            t.callExpression(
              t.memberExpression(
                t.identifier('$q'),
                t.identifier('when')
              ), [
                call
              ]
            )
          )
        ]
      ),
      t.returnStatement(t.identifier('r'))
    ]);

    let expr;
    if (t.isArrowFunctionExpression(path.node)) {
      expr = t.arrowFunctionExpression(arg, block);
    } else {
      expr = t.functionExpression(path.node.id, arg, block);
    }

    member.__awrFunctionWrapped = true;
    expr.__awrExpressionWrapped = true;

    path.replaceWith(expr)
  }
}

export default {
  FunctionExpression: functionExpression,
  ArrowFunctionExpression: functionExpression,
  // FunctionDeclaration: functionExpression,
  AwaitExpression(path) {
    if (
      path.container &&
      path.container.type === 'AssignmentExpression' &&
      path.container.left &&
      path.container.left.name &&
      path.container.left.name.startsWith('___awr')
    ) {
      return;
    }

    path.scope.___awrCount = (path.scope.___awrCount || 0) + 1;
    const ident = '___awr' + path.scope.___awrCount;

    const variableDeclaration = t.variableDeclaration('let', [
      t.variableDeclarator(t.identifier(ident))
    ]);

    const sequence = t.sequenceExpression([
      t.assignmentExpression(
        '=',
        t.identifier(ident),
        path.node,
      ),
      t.callExpression(
        t.memberExpression(
          t.identifier('$rootScope'),
          t.identifier('$digest')
        ),
        []
      ),
      t.identifier(ident),
    ]);

    if (t.isExpression(path.scope.path.node.body)) {
      if (t.isArrowFunctionExpression(path.scope.path.node)) {
        path.scope.path.replaceWith(
          t.arrowFunctionExpression(
            path.scope.path.node.params,
            t.blockStatement([
              t.returnStatement(path.scope.path.node.body),
            ]),
            path.scope.path.node.async
          )
        )
      } else if (t.isFunctionExpression(path.scope.path.node)) {
        path.scope.path.replaceWith(
          t.functionExpression(
            path.scope.path.node.identifier,
            path.scope.path.node.params,
            t.blockStatement([
              t.returnStatement(path.scope.path.node.body),
            ]),
            path.scope.path.node.generator,
            path.scope.path.node.async
          )
        )
      } else {
        console.error(path.scope.path.node);
        throw new Error(`Unknown scope type ${path.scope.path.node.type}`);
      }
      return;
    }

    if (t.isBlockStatement(path.scope.path.node.body)) {
      path.scope.path.node.body.body.unshift(variableDeclaration);
    } else if (t.isBlockStatement(path.scope.path.node)) {
      path.scope.path.node.body.unshift(variableDeclaration);
    } else {
      console.error(path.scope.path.node);
      throw new Error(`Unknown enclosing scope node ${path.scope.path.node.type}`);
    }

    path.replaceWith(sequence);
  }
};
