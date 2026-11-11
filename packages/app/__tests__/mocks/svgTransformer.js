/**
 * @file svgTransformer.js
 * @description Compiles real SVG markup for Jest using the same SVGR configuration as Metro.
 */
const { createRequire } = require('module');
const transformerRequire = createRequire(
  require.resolve('react-native-svg-transformer'),
);
const { transform } = transformerRequire('@svgr/core');
const config = require('../../.svgrrc.json');
const babel = require('babel-jest').createTransformer({
  presets: ['babel-preset-expo'],
});

module.exports = {
  process(source, filename, options) {
    const component = transform.sync(
      source,
      {
        ...config,
        plugins: config.plugins.map((plugin) => transformerRequire(plugin)),
      },
      { filePath: filename },
    );
    return babel.process(component, `${filename}.js`, options);
  },
};
