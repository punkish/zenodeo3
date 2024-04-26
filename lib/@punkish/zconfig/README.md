# zconfig

There are lots of wonderful utilities for storing and managing config information. This is not one of them. But, if you want a dependency-free utility, consider using this, a really zimple tool that works for me.

## How To

Initialize a new config instance and access the settings as follows

```js
import { Config } from './index.js';
const config = new Config().settings;
console.log(config)
```

See the accompanying `example.js` and the sample settings in [config](config/) directory. The base setting in `development.cjs` (or `default.cjs`) is always read first. Then, depending on the `process.env.NODE_ENV`, the applicable `test.cjs` or `production.cjs` are deep-merged into the base settings. All the settings are available via the resulting `config` object.

`process.env.NODE_ENV` can be passed in via [dotenv](https://www.npmjs.com/package/dotenv) or by any other method setting the `NODE_ENV` environment variable. For example, by prefixing the call for your program as `$ NODE_ENV=production node index.js`

**Important Notes:**

- the **config** directory has to be at the root of your application.
- the settings have to use `module.exports` and have to have the `.cjs` suffix.