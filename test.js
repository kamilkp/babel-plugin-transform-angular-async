import * as babylon from 'babylon';
import traverse from '@babel/traverse';
import { types as t } from '@babel/core';
import generate from '@babel/generator';
import visitor from './src/visitor';

// const input = `function test() {
//   __autoinject($rootScope, $httpBackend);
// }`;

const input = `function test() {
  $stateProvider.state('account', {
    url: '/account',
    data: {
      title: 'Account',
      access: accessLevels.manager,
    },
    resolve: {
      personaCollection(PersonaCollection) {
        'ngInject';

        return PersonaCollection.loadData();
      },
      async billingInfo(Authentication, AccountService) {
        'ngInject';

        await Authentication.userLoaded;

        if (!Authentication.user ||
            !Authentication.user.orgSettings.subscriptionOptionsEnabled ||
            !Authentication.user.isAllowedToManageSubscription) {
          return null;
        }

        return await AccountService.getBillingInfo();
      },
      async customIndustryName(Authentication) {
        'ngInject';

        if (Authentication.user.org.businessCategory === OTHER_BUSINESS_CATEGORY) {
          const { data } = await Authentication.sendRequest({
            path: 'organisations/customindustry',
          });

          return data.name;
        }

        return '';
      },
    },
  });
}`;
// y = async(...args) => {
//   const r = await (async function foo(a, b) {
//     return a + b;
//   })(...args);
//   return r;
// };

// const input = `async function test() {
//   x = async() => await y(this);
// }`;

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
