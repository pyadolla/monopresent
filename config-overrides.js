const path = require('path');

module.exports = function override(config, env) {
  // Allow importing from immersion-presentation/src
  config.resolve.symlinks = false;

  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    include: path.resolve(__dirname, '../immersion-presentation/src'),
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          transpileOnly: true
        }
      }
    ]
  });

  return config;
};
