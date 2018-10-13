import * as babylon from 'babylon';
import traverse from '@babel/traverse';
import { types as t } from '@babel/core';
import generate from '@babel/generator';
import visitor from './src/visitor';

// const input = `function test() {
//   __autoinject($rootScope, $httpBackend);
// }`;

const input = `
  async function a(b, c) {
    'ngInject';

    return await b + c;
  }

  const b = {
    async c(d, e) {
      'ngInject';

      return await d + e;
    }
  }

  const c = async(e, f) => e + await f();

  const e = async function f(g, h) {
    'ngInject';
    return g + await h();
  }
`;

const output = `function test() {
  inject((_$rootScope_, _$httpBackend_) => {
    ({ $rootScope, $httpBackend } = { $rootScope: _$rootScope_, $httpBackend: _$httpBackend_ });
  });
}`;

const ast = babylon.parse(input);

// console.log(ast2str(ast));
// process.exit(0);

function ast2str(ast) {
  return JSON.stringify(ast.program.body, (key, value) => {
    if (key === 'loc' || key === 'start' || key === 'end') {
      return undefined;
    }

    return value;
  }, '  ');
}

traverse(ast, visitor);

const gen = generate(ast, {
  // retainLines: true,
}, input);

console.log(gen.code);
