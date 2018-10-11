<img src="https://img.shields.io/badge/license-MIT%20License-blue.svg">

# babel-plugin-transform-angular-async

Leverage async/await syntax with AngualarJS 1.x apps without worrying about executing things outside of the digest loop. No need for any wrappers or external libs. Magic.

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
