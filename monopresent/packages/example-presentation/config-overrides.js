// packages/example-presentation/config-overrides.js
const path = require('path');
const actualConfigPath = path.resolve(__dirname, '../../config-overrides.js');
module.exports = require(actualConfigPath);

