const path = require('path');
const fs = require('fs');
const {
  override,
  babelInclude,
  removeModuleScopePlugin,
} = require('customize-cra');
const rewireYarnWorkspaces = require('react-app-rewire-yarn-workspaces');

console.log("Running!!!!!!!!!!!!!!!!!");
module.exports = override(
  removeModuleScopePlugin(),
  // Ensure the default babel-loader includes both source folders
  babelInclude([
    fs.realpathSync(__dirname + '/packages/example-presentation/src'),
    fs.realpathSync(__dirname + '/packages/immersion-presentation/src'),
  ]),

  // Patch babel-loader plugins and presets (optional if you're using macros in immersion-presentation)
  (config, env) => {
    // Look for the babel-loader rule more flexibly
    const rules = config.module.rules.find(rule => Array.isArray(rule.oneOf))?.oneOf || [];
    const babelRule = rules.find(
      r => r.loader && r.loader.includes('babel-loader')
    );
    if (babelRule) {
      babelRule.options.plugins = [
        ...(babelRule.options.plugins || []),
        require.resolve('babel-plugin-macros'),
        // require.resolve('@babel/plugin-transform-react-jsx-source'),
      ];
    } else {
      console.warn('⚠️ Unable to find babel-loader rule. babel-plugin-macros not injected.');
    }
    console.log("🔍 Final Babel plugins:", babelRule.options.plugins);

    console.log(babelRule)
    config.resolve.extensions = ['.ts', '.tsx', ...config.resolve.extensions];
    config.resolve.modules = [
      fs.realpathSync(__dirname + '/packages/example-presentation/src'),
      fs.realpathSync(__dirname + '/packages/immersion-presentation/src'),
      'node_modules',
    ];
    // ✅ 🔥 Key fix: rewrite source map paths to be relative
    config.devtool = 'source-map';
    // config.output.devtoolModuleFilenameTemplate = info =>
    //   path
    //     .relative(fs.realpathSync(process.cwd()), info.absoluteResourcePath)
    //     .replace(/\\/g, '/');

    // config.output.devtoolModuleFilenameTemplate = info =>
    //   `webpack:///${path.relative(fs.realpathSync(process.cwd()), info.absoluteResourcePath).replace(/\\/g, '/')}`;
    // config.output.devtoolModuleFilenameTemplate = info =>
    //   `file:///${info.absoluteResourcePath.replace(/\\/g, '/')}`;
    return rewireYarnWorkspaces(config, env);
  }

);

