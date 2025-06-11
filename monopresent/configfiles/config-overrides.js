// config-overrides.js (Monorepo Root)
const path = require('path');
const fs = require ('fs');
const { override, babelInclude, removeModuleScopePlugin } = require('customize-cra');
const rewireYarnWorkspaces = require('react-app-rewire-yarn-workspaces');

module.exports = override(
  removeModuleScopePlugin(), // Apply removeModuleScopePlugin first
  babelInclude([ // Apply babelInclude next
    fs.realpathSync(__dirname + '/packages/example-presentation/src'),
    fs.realpathSync(__dirname + '/packages/immersion-presentation/src')
  ]),
  // Add a custom override function to apply the Webpack rule for babel-loader
  (config, env) => {
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      include: fs.realpathSync(__dirname + '/packages/immersion-presentation/src'),
      loader: require.resolve('babel-loader'),
      options: {
        presets: [
          require.resolve('babel-preset-react-app'), // Use the preset directly
          '@babel/preset-typescript'
        ],
        plugins: [
          'babel-plugin-macros'
        ],
        cacheDirectory: true,
        compact: env === 'production',
      },
    });

    config.resolve.extensions = ['.ts', '.tsx', ...config.resolve.extensions];
    config.resolve.modules = [
      fs.realpathSync(__dirname + '/packages/example-presentation/src'),
      fs.realpathSync(__dirname + '/packages/immersion-presentation/src'),
      'node_modules'
    ];

    config = rewireYarnWorkspaces(config, env);
    return config;
  }
  // Apply rewireYarnWorkspaces last (it needs the config to be mostly ready)
  //rewireYarnWorkspaces() // Pass the rewirer function to override
);

