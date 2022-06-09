# install

```sh
npm i sync-update
```

# use

index.js

```js
const path = require('path');
const {syncUpdate} = require('sync-uodate');
const src = path.resolve(__dirname, './src');
const dist = path.resolve(__dirname, './dist');
// const src ="E:\\xxx\\src";
// const dist = "E:\\yy\\zz\\xxxx";
syncUpdate(src, dist);
```

## cmd  中运行

当 src 目录中文件发生变化， dist 中可以同步到此变化；不需要使用 modemon 

```sh
node index.js
```

