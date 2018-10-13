<img src="https://img.shields.io/badge/license-MIT%20License-blue.svg">

# babel-plugin-transform-angular-async

Leverage async/await syntax with AngualarJS 1.x apps without worrying about executing things outside of the digest loop. No need for any wrappers or external libs. Magic.

Not magic really. The secret is wrapping promises into angular's `$q.when()` function which accepts any value, promise or not, and returns an angulary promise. Angulary means that it is invoked within the digest loop.

# Installation

```
npm install --save-dev babel-plugin-transform-angular-async
```

.babelrc
--
```json
{
  "presets": ["es2016"],
  "plugins": ["transform-angular-async"]
}
```

# Example transpilations

## async function declaration

Original:

```javascript
async function a(b, c) {
  'ngInject';

  return await b + c;
}
```

Transpiled:
```javascript
function a(b, c) {
  'ngInject';

  return $q.when(async function a(b, c) {
    return (await $q.when(b)) + c;
  }.call(this, b, c));
}
```

Async function to the outside code is just a regular function that returns a promise. So this plugin turns it into just that - a regular function that accepts the same formal arguments (and if it's supposed to have the `'ngInject';` it has it). And returns the original async function call wrapped in a `$q.when()`.

The `await` statement simply awaits on what it was originally supposed to await on but again wrapped in `$q.when()`. This takes care of digest loop in in both a successfull and erroneous execution path.

---

## Async object method

Original:

```javascript
const b = {
  async c(d, e) {
    'ngInject';

    return await d + e;
  }
}
```

Transpiled:

```javascript
const b = {
  c: function c(d, e) {
    'ngInject';

    return $q.when(async function c(d, e) {
      return (await $q.when(d)) + e;
    }.call(this, d, e));
  }
};
```

---

## Async arrow function expression

Original:

```javascript
const c = async(e, f) => e + await f();
```

Transpiled:

```javascript
const c = (e, f) => {
  return $q.when((async (e, f) => e + (await $q.when(f()))).call(this, e, f));
};
```

---

## Async function expression

Original:

```javascript
const e = async function f(g, h) {
  'ngInject';

  return g + await h();
}
```

Transpiled:

```javascript
const e = function f(g, h) {
  'ngInject';

  return $q.when(async function f(g, h) {
    return g + (await $q.when(h()));
  }.call(this, g, h));
};
```
